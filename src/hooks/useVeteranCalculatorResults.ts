import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSavedCalculationsStore, SavedCalculation } from './useSavedCalculationsStore';

interface SavedResult {
  id: string;
  calculator_id: string;
  input_json: Record<string, any>;
  output_json: Record<string, any>;
  summary?: string;
  created_at: string;
}

interface UseVeteranCalculatorResultsReturn {
  results: SavedResult[];
  loading: boolean;
  save: (inputs: Record<string, any>, outputs: Record<string, any>, summary?: string) => Promise<boolean>;
  deleteResult: (id: string) => Promise<boolean>;
  isLoggedIn: boolean;
  loadSavedResult: (id: string) => SavedResult | undefined;
}

const LOCAL_STORAGE_KEY = 'veteran_calculator_results';

export function useVeteranCalculatorResults(calculatorId: string): UseVeteranCalculatorResultsReturn {
  const [results, setResults] = useState<SavedResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Global store for cross-component sync
  const { addCalculation, removeCalculation, upsertCalculation, calculations: globalCalcs } = useSavedCalculationsStore();

  // Check auth state
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id ?? null);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load results
  useEffect(() => {
    const loadResults = async () => {
      setLoading(true);
      
      if (userId) {
        // Load from Supabase
        const { data, error } = await supabase
          .from('veteran_calculator_results')
          .select('*')
          .eq('calculator_id', calculatorId)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (!error && data) {
          setResults(data as SavedResult[]);
        }
      } else {
        // Load from localStorage
        try {
          const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (stored) {
            const allResults = JSON.parse(stored) as SavedResult[];
            setResults(allResults.filter(r => r.calculator_id === calculatorId).slice(0, 10));
          }
        } catch {
          setResults([]);
        }
      }
      
      setLoading(false);
    };

    loadResults();
  }, [calculatorId, userId]);

  // Load a specific saved result by ID (for pre-filling calculator)
  const loadSavedResult = useCallback((id: string): SavedResult | undefined => {
    // Check local results first
    const localResult = results.find(r => r.id === id);
    if (localResult) return localResult;
    
    // Check global store
    const globalResult = globalCalcs.find(c => c.id === id);
    if (globalResult) {
      return {
        id: globalResult.id,
        calculator_id: globalResult.calculator_id,
        input_json: globalResult.input_json,
        output_json: globalResult.output_json,
        summary: globalResult.summary || undefined,
        created_at: globalResult.created_at,
      };
    }
    
    return undefined;
  }, [results, globalCalcs]);

  const save = async (inputs: Record<string, any>, outputs: Record<string, any>, summary?: string): Promise<boolean> => {
    const newResult: SavedResult = {
      id: crypto.randomUUID(),
      calculator_id: calculatorId,
      input_json: inputs,
      output_json: outputs,
      summary,
      created_at: new Date().toISOString(),
    };

    if (userId) {
      // Check if there's an existing result for this calculator we should update
      const existingResult = results.find(r => r.calculator_id === calculatorId);
      
      if (existingResult) {
        // Update existing record
        const { error, data } = await supabase
          .from('veteran_calculator_results')
          .update({
            input_json: inputs,
            output_json: outputs,
            summary,
            created_at: new Date().toISOString(),
          })
          .eq('id', existingResult.id)
          .eq('user_id', userId)
          .select()
          .single();

        if (error) {
          toast({
            title: "Error saving results",
            description: error.message,
            variant: "destructive",
          });
          return false;
        }

        // Optimistic update
        const updatedCalc: SavedCalculation = {
          id: existingResult.id,
          calculator_id: calculatorId,
          input_json: inputs,
          output_json: outputs,
          summary: summary || null,
          created_at: new Date().toISOString(),
        };
        
        setResults(prev => prev.map(r => r.id === existingResult.id ? { ...r, ...updatedCalc } : r));
        upsertCalculation(updatedCalc, existingResult.id);
      } else {
        // Insert new record
        const { error, data } = await supabase
          .from('veteran_calculator_results')
          .insert({
            user_id: userId,
            calculator_id: calculatorId,
            input_json: inputs,
            output_json: outputs,
            summary,
          })
          .select()
          .single();

        if (error) {
          toast({
            title: "Error saving results",
            description: error.message,
            variant: "destructive",
          });
          return false;
        }

        // Optimistic update with real ID from DB
        const savedCalc: SavedCalculation = {
          id: data.id,
          calculator_id: calculatorId,
          input_json: inputs,
          output_json: outputs,
          summary: summary || null,
          created_at: data.created_at,
        };
        
        setResults(prev => [savedCalc, ...prev].slice(0, 10));
        addCalculation(savedCalc);
      }
    } else {
      // Save to localStorage
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        const allResults = stored ? JSON.parse(stored) as SavedResult[] : [];
        
        // Check for existing result to update
        const existingIdx = allResults.findIndex(r => r.calculator_id === calculatorId);
        
        if (existingIdx >= 0) {
          allResults[existingIdx] = { ...newResult, id: allResults[existingIdx].id };
          // Move to top
          const updated = allResults.splice(existingIdx, 1)[0];
          allResults.unshift(updated);
        } else {
          allResults.unshift(newResult);
        }
        
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(allResults.slice(0, 50)));
        setResults(allResults.filter(r => r.calculator_id === calculatorId).slice(0, 10));
      } catch {
        toast({
          title: "Error saving results",
          description: "Could not save to local storage",
          variant: "destructive",
        });
        return false;
      }
    }

    toast({
      title: "Results saved",
      description: "Your calculation has been saved.",
    });
    return true;
  };

  const deleteResult = async (id: string): Promise<boolean> => {
    if (userId) {
      const { error } = await supabase
        .from('veteran_calculator_results')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        toast({
          title: "Error deleting result",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      setResults(prev => prev.filter(r => r.id !== id));
      removeCalculation(id);
    } else {
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          const allResults = JSON.parse(stored) as SavedResult[];
          const filtered = allResults.filter(r => r.id !== id);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
          setResults(filtered.filter(r => r.calculator_id === calculatorId).slice(0, 10));
        }
      } catch {
        return false;
      }
    }

    toast({
      title: "Result deleted",
    });
    return true;
  };

  return {
    results,
    loading,
    save,
    deleteResult,
    isLoggedIn: !!userId,
    loadSavedResult,
  };
}
