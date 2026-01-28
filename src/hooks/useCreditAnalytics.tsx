import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CreditAnalytics {
  monthlyCreditsConsumed: number;
  overageCredits: number;
  revenuePerUser: number;
  costPerUser: number;
  autoRenewAdoptionRate: number;
  totalActiveUsers: number;
  totalRevenue: number;
  avgCreditsPerUser: number;
}

interface CreditTransaction {
  amount: number;
  user_id: string;
  transaction_type: string;
  description?: string;
}

interface AutoRenewSetting {
  enabled: boolean;
}

export function useCreditAnalytics() {
  return useQuery({
    queryKey: ['cfo-credit-analytics'],
    queryFn: async (): Promise<CreditAnalytics> => {
      // Get credit transactions for current month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const txResult = await (supabase as any)
        .from('credit_transactions')
        .select('amount, user_id, transaction_type')
        .gte('created_at', startOfMonth.toISOString());

      if (txResult.error) throw txResult.error;
      const transactions = txResult.data as CreditTransaction[];

      // Get auto-renew settings
      const arResult = await (supabase as any)
        .from('user_auto_renew_settings')
        .select('enabled');

      const autoRenewData = arResult.error?.code === 'PGRST116' ? [] : (arResult.data as AutoRenewSetting[] || []);

      // Get total users
      const usersResult = await (supabase as any)
        .from('user_credits')
        .select('user_id', { count: 'exact' });

      if (usersResult.error) throw usersResult.error;

      // Calculate metrics
      const creditsConsumed = transactions
        ?.filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;

      const creditsPurchased = transactions
        ?.filter(t => t.transaction_type === 'purchase')
        .reduce((sum, t) => sum + t.amount, 0) || 0;

      const uniqueUsers = new Set(transactions?.map(t => t.user_id) || []).size;
      const totalUsers = usersResult.data?.length || 1;

      const enabledAutoRenew = autoRenewData?.filter(a => a.enabled).length || 0;
      const totalAutoRenewUsers = autoRenewData?.length || 1;

      // Estimate revenue (avg $0.06 per credit)
      const estimatedRevenue = creditsPurchased * 0.06;

      // Modeled cost per user (hosting, AI API costs, etc.)
      const modeledCostPerUser = 2.50; // $2.50 per active user per month

      return {
        monthlyCreditsConsumed: creditsConsumed,
        overageCredits: Math.max(0, creditsConsumed - (uniqueUsers * 600)), // Estimate overage
        revenuePerUser: uniqueUsers > 0 ? estimatedRevenue / uniqueUsers : 0,
        costPerUser: modeledCostPerUser,
        autoRenewAdoptionRate: (enabledAutoRenew / totalAutoRenewUsers) * 100,
        totalActiveUsers: uniqueUsers,
        totalRevenue: estimatedRevenue,
        avgCreditsPerUser: uniqueUsers > 0 ? creditsConsumed / uniqueUsers : 0,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreditUsageByActivity() {
  return useQuery({
    queryKey: ['credit-usage-by-activity'],
    queryFn: async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const result = await (supabase as any)
        .from('credit_transactions')
        .select('description, amount')
        .lt('amount', 0)
        .gte('created_at', startOfMonth.toISOString());

      if (result.error) throw result.error;
      const data = result.data as CreditTransaction[];

      // Group by activity type
      const byActivity: Record<string, number> = {};
      data?.forEach(tx => {
        const activity = tx.description || 'Other';
        byActivity[activity] = (byActivity[activity] || 0) + Math.abs(tx.amount);
      });

      return Object.entries(byActivity).map(([name, value]) => ({
        name,
        value,
      }));
    },
  });
}
