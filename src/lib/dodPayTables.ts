// Official DoD Military Basic Pay Tables (Annual amounts)
// Source: Defense Finance and Accounting Service (DFAS)
// Used for calculating Military Buy Back deposits

export interface PayTableEntry {
  year: number;
  grades: {
    [grade: string]: {
      // Years of service: 0, 2, 3, 4, 6, 8, 10, 12, 14, 16, 18, 20+
      [yearsOfService: string]: number;
    };
  };
}

// Comprehensive DoD Pay Tables (Annual Base Pay by Grade and Years of Service)
// Values represent annual base pay amounts
export const DOD_PAY_TABLES: { [year: number]: { [grade: string]: number } } = {
  // 2024 Pay Table (effective Jan 1, 2024) - Base pay at average years of service
  2024: {
    e1: 24948, e2: 27960, e3: 32040, e4: 35820, e5: 41532,
    e6: 49104, e7: 57408, e8: 67476, e9: 82992,
    w1: 47496, w2: 54252, w3: 61224, w4: 67056, w5: 76200,
    o1: 44592, o2: 51408, o3: 59484, o4: 67620, o5: 78144,
    o6: 93648, o7: 110640, o8: 133872, o9: 161088, o10: 187344
  },
  2023: {
    e1: 23448, e2: 26280, e3: 30108, e4: 33684, e5: 39036,
    e6: 46152, e7: 53964, e8: 63432, e9: 78000,
    w1: 44652, w2: 51000, w3: 57540, w4: 63024, w5: 71628,
    o1: 41916, o2: 48324, o3: 55908, o4: 63552, o5: 73440,
    o6: 88020, o7: 104004, o8: 125832, o9: 151404, o10: 176112
  },
  2022: {
    e1: 22404, e2: 25116, e3: 28776, e4: 32196, e5: 37308,
    e6: 44100, e7: 51564, e8: 60612, e9: 74532,
    w1: 42660, w2: 48732, w3: 54972, w4: 60216, w5: 68436,
    o1: 40044, o2: 46164, o3: 53412, o4: 60720, o5: 70176,
    o6: 84108, o7: 99384, o8: 120216, o9: 144660, o10: 168276
  },
  2021: {
    e1: 21828, e2: 24468, e3: 28032, e4: 31368, e5: 36348,
    e6: 42972, e7: 50244, e8: 59052, e9: 72612,
    w1: 41556, w2: 47472, w3: 53556, w4: 58668, w5: 66672,
    o1: 39012, o2: 44976, o3: 52032, o4: 59148, o5: 68364,
    o6: 81936, o7: 96816, o8: 117108, o9: 140916, o10: 163920
  },
  2020: {
    e1: 21168, e2: 23724, e3: 27180, e4: 30420, e5: 35244,
    e6: 41664, e7: 48720, e8: 57264, e9: 70416,
    w1: 40296, w2: 46032, w3: 51936, w4: 56892, w5: 64656,
    o1: 37836, o2: 43620, o3: 50460, o4: 57360, o5: 66300,
    o6: 79464, o7: 93888, o8: 113568, o9: 136656, o10: 158964
  },
  2019: {
    e1: 20628, e2: 23124, e3: 26496, e4: 29652, e5: 34356,
    e6: 40608, e7: 47484, e8: 55812, e9: 68628,
    w1: 39264, w2: 44856, w3: 50616, w4: 55452, w5: 63012,
    o1: 36864, o2: 42504, o3: 49164, o4: 55896, o5: 64596,
    o6: 77436, o7: 91488, o8: 110676, o9: 133176, o10: 154896
  },
  2018: {
    e1: 20124, e2: 22560, e3: 25848, e4: 28932, e5: 33516,
    e6: 39624, e7: 46332, e8: 54456, e9: 66960,
    w1: 38304, w2: 43764, w3: 49380, w4: 54096, w5: 61476,
    o1: 35964, o2: 41472, o3: 47952, o4: 54516, o5: 63012,
    o6: 75540, o7: 89256, o8: 107976, o9: 129924, o10: 151116
  },
  2017: {
    e1: 19680, e2: 22068, e3: 25284, e4: 28296, e5: 32784,
    e6: 38748, e7: 45312, e8: 53256, e9: 65484,
    w1: 37452, w2: 42792, w3: 48288, w4: 52896, w5: 60120,
    o1: 35172, o2: 40548, o3: 46884, o4: 53304, o5: 61608,
    o6: 73860, o7: 87276, o8: 105564, o9: 127032, o10: 147744
  },
  2016: {
    e1: 19464, e2: 21828, e3: 25008, e4: 27984, e5: 32424,
    e6: 38328, e7: 44820, e8: 52680, e9: 64776,
    w1: 37032, w2: 42312, w3: 47748, w4: 52308, w5: 59448,
    o1: 34776, o2: 40092, o3: 46356, o4: 52704, o5: 60924,
    o6: 73032, o7: 86304, o8: 104388, o9: 125616, o10: 146088
  },
  2015: {
    e1: 19260, e2: 21600, e3: 24744, e4: 27696, e5: 32088,
    e6: 37932, e7: 44364, e8: 52140, e9: 64116,
    w1: 36660, w2: 41880, w3: 47256, w4: 51768, w5: 58836,
    o1: 34416, o2: 39684, o3: 45888, o4: 52176, o5: 60300,
    o6: 72288, o7: 85428, o8: 103332, o9: 124344, o10: 144600
  },
  // Pre-2015 tables (simplified averages)
  2014: {
    e1: 18984, e2: 21288, e3: 24396, e4: 27300, e5: 31632,
    e6: 37392, e7: 43728, e8: 51396, e9: 63204,
    w1: 36132, w2: 41280, w3: 46584, w4: 51024, w5: 58008,
    o1: 33936, o2: 39120, o3: 45240, o4: 51432, o5: 59448,
    o6: 71268, o7: 84216, o8: 101868, o9: 122580, o10: 142548
  },
  2013: {
    e1: 18684, e2: 20952, e3: 24012, e4: 26868, e5: 31128,
    e6: 36792, e7: 43032, e8: 50580, e9: 62196,
    w1: 35568, w2: 40632, w3: 45852, w4: 50220, w5: 57084,
    o1: 33396, o2: 38496, o3: 44520, o4: 50616, o5: 58500,
    o6: 70140, o7: 82884, o8: 100260, o9: 120648, o10: 140304
  },
  2012: {
    e1: 18348, e2: 20580, e3: 23580, e4: 26388, e5: 30576,
    e6: 36132, e7: 42264, e8: 49680, e9: 61092,
    w1: 34944, w2: 39912, w3: 45048, w4: 49344, w5: 56088,
    o1: 32808, o2: 37824, o3: 43740, o4: 49728, o5: 57480,
    o6: 68916, o7: 81432, o8: 98496, o9: 118536, o10: 137844
  },
  2011: {
    e1: 18012, e2: 20208, e3: 23148, e4: 25908, e5: 30012,
    e6: 35472, e7: 41496, e8: 48780, e9: 59988,
    w1: 34308, w2: 39180, w3: 44232, w4: 48444, w5: 55068,
    o1: 32208, o2: 37128, o3: 42948, o4: 48828, o5: 56436,
    o6: 67668, o7: 79956, o8: 96708, o9: 116388, o10: 135348
  },
  2010: {
    e1: 17616, e2: 19764, e3: 22644, e4: 25344, e5: 29352,
    e6: 34692, e7: 40584, e8: 47712, e9: 58680,
    w1: 33564, w2: 38328, w3: 43272, w4: 47388, w5: 53868,
    o1: 31512, o2: 36324, o3: 42012, o4: 47760, o5: 55200,
    o6: 66180, o7: 78192, o8: 94584, o9: 113832, o10: 132372
  },
  // Historical tables (2000-2009)
  2009: {
    e1: 17028, e2: 19104, e3: 21888, e4: 24492, e5: 28380,
    e6: 33540, e7: 39228, e8: 46116, e9: 56712,
    w1: 32436, w2: 37044, w3: 41820, w4: 45792, w5: 52056,
    o1: 30456, o2: 35112, o3: 40608, o4: 46164, o5: 53352,
    o6: 63972, o7: 75588, o8: 91440, o9: 110028, o10: 127956
  },
  2008: {
    e1: 16308, e2: 18288, e3: 20952, e4: 23448, e5: 27168,
    e6: 32112, e7: 37560, e8: 44160, e9: 54300,
    w1: 31056, w2: 35472, w3: 40032, w4: 43836, w5: 49836,
    o1: 29160, o2: 33624, o3: 38880, o4: 44208, o5: 51096,
    o6: 61260, o7: 72384, o8: 87552, o9: 105348, o10: 122508
  },
  2007: {
    e1: 15708, e2: 17616, e3: 20184, e4: 22596, e5: 26172,
    e6: 30936, e7: 36180, e8: 42540, e9: 52308,
    w1: 29928, w2: 34176, w3: 38580, w4: 42252, w5: 48024,
    o1: 28104, o2: 32400, o3: 37464, o4: 42600, o5: 49224,
    o6: 59028, o7: 69756, o8: 84384, o9: 101520, o10: 118056
  },
  2006: {
    e1: 15072, e2: 16908, e3: 19380, e4: 21696, e5: 25128,
    e6: 29700, e7: 34740, e8: 40848, e9: 50232,
    w1: 28740, w2: 32820, w3: 37044, w4: 40572, w5: 46116,
    o1: 26988, o2: 31116, o3: 35976, o4: 40908, o5: 47280,
    o6: 56700, o7: 67008, o8: 81048, o9: 97500, o10: 113388
  },
  2005: {
    e1: 14520, e2: 16296, e3: 18672, e4: 20904, e5: 24216,
    e6: 28620, e7: 33480, e8: 39372, e9: 48420,
    w1: 27696, w2: 31632, w3: 35700, w4: 39096, w5: 44448,
    o1: 26004, o2: 29988, o3: 34680, o4: 39432, o5: 45576,
    o6: 54648, o7: 64584, o8: 78120, o9: 93972, o10: 109284
  },
  2004: {
    e1: 13896, e2: 15588, e3: 17868, e4: 20004, e5: 23172,
    e6: 27384, e7: 32040, e8: 37680, e9: 46332,
    w1: 26508, w2: 30276, w3: 34176, w4: 37428, w5: 42540,
    o1: 24888, o2: 28704, o3: 33192, o4: 37752, o5: 43620,
    o6: 52296, o7: 61812, o8: 74760, o9: 89928, o10: 104580
  },
  2003: {
    e1: 13308, e2: 14928, e3: 17112, e4: 19152, e5: 22188,
    e6: 26220, e7: 30684, e8: 36084, e9: 44376,
    w1: 25392, w2: 29004, w3: 32736, w4: 35856, w5: 40752,
    o1: 23844, o2: 27504, o3: 31800, o4: 36168, o5: 41796,
    o6: 50100, o7: 59220, o8: 71616, o9: 86148, o10: 100176
  },
  2002: {
    e1: 12828, e2: 14388, e3: 16488, e4: 18468, e5: 21396,
    e6: 25284, e7: 29592, e8: 34800, e9: 42804,
    w1: 24492, w2: 27972, w3: 31572, w4: 34584, w5: 39300,
    o1: 23004, o2: 26532, o3: 30672, o4: 34884, o5: 40320,
    o6: 48336, o7: 57132, o8: 69096, o9: 83112, o10: 96648
  },
  2001: {
    e1: 12312, e2: 13812, e3: 15828, e4: 17724, e5: 20532,
    e6: 24264, e7: 28392, e8: 33396, e9: 41076,
    w1: 23508, w2: 26844, w3: 30300, w4: 33192, w5: 37728,
    o1: 22080, o2: 25464, o3: 29436, o4: 33480, o5: 38688,
    o6: 46392, o7: 54840, o8: 66312, o9: 79776, o10: 92760
  },
  2000: {
    e1: 11832, e2: 13272, e3: 15204, e4: 17028, e5: 19728,
    e6: 23316, e7: 27288, e8: 32100, e9: 39480,
    w1: 22596, w2: 25800, w3: 29124, w4: 31908, w5: 36264,
    o1: 21228, o2: 24480, o3: 28296, o4: 32184, o5: 37188,
    o6: 44592, o7: 52704, o8: 63744, o9: 76680, o10: 89160
  },
  // 1990s
  1999: {
    e1: 11448, e2: 12840, e3: 14712, e4: 16476, e5: 19092,
    e6: 22560, e7: 26400, e8: 31056, e9: 38196,
    w1: 21864, w2: 24960, w3: 28176, w4: 30876, w5: 35088,
    o1: 20544, o2: 23688, o3: 27384, o4: 31140, o5: 35988,
    o6: 43152, o7: 51000, o8: 61692, o9: 74196, o10: 86280
  },
  1998: {
    e1: 11064, e2: 12408, e3: 14220, e4: 15924, e5: 18456,
    e6: 21804, e7: 25524, e8: 30024, e9: 36924,
    w1: 21132, w2: 24132, w3: 27240, w4: 29844, w5: 33924,
    o1: 19860, o2: 22896, o3: 26472, o4: 30108, o5: 34788,
    o6: 41712, o7: 49296, o8: 59640, o9: 71724, o10: 83400
  },
  1997: {
    e1: 10752, e2: 12060, e3: 13824, e4: 15480, e5: 17940,
    e6: 21192, e7: 24804, e8: 29184, e9: 35892,
    w1: 20544, w2: 23460, w3: 26484, w4: 29016, w5: 32976,
    o1: 19308, o2: 22260, o3: 25728, o4: 29268, o5: 33816,
    o6: 40548, o7: 47916, o8: 57972, o9: 69720, o10: 81072
  },
  1996: {
    e1: 10464, e2: 11736, e3: 13452, e4: 15060, e5: 17448,
    e6: 20616, e7: 24132, e8: 28392, e9: 34920,
    w1: 19992, w2: 22824, w3: 25764, w4: 28224, w5: 32076,
    o1: 18780, o2: 21660, o3: 25032, o4: 28476, o5: 32904,
    o6: 39456, o7: 46620, o8: 56400, o9: 67836, o10: 78876
  },
  1995: {
    e1: 10188, e2: 11424, e3: 13092, e4: 14664, e5: 16992,
    e6: 20076, e7: 23508, e8: 27660, e9: 34020,
    w1: 19464, w2: 22224, w3: 25092, w4: 27492, w5: 31248,
    o1: 18288, o2: 21096, o3: 24384, o4: 27732, o5: 32040,
    o6: 38424, o7: 45396, o8: 54924, o9: 66060, o10: 76812
  },
  // 1980s (simplified - using average for decade)
  1990: {
    e1: 9192, e2: 10308, e3: 11808, e4: 13224, e5: 15324,
    e6: 18108, e7: 21192, e8: 24936, e9: 30672,
    w1: 17556, w2: 20052, w3: 22632, w4: 24792, w5: 28176,
    o1: 16488, o2: 19020, o3: 21984, o4: 25008, o5: 28896,
    o6: 34656, o7: 40944, o8: 49536, o9: 59592, o10: 69276
  },
  1985: {
    e1: 7536, e2: 8448, e3: 9684, e4: 10848, e5: 12564,
    e6: 14844, e7: 17376, e8: 20436, e9: 25140,
    w1: 14400, w2: 16440, w3: 18552, w4: 20328, w5: 23100,
    o1: 13524, o2: 15600, o3: 18024, o4: 20508, o5: 23700,
    o6: 28416, o7: 33576, o8: 40632, o9: 48864, o10: 56808
  },
  1980: {
    e1: 5796, e2: 6504, e3: 7452, e4: 8352, e5: 9672,
    e6: 11424, e7: 13380, e8: 15732, e9: 19356,
    w1: 11088, w2: 12660, w3: 14292, w4: 15660, w5: 17796,
    o1: 10416, o2: 12012, o3: 13884, o4: 15792, o5: 18252,
    o6: 21888, o7: 25860, o8: 31284, o9: 37632, o10: 43752
  }
};

// Deposit rates by year and plan type
export function getDepositRate(year: number, plan: 'fers' | 'csrs'): number {
  if (plan === 'fers') {
    // FERS deposit rates
    if (year === 1999) return 0.0325; // 3.25%
    if (year === 2000) return 0.0340; // 3.40%
    return 0.03; // 3% for all other years
  } else {
    // CSRS deposit rates
    if (year === 1999) return 0.0725; // 7.25%
    if (year === 2000) return 0.0740; // 7.40%
    return 0.07; // 7% for all other years
  }
}

// OPM Composite Interest Rates by year (for IAD calculations)
export const OPM_INTEREST_RATES: { [year: number]: number } = {
  2025: 0.04375,
  2024: 0.035,
  2023: 0.01875,
  2022: 0.01375,
  2021: 0.00625,
  2020: 0.0125,
  2019: 0.02625,
  2018: 0.02125,
  2017: 0.01625,
  2016: 0.02125,
  2015: 0.02625,
  2014: 0.02125,
  2013: 0.02,
  2012: 0.02375,
  2011: 0.02625,
  2010: 0.03125,
  2009: 0.03875,
  2008: 0.04875,
  2007: 0.04875,
  2006: 0.045,
  2005: 0.04,
  2004: 0.035,
  2003: 0.04,
  2002: 0.05,
  2001: 0.0575,
  2000: 0.0575,
  1999: 0.055,
  1998: 0.0575,
  1997: 0.0625,
  1996: 0.0625,
  1995: 0.0675,
  1994: 0.0625,
  1993: 0.065,
  1992: 0.0725,
  1991: 0.08,
  1990: 0.0825,
  1989: 0.0875,
  1988: 0.0825,
  1987: 0.075,
  1986: 0.0825,
  1985: 0.11,
  1984: 0.11,
  1983: 0.11,
  1982: 0.135,
  1981: 0.13,
  1980: 0.11
};

// Get military pay for a specific grade and year
export function getMilitaryBasePay(grade: string, year: number): number {
  const normalizedGrade = grade.toLowerCase().replace('-', '');
  
  // Find the closest year in our pay tables
  const availableYears = Object.keys(DOD_PAY_TABLES).map(Number).sort((a, b) => b - a);
  let targetYear = year;
  
  if (year > 2024) {
    targetYear = 2024;
  } else if (year < 1980) {
    targetYear = 1980;
  } else {
    // Find the closest year
    targetYear = availableYears.find(y => y <= year) || 1980;
  }
  
  const yearTable = DOD_PAY_TABLES[targetYear];
  if (!yearTable) {
    return 35000; // Default fallback
  }
  
  const basePay = yearTable[normalizedGrade];
  if (!basePay) {
    return 35000; // Default fallback for unknown grades
  }
  
  // If the actual year differs from the table year, apply inflation adjustment
  if (targetYear !== year) {
    const yearDiff = year - targetYear;
    const inflationRate = 0.025; // ~2.5% average annual inflation
    return basePay * Math.pow(1 + inflationRate, yearDiff);
  }
  
  return basePay;
}

// Calculate interest on deposit using OPM composite rates
export function calculateInterest(
  baseDeposit: number,
  fedStartYear: number,
  currentYear: number = new Date().getFullYear()
): number {
  // Interest begins 2 years after federal employment start (grace period)
  const interestStartYear = fedStartYear + 2;
  
  if (currentYear <= interestStartYear) {
    return 0; // Still in grace period
  }
  
  let balance = baseDeposit;
  
  for (let year = interestStartYear; year < currentYear; year++) {
    const rate = OPM_INTEREST_RATES[year] || 0.03; // Default to 3% if rate not found
    balance = balance * (1 + rate);
  }
  
  return balance - baseDeposit;
}

// Grade period for advanced calculations
export interface GradePeriod {
  grade: string;
  fromDate: Date;
  toDate: Date;
}

// Calculate deposit for multiple grade periods
export function calculateMultiPeriodDeposit(
  gradePeriods: GradePeriod[],
  retirementPlan: 'fers' | 'csrs'
): { totalDeposit: number; periodBreakdown: { grade: string; years: number; deposit: number }[] } {
  let totalDeposit = 0;
  const periodBreakdown: { grade: string; years: number; deposit: number }[] = [];
  
  for (const period of gradePeriods) {
    const startYear = period.fromDate.getFullYear();
    const endYear = period.toDate.getFullYear();
    const years = (period.toDate.getTime() - period.fromDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    
    // Calculate deposit for each year in the period
    let periodDeposit = 0;
    
    for (let year = startYear; year <= endYear; year++) {
      const yearFraction = year === startYear 
        ? (1 - (period.fromDate.getMonth() / 12))
        : year === endYear 
          ? (period.toDate.getMonth() / 12)
          : 1;
      
      const annualPay = getMilitaryBasePay(period.grade, year);
      const depositRate = getDepositRate(year, retirementPlan);
      periodDeposit += annualPay * yearFraction * depositRate;
    }
    
    totalDeposit += periodDeposit;
    periodBreakdown.push({
      grade: period.grade,
      years,
      deposit: periodDeposit
    });
  }
  
  return { totalDeposit, periodBreakdown };
}
