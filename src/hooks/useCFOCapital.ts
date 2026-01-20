import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CapitalEvent {
  id: string;
  event_type: 'investment' | 'loan' | 'grant' | 'revenue_milestone' | 'expense_reduction';
  amount: number;
  timing_quarter: string;
  timing_year: number;
  allocation_runway: number;
  allocation_cac: number;
  allocation_hiring: number;
  allocation_infrastructure: number;
  label: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CashPosition {
  id: string;
  current_cash: number;
  monthly_burn_rate: number;
  cash_runway_months: number;
  break_even_month: number | null;
  last_calculated_at: string;
}

export interface RunwayForecast {
  month: number;
  quarter: string;
  year: number;
  startingCash: number;
  revenue: number;
  expenses: number;
  capitalInflows: number;
  netCashFlow: number;
  endingCash: number;
  runwayMonths: number;
  isBreakEven: boolean;
}

export function useCFOCapital() {
  const queryClient = useQueryClient();

  // Fetch capital events
  const { data: capitalEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ['cfo-capital-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cfo_capital_events')
        .select('*')
        .eq('is_active', true)
        .order('timing_year', { ascending: true })
        .order('timing_quarter', { ascending: true });

      if (error) throw error;
      return data as CapitalEvent[];
    }
  });

  // Fetch cash position
  const { data: cashPosition, isLoading: cashLoading } = useQuery({
    queryKey: ['cfo-cash-position'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cfo_cash_position')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      // Return default if none exists
      if (!data) {
        return {
          id: '',
          current_cash: 250000,
          monthly_burn_rate: 0,
          cash_runway_months: 0,
          break_even_month: null,
          last_calculated_at: new Date().toISOString()
        } as CashPosition;
      }
      
      return data as CashPosition;
    }
  });

  // Add capital event
  const addCapitalEvent = useMutation({
    mutationFn: async (event: Omit<CapitalEvent, 'id' | 'created_at' | 'updated_at' | 'is_active'>) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('cfo_capital_events')
        .insert({
          ...event,
          user_id: user.user?.id,
          is_active: true
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cfo-capital-events'] });
      toast.success('Capital event added');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add: ${error.message}`);
    }
  });

  // Update capital event
  const updateCapitalEvent = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CapitalEvent> & { id: string }) => {
      const { error } = await supabase
        .from('cfo_capital_events')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cfo-capital-events'] });
      toast.success('Capital event updated');
    }
  });

  // Delete capital event (soft delete)
  const deleteCapitalEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cfo_capital_events')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cfo-capital-events'] });
      toast.success('Capital event removed');
    }
  });

  // Update cash position
  const updateCashPosition = useMutation({
    mutationFn: async (updates: Partial<CashPosition>) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('cfo_cash_position')
        .upsert({
          ...updates,
          user_id: user.user?.id,
          last_calculated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cfo-cash-position'] });
      toast.success('Cash position updated');
    }
  });

  // Calculate runway with capital events
  const calculateRunway = (
    currentCash: number,
    monthlyBurnRate: number,
    monthlyRevenue: number,
    revenueGrowthRate: number = 0.05
  ): { runwayMonths: number; breakEvenMonth: number | null; forecast: RunwayForecast[] } => {
    const forecast: RunwayForecast[] = [];
    let cash = currentCash;
    let revenue = monthlyRevenue;
    let breakEvenMonth: number | null = null;
    
    const currentDate = new Date();
    const startYear = currentDate.getFullYear();
    const startQuarter = Math.ceil((currentDate.getMonth() + 1) / 3);

    for (let month = 1; month <= 36; month++) {
      const projectedDate = new Date(currentDate);
      projectedDate.setMonth(projectedDate.getMonth() + month);
      const year = projectedDate.getFullYear();
      const quarter = `Q${Math.ceil((projectedDate.getMonth() + 1) / 3)}`;
      const quarterKey = `${quarter}-${year}`;

      // Find capital inflows for this quarter
      const capitalInflow = capitalEvents
        ?.filter(e => e.timing_quarter === quarterKey && e.timing_year === year)
        .reduce((sum, e) => sum + e.amount, 0) || 0;

      // Apply capital inflow once per quarter (first month of quarter)
      const isFirstMonthOfQuarter = projectedDate.getMonth() % 3 === 0;
      const capitalThisMonth = isFirstMonthOfQuarter ? capitalInflow : 0;

      const startingCash = cash;
      const netCashFlow = revenue - monthlyBurnRate + capitalThisMonth;
      cash += netCashFlow;

      const isBreakEven = revenue >= monthlyBurnRate;
      if (isBreakEven && breakEvenMonth === null) {
        breakEvenMonth = month;
      }

      forecast.push({
        month,
        quarter: quarterKey,
        year,
        startingCash,
        revenue,
        expenses: monthlyBurnRate,
        capitalInflows: capitalThisMonth,
        netCashFlow,
        endingCash: Math.max(0, cash),
        runwayMonths: cash > 0 ? Math.ceil(cash / monthlyBurnRate) : 0,
        isBreakEven
      });

      // Grow revenue
      revenue *= (1 + revenueGrowthRate);

      // Stop if cash runs out
      if (cash <= 0) break;
    }

    const runwayMonths = forecast.findIndex(f => f.endingCash <= 0);

    return {
      runwayMonths: runwayMonths === -1 ? 36 : runwayMonths,
      breakEvenMonth,
      forecast
    };
  };

  // Get total capital injections by year
  const getCapitalByYear = (year: number): number => {
    return capitalEvents
      ?.filter(e => e.timing_year === year)
      .reduce((sum, e) => sum + e.amount, 0) || 0;
  };

  return {
    capitalEvents,
    cashPosition,
    isLoading: eventsLoading || cashLoading,
    addCapitalEvent: addCapitalEvent.mutate,
    updateCapitalEvent: updateCapitalEvent.mutate,
    deleteCapitalEvent: deleteCapitalEvent.mutate,
    updateCashPosition: updateCashPosition.mutate,
    calculateRunway,
    getCapitalByYear,
    isSaving: addCapitalEvent.isPending || updateCapitalEvent.isPending || updateCashPosition.isPending
  };
}