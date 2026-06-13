import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

import { getSupabase } from '../config/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const CSV_DIR = path.join(PROJECT_ROOT, 'supabase', 'csv_data');

// RFC 4180 compliant CSV parser
function parseCSV(csvText) {
  const lines = [];
  let currentLine = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentField += '"';
          i++; // skip next quote
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentLine.push(currentField);
        currentField = '';
      } else if (char === '\r' || char === '\n') {
        if (char === '\r' && nextChar === '\n') {
          i++; // skip LF
        }
        currentLine.push(currentField);
        if (currentLine.length > 1 || currentLine[0] !== '') {
          lines.push(currentLine);
        }
        currentLine = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }
  
  if (currentField || currentLine.length > 0) {
    currentLine.push(currentField);
    lines.push(currentLine);
  }

  if (lines.length === 0) return [];

  const headers = lines[0].map(h => h.trim());
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    if (row.length < headers.length) continue;
    
    const obj = {};
    headers.forEach((header, index) => {
      let value = row[index] ? row[index].trim() : null;
      if (value === '') value = null;
      obj[header] = value;
    });
    
    data.push(obj);
  }
  
  return data;
}

function parsePgArray(value) {
  if (!value) return [];
  if (value.startsWith('{') && value.endsWith('}')) {
    const content = value.slice(1, -1);
    const items = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        items.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    items.push(current.trim());
    return items.map(item => {
      if (item.startsWith('"') && item.endsWith('"')) {
        item = item.slice(1, -1);
      }
      return item.trim();
    }).filter(Boolean);
  }
  return [value];
}

async function runImport() {
  const supabase = getSupabase();
  if (!supabase) {
    console.error('❌ Supabase client initialization failed. Please check your .env file.');
    process.exit(1);
  }
  
  const keyToTest = process.env.SUPABASE_KEY || '';
  let role = 'unknown';
  try {
    const payload = JSON.parse(Buffer.from(keyToTest.split('.')[1], 'base64').toString());
    role = payload.role;
  } catch (e) {}
  
  console.log('Using Key Role:', role);
  console.log('Key matches process.env:', keyToTest === process.env.SUPABASE_KEY);

  console.log('🚀 Starting import of real CSV datasets into Supabase...');

  const imports = [
    {
      file: 'schemes.csv',
      table: 'schemes',
      pk: 'id',
      parser: (row) => ({
        id: row.id,
        key: row.key || row.slug || row.id,
        slug: row.slug || row.key || row.id,
        name: row.name || 'Unnamed Scheme',
        category: row.category || 'General',
        audience: row.audience || 'public',
        description: row.description || 'No description available.',
        eligibility: row.eligibility || null,
        documents: row.documents || null,
        benefits: row.benefits || null,
        process: row.process || null,
        apply_link: row.apply_link || '#',
        state: row.state || 'All India',
        language: row.language || 'en'
      })
    },
    {
      file: 'documents.csv',
      table: 'documents',
      pk: 'id',
      parser: (row) => ({
        id: row.id,
        name: row.name,
        purpose: row.purpose,
        documents_required: parsePgArray(row.documents_required),
        process: parsePgArray(row.process),
        link: row.link || '#'
      })
    },
    {
      file: 'faqs.csv',
      table: 'faqs',
      pk: 'id',
      parser: (row) => ({
        id: parseInt(row.id, 10),
        question: row.question,
        answer: row.answer,
        category: row.category || null
      })
    },
    {
      file: 'helplines.csv',
      table: 'helplines',
      pk: 'id',
      parser: (row) => ({
        id: parseInt(row.id, 10),
        name: row.name,
        number: row.number,
        category: row.category || null,
        availability: row.availability || '24x7',
        link: row.link || null
      })
    },
    {
      file: 'government_links.csv',
      table: 'government_links',
      pk: 'id',
      parser: (row) => ({
        id: parseInt(row.id, 10),
        title: row.title,
        category: row.category || null,
        url: row.url,
        description: row.description || null
      })
    },
    {
      file: 'government_updates.csv',
      table: 'government_updates',
      pk: 'id',
      parser: (row) => ({
        id: parseInt(row.id, 10),
        title: row.title,
        category: row.category,
        summary: row.summary || null,
        date: row.date || new Date().toISOString().split('T')[0],
        link: row.link || '#'
      })
    },
    {
      file: 'awareness_content.csv',
      table: 'awareness_content',
      pk: 'id',
      parser: (row) => ({
        id: parseInt(row.id, 10),
        type: row.type,
        title: row.title,
        warning: row.warning,
        action: row.action
      })
    },
    {
      file: 'feedback.csv',
      table: 'feedback',
      pk: 'id',
      parser: (row) => ({
        id: parseInt(row.id, 10),
        name: row.name || 'Anonymous',
        email: row.email || null,
        category: row.category || 'general',
        message: row.message,
        rating: row.rating ? parseInt(row.rating, 10) : null,
        language: row.language || 'en'
      })
    }
  ];

  for (const item of imports) {
    const csvPath = path.join(CSV_DIR, item.file);
    if (!fs.existsSync(csvPath)) {
      console.warn(`⚠️ CSV file not found: ${csvPath}. Skipping.`);
      continue;
    }

    try {
      console.log(`📖 Reading and parsing ${item.file}...`);
      const fileData = fs.readFileSync(csvPath, 'utf8');
      const parsedRows = parseCSV(fileData);
      
      if (parsedRows.length === 0) {
        console.warn(`⚠️ No data found in ${item.file}.`);
        continue;
      }

      const formattedData = parsedRows.map(item.parser);
      console.log(`🚀 Upserting ${formattedData.length} records into table '${item.table}'...`);

      const { error } = await supabase
        .from(item.table)
        .upsert(formattedData, { onConflict: item.pk });

      if (error) {
        console.error(`❌ Failed to upsert to '${item.table}':`, error.message);
        console.error('Details:', error.details || 'No additional details.');
      } else {
        console.log(`✅ Successfully imported ${formattedData.length} records into table '${item.table}'!`);
      }
    } catch (e) {
      console.error(`❌ Error processing import for '${item.table}':`, e.message);
    }
  }

  console.log('🎉 Done importing all real datasets!');
}

runImport();
