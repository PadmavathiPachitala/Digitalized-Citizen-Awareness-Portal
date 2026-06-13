import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

const CSV_DIR = path.join(PROJECT_ROOT, 'supabase', 'csv_data');
const SETUP_SQL_PATH = path.join(PROJECT_ROOT, 'supabase', 'setup.sql');

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

function escapeSql(val) {
  if (val === null || val === undefined) return 'NULL';
  return `'${val.replace(/'/g, "''")}'`;
}

function formatSqlArray(val) {
  if (val === null || val === undefined || val === '') return 'ARRAY[]::TEXT[]';
  const arr = parsePgArray(val);
  return `ARRAY[${arr.map(x => escapeSql(x)).join(', ')}]::TEXT[]`;
}

function formatSqlInt(val) {
  if (val === null || val === undefined || val === '') return 'NULL';
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? 'NULL' : String(parsed);
}

async function run() {
  console.log('🏁 Starting SQL seed generation from real CSV files...');

  const tablesToSeed = [
    {
      file: 'schemes.csv',
      table: 'public.schemes',
      pk: 'id',
      columns: ['id', 'key', 'slug', 'name', 'category', 'audience', 'description', 'eligibility', 'documents', 'benefits', 'process', 'apply_link', 'state', 'language'],
      formatters: {
        apply_link: (v) => escapeSql(v || '#'),
        state: (v) => escapeSql(v || 'All India'),
        language: (v) => escapeSql(v || 'en')
      }
    },
    {
      file: 'documents.csv',
      table: 'public.documents',
      pk: 'id',
      columns: ['id', 'name', 'purpose', 'documents_required', 'process', 'link'],
      formatters: {
        documents_required: formatSqlArray,
        process: formatSqlArray,
        link: (v) => escapeSql(v || '#')
      }
    },
    {
      file: 'faqs.csv',
      table: 'public.faqs',
      pk: 'id',
      columns: ['id', 'question', 'answer', 'category'],
      formatters: {
        id: formatSqlInt
      }
    },
    {
      file: 'helplines.csv',
      table: 'public.helplines',
      pk: 'id',
      columns: ['id', 'name', 'number', 'category', 'availability', 'link'],
      formatters: {
        id: formatSqlInt,
        availability: (v) => escapeSql(v || '24x7')
      }
    },
    {
      file: 'government_links.csv',
      table: 'public.government_links',
      pk: 'id',
      columns: ['id', 'title', 'category', 'url', 'description'],
      formatters: {
        id: formatSqlInt
      }
    },
    {
      file: 'government_updates.csv',
      table: 'public.government_updates',
      pk: 'id',
      columns: ['id', 'title', 'category', 'summary', 'date', 'link'],
      formatters: {
        id: formatSqlInt,
        date: (v) => escapeSql(v || new Date().toISOString().split('T')[0]),
        link: (v) => escapeSql(v || '#')
      }
    },
    {
      file: 'awareness_content.csv',
      table: 'public.awareness_content',
      pk: 'id',
      columns: ['id', 'type', 'title', 'warning', 'action'],
      formatters: {
        id: formatSqlInt
      }
    },
    {
      file: 'feedback.csv',
      table: 'public.feedback',
      pk: 'id',
      columns: ['id', 'name', 'email', 'category', 'message', 'rating', 'language'],
      formatters: {
        id: formatSqlInt,
        name: (v) => escapeSql(v || 'Anonymous'),
        category: (v) => escapeSql(v || 'general'),
        rating: formatSqlInt,
        language: (v) => escapeSql(v || 'en')
      }
    }
  ];

  let sqlOutput = '';

  for (const t of tablesToSeed) {
    const csvPath = path.join(CSV_DIR, t.file);
    if (!fs.existsSync(csvPath)) {
      console.warn(`⚠️ CSV file not found: ${csvPath}. Skipping.`);
      continue;
    }

    const fileData = fs.readFileSync(csvPath, 'utf8');
    const parsedData = parseCSV(fileData);
    console.log(`✅ Parsed ${parsedData.length} records from ${t.file}`);

    if (parsedData.length === 0) continue;

    sqlOutput += `\n-- Seeding ${t.table} Table from ${t.file}\n`;
    sqlOutput += `INSERT INTO ${t.table} (${t.columns.join(', ')})\nVALUES\n`;

    const valueRows = parsedData.map((row, index) => {
      const values = t.columns.map(col => {
        const formatter = t.formatters[col];
        const rawValue = row[col];
        if (formatter) {
          return formatter(rawValue);
        }
        return escapeSql(rawValue);
      });
      const comma = index === parsedData.length - 1 ? '' : ',';
      return `(${values.join(', ')})${comma}`;
    });

    sqlOutput += valueRows.join('\n') + '\n';
    sqlOutput += `ON CONFLICT (${t.pk}) DO UPDATE SET\n`;

    const updateClauses = t.columns
      .filter(col => col !== t.pk)
      .map(col => `    ${col} = EXCLUDED.${col}`)
      .join(',\n');

    sqlOutput += updateClauses + ';\n';
  }

  // Load setup.sql, clean up any previous seeding section, and append new seeding section
  if (fs.existsSync(SETUP_SQL_PATH)) {
    let originalSql = fs.readFileSync(SETUP_SQL_PATH, 'utf8');
    
    // Remove everything from "3. SEED DATA INSERTION" onwards
    const seedMarker = '-- 3. SEED DATA INSERTION';
    const markerIndex = originalSql.indexOf(seedMarker);
    if (markerIndex !== -1) {
      originalSql = originalSql.substring(0, markerIndex).trim();
    } else {
      console.warn(`⚠️ Warning: '${seedMarker}' marker not found. Appending to the end.`);
    }

    const finalSql = originalSql.trim() + '\n\n' +
      '-- =====================================================================\n' +
      '-- 3. SEED DATA INSERTION\n' +
      '-- =====================================================================\n' +
      sqlOutput;

    fs.writeFileSync(SETUP_SQL_PATH, finalSql, 'utf8');
    console.log(`🎉 Successfully regenerated seed SQL in: ${SETUP_SQL_PATH}`);
  } else {
    console.error(`❌ setup.sql not found at: ${SETUP_SQL_PATH}`);
  }
}

run();
