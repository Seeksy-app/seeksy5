// Demo data for Sales & Leads

const firstNames = ["Sarah", "Mike", "Emily", "Alex", "Lisa", "Jordan", "Nina", "Chris", "Priya", "Marcus", "Taylor", "David", "Jessica", "Ryan", "Sophia", "Brandon", "Mia", "Daniel", "Ashley", "Kevin", "Rachel", "James", "Amanda", "Robert", "Samantha", "William", "Jennifer", "Thomas", "Nicole", "Andrew"];
const lastNames = ["Wilson", "Chen", "Brown", "Davis", "Park", "Lee", "Rodriguez", "Taylor", "Sharma", "Williams", "Brooks", "Kim", "Moore", "Cooper", "Thompson", "James", "Wright", "Martinez", "Garcia", "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin"];
const companies = ["Acme Corp", "TechStart Inc", "Global Solutions", "Nike", "Ford", "Starbucks", "Verizon", "MediaMax", "Creative Studios", "Digital First", "Growth Labs", "Innovate Co", "StartupHub", "CloudTech", "DataDriven", "MarketPro", "AdVenture", "BrandBoost", "SalesPush", "LeadGen Pro", "ContentKing", "SocialBuzz", "InfluenceNet", "PodcastPro", "StreamLine", "AudioWave", "VideoVibe", "CreatorSpace", "MonetizeMe", "RevenueMax"];
const stages = ["new", "discovery", "proposal", "negotiation", "closed-won", "closed-lost"];
const statuses = ["new", "qualified", "contacted", "unqualified"];

function generatePhone() {
  return `(555) ${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function generateValue() {
  const values = [5000, 10000, 15000, 25000, 35000, 50000, 75000, 100000, 150000, 200000];
  return values[Math.floor(Math.random() * values.length)];
}

function generateDate(daysAgo: number) {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date.toISOString();
}

export interface DemoLead {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  company: string;
  value: number;
  status: string;
  stage: string;
  source: string;
  notes: string;
  createdAt: string;
  lastContact?: string;
}

export const demoLeads: DemoLead[] = [];

// Generate 156 demo leads to match the counter
for (let i = 0; i < 156; i++) {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const company = companies[Math.floor(Math.random() * companies.length)];
  const stage = stages[Math.floor(Math.random() * stages.length)];
  const status = i < 42 ? "qualified" : statuses[Math.floor(Math.random() * statuses.length)];
  const sources = ["Website", "Referral", "LinkedIn", "Conference", "Cold Outreach", "Inbound Call", "Partner", "Ad Campaign"];
  
  demoLeads.push({
    id: `lead-${i + 1}`,
    name: company,
    contact: `${firstName} ${lastName}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company.toLowerCase().replace(/\s+/g, '')}.com`,
    phone: generatePhone(),
    company,
    value: generateValue(),
    status,
    stage,
    source: sources[Math.floor(Math.random() * sources.length)],
    notes: i % 5 === 0 ? "High priority prospect - follow up ASAP" : "",
    createdAt: generateDate(90),
    lastContact: i % 3 === 0 ? generateDate(7) : undefined,
  });
}

// Ensure first 3 are the highlighted ones
demoLeads[0] = {
  id: "lead-1",
  name: "Acme Corp",
  contact: "Sarah Wilson",
  email: "sarah@acme.com",
  phone: "(555) 123-4567",
  company: "Acme Corp",
  value: 50000,
  status: "qualified",
  stage: "proposal",
  source: "Referral",
  notes: "Enterprise deal - CTO interested in podcast advertising",
  createdAt: generateDate(30),
  lastContact: generateDate(2),
};

demoLeads[1] = {
  id: "lead-2",
  name: "TechStart Inc",
  contact: "Mike Chen",
  email: "mike@techstart.com",
  phone: "(555) 234-5678",
  company: "TechStart Inc",
  value: 25000,
  status: "new",
  stage: "discovery",
  source: "LinkedIn",
  notes: "Series A startup, looking to promote new product launch",
  createdAt: generateDate(7),
};

demoLeads[2] = {
  id: "lead-3",
  name: "Global Solutions",
  contact: "Emily Brown",
  email: "emily@global.com",
  phone: "(555) 345-6789",
  company: "Global Solutions",
  value: 75000,
  status: "qualified",
  stage: "negotiation",
  source: "Conference",
  notes: "Met at PodFest 2024 - very interested in multi-show package",
  createdAt: generateDate(45),
  lastContact: generateDate(1),
};

// Calculate pipeline value
export const leadsStats = {
  totalLeads: demoLeads.length,
  qualifiedLeads: demoLeads.filter(l => l.status === "qualified").length,
  pipelineValue: demoLeads.filter(l => !l.stage.startsWith("closed")).reduce((sum, l) => sum + l.value, 0),
  conversionRate: Math.round((demoLeads.filter(l => l.stage === "closed-won").length / demoLeads.length) * 100),
};

// Demo advertisers for dropdowns
export const demoAdvertisers = [
  { id: "adv-1", company_name: "Nike", status: "active" },
  { id: "adv-2", company_name: "Ford", status: "active" },
  { id: "adv-3", company_name: "Starbucks", status: "active" },
  { id: "adv-4", company_name: "Verizon", status: "active" },
  { id: "adv-5", company_name: "Acme Corp", status: "active" },
  { id: "adv-6", company_name: "TechStart Inc", status: "active" },
  { id: "adv-7", company_name: "Global Solutions", status: "active" },
  { id: "adv-8", company_name: "MediaMax", status: "active" },
  { id: "adv-9", company_name: "Creative Studios", status: "active" },
  { id: "adv-10", company_name: "Digital First", status: "active" },
];
