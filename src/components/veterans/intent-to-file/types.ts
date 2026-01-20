export interface IntentToFileFormData {
  // Veteran Info
  fullName: string;
  email: string;
  phone: string;
  dob: string;
  state: string;
  ssnLastFour: string;

  // Service Info
  branch: string;
  serviceStartDate: string;
  serviceEndDate: string;
  dischargeType: string;

  // Claim Intent
  intentType: "new_claim" | "increase" | "secondary" | "appeal" | "";
  isFirstTimeFiler: boolean;
  claimCategories: string[];
  conditions: string[];

  // Rep Assignment
  repChoice: "vso" | "claims_partner" | "later" | "";
  selectedRepId: string | null;
  selectedRepName: string | null;
  selectedRepOrg: string | null;
}

export const INITIAL_FORM_DATA: IntentToFileFormData = {
  fullName: "",
  email: "",
  phone: "",
  dob: "",
  state: "",
  ssnLastFour: "",
  branch: "",
  serviceStartDate: "",
  serviceEndDate: "",
  dischargeType: "",
  intentType: "",
  isFirstTimeFiler: true,
  claimCategories: [],
  conditions: [],
  repChoice: "",
  selectedRepId: null,
  selectedRepName: null,
  selectedRepOrg: null,
};

export const US_STATES = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
  { value: "DC", label: "District of Columbia" },
];

export const MILITARY_BRANCHES = [
  { value: "army", label: "Army" },
  { value: "navy", label: "Navy" },
  { value: "air_force", label: "Air Force" },
  { value: "marine_corps", label: "Marine Corps" },
  { value: "coast_guard", label: "Coast Guard" },
  { value: "space_force", label: "Space Force" },
  { value: "national_guard", label: "National Guard" },
  { value: "reserves", label: "Reserves" },
];

export const DISCHARGE_TYPES = [
  { value: "honorable", label: "Honorable" },
  { value: "general", label: "General (Under Honorable Conditions)" },
  { value: "other_than_honorable", label: "Other Than Honorable" },
  { value: "bad_conduct", label: "Bad Conduct" },
  { value: "dishonorable", label: "Dishonorable" },
  { value: "uncharacterized", label: "Uncharacterized" },
];

export const CLAIM_CATEGORIES = [
  {
    id: "mental_health",
    label: "Mental Health",
    conditions: ["PTSD", "Depression", "Anxiety", "Insomnia", "Adjustment Disorder"],
  },
  {
    id: "musculoskeletal",
    label: "Musculoskeletal",
    conditions: ["Back Pain", "Neck Pain", "Knee Pain", "Shoulder Pain", "Arthritis", "Limited Range of Motion"],
  },
  {
    id: "hearing",
    label: "Hearing & Vision",
    conditions: ["Tinnitus", "Hearing Loss", "Vision Loss", "Vertigo"],
  },
  {
    id: "respiratory",
    label: "Respiratory",
    conditions: ["Asthma", "Sleep Apnea", "Sinusitis", "COPD"],
  },
  {
    id: "skin",
    label: "Skin Conditions",
    conditions: ["Eczema", "Psoriasis", "Scars", "Skin Cancer"],
  },
  {
    id: "cardiovascular",
    label: "Cardiovascular",
    conditions: ["Hypertension", "Heart Disease", "Peripheral Artery Disease"],
  },
  {
    id: "digestive",
    label: "Digestive",
    conditions: ["GERD", "IBS", "Hiatal Hernia", "Ulcers"],
  },
  {
    id: "neurological",
    label: "Neurological",
    conditions: ["Migraines", "TBI/Concussion", "Radiculopathy", "Neuropathy"],
  },
];

export const INTENT_TYPES = [
  {
    value: "new_claim",
    label: "New Claim",
    description: "Filing for the first time for one or more conditions",
  },
  {
    value: "increase",
    label: "Rating Increase",
    description: "Your condition has gotten worse since your last rating",
  },
  {
    value: "secondary",
    label: "Secondary Condition",
    description: "A new condition caused by a service-connected disability",
  },
  {
    value: "appeal",
    label: "Appeal",
    description: "Challenging a previous VA decision",
  },
];
