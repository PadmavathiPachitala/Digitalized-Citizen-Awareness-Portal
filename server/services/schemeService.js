import { cleanString, pickLanguage, slugify } from '../utils/api.js';
import { listDocuments, listFaqs } from './contentService.js';
import { logger } from '../utils/logger.js';

const cache = new Map();
const CACHE_MS = 5 * 60 * 1000;

const first = (record, keys, fallback = '') => {
  for (const key of keys) {
    if (record?.[key] !== undefined && record[key] !== null && record[key] !== '') return record[key];
  }
  return fallback;
};

export function normalizeScheme(raw = {}) {
  const name = first(raw, ['name', 'scheme_name', 'Scheme Name', 'title']) || 'Unnamed Scheme';
  const id = first(raw, ['id', 'ID', 'scheme_id'], slugify(name));
  const category = first(raw, ['category', 'Category', 'type'], '');
  const audience = first(raw, ['audience', 'Audience', 'target_group'], '');
  const eligibility = first(raw, ['eligibility', 'Eligibility', 'eligibility_criteria'], '');
  const description =
    first(raw, ['description', 'summary']) ||
    eligibility ||
    category ||
    'No details available.';
  const slug = first(raw, ['slug', 'key'], slugify(name));

  return {
    id,
    slug,
    key: first(raw, ['key', 'code'], slug),
    name,
    description,
    category,
    audience,
    eligibility,
    documents: first(raw, ['documents', 'Documents Required', 'documents_required'], ''),
    benefits: first(raw, ['benefits', 'Benefits', 'benefit'], description),
    process: first(raw, ['process', 'application_process', 'how_to_apply'], 'Apply via the official government portal.'),
    applyLink: first(raw, ['applyLink', 'apply_link', 'official_url', 'link'], '#'),
    state: first(raw, ['state', 'State'], 'All India'),
    language: first(raw, ['language', 'lang'], 'en')
  };
}

const FALLBACK_SCHEMES = [
  { id: 'scheme_csv_001', key: 'pm-kushal-vikas', slug: 'pm-kushal-vikas', name: 'Pradhan Mantri Kaushal Vikas Yojana (PMKVY)', category: 'Skill Development', audience: 'youth', description: 'Skill certification scheme aiming to enable a large number of Indian youth to take up industry-relevant skill training.', eligibility: 'Any unemployed youth or school/college dropouts who are citizens of India.', documents: 'Aadhaar Card, Bank Account Details, Education Certificates, Passport Size Photographs', benefits: 'Free skill training, assessment, and certification. Financial rewards upon successful completion and placement assistance.', process: 'Register online on the PMKVY portal, choose a training center and course, complete training, and appear for the assessment.', applyLink: 'https://www.pmkvyofficial.org/', state: 'All India', language: 'en' },
  { id: 'scheme_csv_002', key: 'pm-suraksha-bima', slug: 'pm-suraksha-bima', name: 'Pradhan Mantri Suraksha Bima Yojana (PMSBY)', category: 'Insurance', audience: 'public', description: 'Government-backed accident insurance scheme in India targeting a wide section of the population.', eligibility: 'All savings bank account holders aged between 18 and 70 years.', documents: 'Aadhaar Card, Bank Account Details, KYC Documents', benefits: 'Accidental death and full disability cover of Rs. 2 Lakh; partial disability cover of Rs. 1 Lakh.', process: 'Submit the application form to your bank or register through internet banking with auto-debit consent.', applyLink: 'https://www.jansuraksha.gov.in/', state: 'All India', language: 'en' },
  { id: 'scheme_csv_003', key: 'pm-jeevan-jyoti', slug: 'pm-jeevan-jyoti', name: 'Pradhan Mantri Jeevan Jyoti Bima Yojana (PMJJBY)', category: 'Insurance', audience: 'public', description: 'Government-backed life insurance scheme in India providing annual term life insurance.', eligibility: 'All savings bank account holders aged between 18 and 50 years.', documents: 'Aadhaar Card, Bank Account Details, Health Declaration Form', benefits: 'Life cover of Rs. 2 Lakh in case of death of the insured due to any reason.', process: 'Fill the PMJJBY enrollment form at your banking branch or apply online via net banking.', applyLink: 'https://www.jansuraksha.gov.in/', state: 'All India', language: 'en' },
  { id: 'scheme_csv_004', key: 'stand-up-india', slug: 'stand-up-india', name: 'Stand-Up India Scheme', category: 'Business & Entrepreneurship', audience: 'entrepreneurs', description: 'Scheme promoting entrepreneurship among women and Scheduled Castes or Scheduled Tribes.', eligibility: 'SC/ST and/or women entrepreneurs above 18 years of age. Loan only for greenfield projects.', documents: 'Identity Proof, Address Proof, Business Plan, Caste Certificate (if applicable), Assets & Liabilities Statement', benefits: 'Bank loans between Rs. 10 Lakh and Rs. 1 Crore for setting up a greenfield enterprise.', process: 'Apply online at Stand-Up India portal, connect with a branch counselor, and submit the loan application form.', applyLink: 'https://www.standupmitra.in/', state: 'All India', language: 'en' },
  { id: 'scheme_csv_005', key: 'pm-mudra-yojana', slug: 'pm-mudra-yojana', name: 'Pradhan Mantri MUDRA Yojana (PMMY)', category: 'Business & Entrepreneurship', audience: 'entrepreneurs', description: 'Provides loans up to Rs. 10 Lakh to non-corporate, non-farm small/micro enterprises.', eligibility: 'Any Indian citizen having a business plan for a non-farm sector income-generating activity.', documents: 'MUDRA Application Form, Identity/Address Proof, Business Identity Proof, 2 Passport Photos', benefits: 'Collateral-free loans under three categories: Shishu (up to 50k), Kishor (50k-5L), and Tarun (5L-10L).', process: 'Approach a commercial bank, RRB, MFI, or cooperative bank, or apply online via Udyami Mitra portal.', applyLink: 'https://www.mudra.org.in/', state: 'All India', language: 'en' },
  { id: 'scheme_csv_006', key: 'pm-ujjwala-yojana', slug: 'pm-ujjwala-yojana', name: 'Pradhan Mantri Ujjwala Yojana (PMUY)', category: 'Social Welfare', audience: 'women', description: 'Provides clean cooking fuel (LPG connections) to women from BPL (Below Poverty Line) households.', eligibility: 'Adult woman belonging to a poor household without an existing LPG connection in the name of any family member.', documents: 'Aadhaar Card, BPL Ration Card, Bank Account Details, Address Proof', benefits: 'Free LPG connection with financial support of Rs. 1,600 per connection plus interest-free loan for stove/refill.', process: 'Submit application form at nearest LPG distributor or apply online through the PMUY website.', applyLink: 'https://www.pmuy.gov.in/', state: 'All India', language: 'en' },
  { id: 'scheme_csv_007', key: 'sukanya-samriddhi', slug: 'sukanya-samriddhi', name: 'Sukanya Samriddhi Yojana (SSY)', category: 'Women Empowerment', audience: 'parent', description: 'A small deposit scheme for the girl child, launched under the \'Beti Bachao Beti Padhao\' campaign.', eligibility: 'Parents or legal guardians of a girl child aged 10 years or below. Maximum 2 accounts per family.', documents: 'Girl Child\'s Birth Certificate, Parent\'s Identity and Address Proof, Photo', benefits: 'High interest rate, tax benefits under Section 80C, and a maturity payout when the girl turns 21.', process: 'Open account at any post office or authorized commercial bank branches by submitting the form and deposit.', applyLink: 'https://www.indiapost.gov.in/', state: 'All India', language: 'en' },
  { id: 'scheme_csv_008', key: 'pm-svanidhi', slug: 'pm-svanidhi', name: 'PM SVANidhi Scheme', category: 'Business & Entrepreneurship', audience: 'vendors', description: 'Special micro-credit facility scheme for providing affordable working capital loans to street vendors.', eligibility: 'Urban street vendors vending in urban areas on or before March 24, 2020.', documents: 'Aadhaar Card, Voter Card, Street Vendor ID Card or Letter of Recommendation (LoR)', benefits: 'Working capital loan up to Rs. 10,000 for 1st tranche, Rs. 20,000 for 2nd tranche, and Rs. 50,000 for 3rd tranche.', process: 'Apply online through PM SVANidhi Portal, or via a Banking Correspondent (BC)/Common Service Centre (CSC).', applyLink: 'https://pmsvanidhi.mohua.gov.in/', state: 'All India', language: 'en' },
  { id: 'scheme_csv_009', key: 'day-nrlm', slug: 'day-nrlm', name: 'Deendayal Antyodaya Yojana - NRLM', category: 'Livelihoods', audience: 'rural', description: 'Organizes rural poor households into Self Help Groups (SHGs) and supports them for livelihoods.', eligibility: 'At least one member from each rural poor household (preferably a woman) to be brought under SHG network.', documents: 'SHG Member details, Aadhaar Card, Bank Account, Ration Card', benefits: 'Revolving fund, community investment fund support, interest subvention on loans, and capacity building.', process: 'Form a Self Help Group, register with block mission management unit, open bank account, and apply for revolving fund.', applyLink: 'https://aajeevika.gov.in/', state: 'All India', language: 'en' },
  { id: 'scheme_csv_010', key: 'janani-suraksha', slug: 'janani-suraksha', name: 'Janani Suraksha Yojana (JSY)', category: 'Health & Family Welfare', audience: 'pregnant_women', description: 'Safe motherhood intervention promoting institutional delivery among poor pregnant women.', eligibility: 'All pregnant women belonging to BPL/SC/ST households delivering in government or accredited private health facilities.', documents: 'JSY Card, Bank Account Details, Address Proof, BPL Card', benefits: 'Cash assistance of Rs. 1,400 in rural areas and Rs. 700 in urban areas to the mother, and incentives to ASHA workers.', process: 'Register with the local auxiliary nurse midwife (ANM) or ASHA worker, fill JSY form, and deliver at institutional facility.', applyLink: 'https://nhm.gov.in/', state: 'All India', language: 'en' },
  { id: 'scheme_csv_011', key: 'pm-vishwakarma', slug: 'pm-vishwakarma', name: 'PM Vishwakarma Scheme', category: 'Skill Development', audience: 'artisans', description: 'Provides end-to-end support to artisans and craftspeople who work with their hands and tools.', eligibility: 'An artisan or craftsperson working in one of the 18 family-based traditional trades.', documents: 'Aadhaar Card, Mobile Number, Bank Details, Ration Card, Skill Certificate (if any)', benefits: 'Biometric registration, PM Vishwakarma Certificate, skill upgrading, toolkit incentive of Rs. 15,000, credit support up to Rs. 3 Lakh.', process: 'Apply online at CSC or the PM Vishwakarma portal, complete three-step verification, and obtain certificate.', applyLink: 'https://pmvishwakarma.gov.in/', state: 'All India', language: 'en' },
  { id: 'scheme_csv_012', key: 'pm-awas-yojana-urban', slug: 'pm-awas-yojana-urban', name: 'Pradhan Mantri Awas Yojana - Urban (PMAY-U)', category: 'Housing', audience: 'public', description: 'Aims to provide all-weather pucca houses to eligible urban households.', eligibility: 'Beneficiary family should not own a pucca house in their name anywhere in India. Annual income rules apply.', documents: 'Aadhaar Card, Voter Card, Pan Card, Bank Account details, Income Certificate, Land ownership documents', benefits: 'Interest subsidy on home loans, financial assistance for house construction/enhancement.', process: 'Apply online through the PMAY-U portal or submit application via a Common Service Centre (CSC).', applyLink: 'https://pmaymis.gov.in/', state: 'All India', language: 'en' },
  { id: 'scheme_csv_013', key: 'pm-awas-yojana-gramin', slug: 'pm-awas-yojana-gramin', name: 'Pradhan Mantri Awas Yojana - Gramin (PMAY-G)', category: 'Housing', audience: 'rural', description: 'Aims to provide a pucca house with basic amenities to all houseless households in rural areas.', eligibility: 'Rural families living in kutcha/dilapidated houses as per SECC database.', documents: 'Aadhaar Card, Bank Account details, Swachh Bharat Mission registration number, Job card number', benefits: 'Financial assistance of Rs. 1.2 Lakh in plains and Rs. 1.3 Lakh in hilly/difficult areas for house construction.', process: 'Beneficiary list generated based on SECC data. Gram Sabha validates list. Local administration contacts beneficiaries.', applyLink: 'https://pmayg.nic.in/', state: 'All India', language: 'en' },
  { id: 'scheme_csv_014', key: 'atal-pension-yojana', slug: 'atal-pension-yojana', name: 'Atal Pension Yojana (APY)', category: 'Pension', audience: 'public', description: 'Pension scheme focused on the unorganized sector workers to secure their old age.', eligibility: 'All citizens of India aged between 18 and 40 years holding a savings bank account.', documents: 'Aadhaar Card, Bank Account Details, Mobile Number', benefits: 'Minimum guaranteed monthly pension of Rs. 1,000, 2,000, 3,000, 4,000, or 5,000 after the age of 60.', process: 'Approach the bank where savings account is held, fill APY registration form, and opt for auto-debit.', applyLink: 'https://www.npscra.nsdl.co.in/', state: 'All India', language: 'en' },
  { id: 'scheme_csv_015', key: 'pm-kisan-maan-dhan', slug: 'pm-kisan-maan-dhan', name: 'PM Kisan Maan-Dhan Yojana', category: 'Pension', audience: 'farmers', description: 'Pension scheme to secure the lives of Small and Marginal Farmers in their old age.', eligibility: 'Small and marginal farmers owning cultivable land up to 2 hectares, aged 18 to 40 years.', documents: 'Aadhaar Card, Bank Account Details, Land Possession Document, KCC Card (optional)', benefits: 'Minimum assured pension of Rs. 3,000 per month after attaining the age of 60 years.', process: 'Apply online at nearest CSC or PM-KMDY portal. Farmers make monthly contribution matched by Central Government.', applyLink: 'https://maandhan.in/', state: 'All India', language: 'en' },
  { id: 'scheme_csv_016', key: 'ladli-behna-yojana', slug: 'ladli-behna-yojana', name: 'Ladli Behna Yojana', category: 'Women Welfare', audience: 'women', description: 'State level scheme to support the health and economic independence of women.', eligibility: 'Women residents of the specific state (e.g., MP) aged 21 to 60 years. Income limitations apply.', documents: 'Samagra ID (if applicable), Aadhaar Card, Bank Account (DBT enabled), Photo', benefits: 'Monthly financial aid of Rs. 1,250 transferred directly to the beneficiary\'s bank account.', process: 'Submit applications at ward offices or through local camps, complete e-KYC, and verify registration.', applyLink: 'https://cmladlibahna.mp.gov.in/', state: 'Madhya Pradesh', language: 'en' },
  { id: 'scheme_csv_017', key: 'pm-egp', slug: 'pm-egp', name: 'Prime Minister\'s Employment Generation Programme (PMEGP)', category: 'Employment', audience: 'entrepreneurs', description: 'Credit-linked subsidy program for generating self-employment opportunities through micro-enterprises.', eligibility: 'Any individual above 18 years of age. At least VIII standard pass for project costs above 10 Lakh.', documents: 'Aadhaar, Project Report, Education Certificate, Caste/Special Category Certificate, PAN', benefits: 'Subsidy of 15% to 35% on project costs up to Rs. 50 Lakh for manufacturing and Rs. 20 Lakh for service sector.', process: 'Apply online on the KVIC website, upload required documents, bank evaluates project and sanctions loan.', applyLink: 'https://www.kviconline.gov.in/pmegpeportal/', state: 'All India', language: 'en' },
  { id: 'scheme_csv_018', key: 'digital-india-internship', slug: 'digital-india-internship', name: 'Digital India Internship Scheme', category: 'Education & Career', audience: 'students', description: 'Provides learning opportunities to students in the area of Electronics and IT policies/projects.', eligibility: 'B.E/B.Tech/M.E/M.Tech/MCA/M.Sc (IT) students with minimum 60% marks in degree/class XII.', documents: 'College Recommendation Letter, Marksheets, Aadhaar Card, Resume', benefits: 'Practical exposure in Ministry of Electronics and IT, monthly stipend of Rs. 10,000, and internship certificate.', process: 'Apply online during the active application window on MeitY portal and undergo screening interview.', applyLink: 'https://www.meity.gov.in/', state: 'All India', language: 'en' },
  { id: 'scheme_csv_019', key: 'national-safai-karamcharis', slug: 'national-safai-karamcharis', name: 'NSKFDC Loan Schemes', category: 'Social Welfare', audience: 'safai_karamcharis', description: 'Financial assistance schemes for socio-economic upliftment of Safai Karamcharis and Scavengers.', eligibility: 'Safai Karamcharis, manual scavengers, and their dependents. No income limit applies.', documents: 'Identity/Address Proof, Occupation Certificate from local authority, Bank Passbook, Aadhaar', benefits: 'Concessional loans at low interest rates (4% to 6%) for starting self-employment ventures.', process: 'Apply through State Channelising Agencies (SCAs), Regional Rural Banks, or designated nationalized banks.', applyLink: 'https://nskfdc.nic.in/', state: 'All India', language: 'en' },
  { id: 'scheme_csv_020', key: 'post-matric-sc-students', slug: 'post-matric-sc-students', name: 'Post Matric Scholarship for SC Students', category: 'Education', audience: 'students', description: 'Financial assistance to Scheduled Caste students studying at post-matriculation or post-secondary stages.', eligibility: 'SC students whose parents\' annual income does not exceed Rs. 2.5 Lakh.', documents: 'Caste Certificate, Income Certificate, Academic Marksheets, Fee Receipt, Bank Details, Aadhaar', benefits: '100% compulsory non-refundable fees and maintenance allowance paid directly to student bank accounts.', process: 'Register and apply on the National Scholarship Portal or State Scholarship Portal during active dates.', applyLink: 'https://scholarships.gov.in/', state: 'All India', language: 'en' }
];

async function fetchSchemesFromSupabase(supabase) {
  if (!supabase) return [];
  const { data, error } = await supabase.from('schemes').select('*');
  if (error) {
    logger.warn('Failed to fetch schemes from Supabase, using fallback.', { details: error.message });
    return [];
  }
  return data || [];
}

export async function listSchemes(supabase, filters = {}) {
  const lang = pickLanguage(filters.lang);
  const cacheKey = `schemes:${lang}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.createdAt < CACHE_MS) return cached.data;

  const raw = await fetchSchemesFromSupabase(supabase);
  const source = raw.length > 0 ? raw : FALLBACK_SCHEMES;
  const schemes = source.map(normalizeScheme);
  cache.set(cacheKey, { createdAt: Date.now(), data: schemes });
  return schemes;
}

export async function getSchemeById(supabase, id) {
  const key = cleanString(id, 180).toLowerCase();
  const schemes = await listSchemes(supabase);
  return (
    schemes.find(
      (s) =>
        String(s.id).toLowerCase() === key ||
        String(s.slug).toLowerCase() === key ||
        String(s.key).toLowerCase() === key ||
        slugify(s.name) === key
    ) || null
  );
}

export async function searchAll(supabase, query, options = {}) {
  const q = cleanString(query, 120).toLowerCase();
  if (!q) return [];

  const [schemes, documents, faqs] = await Promise.all([
    listSchemes(supabase, options),
    listDocuments(supabase),
    listFaqs(supabase)
  ]);

  const results = [];
  const includes = (...values) => values.filter(Boolean).join(' ').toLowerCase().includes(q);

  schemes.forEach((scheme) => {
    if (includes(scheme.name, scheme.description, scheme.category, scheme.audience, scheme.eligibility)) {
      results.push({
        type: 'Scheme',
        title: scheme.name,
        description: scheme.description,
        url: `scheme-details.html?scheme=${encodeURIComponent(scheme.slug)}`
      });
    }
  });

  documents.forEach((doc) => {
    if (includes(doc.name, doc.purpose, doc.description)) {
      results.push({
        type: 'Document',
        title: doc.name,
        description: doc.purpose || doc.description || '',
        url: 'documents.html'
      });
    }
  });

  faqs.forEach((faq) => {
    if (includes(faq.question, faq.answer, faq.category)) {
      results.push({
        type: 'FAQ',
        title: faq.question,
        description: faq.answer,
        url: 'chatbot.html'
      });
    }
  });

  return results.slice(0, Number(options.limit) || 30);
}

const scoreScheme = (scheme, profile) => {
  const haystack = [scheme.name, scheme.description, scheme.category, scheme.audience, scheme.eligibility, scheme.benefits]
    .join(' ')
    .toLowerCase();
  let score = 0;
  const reasons = [];

  if (profile.category && haystack.includes(profile.category)) {
    score += 35;
    reasons.push(`Matches your ${profile.category} profile`);
  }
  if (profile.socialCategory && haystack.includes(profile.socialCategory)) {
    score += 15;
    reasons.push(`Mentions ${profile.socialCategory.toUpperCase()} support`);
  }
  if (profile.income === 'low' && /(income|poor|bpl|ews|low|subsidy|financial)/.test(haystack)) {
    score += 20;
    reasons.push('Likely relevant for lower-income households');
  }
  if (profile.age >= 60 && /(senior|pension|old age|elder)/.test(haystack)) {
    score += 25;
    reasons.push('Relevant for senior citizens');
  }
  if (profile.category === 'student' && /(student|scholarship|education)/.test(haystack)) {
    score += 35;
    reasons.push('Student education support');
  }
  if (profile.category === 'farmer' && /(farmer|agriculture|crop|kisan)/.test(haystack)) {
    score += 35;
    reasons.push('Farmer/agriculture support');
  }

  return { score, reasons };
};

export async function recommendSchemes(supabase, payload = {}) {
  const profile = {
    age: Number(payload.age) || 0,
    category: cleanString(payload.category, 80).toLowerCase(),
    income: cleanString(payload.income, 40).toLowerCase(),
    state: cleanString(payload.state, 80),
    socialCategory: cleanString(payload.social_category || payload.socialCategory, 40).toLowerCase(),
    language: pickLanguage(payload.language)
  };

  const schemes = await listSchemes(supabase, { lang: profile.language });
  const recommendations = schemes
    .map((scheme) => ({ ...scheme, ...scoreScheme(scheme, profile) }))
    .filter((scheme) => scheme.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  return { profile, recommendations };
}

export async function compareSchemes(supabase, ids = []) {
  const uniqueIds = [...new Set(ids.map((id) => cleanString(id, 180)).filter(Boolean))].slice(0, 4);
  const schemes = await Promise.all(uniqueIds.map((id) => getSchemeById(supabase, id)));
  return schemes.filter(Boolean).map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    benefits: s.benefits,
    eligibility: s.eligibility,
    documents: s.documents,
    process: s.process,
    applyLink: s.applyLink
  }));
}
