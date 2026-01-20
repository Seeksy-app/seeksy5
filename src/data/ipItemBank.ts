// Interest Profiler 60-item bank
// Interleaved order: R, I, A, S, E, C (repeated 10 times)

import { RIASECCode } from '@/types/interestProfiler';

export interface IPItemData {
  display_order: number;
  riasec_code: RIASECCode;
  prompt: string;
}

// Items organized by RIASEC type, then interleaved for display
const REALISTIC_ITEMS = [
  "Repair mechanical equipment or tools",
  "Work outdoors most of the day",
  "Operate heavy machinery or vehicles",
  "Build or assemble things with your hands",
  "Fix electrical or wiring problems",
  "Use tools to complete a job",
  "Perform routine maintenance on equipment",
  "Work with engines or mechanical systems",
  "Install or set up physical equipment",
  "Troubleshoot hardware problems",
];

const INVESTIGATIVE_ITEMS = [
  "Analyze data to solve a problem",
  "Conduct experiments or tests",
  "Research how or why something works",
  "Solve complex math or logic problems",
  "Investigate technical or scientific questions",
  "Interpret charts, data, or reports",
  "Diagnose the cause of a problem",
  "Work independently on intellectual tasks",
  "Learn new scientific or technical concepts",
  "Evaluate evidence to reach conclusions",
];

const ARTISTIC_ITEMS = [
  "Create visual designs or graphics",
  "Write stories, articles, or scripts",
  "Express ideas through art or media",
  "Design logos, layouts, or branding",
  "Perform music, acting, or dance",
  "Experiment with creative ideas",
  "Develop original content or concepts",
  "Work without strict rules or structure",
  "Use creativity to solve problems",
  "Create something unique or expressive",
];

const SOCIAL_ITEMS = [
  "Help people solve personal problems",
  "Teach or train others",
  "Provide guidance or mentoring",
  "Support people during difficult situations",
  "Work closely with others every day",
  "Communicate ideas clearly to help others",
  "Coach or motivate individuals or groups",
  "Provide care or assistance to people",
  "Work in a team-focused environment",
  "Contribute to community or social causes",
];

const ENTERPRISING_ITEMS = [
  "Lead a team or group",
  "Persuade others to see your point of view",
  "Sell products, services, or ideas",
  "Make business or financial decisions",
  "Take risks to achieve goals",
  "Negotiate deals or agreements",
  "Start or grow a business",
  "Manage projects or people",
  "Influence others to take action",
  "Compete to achieve success",
];

const CONVENTIONAL_ITEMS = [
  "Organize files, records, or data",
  "Follow clear rules and procedures",
  "Work with numbers or financial records",
  "Maintain accurate documentation",
  "Use spreadsheets or databases",
  "Track schedules, deadlines, or inventories",
  "Perform detailed clerical or administrative tasks",
  "Ensure information is correct and complete",
  "Work in a structured, predictable environment",
  "Manage systems that require accuracy",
];

// Create interleaved item bank
export const IP_ITEM_BANK: IPItemData[] = [];

const TYPE_ORDER: RIASECCode[] = ['R', 'I', 'A', 'S', 'E', 'C'];
const ITEMS_BY_TYPE: Record<RIASECCode, string[]> = {
  R: REALISTIC_ITEMS,
  I: INVESTIGATIVE_ITEMS,
  A: ARTISTIC_ITEMS,
  S: SOCIAL_ITEMS,
  E: ENTERPRISING_ITEMS,
  C: CONVENTIONAL_ITEMS,
};

// Generate interleaved order: 1:R, 2:I, 3:A, 4:S, 5:E, 6:C, 7:R, 8:I, ...
for (let cycle = 0; cycle < 10; cycle++) {
  for (let typeIndex = 0; typeIndex < 6; typeIndex++) {
    const code = TYPE_ORDER[typeIndex];
    const displayOrder = cycle * 6 + typeIndex + 1; // 1-60
    IP_ITEM_BANK.push({
      display_order: displayOrder,
      riasec_code: code,
      prompt: ITEMS_BY_TYPE[code][cycle],
    });
  }
}

// Suggested career paths by RIASEC type
export const RIASEC_CAREER_SUGGESTIONS: Record<RIASECCode, string[]> = {
  R: [
    'Electrician',
    'Mechanic',
    'Construction Manager',
    'HVAC Technician',
    'Carpenter',
    'Civil Engineer',
    'Pilot',
    'Firefighter',
    'Agricultural Worker',
    'Equipment Operator',
  ],
  I: [
    'Research Scientist',
    'Data Analyst',
    'Software Developer',
    'Physician',
    'Pharmacist',
    'Forensic Scientist',
    'Economist',
    'Statistician',
    'Veterinarian',
    'Environmental Scientist',
  ],
  A: [
    'Graphic Designer',
    'Writer/Author',
    'Musician',
    'Photographer',
    'Interior Designer',
    'Architect',
    'Marketing Creative',
    'Film Director',
    'Art Teacher',
    'UX/UI Designer',
  ],
  S: [
    'Teacher',
    'Counselor',
    'Social Worker',
    'Nurse',
    'Human Resources',
    'Physical Therapist',
    'Career Coach',
    'Community Organizer',
    'Chaplain',
    'Customer Success Manager',
  ],
  E: [
    'Sales Manager',
    'Entrepreneur',
    'Real Estate Agent',
    'Marketing Manager',
    'Lawyer',
    'Business Development',
    'Political Campaign Manager',
    'Financial Advisor',
    'Recruiter',
    'Restaurant Manager',
  ],
  C: [
    'Accountant',
    'Administrative Assistant',
    'Bank Teller',
    'Bookkeeper',
    'Court Reporter',
    'Data Entry Specialist',
    'Financial Analyst',
    'Logistics Coordinator',
    'Paralegal',
    'Quality Control Inspector',
  ],
};

// Combined code suggestions (for top 2-3 letter codes)
export const COMBINED_CODE_SUGGESTIONS: Record<string, string[]> = {
  'RI': ['Engineer', 'Lab Technician', 'IT Specialist'],
  'RA': ['Architect', 'Landscape Designer', 'Industrial Designer'],
  'RS': ['Physical Therapist', 'Occupational Therapist', 'Athletic Trainer'],
  'RE': ['Construction Manager', 'Operations Manager', 'Facilities Director'],
  'RC': ['Quality Inspector', 'Surveyor', 'Drafter'],
  'IA': ['Medical Illustrator', 'Science Writer', 'Game Designer'],
  'IS': ['Psychologist', 'Physician', 'Pharmacist'],
  'IE': ['Healthcare Administrator', 'Patent Attorney', 'Management Consultant'],
  'IC': ['Actuary', 'Financial Analyst', 'Database Administrator'],
  'AS': ['Art Therapist', 'Music Teacher', 'Drama Coach'],
  'AE': ['Creative Director', 'Brand Manager', 'Public Relations'],
  'AC': ['Technical Writer', 'Editor', 'Museum Curator'],
  'SE': ['School Administrator', 'Training Manager', 'Fundraiser'],
  'SC': ['Medical Records', 'Dental Hygienist', 'Health Information'],
  'EC': ['Accountant', 'Bank Manager', 'Insurance Agent'],
};
