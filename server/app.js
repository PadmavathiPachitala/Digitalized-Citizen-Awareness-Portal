import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';
import schemesRouter from './routes/schemes.js';
import documentsRouter from './routes/documents.js';
import faqsRouter from './routes/faqs.js';
import helplinesRouter from './routes/helplines.js';
import healthRouter from './routes/health.js';
import { getSupabase } from './config/supabase.js';
import { corsMiddleware, securityHeaders, rateLimiter } from './middleware/security.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { asyncHandler, cleanString } from './utils/api.js';
import { listSchemes, searchAll, recommendSchemes, compareSchemes } from './services/schemeService.js';
import { listGovernmentUpdates, listAwarenessContent, saveFeedback, listFaqs } from './services/contentService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');


const app = express();

// Trust Render's reverse proxy so rate limiting works per-user, not globally
app.set('trust proxy', true);

app.use(securityHeaders);
app.use(corsMiddleware);

// Serve static files BEFORE rate limiting so images/css don't eat up the limit
app.use(express.static(PROJECT_ROOT));

app.use(rateLimiter);
app.use(express.json({ limit: '1mb' }));

// Attach supabase client to every request
app.use((req, _res, next) => {
  req.supabase = getSupabase();
  next();
});

app.locals.indexFile = path.join(PROJECT_ROOT, 'index.html');

app.use('/api/health', healthRouter);
app.use('/api/schemes', schemesRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/faqs', faqsRouter);
app.use('/api/helplines', helplinesRouter);

app.get('/api/search', asyncHandler(async (req, res) => {
  const query = cleanString(req.query.q, 120);
  if (!query) return res.json({ results: [] });
  const results = await searchAll(req.supabase, query);
  res.json({ results });
}));

app.post('/api/eligibility', asyncHandler(async (req, res) => {
  const { profile, recommendations } = await recommendSchemes(req.supabase, req.body);
  // Strip raw field from each recommendation to keep payload lean
  const clean = recommendations.map(({ raw: _raw, ...rest }) => rest);
  res.json({ profile, recommendations: clean });
}));

app.post('/api/assistant', asyncHandler(async (req, res) => {
  const message = cleanString(req.body.message, 1200);
  const language = ['hi', 'te', 'en'].includes(req.body.language) ? req.body.language : 'en';
  if (!message) return res.status(400).json({ error: 'Message is required' });

  const queryLower = message.trim().toLowerCase();
  const isGreeting = /^(hi+|hello+|hey+|namaste|hola|greetings|good\s+morning|good\s+afternoon|good\s+evening|namaskar|namaskaram|hi\s+there|hello\s+there|नमस्ते|नमस्कार|हेलो|हाय|నమస్కారం|హలో|హాయ్)(?:\s+(?:assistant|chatbot|bot|dcap|there))?([\s!?.,]*)$/i.test(queryLower);

  if (isGreeting) {
    const greetingReply = language === 'hi'
      ? 'नमस्ते! आज मैं आपकी क्या सहायता कर सकता हूँ? आप मुझसे सरकारी योजनाओं, पात्रता या आवश्यक दस्तावेजों के बारे में पूछ सकते हैं।'
      : language === 'te'
        ? 'నమస్కారం! ఈరోజు నేను మీకు ఎలా సహాయపడగలను? మీరు నన్ను ప్రభుత్వ పథకాలు, అర్హత లేదా అవసరమైన పత్రాల గురించి అడగవచ్చు।'
        : 'Hello! How can I help you today? You can ask me about government schemes, eligibility, or required documents.';
    return res.json({ reply: greetingReply, source: 'local', matches: [] });
  }

  const schemes = await listSchemes(req.supabase);
  const matches = schemes
    .filter((s) => {
      const content = [s.name, s.description, s.category, s.eligibility, s.audience]
        .join(' ')
        .toLowerCase();
      const q = queryLower.slice(0, 120);
      if (content.includes(q)) return true;

      const importantKeywords = ['student', 'scholarship', 'education', 'farmer', 'agriculture', 'kisan', 'pension', 'senior', 'health', 'insurance', 'document', 'scam', 'fraud', 'loan', 'business', 'women'];
      const queryTokens = q.split(/[^a-z0-9]+/).filter(t => t.length >= 3);
      return queryTokens.some(token => importantKeywords.includes(token) && content.includes(token));
    })
    .slice(0, 4);

  const fallback = async () => {
    const queryLower = message.toLowerCase();
    
    // Website / Portal queries localization
    if (/dcap|this website|what is this|about this portal|awareness portal/i.test(queryLower)) {
      if (language === 'hi') {
        return 'DCAP (डिजिटलाइज्ड सिटीजन अवेयरनेस पोर्टल) एक सार्वजनिक हित का मंच है जिसे नागरिकों को सरकारी योजनाओं की खोज करने, पात्रता जांचने, आवश्यक दस्तावेजों की पहचान करने और साइबर सुरक्षा के बारे में जागरूक करने में मदद करने के लिए डिज़ाइन किया गया है।';
      }
      if (language === 'te') {
        return 'DCAP (డిజిటలైజ్డ్ సిటిజెన్ అవేర్నెస్ పోర్టల్) అనేది పౌరులు ప్రభుత్వ పథకాలను కనుగొనడానికి, అర్హతను తనిఖీ చేయడానికి, అవసరమైన పత్రాలను గుర్తించడానికి మరియు సైబర్ భద్రతపై అవగాహన పెంచడానికి సహాయపడే ఒక వేదిక.';
      }
      return 'DCAP (Digitalized Citizen Awareness Portal) is a public-interest platform designed to help Indian citizens discover government schemes, check eligibility, identify required documents, and raise awareness about cyber safety and official welfare channels.';
    }

    // Match FAQ DB
    try {
      const faqs = await listFaqs(req.supabase);
      const matchedFaq = faqs.find(f => 
        queryLower.includes(f.question.toLowerCase()) || 
        f.question.toLowerCase().includes(queryLower)
      );
      if (matchedFaq) {
        return matchedFaq.answer;
      }
    } catch (e) {
      console.warn("FAQ list fetch failed in fallback:", e);
    }

    // Keywords localization
    if (/otp|fraud|scam|upi|money|hack/i.test(queryLower)) {
      if (language === 'hi') {
        return 'कभी भी ओटीपी, पिन, पासवर्ड, आधार नंबर या बैंकिंग विवरण किसी के साथ साझा न करें। साइबर वित्तीय धोखाधड़ी के लिए 1930 पर कॉल करें और cybercrime.gov.in पर तुरंत शिकायत दर्ज करें।';
      }
      if (language === 'te') {
        return 'OTP, పిన్, పాస్‌వర్డ్‌లు, ఆధార్ నంబర్ లేదా బ్యాంకింగ్ వివరాలను ఎవరితోనూ షేర్ చేయవద్దు. సైబర్ ఆర్థిక మోసాల కోసం 1930కి కాల్ చేయండి మరియు cybercrime.gov.in లో వెంటనే ఫిర్యాదు చేయండి.';
      }
      return 'Never share OTP, PIN, passwords, Aadhaar full number, or banking details. For cyber financial fraud in India, call 1930 and report at cybercrime.gov.in.';
    }
    
    if (/document|certificate|proof|card/i.test(queryLower)) {
      if (language === 'hi') {
        return 'सामान्य दस्तावेजों में आधार कार्ड, निवास प्रमाण, आय प्रमाण पत्र, बैंक पासबुक, फोटो और जाति प्रमाण पत्र (यदि लागू हो) शामिल हैं। कृपया अंतिम आवश्यकताओं को सत्यापित करने के लिए आधिकारिक सरकारी पोर्टल का उपयोग करें।';
      }
      if (language === 'te') {
        return 'సాధారణ పత్రాలలో ఆధార్ కార్డ్, నివాస ధృవీకరణ పత్రం, ఆదాయ ధృవీకరణ పత్రం, బ్యాంక్ పాస్‌బుక్, ఫోటో మరియు వర్గం ధృవీకరణ పత్రం (వర్తిస్తే) ఉంటాయి. తుది అవసరాల కోసం అధికారిక పోర్టల్‌ని ధృవీకరించండి.';
      }
      return 'Common documents include Aadhaar, address proof, income certificate, bank details, photograph, and category certificate if applicable. Always verify final requirements on the official portal.';
    }
    
    if (matches.length) {
      if (language === 'hi') {
        return `मुझे ${matches.length} संबंधित योजना(एं) मिली हैं। आप ${matches[0].name} से शुरुआत कर सकते हैं। पात्रता की जांच करें और केवल आधिकारिक सरकारी पोर्टल के माध्यम से आवेदन करें।`;
      }
      if (language === 'te') {
        return `నేను ${matches.length} సంబంధిత పథకాన్ని(లను) కనుగొన్నాను. మీరు ${matches[0].name} తో ప్రారంభించవచ్చు. అర్హతను ధృవీకరించి, అధికారిక పోర్టల్ ద్వారా మాత్రమే దరఖాస్తు చేయండి.`;
      }
      return `I found ${matches.length} related scheme(s). Start with ${matches[0].name}. Check eligibility and apply only through the official portal.`;
    }

    if (language === 'hi') {
      return 'कृपया अपनी उम्र, राज्य, आय सीमा बताएं और यह भी बताएं कि क्या आप छात्र, किसान, कामगार या वरिष्ठ नागरिक हैं। मैं योजनाओं और आवश्यक दस्तावेजों का सुझाव दे सकता हूं।';
    }
    if (language === 'te') {
      return 'దయచేసి మీ వయస్సు, రాష్ట్రం, ఆదాయ పరిధిని మరియు మీరు విద్యార్థి, రైతు, కార్మికుడు లేదా సీనియర్ సిటిజనా అని తెలియజేయండి. నేను పథకాలు మరియు అవసరమైన పత్రాలను సూచించగలను.';
    }
    return 'Share your age, state, income range, and whether you are a student, farmer, worker, senior citizen, or family applicant. I can suggest schemes and required documents.';
  };

  if (!process.env.GEMINI_API_KEY) {
    const fallbackReply = await fallback();
    return res.json({ reply: fallbackReply, source: 'fallback', matches });
  }

  try {
    const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const prompt = `You are a Citizen Empowerment assistant for India. Reply in ${language === 'hi' ? 'Hindi' : language === 'te' ? 'Telugu' : 'English'}. Be concise, practical, and safety-aware. Never ask for OTP, PIN, passwords, or full identity numbers. Context schemes: ${JSON.stringify(matches.map((s) => ({ name: s.name, description: s.description })))}. Citizen question: ${message}`;
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    );
    
    if (!geminiRes.ok) {
      const errorText = await geminiRes.text();
      console.warn(`Gemini API returned error status ${geminiRes.status}:`, errorText);
      const fallbackReply = await fallback();
      return res.json({ 
        reply: fallbackReply, 
        source: 'fallback', 
        matches 
      });
    }

    const data = await geminiRes.json();
    
    if (data.error) {
      console.warn("Gemini API error payload:", data.error);
      const fallbackReply = await fallback();
      return res.json({ 
        reply: fallbackReply, 
        source: 'fallback', 
        matches 
      });
    }

    const reply = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('\n').trim();
    const fallbackReply = await fallback();
    res.json({ reply: reply || fallbackReply, source: reply ? 'gemini' : 'fallback', matches });
  } catch (error) {
    console.error("Gemini API call failed with exception:", error);
    const fallbackReply = await fallback();
    res.json({ 
      reply: fallbackReply, 
      source: 'fallback', 
      matches 
    });
  }
}));

app.post('/api/feedback', asyncHandler(async (req, res) => {
  if (!req.body.message) return res.status(400).json({ error: 'Feedback message is required' });
  const result = await saveFeedback(req.supabase, req.body);
  if (!result.saved) {
    return res.json({ saved: false, message: result.reason || 'Could not save feedback.' });
  }
  res.json({ saved: true, feedback: result.feedback });
}));

app.get('/api/compare', asyncHandler(async (req, res) => {
  const ids = cleanString(req.query.ids, 500)
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 4);
  const { compareSchemes: compare } = await import('./services/schemeService.js');
  const schemes = await compare(req.supabase, ids);
  res.json({ schemes });
}));

app.get('/api/updates', asyncHandler(async (req, res) => {
  const updates = await listGovernmentUpdates(req.supabase);
  res.json({ updates });
}));

app.get('/api/scams', asyncHandler(async (req, res) => {
  const scams = await listAwarenessContent(req.supabase);
  res.json({ scams });
}));

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
