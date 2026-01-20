import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

export interface SavedCalculation {
  id: string;
  calculator_id: string;
  input_json: Record<string, any>;
  output_json: Record<string, any>;
  summary: string | null;
  created_at: string;
}

interface SavedCalculationsState {
  calculations: SavedCalculation[];
  loading: boolean;
  userId: string | null;
  setUserId: (userId: string | null) => void;
  loadCalculations: () => Promise<void>;
  addCalculation: (calc: SavedCalculation) => void;
  updateCalculation: (id: string, calc: Partial<SavedCalculation>) => void;
  removeCalculation: (id: string) => void;
  upsertCalculation: (calc: SavedCalculation, existingId?: string) => void;
}

export const useSavedCalculationsStore = create<SavedCalculationsState>((set, get) => ({
  calculations: [],
  loading: false,
  userId: null,

  setUserId: (userId) => {
    set({ userId });
    if (userId) {
      get().loadCalculations();
    } else {
      set({ calculations: [] });
    }
  },

  loadCalculations: async () => {
    const { userId } = get();
    if (!userId) return;

    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('veteran_calculator_results')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        set({ calculations: data as SavedCalculation[] });
      }
    } catch (e) {
      console.error('Error loading saved calculations:', e);
    } finally {
      set({ loading: false });
    }
  },

  addCalculation: (calc) => {
    set((state) => ({
      calculations: [calc, ...state.calculations].slice(0, 20),
    }));
  },

  updateCalculation: (id, updates) => {
    set((state) => ({
      calculations: state.calculations.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
  },

  removeCalculation: (id) => {
    set((state) => ({
      calculations: state.calculations.filter((c) => c.id !== id),
    }));
  },

  upsertCalculation: (calc, existingId) => {
    set((state) => {
      if (existingId) {
        // Update existing
        const updated = state.calculations.map((c) =>
          c.id === existingId ? { ...c, ...calc, id: existingId } : c
        );
        // Move to top
        const existing = updated.find((c) => c.id === existingId);
        if (existing) {
          return {
            calculations: [existing, ...updated.filter((c) => c.id !== existingId)].slice(0, 20),
          };
        }
        return { calculations: updated };
      }
      // Add new
      return {
        calculations: [calc, ...state.calculations].slice(0, 20),
      };
    });
  },
}));

// Calculator ID to route mapping
export const CALCULATOR_ROUTES: Record<string, string> = {
  'military_buyback': '/yourbenefits/calculators/military-buyback',
  'mra_calculator': '/yourbenefits/calculators/mra',
  'sick_leave_calculator': '/yourbenefits/calculators/sick-leave',
  'va_combined_rating': '/yourbenefits/calculators/va-combined-rating',
  'va_compensation_estimator': '/yourbenefits/calculators/va-compensation',
  'fers_pension_estimator': '/yourbenefits/calculators/fers-pension',
  'tsp_growth_calculator': '/yourbenefits/calculators/tsp-growth',
  'gi_bill_estimator': '/yourbenefits/calculators/gi-bill',
  'brs_comparison': '/yourbenefits/calculators/brs-comparison',
  'cola': '/yourbenefits/calculators/cola',
  'leave_sellback': '/yourbenefits/calculators/leave-sellback',
  'sbp': '/yourbenefits/calculators/sbp',
  'insurance_needs': '/yourbenefits/calculators/insurance-needs',
  'state_tax_benefits': '/yourbenefits/calculators/state-tax-benefits',
  'property_tax_exemption': '/yourbenefits/calculators/property-tax-exemption',
  'va_travel': '/yourbenefits/calculators/va-travel',
};

export const CALC_DISPLAY_NAMES: Record<string, string> = {
  'military_buyback': 'Military Buy-Back',
  'mra_calculator': 'MRA Calculator',
  'sick_leave_calculator': 'Sick Leave Credit',
  'va_combined_rating': 'VA Combined Rating',
  'va_compensation_estimator': 'VA Compensation',
  'fers_pension_estimator': 'FERS Pension',
  'tsp_growth_calculator': 'TSP Growth',
  'gi_bill_estimator': 'GI Bill',
  'brs_comparison': 'BRS vs Legacy',
  'cola': 'COLA Estimator',
  'leave_sellback': 'Leave Sell-Back',
  'sbp': 'Survivor Benefit Plan',
  'insurance_needs': 'Life Insurance',
  'state_tax_benefits': 'State Tax Benefits',
  'property_tax_exemption': 'Property Tax Exemption',
  'va_travel': 'VA Travel Reimbursement',
};
