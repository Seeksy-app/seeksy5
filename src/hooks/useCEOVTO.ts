import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCFOAssumptions } from '@/hooks/useCFOAssumptions';
import { Json } from '@/integrations/supabase/types';

export interface Rock {
  id: string;
  name: string;
  description: string;
  owner: string;
  status: 'not_started' | 'in_progress' | 'at_risk' | 'completed';
}

export interface YearGoal {
  id: string;
  label: string;
  target: string;
  current?: string;
}

export interface Milestone {
  id: string;
  title: string;
  owner: string;
  deadline: string;
  status: 'not_started' | 'in_progress' | 'at_risk' | 'completed';
}

export interface VisionData {
  tenYearVision: string;
  threeYearPicture: string;
  oneYearFocus: string;
  whyWeWin: string[];
  whatSetsUsApart: string[];
  competitiveEdge: string;
}

export interface TractionSliders {
  creatorGrowth: number;
  advertisingDemand: number;
  aiAutomation: number;
  identityVerification: number;
}

export interface CEOVTOData {
  vision: VisionData;
  rocks: Rock[];
  yearGoals: YearGoal[];
  sliders: TractionSliders;
  milestones: Milestone[];
}

const defaultVision: VisionData = {
  tenYearVision: "Seeksy is the unified operating system for creators, podcasters, and businesses to manage identity, content, monetization, and audience — all in one platform trusted by millions worldwide.",
  threeYearPicture: "250,000 verified creators, $25M ARR, industry-leading AI tools, and a thriving advertising marketplace connecting brands with authentic creator audiences.",
  oneYearFocus: "Launch advertising marketplace v1, reach 50,000 verified creators, achieve product-market fit with identity verification as core differentiator.",
  whyWeWin: [
    "Blockchain-backed identity verification creates unprecedented trust",
    "Unified platform eliminates tool fragmentation for creators",
    "AI-native architecture accelerates content creation 10x"
  ],
  whatSetsUsApart: [
    "Voice + Face certification on Polygon mainnet",
    "Integrated monetization from day one",
    "Creator-first revenue share (70/30)"
  ],
  competitiveEdge: "We combine identity verification, content creation, and monetization into one platform — competitors force creators to stitch together 5+ tools."
};

const defaultRocks: Rock[] = [
  { id: '1', name: 'Advertising Marketplace v1', description: 'Launch programmatic ad insertion for podcasts', owner: 'Product', status: 'in_progress' },
  { id: '2', name: 'Identity Verification Rollout', description: 'Onboard 10,000 verified creators', owner: 'Growth', status: 'in_progress' },
  { id: '3', name: 'AI Agent Studio', description: 'Ship AI-powered editing and clip generation', owner: 'Engineering', status: 'not_started' },
  { id: '4', name: 'Enterprise Pilot', description: 'Close 3 enterprise white-label deals', owner: 'Sales', status: 'not_started' },
];

const defaultYearGoals: YearGoal[] = [
  { id: '1', label: 'Revenue Goal', target: '$2.5M ARR' },
  { id: '2', label: 'Creator Count Goal', target: '50,000 creators' },
  { id: '3', label: 'Verified Creator Goal', target: '25,000 verified' },
  { id: '4', label: 'AI Tools Adoption Goal', target: '60% adoption' },
  { id: '5', label: 'Advertising Marketplace Goal', target: '$500K ad revenue' },
  { id: '6', label: 'Enterprise Licensing Goal', target: '5 enterprise deals' },
  { id: '7', label: 'Operational Goal', target: '70% AI automation' },
];

const defaultSliders: TractionSliders = {
  creatorGrowth: 10,
  advertisingDemand: 15,
  aiAutomation: 1.0,
  identityVerification: 40,
};

const defaultMilestones: Milestone[] = [
  { id: '1', title: 'AI Agent Studio live', owner: 'Engineering', deadline: '2025-03-31', status: 'in_progress' },
  { id: '2', title: 'Advertising Marketplace v1 live', owner: 'Product', deadline: '2025-04-15', status: 'not_started' },
  { id: '3', title: 'Identity App migration complete', owner: 'Engineering', deadline: '2025-02-28', status: 'completed' },
  { id: '4', title: 'Marketplace payouts automation', owner: 'Finance', deadline: '2025-05-01', status: 'not_started' },
  { id: '5', title: 'Enterprise onboarding pipeline', owner: 'Sales', deadline: '2025-06-30', status: 'not_started' },
];

export function useCEOVTO() {
  const { toast } = useToast();
  const { getEffectiveValue } = useCFOAssumptions();
  
  const [vision, setVision] = useState<VisionData>(defaultVision);
  const [rocks, setRocks] = useState<Rock[]>(defaultRocks);
  const [yearGoals, setYearGoals] = useState<YearGoal[]>(defaultYearGoals);
  const [sliders, setSliders] = useState<TractionSliders>(defaultSliders);
  const [milestones, setMilestones] = useState<Milestone[]>(defaultMilestones);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load data from localStorage (simulating persistence until DB table created)
  useEffect(() => {
    const loadData = () => {
      try {
        const saved = localStorage.getItem('ceo_vto_data');
        if (saved) {
          const data: CEOVTOData = JSON.parse(saved);
          setVision(data.vision || defaultVision);
          setRocks(data.rocks || defaultRocks);
          setYearGoals(data.yearGoals || defaultYearGoals);
          setSliders(data.sliders || defaultSliders);
          setMilestones(data.milestones || defaultMilestones);
        }
      } catch (e) {
        console.error('Error loading VTO data:', e);
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Auto-save with debounce
  const saveData = useCallback(async () => {
    setIsSaving(true);
    try {
      const data: CEOVTOData = { vision, rocks, yearGoals, sliders, milestones };
      localStorage.setItem('ceo_vto_data', JSON.stringify(data));
      setLastSaved(new Date());
    } catch (e) {
      console.error('Error saving VTO data:', e);
      toast({ title: 'Save failed', variant: 'destructive' });
    }
    setIsSaving(false);
  }, [vision, rocks, yearGoals, sliders, milestones, toast]);

  // Auto-save on changes
  useEffect(() => {
    if (isLoading) return;
    const timer = setTimeout(saveData, 1000);
    return () => clearTimeout(timer);
  }, [vision, rocks, yearGoals, sliders, milestones, isLoading, saveData]);

  // Get KPI values from CFO model + sliders
  const getKPIs = useCallback(() => {
    const baseARR = getEffectiveValue('base_arr') || 500000;
    const baseCreators = getEffectiveValue('starting_creators') || 10000;
    const baseLTV = getEffectiveValue('ltv_per_creator') || 350;
    const baseCAC = getEffectiveValue('cac_paid') || 45;
    const baseChurn = getEffectiveValue('churn_rate') || 5;
    const baseBurnRate = getEffectiveValue('monthly_burn_rate') || 80000;
    const baseEBITDA = getEffectiveValue('ebitda_margin') || -15;

    // Apply sliders
    const growthMultiplier = 1 + (sliders.creatorGrowth / 100);
    const adMultiplier = 1 + (sliders.advertisingDemand / 100);
    const aiEfficiency = sliders.aiAutomation;
    const verificationRate = sliders.identityVerification / 100;

    const adjustedCreators = Math.round(baseCreators * growthMultiplier);
    const verifiedCreators = Math.round(adjustedCreators * verificationRate);
    const adjustedARR = Math.round(baseARR * growthMultiplier * adMultiplier);
    const adjustedBurnRate = Math.round(baseBurnRate * (2 - aiEfficiency));
    const runway = Math.round((adjustedARR * 0.3) / adjustedBurnRate * 12);

    return {
      arr: adjustedARR,
      cac: baseCAC,
      ltv: baseLTV,
      runway,
      burnRate: adjustedBurnRate,
      ebitda: baseEBITDA * aiEfficiency,
      creatorCount: adjustedCreators,
      verifiedCreators,
      aiToolAdoption: Math.round(60 * aiEfficiency),
      newVerifiedPerMonth: Math.round(verifiedCreators * 0.08),
      avgClipsPerCreator: Math.round(12 * aiEfficiency),
      studioUsageHours: Math.round(adjustedCreators * 2.5),
    };
  }, [getEffectiveValue, sliders]);

  return {
    vision,
    setVision,
    rocks,
    setRocks,
    yearGoals,
    setYearGoals,
    sliders,
    setSliders,
    milestones,
    setMilestones,
    isLoading,
    isSaving,
    lastSaved,
    getKPIs,
    saveData,
  };
}
