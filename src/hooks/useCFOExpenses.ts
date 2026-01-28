import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CFO_EXPENSES_SCHEMA, type ExpenseConfig } from '@/lib/cfo-expenses-schema';

export interface CFOExpense {
  id: string;
  category: 'fixed' | 'variable' | 'marketing';
  expense_key: string;
  label: string;
  value: number;
  unit: string;
  is_monthly: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseSummary {
  fixedCosts: number;
  variableCosts: number;
  marketingCosts: number;
  totalMonthlyExpenses: number;
  totalAnnualExpenses: number;
}

export function useCFOExpenses() {
  const queryClient = useQueryClient();

  // Fetch all expenses
  const { data: expenses, isLoading } = useQuery({
    queryKey: ['cfo-expenses'],
    queryFn: async () => {
      const result = await (supabase as any)
        .from('cfo_expenses')
        .select('*')
        .order('category', { ascending: true });

      if (result.error) throw result.error;
      return result.data as CFOExpense[];
    }
  });

  // Build effective expenses map with schema defaults
  const effectiveExpenses: Record<string, CFOExpense> = {};

  // Start with schema defaults
  Object.entries(CFO_EXPENSES_SCHEMA).forEach(([category, configs]) => {
    configs.forEach((config: ExpenseConfig) => {
      effectiveExpenses[config.key] = {
        id: '',
        category: config.category,
        expense_key: config.key,
        label: config.label,
        value: config.default,
        unit: config.unit,
        is_monthly: config.isMonthly,
        notes: null,
        created_at: '',
        updated_at: ''
      };
    });
  });

  // Override with saved values
  expenses?.forEach((expense) => {
    effectiveExpenses[expense.expense_key] = expense;
  });

  // Calculate summary
  const calculateSummary = (): ExpenseSummary => {
    let fixedCosts = 0;
    let variableCosts = 0;
    let marketingCosts = 0;

    Object.values(effectiveExpenses).forEach((expense) => {
      // Only count USD values for totals (percentages need revenue context)
      if (expense.unit === 'USD') {
        switch (expense.category) {
          case 'fixed':
            fixedCosts += expense.value;
            break;
          case 'variable':
            variableCosts += expense.value;
            break;
          case 'marketing':
            marketingCosts += expense.value;
            break;
        }
      }
    });

    const totalMonthlyExpenses = fixedCosts + variableCosts + marketingCosts;

    return {
      fixedCosts,
      variableCosts,
      marketingCosts,
      totalMonthlyExpenses,
      totalAnnualExpenses: totalMonthlyExpenses * 12
    };
  };

  // Save or update expense
  const saveExpense = useMutation({
    mutationFn: async ({ expense_key, value, notes }: {
      expense_key: string;
      value: number;
      notes?: string;
    }) => {
      const config = Object.values(CFO_EXPENSES_SCHEMA)
        .flat()
        .find(e => e.key === expense_key);

      if (!config) throw new Error(`Unknown expense key: ${expense_key}`);

      const result = await (supabase as any)
        .from('cfo_expenses')
        .upsert({
          expense_key,
          value,
          label: config.label,
          category: config.category,
          unit: config.unit,
          is_monthly: config.isMonthly,
          notes,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'expense_key'
        });

      if (result.error) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cfo-expenses'] });
      toast.success('Expense saved');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save: ${error.message}`);
    }
  });

  // Save multiple expenses at once
  const saveMultipleExpenses = useMutation({
    mutationFn: async (updates: Array<{ expense_key: string; value: number; notes?: string }>) => {
      const records = updates.map(update => {
        const config = Object.values(CFO_EXPENSES_SCHEMA)
          .flat()
          .find(e => e.key === update.expense_key);

        return {
          expense_key: update.expense_key,
          value: update.value,
          label: config?.label || update.expense_key,
          category: config?.category || 'fixed',
          unit: config?.unit || 'USD',
          is_monthly: config?.isMonthly ?? true,
          notes: update.notes,
          updated_at: new Date().toISOString()
        };
      });

      const result = await (supabase as any)
        .from('cfo_expenses')
        .upsert(records, { onConflict: 'expense_key' });

      if (result.error) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cfo-expenses'] });
      toast.success('Expenses updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save: ${error.message}`);
    }
  });

  // Reset expense to default
  const resetExpense = useMutation({
    mutationFn: async (expense_key: string) => {
      const result = await (supabase as any)
        .from('cfo_expenses')
        .delete()
        .eq('expense_key', expense_key);

      if (result.error) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cfo-expenses'] });
      toast.success('Reset to default');
    }
  });

  // Get value for a specific expense
  const getExpenseValue = (key: string, fallback?: number): number => {
    return effectiveExpenses[key]?.value ?? fallback ?? 0;
  };

  const summary = calculateSummary();

  return {
    expenses,
    effectiveExpenses,
    summary,
    isLoading,
    saveExpense: saveExpense.mutate,
    saveMultipleExpenses: saveMultipleExpenses.mutate,
    resetExpense: resetExpense.mutate,
    getExpenseValue,
    isSaving: saveExpense.isPending || saveMultipleExpenses.isPending
  };
}
