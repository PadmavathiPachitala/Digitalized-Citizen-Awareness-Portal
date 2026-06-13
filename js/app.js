// Initialize theme choice
const savedTheme = localStorage.getItem("theme");
const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
  document.documentElement.setAttribute("data-theme", "dark");
} else {
  document.documentElement.setAttribute("data-theme", "light");
}

// Inject Theme Toggle Button dynamically
const navBar = document.querySelector(".nav-bar");
if (navBar) {
  const themeToggle = document.createElement("button");
  themeToggle.type = "button";
  themeToggle.className = "theme-toggle";
  themeToggle.setAttribute("aria-label", "Toggle dark mode");
  themeToggle.innerHTML = `
    <svg class="sun-icon" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="5"></circle>
      <line x1="12" y1="1" x2="12" y2="3"></line>
      <line x1="12" y1="21" x2="12" y2="23"></line>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
      <line x1="1" y1="12" x2="3" y2="12"></line>
      <line x1="21" y1="12" x2="23" y2="12"></line>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
    </svg>
    <svg class="moon-icon" viewBox="0 0 24 24">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    </svg>
  `;

  const menuToggle = navBar.querySelector("[data-nav-toggle]") || navBar.querySelector(".menu-toggle");
  const navCta = navBar.querySelector(".nav-cta");
  if (menuToggle) {
    navBar.insertBefore(themeToggle, menuToggle);
  } else if (navCta) {
    navBar.insertBefore(themeToggle, navCta);
  } else {
    navBar.appendChild(themeToggle);
  }

  themeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  });
}

const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");

const API_BASE =
  (window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost")
    ? "http://localhost:3000"
    : window.location.origin;

if (nav && navToggle) {
  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

const currentPage = window.location.pathname.split("/").pop() || "index.html";
document.querySelectorAll(".site-nav a").forEach((link) => {
  if (link.getAttribute("href").endsWith(currentPage)) {
    link.classList.add("active");
  }
});

const homeSearch = document.querySelector("[data-home-search]");
if (homeSearch) {
  homeSearch.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = homeSearch.querySelector("input").value.trim();
    if (!query) { homeSearch.querySelector("input").focus(); return; }
    const basePath = window.location.pathname.includes("/pages/") ? "" : "pages/";
    window.location.href = `${basePath}search-results.html?q=${encodeURIComponent(query)}`;
  });
}

const schemeSearch = document.querySelector("[data-scheme-search]");
const getSchemeCards = () => document.querySelectorAll("[data-scheme-list] .info-card");
if (schemeSearch) {
  schemeSearch.addEventListener("input", () => {
    const query = schemeSearch.value.trim().toLowerCase();
    getSchemeCards().forEach((card) => {
      const text = `${card.textContent} ${card.dataset.keywords}`.toLowerCase();
      card.style.display = text.includes(query) ? "" : "none";
    });
  });
}

const schemeListContainer = document.querySelector("[data-scheme-list]");
const schemeCategoryFallback = {
  student: ["pm-kushal-vikas", "digital-india-internship", "post-matric-sc-students"],
  farmer: ["pm-kisan-maan-dhan", "pm-awas-yojana-gramin", "day-nrlm"],
  public: ["pm-suraksha-bima", "pm-jeevan-jyoti", "stand-up-india", "pm-mudra-yojana", "pm-ujjwala-yojana", "sukanya-samriddhi", "pm-svanidhi", "janani-suraksha", "pm-vishwakarma", "pm-awas-yojana-urban", "atal-pension-yojana", "ladli-behna-yojana", "pm-egp", "national-safai-karamcharis"]
};
const schemeCategoryTokenMap = {
  student: ["student", "scholarship", "education", "school", "university", "college", "academic", "merit"],
  farmer: ["farmer", "agriculture", "agricultural", "farm", "crop", "irrigation", "soil", "livestock"],
  public: ["public", "general", "health", "housing", "pension", "welfare"]
};
const audienceToPageCategory = {
  student: "student",
  students: "student",
  youth: "student",
  farmer: "farmer",
  farmers: "farmer",
  rural: "farmer",
  "general public": "public",
  public: "public",
  entrepreneurs: "public",
  women: "public",
  parent: "public",
  vendors: "public",
  pregnant_women: "public",
  artisans: "public",
  safai_karamcharis: "public"
};

const slugify = (s) =>
  s ? s.toString().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") : "";

const escapeHTML = (str) =>
  String(str || "").replace(/[&<>"']/g, (match) => {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[match];
  });

const normalize = (raw) => {
  const name = raw.name || raw["Scheme Name"] || raw.title || "Unnamed Scheme";
  const category = raw.category || raw["Category"] || "";
  const audience = raw.audience || raw["Audience"] || "";
  const eligibility = raw.eligibility || raw["Eligibility"] || "";
  const description = raw.description || eligibility || category || "No details available.";
  const generatedSlug = slugify(name) || String(raw.id || raw.ID || "");
  const slug = raw.slug || raw.key || generatedSlug;

  return {
    id: raw.id || raw.ID || "",
    slug,
    key: raw.key || slug,
    name,
    description,
    category,
    audience,
    eligibility,
    documents: raw.documents || raw["Documents Required"] || "",
    benefits: raw.benefits || raw.Benefits || "Refer to the official scheme guidelines for full benefits.",
    process: raw.process || raw.application_process || "Apply via the official government portal.",
    applyLink: raw.applyLink || raw.apply_link || raw.link || "#",
    raw
  };
};

const fetchSchemes = async () => {
  let normalized = [];
  try {
    const response = await fetch(`${API_BASE}/api/schemes`);
    if (response.ok) {
      const payload = await response.json();
      const raw = Array.isArray(payload.schemes) ? payload.schemes : [];
      if (raw.length > 0) normalized = raw.map(normalize);
    }
  } catch (error) {
    console.warn("API fetch failed, falling back to local data.", error);
  }

  if (normalized.length === 0 && window.normalizedSchemes && window.normalizedSchemes.length > 0) {
    normalized = window.normalizedSchemes;
  }

  window.normalizedSchemes = normalized;
  window.normalizedSchemesMap = Object.fromEntries(
    normalized.flatMap((s) => {
      const entries = [];
      if (s.slug) entries.push([String(s.slug), s]);
      if (s.key && s.key !== s.slug) entries.push([String(s.key), s]);
      return entries;
    })
  );

  return normalized;
};

const getSchemeKey = (scheme) => scheme.slug || scheme.key || scheme.id || "";
const getSchemeAudience = (scheme) =>
  (scheme.Audience || scheme.audience || "").toString().trim().toLowerCase();
const getSchemeCategory = (scheme) =>
  (scheme.category || scheme.type || scheme.Category || "").toString().toLowerCase();

const isSchemeInCategory = (scheme, pageCategory) => {
  const audience = getSchemeAudience(scheme);
  if (audience) {
    const normalized = audience.replace(/\s+/g, " ");
    if (audienceToPageCategory[normalized]) return audienceToPageCategory[normalized] === pageCategory;
  }
  const category = getSchemeCategory(scheme);
  if (category) return schemeCategoryTokenMap[pageCategory].some((token) => category.includes(token));
  const key = getSchemeKey(scheme);
  return schemeCategoryFallback[pageCategory]?.includes(key) ?? false;
};

const renderSchemeArticle = (scheme) => {
  // Use slug for URL so scheme-details.html lookup works correctly
  const urlKey = scheme.slug || scheme.key || scheme.id || "";
  const title = scheme.name || "Unnamed Scheme";
  const description = scheme.description || "No details available.";
  const tag = scheme.category || "";
  const keywords = [title, description, tag, scheme.audience, urlKey].filter(Boolean).join(" ");

  return `
    <article class="info-card scheme-card" data-keywords="${keywords.replace(/"/g, "&quot;")}">
      ${tag ? `<span class="tag">${tag}</span>` : ""}
      <h2 class="card-title">${title}</h2>
      <p class="card-desc">${description}</p>
      <a class="btn btn-primary" href="scheme-details.html?scheme=${encodeURIComponent(urlKey)}">View Details</a>
    </article>
  `;
};

const renderSkeletonCard = () => `
  <article class="info-card scheme-card skeleton-card">
    <div class="skeleton skeleton-tag"></div>
    <div class="skeleton skeleton-title"></div>
    <div class="skeleton skeleton-text"></div>
    <div class="skeleton skeleton-text"></div>
    <div class="skeleton skeleton-button"></div>
  </article>
`;

const renderEmptyState = (title, message) => `
  <div class="empty-state" style="grid-column: 1 / -1;">
    <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
    </svg>
    <h3>${title}</h3>
    <p>${message}</p>
  </div>
`;

const renderSchemesForCategory = async () => {
  if (!schemeListContainer) return;
  const pageCategory =
    schemeListContainer.dataset.schemeCategory || currentPage.replace("-schemes.html", "");
  schemeListContainer.innerHTML = Array(6).fill(renderSkeletonCard()).join("");

  try {
    const allSchemes = await fetchSchemes();
    const visibleSchemes = allSchemes.filter((scheme) => isSchemeInCategory(scheme, pageCategory));
    if (visibleSchemes.length === 0) {
      schemeListContainer.innerHTML = renderEmptyState(
        "No schemes found",
        "No schemes are available for this category right now. Please check back later."
      );
      return;
    }
    schemeListContainer.innerHTML = visibleSchemes.map(renderSchemeArticle).join("");
  } catch (error) {
    console.error("Error loading schemes:", error);
    schemeListContainer.innerHTML = renderEmptyState(
      "Unable to load schemes",
      "There was a problem fetching schemes from the server. Please refresh the page."
    );
  }
};

renderSchemesForCategory();

// ---------------------------------------------------------------------------
// Local fallback scheme data (used when API is unavailable)
// ---------------------------------------------------------------------------
const localSchemes = {
  "pm-kushal-vikas": { name: "Pradhan Mantri Kaushal Vikas Yojana (PMKVY)", description: "Skill certification scheme aiming to enable a large number of Indian youth to take up industry-relevant skill training.", benefits: "Free skill training, assessment, and certification. Financial rewards upon successful completion and placement assistance.", eligibility: "Any unemployed youth or school/college dropouts who are citizens of India.", documents: "Aadhaar Card, Bank Account Details, Education Certificates, Passport Size Photographs", process: "Register online on the PMKVY portal, choose a training center and course, complete training, and appear for the assessment.", applyLink: "https://www.pmkvyofficial.org/", category: "Skill Development", audience: "youth", state: "All India" },
  "pm-suraksha-bima": { name: "Pradhan Mantri Suraksha Bima Yojana (PMSBY)", description: "Government-backed accident insurance scheme in India targeting a wide section of the population.", benefits: "Accidental death and full disability cover of Rs. 2 Lakh; partial disability cover of Rs. 1 Lakh.", eligibility: "All savings bank account holders aged between 18 and 70 years.", documents: "Aadhaar Card, Bank Account Details, KYC Documents", process: "Submit the application form to your bank or register through internet banking with auto-debit consent.", applyLink: "https://www.jansuraksha.gov.in/", category: "Insurance", audience: "public", state: "All India" },
  "pm-jeevan-jyoti": { name: "Pradhan Mantri Jeevan Jyoti Bima Yojana (PMJJBY)", description: "Government-backed life insurance scheme in India providing annual term life insurance.", benefits: "Life cover of Rs. 2 Lakh in case of death of the insured due to any reason.", eligibility: "All savings bank account holders aged between 18 and 50 years.", documents: "Aadhaar Card, Bank Account Details, Health Declaration Form", process: "Fill the PMJJBY enrollment form at your banking branch or apply online via net banking.", applyLink: "https://www.jansuraksha.gov.in/", category: "Insurance", audience: "public", state: "All India" },
  "stand-up-india": { name: "Stand-Up India Scheme", description: "Scheme promoting entrepreneurship among women and Scheduled Castes or Scheduled Tribes.", benefits: "Bank loans between Rs. 10 Lakh and Rs. 1 Crore for setting up a greenfield enterprise.", eligibility: "SC/ST and/or women entrepreneurs above 18 years of age. Loan only for greenfield projects.", documents: "Identity Proof, Address Proof, Business Plan, Caste Certificate (if applicable), Assets & Liabilities Statement", process: "Apply online at Stand-Up India portal, connect with a branch counselor, and submit the loan application form.", applyLink: "https://www.standupmitra.in/", category: "Business & Entrepreneurship", audience: "entrepreneurs", state: "All India" },
  "pm-mudra-yojana": { name: "Pradhan Mantri MUDRA Yojana (PMMY)", description: "Provides loans up to Rs. 10 Lakh to non-corporate, non-farm small/micro enterprises.", benefits: "Collateral-free loans under three categories: Shishu (up to 50k), Kishor (50k-5L), and Tarun (5L-10L).", eligibility: "Any Indian citizen having a business plan for a non-farm sector income-generating activity.", documents: "MUDRA Application Form, Identity/Address Proof, Business Identity Proof, 2 Passport Photos", process: "Approach a commercial bank, RRB, MFI, or cooperative bank, or apply online via Udyami Mitra portal.", applyLink: "https://www.mudra.org.in/", category: "Business & Entrepreneurship", audience: "entrepreneurs", state: "All India" },
  "pm-ujjwala-yojana": { name: "Pradhan Mantri Ujjwala Yojana (PMUY)", description: "Provides clean cooking fuel (LPG connections) to women from BPL (Below Poverty Line) households.", benefits: "Free LPG connection with financial support of Rs. 1,600 per connection plus interest-free loan for stove/refill.", eligibility: "Adult woman belonging to a poor household without an existing LPG connection in the name of any family member.", documents: "Aadhaar Card, BPL Ration Card, Bank Account Details, Address Proof", process: "Submit application form at nearest LPG distributor or apply online through the PMUY website.", applyLink: "https://www.pmuy.gov.in/", category: "Social Welfare", audience: "women", state: "All India" },
  "sukanya-samriddhi": { name: "Sukanya Samriddhi Yojana (SSY)", description: "A small deposit scheme for the girl child, launched under the 'Beti Bachao Beti Padhao' campaign.", benefits: "High interest rate, tax benefits under Section 80C, and a maturity payout when the girl turns 21.", eligibility: "Parents or legal guardians of a girl child aged 10 years or below. Maximum 2 accounts per family.", documents: "Girl Child's Birth Certificate, Parent's Identity and Address Proof, Photo", process: "Open account at any post office or authorized commercial bank branches by submitting the form and deposit.", applyLink: "https://www.indiapost.gov.in/", category: "Women Empowerment", audience: "parent", state: "All India" },
  "pm-svanidhi": { name: "PM SVANidhi Scheme", description: "Special micro-credit facility scheme for providing affordable working capital loans to street vendors.", benefits: "Working capital loan up to Rs. 10,000 for 1st tranche, Rs. 20,000 for 2nd tranche, and Rs. 50,000 for 3rd tranche.", eligibility: "Urban street vendors vending in urban areas on or before March 24, 2020.", documents: "Aadhaar Card, Voter Card, Street Vendor ID Card or Letter of Recommendation (LoR)", process: "Apply online through PM SVANidhi Portal, or via a Banking Correspondent (BC)/Common Service Centre (CSC).", applyLink: "https://pmsvanidhi.mohua.gov.in/", category: "Business & Entrepreneurship", audience: "vendors", state: "All India" },
  "day-nrlm": { name: "Deendayal Antyodaya Yojana - NRLM", description: "Organizes rural poor households into Self Help Groups (SHGs) and supports them for livelihoods.", benefits: "Revolving fund, community investment fund support, interest subvention on loans, and capacity building.", eligibility: "At least one member from each rural poor household (preferably a woman) to be brought under SHG network.", documents: "SHG Member details, Aadhaar Card, Bank Account, Ration Card", process: "Form a Self Help Group, register with block mission management unit, open bank account, and apply for revolving fund.", applyLink: "https://aajeevika.gov.in/", category: "Livelihoods", audience: "rural", state: "All India" },
  "janani-suraksha": { name: "Janani Suraksha Yojana (JSY)", description: "Safe motherhood intervention promoting institutional delivery among poor pregnant women.", benefits: "Cash assistance of Rs. 1,400 in rural areas and Rs. 700 in urban areas to the mother, and incentives to ASHA workers.", eligibility: "All pregnant women belonging to BPL/SC/ST households delivering in government or accredited private health facilities.", documents: "JSY Card, Bank Account Details, Address Proof, BPL Card", process: "Register with the local auxiliary nurse midwife (ANM) or ASHA worker, fill JSY form, and deliver at institutional facility.", applyLink: "https://nhm.gov.in/", category: "Health & Family Welfare", audience: "pregnant_women", state: "All India" },
  "pm-vishwakarma": { name: "PM Vishwakarma Scheme", description: "Provides end-to-end support to artisans and craftspeople who work with their hands and tools.", benefits: "Biometric registration, PM Vishwakarma Certificate, skill upgrading, toolkit incentive of Rs. 15,000, credit support up to Rs. 3 Lakh.", eligibility: "An artisan or craftsperson working in one of the 18 family-based traditional trades.", documents: "Aadhaar Card, Mobile Number, Bank Details, Ration Card, Skill Certificate (if any)", process: "Apply online at CSC or the PM Vishwakarma portal, complete three-step verification, and obtain certificate.", applyLink: "https://pmvishwakarma.gov.in/", category: "Skill Development", audience: "artisans", state: "All India" },
  "pm-awas-yojana-urban": { name: "Pradhan Mantri Awas Yojana - Urban (PMAY-U)", description: "Aims to provide all-weather pucca houses to eligible urban households.", benefits: "Interest subsidy on home loans, financial assistance for house construction/enhancement.", eligibility: "Beneficiary family should not own a pucca house in their name anywhere in India. Annual income rules apply.", documents: "Aadhaar Card, Voter Card, Pan Card, Bank Account details, Income Certificate, Land ownership documents", process: "Apply online through the PMAY-U portal or submit application via a Common Service Centre (CSC).", applyLink: "https://pmaymis.gov.in/", category: "Housing", audience: "public", state: "All India" },
  "pm-awas-yojana-gramin": { name: "Pradhan Mantri Awas Yojana - Gramin (PMAY-G)", description: "Aims to provide a pucca house with basic amenities to all houseless households in rural areas.", benefits: "Financial assistance of Rs. 1.2 Lakh in plains and Rs. 1.3 Lakh in hilly/difficult areas for house construction.", eligibility: "Rural families living in kutcha/dilapidated houses as per SECC database.", documents: "Aadhaar Card, Bank Account details, Swachh Bharat Mission registration number, Job card number", process: "Beneficiary list generated based on SECC data. Gram Sabha validates list. Local administration contacts beneficiaries.", applyLink: "https://pmayg.nic.in/", category: "Housing", audience: "rural", state: "All India" },
  "atal-pension-yojana": { name: "Atal Pension Yojana (APY)", description: "Pension scheme focused on the unorganized sector workers to secure their old age.", benefits: "Minimum guaranteed monthly pension of Rs. 1,000, 2,000, 3,000, 4,000, or 5,000 after the age of 60.", eligibility: "All citizens of India aged between 18 and 40 years holding a savings bank account.", documents: "Aadhaar Card, Bank Account Details, Mobile Number", process: "Approach the bank where savings account is held, fill APY registration form, and opt for auto-debit.", applyLink: "https://www.npscra.nsdl.co.in/", category: "Pension", audience: "public", state: "All India" },
  "pm-kisan-maan-dhan": { name: "PM Kisan Maan-Dhan Yojana", description: "Pension scheme to secure the lives of Small and Marginal Farmers in their old age.", benefits: "Minimum assured pension of Rs. 3,000 per month after attaining the age of 60 years.", eligibility: "Small and marginal farmers owning cultivable land up to 2 hectares, aged 18 to 40 years.", documents: "Aadhaar Card, Bank Account Details, Land Possession Document, KCC Card (optional)", process: "Apply online at nearest CSC or PM-KMDY portal. Farmers make monthly contribution matched by Central Government.", applyLink: "https://maandhan.in/", category: "Pension", audience: "farmers", state: "All India" },
  "ladli-behna-yojana": { name: "Ladli Behna Yojana", description: "State level scheme to support the health and economic independence of women.", benefits: "Monthly financial aid of Rs. 1,250 transferred directly to the beneficiary's bank account.", eligibility: "Women residents of the specific state (e.g., MP) aged 21 to 60 years. Income limitations apply.", documents: "Samagra ID (if applicable), Aadhaar Card, Bank Account (DBT enabled), Photo", process: "Submit applications at ward offices or through local campaigns, complete e-KYC, and verify registration.", applyLink: "https://cmladlibahna.mp.gov.in/", category: "Women Welfare", audience: "women", state: "Madhya Pradesh" },
  "pm-egp": { name: "Prime Minister's Employment Generation Programme (PMEGP)", description: "Credit-linked subsidy program for generating self-employment opportunities through micro-enterprises.", benefits: "Subsidy of 15% to 35% on project costs up to Rs. 50 Lakh for manufacturing and Rs. 20 Lakh for service sector.", eligibility: "Any individual above 18 years of age. At least VIII standard pass for project costs above 10 Lakh.", documents: "Aadhaar, Project Report, Education Certificate, Caste/Special Category Certificate, PAN", process: "Apply online on the KVIC website, upload required documents, bank evaluates project and sanctions loan.", applyLink: "https://www.kviconline.gov.in/pmegpeportal/", category: "Employment", audience: "entrepreneurs", state: "All India" },
  "digital-india-internship": { name: "Digital India Internship Scheme", description: "Provides learning opportunities to students in the area of Electronics and IT policies/projects.", benefits: "Practical exposure in Ministry of Electronics and IT, monthly stipend of Rs. 10,000, and internship certificate.", eligibility: "B.E/B.Tech/M.E/M.Tech/MCA/M.Sc (IT) students with minimum 60% marks in degree/class XII.", documents: "College Recommendation Letter, Marksheets, Aadhaar Card, Resume", process: "Apply online during the active application window on MeitY portal and undergo screening interview.", applyLink: "https://www.meity.gov.in/", category: "Education & Career", audience: "students", state: "All India" },
  "national-safai-karamcharis": { name: "NSKFDC Loan Schemes", description: "Financial assistance schemes for socio-economic upliftment of Safai Karamcharis and Scavengers.", benefits: "Concessional loans at low interest rates (4% to 6%) for starting self-employment ventures.", eligibility: "Safai Karamcharis, manual scavengers, and their dependents. No income limit applies.", documents: "Identity/Address Proof, Occupation Certificate from local authority, Bank Passbook, Aadhaar", process: "Apply through State Channelising Agencies (SCAs), Regional Rural Banks, or designated nationalized banks.", applyLink: "https://nskfdc.nic.in/", category: "Social Welfare", audience: "safai_karamcharis", state: "All India" },
  "post-matric-sc-students": { name: "Post Matric Scholarship for SC Students", description: "Financial assistance to Scheduled Caste students studying at post-matriculation or post-secondary stages.", benefits: "100% compulsory non-refundable fees and maintenance allowance paid directly to student bank accounts.", eligibility: "SC students whose parents' annual income does not exceed Rs. 2.5 Lakh.", documents: "Caste Certificate, Income Certificate, Academic Marksheets, Fee Receipt, Bank Details, Aadhaar", process: "Register and apply on the National Scholarship Portal or State Scholarship Portal during active dates.", applyLink: "https://scholarships.gov.in/", category: "Education", audience: "students", state: "All India" }
};

(() => {
  try {
    const normalizedLocalSchemes = Object.entries(localSchemes).map(([k, v]) => {
      const name = v.name || "";
      const slug = slugify(name) || k;
      return {
        id: k,
        slug,
        key: k,
        name,
        description: v.description || "",
        category: v.category || "",
        audience: v.audience || "",
        eligibility: v.eligibility || "",
        documents: v.documents || "",
        benefits: v.benefits || "",
        process: v.process || "",
        applyLink: v.applyLink || "#",
        raw: v
      };
    });

    if (!window.normalizedSchemes) window.normalizedSchemes = normalizedLocalSchemes;
    if (!window.normalizedSchemesMap) {
      const mapObj = {};
      (window.normalizedSchemes || []).forEach((s) => {
        if (s.slug) mapObj[String(s.slug)] = s;
        if (s.key && s.key !== s.slug) mapObj[String(s.key)] = s;
      });
      window.normalizedSchemesMap = mapObj;
    } else {
      for (const s of normalizedLocalSchemes) {
        if (!window.normalizedSchemesMap[String(s.slug)] && !window.normalizedSchemesMap[String(s.key)]) {
          if (s.slug) window.normalizedSchemesMap[String(s.slug)] = s;
          if (s.key) window.normalizedSchemesMap[String(s.key)] = s;
          window.normalizedSchemes = (window.normalizedSchemes || []).concat(s);
        }
      }
    }
  } catch (e) {
    console.warn("Failed to normalize local schemes fallback", e && e.message);
  }
})();

// ---------------------------------------------------------------------------
// Scheme Details Page
// ---------------------------------------------------------------------------
const schemeName = document.querySelector("[data-scheme-name]");
if (schemeName) {
  (async () => {
    const params = new URLSearchParams(window.location.search);
    const schemeKey = params.get("scheme");
    const detailsSection = document.querySelector("[data-scheme-details]");

    let selected = null;

    // Use /api/schemes/:id endpoint directly
    if (schemeKey) {
      try {
        const response = await fetch(`${API_BASE}/api/schemes/${encodeURIComponent(schemeKey)}`);
        if (response.ok) {
          const payload = await response.json();
          if (payload.scheme) selected = normalize(payload.scheme);
        }
      } catch (error) {
        console.warn("Scheme details API unavailable, using local fallback.", error);
      }
    }

    // Fallback to local map
    if (!selected) {
      let map = window.normalizedSchemesMap;
      if (!map) {
        try { await fetchSchemes(); } catch (e) { /* ignore */ }
        map = window.normalizedSchemesMap || {};
      }
      selected =
        map[schemeKey] ||
        (window.normalizedSchemes || []).find(
          (s) => s.slug === slugify(schemeKey || "") || s.key === schemeKey || String(s.id) === String(schemeKey)
        );
    }

    if (!selected) {
      document.title = "Scheme Not Found | DCAP";
      schemeName.textContent = "Scheme not found";
      const descEl = document.querySelector("[data-scheme-description]");
      if (descEl) descEl.textContent = "Please choose a valid scheme from the student, farmer, or general public scheme pages.";
      if (detailsSection) {
        detailsSection.innerHTML = `
          <article class="empty-state">
            <h2>Choose a scheme category</h2>
            <p>The requested scheme is not available.</p>
            <p><a class="back-link" href="schemes.html">Back to schemes</a></p>
          </article>
        `;
      }
      return;
    }

    let finalApplyLink = selected.applyLink || "#";
    if (finalApplyLink === "#" || !finalApplyLink) {
      const textToSearch = `${selected.name} ${selected.description} ${selected.category} ${selected.audience}`.toLowerCase();
      if (/scholarship|fellowship|student|school|university|college|academic|aicte/i.test(textToSearch)) {
        finalApplyLink = "https://scholarships.gov.in/";
      } else if (/kisan|farmer|agriculture|krishi|crop|farm|fertilizer|horticulture|livestock|dairy/i.test(textToSearch)) {
        if (/pm-kisan-samman-nidhi|pmkisan/i.test(selected.key || selected.slug)) {
          finalApplyLink = "https://pmkisan.gov.in/";
        } else {
          finalApplyLink = "https://www.myscheme.gov.in/";
        }
      } else {
        finalApplyLink = "https://www.myscheme.gov.in/";
      }
    }

    const vm = {
      name: selected.name || "Unnamed Scheme",
      description: selected.description || selected.category || "Government Scheme",
      benefits: selected.benefits || "Refer to the official scheme guidelines for full benefits.",
      eligibility: selected.eligibility || "Check official portal for eligibility details.",
      documents: selected.documents || "Standard identity and residence proofs required.",
      process: selected.process || "Follow instructions on the official application portal.",
      applyLink: finalApplyLink
    };

    document.title = `${vm.name} | DCAP`;
    schemeName.textContent = vm.name;
    const setEl = (sel, val) => { const el = document.querySelector(sel); if (el) el.textContent = val; };
    setEl("[data-scheme-description]", vm.description);
    setEl("[data-scheme-benefits]", vm.benefits);
    setEl("[data-scheme-eligibility]", vm.eligibility);
    setEl("[data-scheme-documents]", vm.documents);
    setEl("[data-scheme-process]", vm.process);
    const linkEl = document.querySelector("[data-scheme-link]");
    if (linkEl) linkEl.href = vm.applyLink;
  })();
}

// ---------------------------------------------------------------------------
// Eligibility Checker
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Eligibility Checker
// ---------------------------------------------------------------------------
const eligibilityForm = document.querySelector("[data-eligibility-form]");
const eligibilityResult = document.querySelector("[data-eligibility-result]");

const scoreLocalScheme = (scheme, profile) => {
  const haystack = [
    scheme.name,
    scheme.description,
    scheme.category,
    scheme.audience,
    scheme.eligibility,
    scheme.benefits
  ].join(' ').toLowerCase();
  
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

const getLocalRecommendations = (profile) => {
  const schemes = window.normalizedSchemes || [];
  return schemes
    .map((s) => {
      const { score, reasons } = scoreLocalScheme(s, profile);
      return { ...s, score, reasons };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);
};

if (eligibilityForm && eligibilityResult) {
  eligibilityForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(eligibilityForm);
    const profileData = Object.fromEntries(formData.entries());
    
    eligibilityResult.hidden = false;
    eligibilityResult.innerHTML = `<h2>Checking eligibility...</h2><p>Please wait while we match your profile with available schemes.</p>`;

    let eligibleSchemes = [];
    try {
      const response = await fetch(`${API_BASE}/api/eligibility`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData)
      });
      if (response.ok) {
        const payload = await response.json();
        eligibleSchemes = payload.recommendations || [];
      } else {
        throw new Error("Eligibility API response not ok");
      }
    } catch (error) {
      console.warn("Eligibility API failed, using local fallback matching:", error);
      const profile = {
        age: Number(profileData.age) || 0,
        category: (profileData.category || "").toLowerCase(),
        income: (profileData.income || "").toLowerCase(),
        state: profileData.state || "",
        socialCategory: (profileData.social_category || profileData.socialCategory || "").toLowerCase()
      };
      eligibleSchemes = getLocalRecommendations(profile);
    }

    if (eligibleSchemes.length > 0) {
      eligibilityResult.innerHTML = `
        <h2 class="eligibility-heading">Recommended Schemes for You</h2>
        <div class="list-grid">
          ${eligibleSchemes.map((scheme) => `
            <article class="info-card scheme-card">
              <h2 class="card-title">${scheme.name}</h2>
              <p class="card-desc">${scheme.description}</p>
              <p class="muted">${(scheme.reasons || []).join(" • ")}</p>
              <a class="btn btn-primary" href="scheme-details.html?scheme=${encodeURIComponent(scheme.slug || scheme.key || scheme.id)}">View Details</a>
            </article>
          `).join("")}
        </div>
        <button class="btn btn-outline" type="button" data-download-report style="margin-top:1.5rem">Download Report</button>
        <p class="eligibility-note"><strong>Note:</strong> Please verify final criteria on the official scheme portal before applying.</p>
      `;
      eligibilityResult
        .querySelector("[data-download-report]")
        ?.addEventListener("click", () =>
          downloadEligibilityReport(profileData, eligibleSchemes)
        );
    } else {
      eligibilityResult.innerHTML = `
        <div class="empty-state">
          <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          <h3>No Exact Matches Found</h3>
          <p>We couldn't find a perfect match for your profile. Browse all schemes for more options.</p>
          <a class="btn btn-primary" href="schemes.html" style="margin-top:1rem">Browse All Schemes</a>
        </div>
      `;
    }
    eligibilityResult.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

// ---------------------------------------------------------------------------
// Chatbot
// ---------------------------------------------------------------------------
const chatForm = document.querySelector("[data-chat-form]");
const chatMessages = document.querySelector("[data-chat-messages]");
const languageSelect = document.querySelector("[data-language-select]");
const suggestedQuestionsContainer = document.querySelector("[data-chat-suggested-questions]");

const translations = {
  en: {
    greeting: "Hello! I can help you understand scheme categories and basic document needs.",
    placeholder: "Type your question...",
    send: "Send",
    suggestedLabel: "Suggested:",
    suggestions: [
      { text: "What is DCAP?", val: "What is DCAP?" },
      { text: "Check eligibility", val: "How do I check my scheme eligibility?" },
      { text: "PM KISAN documents", val: "What documents are required for PM KISAN?" },
      { text: "Report cyber fraud", val: "How do I report online cyber fraud?" }
    ]
  },
  hi: {
    greeting: "नमस्ते! मैं योजनाओं, पात्रता और दस्तावेजों के बारे में मदद कर सकता हूं।",
    placeholder: "अपना सवाल लिखें...",
    send: "भेजें",
    suggestedLabel: "सुझाए गए प्रश्न:",
    suggestions: [
      { text: "DCAP क्या है?", val: "DCAP क्या है?" },
      { text: "पात्रता जांचें", val: "पात्रता कैसे जांचें?" },
      { text: "PM KISAN दस्तावेज", val: "PM KISAN के लिए कौन से दस्तावेज चाहिए?" },
      { text: "साइबर धोखाधड़ी", val: "साइबर धोखाधड़ी की रिपोर्ट कैसे करें?" }
    ]
  },
  te: {
    greeting: "నమస్తే! పథకాలు, అర్హత మరియు పత్రాల గురించి నేను సహాయం చేయగలను.",
    placeholder: "మీ ప్రశ్నను టైప్ చేయండి...",
    send: "పంపండి",
    suggestedLabel: "సూచించబడినవి:",
    suggestions: [
      { text: "DCAP అంటే ఏమిటి?", val: "DCAP అంటే ఏమిటి?" },
      { text: "అర్హతను ధృవీకరించండి", val: "అర్హతను ఎలా ధృవీకరించాలి?" },
      { text: "PM KISAN పత్రాలు", val: "PM KISAN కొరకు ఏ పత్రాలు అవసరం?" },
      { text: "సైబర్ మోసాలు", val: "సైబర్ మోసాన్ని ఎలా నివేదించాలి?" }
    ]
  }
};

const keywordReplies = [
  { keywords: ["document", "documents", "proof", "certificate"], text: "Common documents include ID proof, address proof, income certificate, bank passbook, photo, and category-specific certificates." },
  { keywords: ["student", "scholarship", "education"], text: "For student schemes, keep marksheets, student ID, admission proof, income certificate, and bank details ready." },
  { keywords: ["farmer", "agriculture", "crop"], text: "Farmer schemes often need land records, farmer ID, bank details, and sometimes crop or soil-related documents." },
  { keywords: ["pension", "senior", "old"], text: "Pension schemes usually check age, residence, income, bank account details, and social category if applicable." },
  { keywords: ["health", "hospital", "insurance"], text: "Health schemes may require identity proof, family details, health card details, and hospital documents for claims." },
  { keywords: ["eligibility", "eligible", "income"], text: "Eligibility depends on age, income, residence, category, occupation, and official scheme rules. Try the eligibility page for a quick guide." }
];

function addMessage(text, type) {
  const message = document.createElement("div");
  message.className = `message ${type}`;
  message.textContent = text;
  chatMessages.appendChild(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

if (chatForm && chatMessages) {
  const conversation = [];

  languageSelect?.addEventListener("change", () => {
    const t = translations[languageSelect.value] || translations.en;
    chatForm.elements.message.placeholder = t.placeholder;
    chatForm.querySelector("button").textContent = t.send;
    
    const firstBot = chatMessages.querySelector(".message.bot");
    if (firstBot) firstBot.textContent = t.greeting;

    // Update suggested questions label
    const labelEl = suggestedQuestionsContainer?.querySelector("[data-suggested-label]");
    if (labelEl) labelEl.textContent = t.suggestedLabel;

    // Update suggestion buttons
    const buttons = suggestedQuestionsContainer?.querySelectorAll("button.suggested-btn");
    if (buttons && t.suggestions) {
      buttons.forEach((btn, idx) => {
        const sugg = t.suggestions[idx];
        if (sugg) {
          btn.textContent = sugg.text;
          btn.dataset.question = sugg.val;
        }
      });
    }
  });

  // Handle click events on suggested questions
  if (suggestedQuestionsContainer) {
    suggestedQuestionsContainer.addEventListener("click", (event) => {
      const btn = event.target.closest("button.suggested-btn");
      if (!btn) return;
      const questionText = btn.dataset.question || btn.textContent;
      const input = chatForm.elements.message;
      if (input) {
        input.value = questionText;
        // Trigger submit event on form
        chatForm.requestSubmit ? chatForm.requestSubmit() : chatForm.dispatchEvent(new Event("submit", { cancelable: true }));
      }
    });
  }

  chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = chatForm.elements.message;
    const question = input.value.trim();
    if (!question) return;

    addMessage(question, "user");
    conversation.push({ role: "user", text: question });
    input.value = "";

    const loadingEl = document.createElement("div");
    loadingEl.className = "message bot loading";
    loadingEl.innerHTML = `<span class="skeleton skeleton-text" style="width:60px;height:12px;display:inline-block;margin:0;"></span>`;
    chatMessages.appendChild(loadingEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
      const response = await fetch(`${API_BASE}/api/assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question, language: languageSelect?.value || "en", history: conversation.slice(-8) })
      });
      const payload = await response.json();
      chatMessages.querySelector(".message.loading")?.remove();
      const reply = payload.reply || "I can help with schemes, documents, eligibility, scholarships, farmer support, pensions, and health benefits.";
      addMessage(reply, "bot");
      conversation.push({ role: "assistant", text: reply });
    } catch {
      chatMessages.querySelector(".message.loading")?.remove();
      const lq = question.toLowerCase();
      const match = keywordReplies.find((r) => r.keywords.some((kw) => lq.includes(kw)));
      addMessage(match ? match.text : "The assistant is temporarily unavailable. Try asking about schemes, documents, eligibility, or cyber safety.", "bot");
    }
  });
}

// ---------------------------------------------------------------------------
// Search Results
// ---------------------------------------------------------------------------
const searchResultsContainer = document.querySelector("[data-search-results]");
const searchQueryDisplay = document.querySelector("[data-search-query]");

if (searchResultsContainer) {
  const params = new URLSearchParams(window.location.search);
  const query = (params.get("q") || "").toLowerCase().trim();

  if (searchQueryDisplay) {
    searchQueryDisplay.textContent = query ? `"${params.get("q")}"` : "Empty Search";
  }

  if (!query) {
    searchResultsContainer.innerHTML = `<p>Please enter a valid search term.</p>`;
  } else {
    searchResultsContainer.innerHTML = `<div class="list-grid">${Array(3).fill(renderSkeletonCard()).join("")}</div>`;

    fetch(`${API_BASE}/api/search?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((payload) => {
        const results = payload.results || [];
        if (results.length > 0) {
          searchResultsContainer.innerHTML =
            `<div class="list-grid">` +
            results
              .map(
                (res) => `
              <article class="info-card scheme-card">
                <span class="tag">${res.type}</span>
                <h2 class="card-title">${res.title}</h2>
                <p class="card-desc">${res.description}</p>
                <a class="btn btn-primary" href="${res.url}">View Details</a>
              </article>`
              )
              .join("") +
            `</div>`;
        } else {
          searchResultsContainer.innerHTML = renderEmptyState(
            "No matching results found.",
            `We couldn't find anything matching "${escapeHTML(params.get("q"))}". Please try different keywords.`
          );
        }
      })
      .catch(() => {
        searchResultsContainer.innerHTML = renderEmptyState(
          "Search unavailable",
          "Please check that the backend server is running."
        );
      });
  }
}

// ---------------------------------------------------------------------------
// Compare
// ---------------------------------------------------------------------------
const compareSelect = document.querySelector("[data-compare-select]");
const compareChips = document.querySelector("[data-compare-chips]");
const compareResults = document.querySelector("[data-compare-results]");
const compareAdd = document.querySelector("[data-add-compare]");
const selectedCompare = [];

const renderCompareChips = () => {
  if (!compareChips) return;
  compareChips.innerHTML = selectedCompare
    .map(
      (item) => `
    <button class="chip" type="button" data-remove-compare="${item.slug}" aria-label="Remove ${item.name}">
      ${item.name} ×
    </button>`
    )
    .join("");
};

const renderComparison = async () => {
  if (!compareResults) return;
  if (selectedCompare.length < 2) {
    compareResults.innerHTML = `<p class="muted">Add at least two schemes to compare.</p>`;
    return;
  }
  compareResults.innerHTML = `<article class="info-card"><h2>Comparing...</h2><p>Please wait.</p></article>`;
  const ids = selectedCompare.map((item) => item.slug).join(",");
  try {
    const response = await fetch(`${API_BASE}/api/compare?ids=${encodeURIComponent(ids)}`);
    const payload = await response.json();
    const rows = payload.schemes || [];
    compareResults.innerHTML = `
      <div class="compare-table-wrap">
        <table class="compare-table">
          <thead><tr><th>Field</th>${rows.map((s) => `<th>${s.name}</th>`).join("")}</tr></thead>
          <tbody>
            ${["benefits", "eligibility", "documents", "process"]
              .map(
                (field) => `
              <tr><th>${field.charAt(0).toUpperCase() + field.slice(1)}</th>
              ${rows.map((s) => `<td>${s[field] || "Check official portal"}</td>`).join("")}</tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>`;
  } catch {
    compareResults.innerHTML = `<article class="info-card"><h2>Comparison unavailable</h2><p>Please check the backend server.</p></article>`;
  }
};

if (compareSelect && compareAdd) {
  fetchSchemes()
    .then((items) => {
      compareSelect.innerHTML =
        `<option value="">Select a scheme</option>` +
        items.map((s) => `<option value="${s.slug}">${s.name}</option>`).join("");
    })
    .catch(() => {
      compareSelect.innerHTML = `<option value="">Unable to load schemes</option>`;
    });

  compareAdd.addEventListener("click", async () => {
    const slug = compareSelect.value;
    if (!slug || selectedCompare.some((i) => i.slug === slug) || selectedCompare.length >= 4) return;
    const scheme = (window.normalizedSchemes || []).find((i) => i.slug === slug);
    if (scheme) selectedCompare.push(scheme);
    renderCompareChips();
    await renderComparison();
  });

  compareChips?.addEventListener("click", async (event) => {
    const slug = event.target.dataset.removeCompare;
    if (!slug) return;
    const index = selectedCompare.findIndex((i) => i.slug === slug);
    if (index >= 0) selectedCompare.splice(index, 1);
    renderCompareChips();
    await renderComparison();
  });
}

// ---------------------------------------------------------------------------
// Updates & Scams
// ---------------------------------------------------------------------------
const updatesList = document.querySelector("[data-updates-list]");
if (updatesList) {
  fetch(`${API_BASE}/api/updates`)
    .then((r) => r.json())
    .then((payload) => {
      const updates = payload.updates || [];
      updatesList.innerHTML = updates.length
        ? updates
            .map(
              (item) => `
          <article class="info-card">
            <span class="tag">${item.category || "Update"}</span>
            <h2 class="card-title">${item.title}</h2>
            <p class="card-desc">${item.summary || item.description || ""}</p>
            ${item.link ? `<a class="card-link" href="${item.link}" target="_blank" rel="noopener noreferrer">Open source &rarr;</a>` : ""}
          </article>`
            )
            .join("")
        : `<article class="info-card"><h2>No updates</h2><p>No current advisories available.</p></article>`;
    })
    .catch(() => {
      updatesList.innerHTML = `<article class="info-card"><h2>Updates unavailable</h2><p>Please check the backend server.</p></article>`;
    });
}

const scamsList = document.querySelector("[data-scams-list]");
if (scamsList) {
  fetch(`${API_BASE}/api/scams`)
    .then((r) => r.json())
    .then((payload) => {
      const scams = payload.scams || [];
      scamsList.innerHTML = scams
        .map(
          (item) => `
        <article class="info-card">
          <span class="tag danger-tag">Alert</span>
          <h2 class="card-title">${item.title}</h2>
          <p><strong>Warning:</strong> ${item.warning || item.description || ""}</p>
          <p><strong>Action:</strong> ${item.action || "Use official portals and report suspicious activity."}</p>
        </article>`
        )
        .join("");
    })
    .catch(() => {
      scamsList.innerHTML = `<article class="info-card"><h2>Scam alerts unavailable</h2><p>Please check the backend server.</p></article>`;
    });
}

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------
const feedbackForm = document.querySelector("[data-feedback-form]");
const feedbackResult = document.querySelector("[data-feedback-result]");
if (feedbackForm && feedbackResult) {
  feedbackForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    feedbackResult.hidden = false;
    feedbackResult.innerHTML = `<h2>Submitting...</h2><p>Please wait.</p>`;
    try {
      const response = await fetch(`${API_BASE}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(feedbackForm).entries()))
      });
      const payload = await response.json();
      feedbackResult.innerHTML = `<h2>${payload.saved ? "Thank you!" : "Feedback received"}</h2><p>${payload.saved ? "Your feedback was saved successfully." : payload.message || "Your feedback could not be saved yet."}</p>`;
      if (payload.saved) feedbackForm.reset();
    } catch {
      feedbackResult.innerHTML = `<h2>Unable to submit</h2><p>Please check the backend server and try again.</p>`;
    }
  });
}

// ---------------------------------------------------------------------------
// Eligibility Report Download
// ---------------------------------------------------------------------------
function downloadEligibilityReport(profile, schemesList) {
  const lines = [
    "Citizen Eligibility Report",
    `Generated: ${new Date().toLocaleString()}`,
    "",
    `Age: ${profile.age || "Not provided"}`,
    `Category: ${profile.category || "Not provided"}`,
    `Income: ${profile.income || "Not provided"}`,
    `State: ${profile.state || "Not provided"}`,
    "",
    "Recommended Schemes:",
    ...schemesList.map(
      (scheme, i) =>
        `${i + 1}. ${scheme.name}\n   ${scheme.description}\n   Eligibility: ${scheme.eligibility || "Check official portal"}`
    )
  ];
  const pdf = createSimplePdf(lines.join("\n"));
  const blob = new Blob([pdf], { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "citizen-eligibility-report.pdf";
  link.click();
  URL.revokeObjectURL(link.href);
}

function createSimplePdf(text) {
  const escapePdf = (v) => v.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  const wrapped = text
    .split("\n")
    .flatMap((line) => {
      const words = line.split(" ");
      const rows = [];
      let current = "";
      words.forEach((word) => {
        if ((current + " " + word).trim().length > 86) { rows.push(current); current = word; }
        else current = `${current} ${word}`.trim();
      });
      rows.push(current);
      return rows;
    })
    .slice(0, 46);

  const contentLines = ["BT", "/F1 11 Tf", "50 790 Td", "14 TL"];
  wrapped.forEach((line, i) => { contentLines.push(`${i === 0 ? "" : "T*"} (${escapePdf(line)}) Tj`); });
  contentLines.push("ET");
  const stream = contentLines.join("\n");
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`
  ];
  let body = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((obj) => { offsets.push(body.length); body += `${obj}\n`; });
  const xrefAt = body.length;
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => { body += `${String(offset).padStart(10, "0")} 00000 n \n`; });
  body += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF`;
  return body;
}
// ---------------------------------------------------------------------------
// Dynamic Documents Page Loader
// ---------------------------------------------------------------------------
(() => {
  const documentsListContainer = document.querySelector("[data-documents-list]");
  const docSearchInput = document.getElementById("docSearchInput");

  if (documentsListContainer) {
    const renderDocumentCard = (doc) => {
      const processSteps = Array.isArray(doc.process)
        ? doc.process
        : typeof doc.process === 'string' && doc.process.startsWith('{')
        ? doc.process.slice(1, -1).split(',').map(s => s.replace(/^"|"$/g, '').trim())
        : [doc.process || ''];
      
      const reqDocs = Array.isArray(doc.documents_required)
        ? doc.documents_required
        : typeof doc.documents_required === 'string' && doc.documents_required.startsWith('{')
        ? doc.documents_required.slice(1, -1).split(',').map(s => s.replace(/^"|"$/g, '').trim())
        : [doc.documents_required || ''];

      return `
        <article class="ic doc-card">
          <div class="ic-header">
            <svg class="ic-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
            </svg>
            <h2>${doc.name || 'Document'}</h2>
          </div>
          <div class="ic-body">
            <div class="purpose"><strong>Purpose:</strong> ${doc.purpose || 'No purpose description available.'}</div>
            <div style="margin-top: 1.25rem;">
              <div class="section-label">Step-by-step process</div>
              <ul class="step-list">
                ${processSteps.map((step, idx) => `<li><strong>Step ${idx + 1}:</strong> ${step}</li>`).join("")}
              </ul>
            </div>
            <div style="margin-top: 1.25rem;">
              <div class="section-label">Required Documents</div>
              <ul class="doc-list">
                ${reqDocs.map(req => `<li><span class="check">&#10003;</span>${req}</li>`).join("")}
              </ul>
            </div>
          </div>
          <a href="${doc.link || '#'}" target="_blank" rel="noopener noreferrer" class="btn-outline">Official Website &#8599;</a>
        </article>
      `;
    };

    const loadDocuments = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/documents`);
        if (response.ok) {
          const payload = await response.json();
          const documents = payload.documents || [];
          
          if (documents.length > 0) {
            // Safety layer: Remove duplicates by name, keeping the most detailed version
            const docMap = new Map();
            documents.forEach(doc => {
              const key = (doc.name || '').trim().toLowerCase();
              if (!docMap.has(key)) {
                docMap.set(key, doc);
              } else {
                // Keep the version with more details (longest payload)
                const existing = docMap.get(key);
                if (JSON.stringify(doc).length > JSON.stringify(existing).length) {
                  docMap.set(key, doc);
                }
              }
            });
            
            // Convert to array and sort alphabetically
            const uniqueDocuments = Array.from(docMap.values());
            uniqueDocuments.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            
            documentsListContainer.innerHTML = uniqueDocuments.map(renderDocumentCard).join("");
          }
        }
      } catch (error) {
        console.warn("Failed to fetch documents from database, using static fallback.", error);
      }
    };

    loadDocuments().then(() => {
      if (docSearchInput) {
        docSearchInput.addEventListener("input", (e) => {
          const query = e.target.value.toLowerCase().trim();
          const cards = documentsListContainer.querySelectorAll(".doc-card");
          cards.forEach((card) => {
            const title = card.querySelector("h2")?.textContent.toLowerCase() || "";
            const purpose = card.querySelector(".purpose")?.textContent.toLowerCase() || "";
            card.style.display = (title.includes(query) || purpose.includes(query)) ? "" : "none";
          });
        });
      }
    });
  }
})();
