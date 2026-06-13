import { cleanString, pickLanguage } from '../utils/api.js';

const fallbackDocuments = [
  { id: 'aadhaar_card', name: 'Aadhaar Card', purpose: '12-digit unique identity number based on biometrics and demographics', documents_required: ['Proof of Identity (Passport/Voter ID)', 'Proof of Address (Utility Bill/Bank statement)', 'Proof of Date of Birth (Birth Certificate/Marksheet)'], process: ['Locate and book an appointment at the nearest Aadhaar Enrolment Centre', 'Fill the Aadhaar enrolment form at the center', 'Provide biometric data (iris scan, fingerprints) and a photograph', 'Submit copies of identity and address proofs for scanning', 'Receive an acknowledgment slip with EID; track status online and download e-Aadhaar'], link: 'https://uidai.gov.in/' },
  { id: 'pan_card', name: 'PAN Card', purpose: 'Permanent Account Number for all tax-related financial transactions', documents_required: ['Aadhaar Card (serves as identity, address, and date of birth proof)', 'Recent passport size photographs (for physical forms)', 'Valid mobile number linked with Aadhaar'], process: ['Visit NSDL (Protean) or UTIITSL website', 'Fill Form 49A online for Indian Citizens', 'Choose e-KYC option for instant digital PAN using Aadhaar OTP', 'Pay application fee of around Rs. 107 online', 'Physical PAN card will be delivered to your Aadhaar address, and e-PAN is sent to your email'], link: 'https://www.onlineservices.nsdl.com/' },
  { id: 'income_certificate', name: 'Income Certificate', purpose: 'Proof of annual income of a family for fee concessions and scholarships', documents_required: ['Aadhaar Card', 'Salary slip or Form 16 (for salaried)', 'Affidavit declaring non-salaried income', 'Ration card or electricity bill', 'Land records (for farmers)'], process: ['Access the state e-District portal', 'Complete registration and fill the Income Certificate application form', 'Upload income declaration affidavit and supporting address proofs', 'Application undergoes review by the local revenue inspector', 'Download the digital certificate after approval from the Tehsildar'], link: 'https://www.myscheme.gov.in/' },
  { id: 'passport', name: 'Indian Passport', purpose: 'Official travel document for leaving and re-entering India', documents_required: ['Proof of Address (Aadhaar/Utility Bill)', 'Proof of Date of Birth (Birth Certificate/10th Marksheet)', 'Photo Identity Proof', 'Non-ECR proof if applicable'], process: ['Register on the Passport Seva Online Portal', 'Login and fill the application form online', 'Pay the required fee and schedule an appointment at the nearest PSK', 'Visit the Passport Seva Kendra with original documents', 'Complete the police verification process at your residence', 'Receive passport via speed post after verification'], link: 'https://www.passportindia.gov.in/' },
  { id: 'voter_id', name: 'Voter ID Card (EPIC)', purpose: 'Proof of identity and eligibility to vote in elections', documents_required: ['Proof of Address', 'Proof of Identity', 'Passport size photograph', 'Declaration Form 6'], process: ['Visit the National Voters Service Portal (NVSP)', 'Fill Form 6 online for new voter registration', 'Upload age proof, address proof, and photograph', 'The Booth Level Officer (BLO) will visit your house for verification', 'After approval, the Voter ID card is printed and posted to your address'], link: 'https://www.nvsp.in/' },
  { id: 'driving_license', name: 'Driving License', purpose: 'Official document permitting operation of motor vehicles', documents_required: ['Learner License', 'Address Proof', 'Age Proof', 'Form 1 and 1A (Medical Certificate if applicable)', 'Fee Payment Receipt'], process: ['Apply for a Learner License online on Sarathi Parivahan portal', 'Take the online learner\'s test and pass it', 'After 30 days of Learner License, apply for permanent Driving License online', 'Book a slot for a driving test at the local RTO office', 'Appear for the driving test; if you pass, the DL will be dispatched by post'], link: 'https://sarathi.parivahan.gov.in/' },
  { id: 'ration_card', name: 'Ration Card', purpose: 'State-issued document for buying subsidized food grains', documents_required: ['Aadhaar Cards of all family members', 'Income Proof', 'Residency Proof', 'Passport size photo of head of family'], process: ['Visit the state food and civil supplies portal or local FCS office', 'Fill the Application Form for new Ration Card', 'Submit copies of Aadhaar cards and family income proofs', 'FCS inspectors conduct field verification', 'Receive ration card from the local fair price shop or download online'], link: 'https://nfsa.gov.in/' },
  { id: 'birth_certificate', name: 'Birth Certificate', purpose: 'Primary proof of birth, date, place, and parentage', documents_required: ['Discharge certificate from hospital', 'Aadhaar Card of parents', 'Marriage certificate of parents (optional)', 'Identity proof of informant'], process: ['Get a birth registration form from the municipal corporation or Gram Panchayat', 'Register the birth within 21 days at the local registrar office', 'Provide hospital discharge summary and parental identity documents', 'Pay the nominal fee for additional copies of the birth certificate', 'Collect the certificate from the municipal counter or download online'], link: 'https://crsorgi.gov.in/' },
  { id: 'caste_certificate', name: 'Caste Certificate', purpose: 'Official proof of belonging to a reserved category (SC/ST/OBC)', documents_required: ['Aadhaar Card', 'Proof of residency', 'Father\'s caste certificate or community proof', 'Affidavit declaring caste status', 'Income certificate (for OBC non-creamy layer)'], process: ['Apply online on the state e-District portal or at a local CSC center', 'Fill the application form and upload scanned copies of proofs', 'Application is forwarded to local Revenue Inspector / Tehsildar', 'Tehsildar verifies the caste history through local inquiry', 'Once approved, download the digitally signed caste certificate'], link: 'https://www.myscheme.gov.in/' },
  { id: 'domicile_certificate', name: 'Domicile Certificate', purpose: 'Proof that a person is a resident of a particular State/UT', documents_required: ['Aadhaar Card', 'School leaving certificate showing residency', 'Land registry papers or rent agreement', 'Ration card or voter list entry', 'Affidavit in prescribed format'], process: ['Login to your state\'s e-District website', 'Fill the residency / domicile certificate form', 'Submit proofs showing continuous residency for specified years (usually 5-15 years)', 'Local revenue authority (Patwari/Lekhpal) conducts verification', 'Download the issued Domicile Certificate from the portal'], link: 'https://www.myscheme.gov.in/' },
  { id: 'marriage_certificate', name: 'Marriage Certificate', purpose: 'Proof of legal registration of marriage', documents_required: ['Application form signed by husband and wife', 'Proof of birth of both parties', 'Address proof before and after marriage', 'Two marriage photographs', 'Wedding invitation card', 'Witness identity proofs (usually 3 witnesses)'], process: ['File an application online or at the Sub-Registrar\'s Office (SRO) in your area', 'Submit marriage invitation card, photos, and age/address proofs', 'Both partners and witnesses must appear before the Sub-Registrar on the appointed date', 'Under Hindu Marriage Act, certificate is issued in a few days. Under Special Marriage Act, a 30-day notice is posted', 'Collect the marriage certificate signed by the Registrar'], link: 'https://www.india.gov.in/' },
  { id: 'disability_certificate', name: 'Disability Certificate (UDID Card)', purpose: 'Official identity card for persons with disabilities to claim benefits', documents_required: ['Aadhaar Card', 'Address Proof', 'Recent passport size photograph', 'Medical reports showing disability details'], process: ['Register on the Swavlambancard (UDID) portal', 'Fill the personal, address, and disability details in the online form', 'Select the government hospital for physical medical assessment', 'Visit the designated hospital on the scheduled date for medical board checkup', 'Medical board determines disability percentage, and UDID card is issued online and posted'], link: 'https://www.swavlambancard.gov.in/' },
  { id: 'death_certificate', name: 'Death Certificate', purpose: 'Official proof of death of an individual', documents_required: ['Hospital death summary or post-mortem report', 'Aadhaar Card of the deceased', 'Identity proof of the applicant', 'Cremation/burial receipt'], process: ['Report the death to the local registrar within 21 days of occurrence', 'Submit the hospital death report or declaration by local headman', 'Provide identity proofs of the deceased and applicant', 'Verify the entry in the death register of the local body', 'Collect the printed death certificate from municipal or panchayat office'], link: 'https://crsorgi.gov.in/' },
  { id: 'minority_certificate', name: 'Minority Certificate', purpose: 'Proof of belonging to a religious/linguistic minority community', documents_required: ['Aadhaar Card', 'Self-declaration of community membership', 'School leaving certificate', 'Domicile Certificate', 'Parents\' minority declaration or school record'], process: ['Apply through the State Minorities Commission or e-District portal', 'Upload self-declaration of religion/linguistic community', 'Attach address and identity proofs', 'Revenue officer verifies the credentials', 'Obtain the digital certificate from the portal dashboard'], link: 'https://www.minorityaffairs.gov.in/' },
  { id: 'senior_citizen_card', name: 'Senior Citizen Card', purpose: 'Grants age concessions for travel, healthcare, and utility bills', documents_required: ['Proof of Age (PAN Card/Birth Certificate)', 'Proof of Address', 'Two passport size photographs', 'Medical certificate showing blood group'], process: ['Apply through the state Social Welfare Department portal or local municipal office', 'Fill the senior citizen registration form', 'Upload age proof (showing age 60 or above) and photo', 'Verification is done by social welfare officers', 'Collect the Senior Citizen ID Card which lists blood group, emergency contact, and age benefits'], link: 'https://www.india.gov.in/' },
  { id: 'e_shram_card', name: 'e-Shram Card', purpose: 'National database of unorganized workers to deliver social security benefits', documents_required: ['Aadhaar Card', 'Aadhaar linked active mobile number', 'Bank Account details (account number and IFSC code)'], process: ['Visit the e-Shram self-registration portal', 'Enter your Aadhaar-linked mobile number and solve captcha', 'Enter Aadhaar details and authenticate using OTP', 'Fill personal, address, qualification, occupation, and bank details', 'Verify the details and download the e-Shram card containing a 12-digit UAN number'], link: 'https://eshram.gov.in/' },
  { id: 'udyam_registration', name: 'Udyam (MSME) Registration', purpose: 'Official registration for small, micro, and medium enterprises to claim subsidies', documents_required: ['Aadhaar Card of the proprietor/partner/director', 'PAN Card of the organization', 'GSTIN (if applicable)', 'Bank Account number and IFSC code'], process: ['Visit the Udyam Registration portal', 'Enter Aadhaar number and name of entrepreneur, validate with OTP', 'Enter PAN card details and validate tax status', 'Provide business name, location, bank details, and investment figures', 'Submit and receive the Udyam Registration Certificate containing QR code instantly'], link: 'https://udyamregistration.gov.in/' },
  { id: 'land_possession', name: 'Land Possession Certificate (LPC)', purpose: 'Establishes legal possession over a piece of land', documents_required: ['Registered land deed papers', 'Recent land tax payment receipt', 'Aadhaar Card', 'Voter List copy', 'Affidavit declaring land details'], process: ['Apply online on the state Land Records (Bhumi) portal or visit Circle Office', 'Fill application form with Khata/Khesra/Plot numbers', 'Submit copies of registered deeds and current revenue tax receipt', 'An Amin (surveyor) is deputed to measure and verify boundary possession', 'Circle Officer approves and issues LPC showing ownership details'], link: 'https://www.myscheme.gov.in/' },
  { id: 'ration_card_surrender', name: 'Ration Card Surrender Certificate', purpose: 'Required when moving to another state or changing category', documents_required: ['Active Ration Card', 'Aadhaar Card', 'Proof of transfer/relocation', 'Application form for surrender'], process: ['Submit application to District Supply Officer (DSO) or apply online', 'Provide active ration card details and reason for surrender', 'FCS department marks the card as inactive and generates surrender slip', 'Use this surrender slip to apply for a fresh ration card in your new location'], link: 'https://nfsa.gov.in/' },
  { id: 'non_creamy_layer', name: 'OBC Non-Creamy Layer Certificate', purpose: 'Required to claim reservation benefits in education and government jobs', documents_required: ['Community/Caste Certificate', 'Aadhaar Card', 'Parent\'s Income Certificates / Form 16 for last 3 years', 'Affidavit declaring assets and income'], process: ['Apply through the e-District website or Citizen Service Centre', 'Submit caste proof and parents\' verified income details of the past three fiscal years', 'Revenue inspectors verify that family income is below the creamy layer threshold (currently Rs. 8 Lakh/year)', 'Tehsildar issues the NCL certificate, usually valid for one financial year'], link: 'https://www.myscheme.gov.in/' }
];

const fallbackFaqs = [
  { id: 1, question: 'How do I know if I am eligible for a scheme?', answer: 'Use the eligibility checker for a first pass, then verify final rules on the official scheme portal.', category: 'eligibility' },
  { id: 2, question: 'Can I apply without Aadhaar?', answer: 'Many schemes use Aadhaar for verification, but alternatives depend on the scheme rules and state process.', category: 'documents' },
  { id: 3, question: 'Are application fees required?', answer: 'Most welfare scheme applications should only use official portals. Avoid payment links from unknown messages.', category: 'safety' }
];

const fallbackHelplines = [
  { id: 1, name: 'National Cyber Crime Helpline', number: '1930', category: 'Cyber safety', availability: '24x7', link: 'https://cybercrime.gov.in/' },
  { id: 2, name: 'Emergency Response Support System', number: '112', category: 'Emergency', availability: '24x7', link: 'https://112.gov.in/' },
  { id: 3, name: 'Women Helpline', number: '181', category: 'Women safety', availability: '24x7', link: 'https://www.india.gov.in/' }
];

const fallbackLinks = [
  { id: 1, title: 'India.gov.in', category: 'Government directory', url: 'https://www.india.gov.in/', description: 'National portal for Government of India services and information.' },
  { id: 2, title: 'MyScheme', category: 'Scheme discovery', url: 'https://www.myscheme.gov.in/', description: 'Official scheme discovery platform.' },
  { id: 3, title: 'DigiLocker', category: 'Documents', url: 'https://www.digilocker.gov.in/', description: 'Digital document wallet for citizens.' },
  { id: 4, title: 'UMANG', category: 'Citizen services', url: 'https://web.umang.gov.in/', description: 'Unified mobile app for government services.' }
];

const fallbackUpdates = [
  { id: 1, title: 'Verify scheme information only on official portals', category: 'Advisory', summary: 'Use .gov.in and .nic.in websites for applications and status checks.', date: '2026-06-06', link: 'https://www.india.gov.in/' },
  { id: 2, title: 'Keep documents ready before applying', category: 'Preparation', summary: 'Aadhaar, bank details, income proof, and category certificates are commonly requested.', date: '2026-06-06', link: 'documents.html' }
];

const fallbackAwareness = [
  { id: 1, type: 'scam', title: 'OTP fraud', warning: 'No official or bank employee should ask for OTP, PIN, or passwords.', action: 'Do not share OTP. Report financial fraud quickly on 1930.' },
  { id: 2, type: 'scam', title: 'Fake government websites', warning: 'Fraud sites may copy official scheme pages and collect fees.', action: 'Check for .gov.in or .nic.in and use official directories.' },
  { id: 3, type: 'awareness', title: 'Self-attest document copies', warning: 'Document copies can be misused if shared blank.', action: 'Write purpose and date before sharing copies.' }
];

const tableFallback = {
  documents: fallbackDocuments,
  faqs: fallbackFaqs,
  helplines: fallbackHelplines,
  government_links: fallbackLinks,
  government_updates: fallbackUpdates,
  awareness_content: fallbackAwareness
};

async function fetchTable(supabase, table, order = 'id') {
  if (!supabase) return tableFallback[table] || [];
  const { data, error } = await supabase.from(table).select('*').order(order, { ascending: true });
  if (error) return tableFallback[table] || [];
  return data?.length ? data : tableFallback[table] || [];
}

export async function listDocuments(supabase) {
  return fetchTable(supabase, 'documents');
}

export async function listFaqs(supabase) {
  return fetchTable(supabase, 'faqs');
}

export async function listHelplines(supabase) {
  return fetchTable(supabase, 'helplines');
}

export async function listGovernmentLinks(supabase) {
  return fetchTable(supabase, 'government_links');
}

export async function listGovernmentUpdates(supabase) {
  return fetchTable(supabase, 'government_updates', 'date');
}

export async function listAwarenessContent(supabase) {
  return fetchTable(supabase, 'awareness_content');
}

export async function saveFeedback(supabase, payload) {
  const feedback = {
    name: cleanString(payload.name, 120) || 'Anonymous',
    email: cleanString(payload.email, 180),
    category: cleanString(payload.category, 80) || 'general',
    message: cleanString(payload.message, 1500),
    rating: Number(payload.rating) || null,
    language: pickLanguage(payload.language)
  };

  if (!feedback.message) {
    return { saved: false, feedback, reason: 'Feedback message is required.' };
  }

  if (!supabase) return { saved: false, feedback, reason: 'Supabase is not configured.' };
  const { data, error } = await supabase.from('feedback').insert(feedback).select().single();
  if (error) return { saved: false, feedback, reason: error.message };
  return { saved: true, feedback: data };
}
