import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CFOSectionKey = 'growth' | 'subscriptions' | 'adRevenue' | 'events' | 'expenses' | 'capital';

interface CFOSectionData {
  [key: string]: number | string | boolean | object;
}

interface CFOProFormaStatus {
  // Section save states
  sectionStatus: Record<CFOSectionKey, boolean>;
  
  // Section data snapshots
  sectionData: Record<CFOSectionKey, CFOSectionData | null>;
  
  // Computed
  isProFormaComplete: boolean;
  
  // Actions
  markSectionSaved: (section: CFOSectionKey, data?: CFOSectionData) => void;
  resetSection: (section: CFOSectionKey) => void;
  resetAllSections: () => void;
  getSectionStatus: (section: CFOSectionKey) => boolean;
  getAllSectionData: () => Record<CFOSectionKey, CFOSectionData | null>;
}

const initialSectionStatus: Record<CFOSectionKey, boolean> = {
  growth: false,
  subscriptions: false,
  adRevenue: false,
  events: false,
  expenses: false,
  capital: false,
};

const initialSectionData: Record<CFOSectionKey, CFOSectionData | null> = {
  growth: null,
  subscriptions: null,
  adRevenue: null,
  events: null,
  expenses: null,
  capital: null,
};

export const useCFOProFormaStatus = create<CFOProFormaStatus>()(
  persist(
    (set, get) => ({
      sectionStatus: { ...initialSectionStatus },
      sectionData: { ...initialSectionData },
      
      get isProFormaComplete() {
        return Object.values(get().sectionStatus).every(v => v === true);
      },
      
      markSectionSaved: (section, data) => {
        set(state => ({
          sectionStatus: { ...state.sectionStatus, [section]: true },
          sectionData: { ...state.sectionData, [section]: data || state.sectionData[section] },
        }));
      },
      
      resetSection: (section) => {
        set(state => ({
          sectionStatus: { ...state.sectionStatus, [section]: false },
          sectionData: { ...state.sectionData, [section]: null },
        }));
      },
      
      resetAllSections: () => {
        set({
          sectionStatus: { ...initialSectionStatus },
          sectionData: { ...initialSectionData },
        });
      },
      
      getSectionStatus: (section) => get().sectionStatus[section],
      
      getAllSectionData: () => get().sectionData,
    }),
    {
      name: 'cfo-proforma-status',
    }
  )
);
