import { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Download, FileSpreadsheet, FileText, Sparkles, Target, TrendingUp,
  DollarSign, Users, Building2, Briefcase, Calculator, Share2, ArrowLeft, Info,
  Check, Save, AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { CFOSliderControl, CollapsibleSliderSection } from '@/components/cfo-v2/CFOSliderControl';
import { ROICalculator, BreakevenCalculator, GrowthImpactCalculator } from '@/components/cfo-v2/CFOCalculators';
import { CFOFinancialStatements } from '@/components/cfo-v2/CFOFinancialStatements';
import { CFOVersionManager, CFOStudioVersion } from '@/components/cfo-v2/CFOVersionManager';
import { CFOCapitalRunway, CapitalSettings, CapitalInfusion, CapitalOutputs } from '@/components/cfo-v2/CFOCapitalRunway';
import { useCFOProFormaVersions } from '@/hooks/useCFOProFormaVersions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Landmark, Eye } from 'lucide-react';
import { CFOBrief, generateInvestorBriefText } from '@/components/cfo-v2/CFOBrief';
import { SaveProFormaVersionModal } from '@/components/cfo/SaveProFormaVersionModal';
import { ShareToBoardModal } from '@/components/cfo-v2/ShareToBoardModal';
import { GlossaryTerm } from '@/components/cfo-v2/CFOGlossary';
import { AIExplanationCard } from '@/components/cfo-v2/CFOAIExplanations';
import { CFOScenarioSummary, ScenarioSummaryExport, ScenarioType } from '@/components/cfo-v2/CFOScenarioSummary';
import { useUserRoles } from '@/hooks/useUserRoles';

// Types
interface RevenueModel {
  saasSubscriptions: number[];
  aiProductionTools: number[];
  advertisingMarketplace: number[];
  enterpriseLicensing: number[];
}

interface COGS {
  hostingBandwidth: number[];
  aiInference: number[];
  paymentProcessing: number[];
}

interface OpEx {
  productEngineering: number[];
  salesMarketing: number[];
  generalAdmin: number[];
  customerSuccess: number[];
  contractorsAI: number[];
}

interface HeadcountRow {
  department: string;
  year1: number;
  year2: number;
  year3: number;
  avgSalary: number;
}

interface Assumptions {
  // Revenue sliders
  monthlyCreatorGrowth: number;
  avgRevenuePerCreator: number;
  advertisingCPM: number;
  adFillRate: number;
  churnRate: number;
  pricingSensitivity: number;
  organicGrowthMix: number;
  enterpriseDealValue: number;
  // COGS sliders
  hostingCostPerUser: number;
  bandwidthMultiplier: number;
  aiInferenceCostPerMin: number;
  paymentProcessingFee: number;
  aiUsageMultiplier: number;
  // OpEx sliders
  monthlyMarketingBudget: number;
  cacPaid: number;
  proTierArpu: number;
  opexChurn: number;
  headcountProductivity: number;
  // Headcount sliders
  salaryInflation: number;
  hiringRampSpeed: number;
  contractorToEmployee: boolean;
  // Legacy
  cacOrganic: number;
  grossMarginTarget: number;
  aiToolsAdoption: number;
}

interface KeyMetrics {
  arr: number[];
  cac: number;
  ltv: number;
  grossMargin: number[];
  burnRate: number[];
  runway: number;
  ebitda: number[];
  breakEvenMonth: number | null;
}

const YEARS = [2025, 2026, 2027];

const formatCurrency = (value: number, compact = true) => {
  if (compact) {
    if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
};

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

export default function CFOStudioV2() {
  const navigate = useNavigate();
  const { roles, isLoading: rolesLoading } = useUserRoles();
  const [activeTab, setActiveTab] = useState('revenue');
  const [forecastMode, setForecastMode] = useState<'ai' | 'custom'>('custom');
  const [enterpriseEnabled, setEnterpriseEnabled] = useState(true);
  const [activeScenario, setActiveScenario] = useState<ScenarioType>('base');
  const [lastChangedFields, setLastChangedFields] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Check if user has access (super_admin, platform_owner, or cfo only - not regular admin)
  const hasAccess = roles.some(role => 
    ['super_admin', 'platform_owner', 'cfo'].includes(role)
  );

  // Redirect admin users without proper access
  useEffect(() => {
    if (!rolesLoading && !hasAccess) {
      toast.info('This module is currently under development.');
      navigate('/admin/financials');
    }
  }, [rolesLoading, hasAccess, navigate]);

  // Version management
  const { versions, isLoading: versionsLoading, saveVersion, deleteVersion, isSaving } = useCFOProFormaVersions();
  const [currentVersionId, setCurrentVersionId] = useState<string | null>(null);

  // Collapsible sections state
  const [revenueSliderOpen, setRevenueSliderOpen] = useState(true);
  const [cogsSliderOpen, setCogsSliderOpen] = useState(true);
  const [opexSliderOpen, setOpexSliderOpen] = useState(true);
  const [headcountSliderOpen, setHeadcountSliderOpen] = useState(true);

  // Tab completion tracking
  const [savedTabs, setSavedTabs] = useState<Record<string, boolean>>({
    revenue: false,
    cogs: false,
    opex: false,
    headcount: false,
    metrics: false,
    assumptions: false,
    capital: false,
    statements: false,
    summary: false,
  });
  const [savingTab, setSavingTab] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const TAB_ORDER = ['revenue', 'cogs', 'opex', 'headcount', 'metrics', 'assumptions', 'capital', 'statements', 'summary'];
  const allTabsSaved = Object.values(savedTabs).every(Boolean);

  // Capital & Runway State
  const [capitalSettings, setCapitalSettings] = useState<CapitalSettings>({
    startingCash: 500000,
    minimumCashTarget: 100000,
    burnRateChangePercent: 0,
    hiringFreezeEnabled: false,
    opexCompression: 0,
    revenueShock: 0,
    cashToEbitdaConversion: 85,
    scenario: 'base',
  });
  const [capitalInfusions, setCapitalInfusions] = useState<CapitalInfusion[]>([]);
  
  const handleSaveTab = useCallback((tabName: string) => {
    setSavingTab(tabName);
    
    // Simulate save with animation delay
    setTimeout(() => {
      setSavedTabs(prev => ({ ...prev, [tabName]: true }));
      setSavingTab(null);
      toast.success(`${tabName.charAt(0).toUpperCase() + tabName.slice(1)} saved to Pro Forma`);
      
      // Auto-advance to next tab
      const currentIndex = TAB_ORDER.indexOf(tabName);
      if (currentIndex < TAB_ORDER.length - 1) {
        setActiveTab(TAB_ORDER[currentIndex + 1]);
      }
    }, 600);
  }, []);

  // Assumptions State with all new sliders
  const [assumptions, setAssumptions] = useState<Assumptions>({
    // Revenue
    monthlyCreatorGrowth: 8,
    avgRevenuePerCreator: 45,
    advertisingCPM: 22,
    adFillRate: 65,
    churnRate: 5,
    pricingSensitivity: 0,
    organicGrowthMix: 30,
    enterpriseDealValue: 150000,
    // COGS
    hostingCostPerUser: 12,
    bandwidthMultiplier: 1.0,
    aiInferenceCostPerMin: 0.005,
    paymentProcessingFee: 3,
    aiUsageMultiplier: 1.0,
    // OpEx
    monthlyMarketingBudget: 10000,
    cacPaid: 85,
    proTierArpu: 29,
    opexChurn: 5,
    headcountProductivity: 1.0,
    // Headcount
    salaryInflation: 5,
    hiringRampSpeed: 1.0,
    contractorToEmployee: false,
    // Legacy
    cacOrganic: 15,
    grossMarginTarget: 70,
    aiToolsAdoption: 35,
  });

  // Revenue Model State
  const [revenue, setRevenue] = useState<RevenueModel>({
    saasSubscriptions: [480000, 1200000, 2400000],
    aiProductionTools: [120000, 420000, 960000],
    advertisingMarketplace: [180000, 720000, 1800000],
    enterpriseLicensing: [0, 150000, 500000],
  });

  // COGS State
  const [cogs, setCogs] = useState<COGS>({
    hostingBandwidth: [48000, 96000, 180000],
    aiInference: [36000, 84000, 192000],
    paymentProcessing: [24000, 60000, 144000],
  });

  // OpEx State
  const [opex, setOpex] = useState<OpEx>({
    productEngineering: [360000, 540000, 720000],
    salesMarketing: [180000, 360000, 540000],
    generalAdmin: [120000, 180000, 240000],
    customerSuccess: [60000, 120000, 180000],
    contractorsAI: [48000, 72000, 96000],
  });

  // Headcount State
  const [headcount, setHeadcount] = useState<HeadcountRow[]>([
    { department: 'Engineering', year1: 4, year2: 7, year3: 12, avgSalary: 120000 },
    { department: 'Product', year1: 2, year2: 3, year3: 5, avgSalary: 110000 },
    { department: 'Sales', year1: 2, year2: 4, year3: 8, avgSalary: 90000 },
    { department: 'Marketing', year1: 1, year2: 2, year3: 4, avgSalary: 85000 },
    { department: 'Customer Success', year1: 1, year2: 2, year3: 4, avgSalary: 75000 },
    { department: 'G&A', year1: 2, year2: 3, year3: 4, avgSalary: 95000 },
  ]);

  // Apply slider effects to revenue
  const adjustedRevenue = useMemo(() => {
    const growthMultiplier = 1 + (assumptions.monthlyCreatorGrowth / 100);
    const pricingMultiplier = 1 + (assumptions.pricingSensitivity / 100);
    const churnImpact = 1 - (assumptions.churnRate / 100);
    
    return {
      saasSubscriptions: revenue.saasSubscriptions.map((v, i) => 
        Math.round(v * Math.pow(growthMultiplier, i) * pricingMultiplier * churnImpact)
      ),
      aiProductionTools: revenue.aiProductionTools.map((v, i) =>
        Math.round(v * (assumptions.aiToolsAdoption / 35) * Math.pow(growthMultiplier, i))
      ),
      advertisingMarketplace: revenue.advertisingMarketplace.map((v, i) =>
        Math.round(v * (assumptions.advertisingCPM / 22) * (assumptions.adFillRate / 65) * Math.pow(growthMultiplier, i))
      ),
      enterpriseLicensing: enterpriseEnabled 
        ? [0, assumptions.enterpriseDealValue, assumptions.enterpriseDealValue * 3.33]
        : [0, 0, 0],
    };
  }, [revenue, assumptions, enterpriseEnabled]);

  // Apply slider effects to COGS
  const adjustedCogs = useMemo(() => {
    const totalRevenue = adjustedRevenue.saasSubscriptions.map((v, i) =>
      v + adjustedRevenue.aiProductionTools[i] + adjustedRevenue.advertisingMarketplace[i] + adjustedRevenue.enterpriseLicensing[i]
    );
    
    return {
      hostingBandwidth: cogs.hostingBandwidth.map((v, i) =>
        Math.round(v * (assumptions.hostingCostPerUser / 12) * assumptions.bandwidthMultiplier)
      ),
      aiInference: cogs.aiInference.map((v, i) =>
        Math.round(v * (assumptions.aiInferenceCostPerMin / 0.005) * assumptions.aiUsageMultiplier)
      ),
      paymentProcessing: totalRevenue.map(rev =>
        Math.round(rev * (assumptions.paymentProcessingFee / 100))
      ),
    };
  }, [cogs, assumptions, adjustedRevenue]);

  // Apply slider effects to OpEx
  const adjustedOpex = useMemo(() => {
    const productivityFactor = assumptions.headcountProductivity;
    const marketingBudgetRatio = assumptions.monthlyMarketingBudget / 10000;
    
    return {
      productEngineering: opex.productEngineering.map(v => Math.round(v / productivityFactor)),
      salesMarketing: opex.salesMarketing.map(v => Math.round(v * marketingBudgetRatio)),
      generalAdmin: opex.generalAdmin.map(v => Math.round(v / productivityFactor)),
      customerSuccess: opex.customerSuccess.map(v => Math.round(v / productivityFactor)),
      contractorsAI: assumptions.contractorToEmployee 
        ? opex.contractorsAI.map(v => Math.round(v * 1.2))
        : opex.contractorsAI,
    };
  }, [opex, assumptions]);

  // Calculated Metrics
  const metrics = useMemo<KeyMetrics>(() => {
    const totalRevenue = YEARS.map((_, i) => 
      adjustedRevenue.saasSubscriptions[i] + 
      adjustedRevenue.aiProductionTools[i] + 
      adjustedRevenue.advertisingMarketplace[i] + 
      adjustedRevenue.enterpriseLicensing[i]
    );

    const totalCogs = YEARS.map((_, i) => 
      adjustedCogs.hostingBandwidth[i] + adjustedCogs.aiInference[i] + adjustedCogs.paymentProcessing[i]
    );

    const totalOpex = YEARS.map((_, i) =>
      adjustedOpex.productEngineering[i] + adjustedOpex.salesMarketing[i] + adjustedOpex.generalAdmin[i] +
      adjustedOpex.customerSuccess[i] + adjustedOpex.contractorsAI[i]
    );

    const grossProfit = totalRevenue.map((rev, i) => rev - totalCogs[i]);
    const grossMargin = totalRevenue.map((rev, i) => rev > 0 ? (grossProfit[i] / rev) * 100 : 0);
    const ebitda = grossProfit.map((gp, i) => gp - totalOpex[i]);
    const burnRate = ebitda.map(e => e < 0 ? Math.abs(e) / 12 : 0);

    // CAC/LTV based on assumptions
    const blendedCAC = (assumptions.cacPaid * (100 - assumptions.organicGrowthMix) / 100) + 
                       (assumptions.cacOrganic * assumptions.organicGrowthMix / 100);
    const avgMonthlyRevenue = assumptions.proTierArpu;
    const churnRate = assumptions.churnRate / 100;
    const ltv = churnRate > 0 ? avgMonthlyRevenue / churnRate : avgMonthlyRevenue * 24;

    // Find breakeven month
    let breakEvenMonth: number | null = null;
    let cumulative = 0;
    for (let month = 1; month <= 36; month++) {
      const yearIndex = Math.floor((month - 1) / 12);
      const monthlyEbitda = ebitda[yearIndex] / 12;
      cumulative += monthlyEbitda;
      if (cumulative > 0 && breakEvenMonth === null) {
        breakEvenMonth = month;
        break;
      }
    }

    const currentBurn = burnRate[0];
    const assumedCash = 500000;
    const runway = currentBurn > 0 ? assumedCash / currentBurn : 36;

    return {
      arr: totalRevenue,
      cac: blendedCAC,
      ltv,
      grossMargin,
      burnRate,
      runway: Math.min(runway, 36),
      ebitda,
      breakEvenMonth,
    };
  }, [adjustedRevenue, adjustedCogs, adjustedOpex, assumptions]);

  // Update handlers
  const updateRevenue = useCallback((key: keyof RevenueModel, yearIndex: number, value: number) => {
    setRevenue(prev => ({
      ...prev,
      [key]: prev[key].map((v, i) => i === yearIndex ? value : v)
    }));
  }, []);

  const updateCogs = useCallback((key: keyof COGS, yearIndex: number, value: number) => {
    setCogs(prev => ({
      ...prev,
      [key]: prev[key].map((v, i) => i === yearIndex ? value : v)
    }));
  }, []);

  const updateOpex = useCallback((key: keyof OpEx, yearIndex: number, value: number) => {
    setOpex(prev => ({
      ...prev,
      [key]: prev[key].map((v, i) => i === yearIndex ? value : v)
    }));
  }, []);

  const updateHeadcount = useCallback((index: number, field: 'year1' | 'year2' | 'year3' | 'avgSalary', value: number) => {
    setHeadcount(prev => prev.map((row, i) => 
      i === index ? { ...row, [field]: value } : row
    ));
  }, []);

  const updateAssumption = useCallback(<K extends keyof Assumptions>(key: K, value: Assumptions[K]) => {
    setAssumptions(prev => ({ ...prev, [key]: value }));
    setLastChangedFields(prev => [...new Set([...prev, key as string])].slice(-5));
  }, []);

  // Calculator apply handlers - sync inputs back to sliders
  const handleROIApply = useCallback((
    results: { roi: number; ltvCac: number; payback: number },
    inputs: { marketingSpend: number; cac: number; churn: number; arpu: number }
  ) => {
    setAssumptions(prev => ({
      ...prev,
      monthlyMarketingBudget: inputs.marketingSpend,
      cacPaid: inputs.cac,
      churnRate: inputs.churn,
      proTierArpu: inputs.arpu,
    }));
    toast.success(`ROI Calculator applied: ${results.roi.toFixed(0)}% ROI, ${results.ltvCac.toFixed(1)}x LTV:CAC — Sliders updated`);
  }, []);

  const handleBreakevenApply = useCallback((
    results: { breakEvenMonth: number; breakEvenRunRate: number },
    inputs: { fixedOpex: number; variableOpexPct: number; revenueGrowth: number }
  ) => {
    setAssumptions(prev => ({
      ...prev,
      monthlyCreatorGrowth: Math.round(inputs.revenueGrowth / 12 * 10) / 10,
    }));
    toast.success(`Breakeven Month ${results.breakEvenMonth} applied — Sliders updated`);
  }, []);

  const handleGrowthImpactApply = useCallback((
    results: { deltaRevenue: number[]; deltaEbitda: number[]; deltaRunway: number },
    inputs: { growthDelta: number; pricingDelta: number; cacDelta: number; churnDelta: number }
  ) => {
    setAssumptions(prev => ({
      ...prev,
      monthlyCreatorGrowth: Math.max(0, Math.min(20, prev.monthlyCreatorGrowth * (1 + inputs.growthDelta / 100))),
      pricingSensitivity: inputs.pricingDelta,
      churnRate: Math.max(0, Math.min(15, prev.churnRate * (1 + inputs.churnDelta / 100))),
    }));
    toast.success('Growth impact applied — Sliders updated');
  }, []);

  // AI Forecast Generation
  const generateAIForecast = async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const growthMultiplier = 1 + (assumptions.monthlyCreatorGrowth / 100) * 12;
    
    setRevenue({
      saasSubscriptions: [480000, Math.round(480000 * growthMultiplier), Math.round(480000 * growthMultiplier * growthMultiplier)],
      aiProductionTools: [120000, Math.round(120000 * growthMultiplier * 1.2), Math.round(120000 * growthMultiplier * growthMultiplier * 1.3)],
      advertisingMarketplace: [180000, Math.round(180000 * growthMultiplier * 1.1), Math.round(180000 * growthMultiplier * growthMultiplier * 1.2)],
      enterpriseLicensing: [0, 150000, 500000],
    });
    
    setIsGenerating(false);
    setForecastMode('ai');
    toast.success('AI forecast generated');
  };

  // Export handlers
  const exportPDF = () => {
    // Include investor brief in PDF export
    const investorBrief = generateInvestorBriefText(metrics, YEARS);
    console.log('PDF Export with Investor Brief:', investorBrief);
    toast.success('PDF export started with CFO Investor Brief');
  };
  const exportExcel = () => {
    const headers = ['Category', ...YEARS.map(y => y.toString())];
    const rows = [
      ['Revenue - SaaS Subscriptions', ...adjustedRevenue.saasSubscriptions],
      ['Revenue - AI + Production Tools', ...adjustedRevenue.aiProductionTools],
      ['Revenue - Advertising + Marketplace', ...adjustedRevenue.advertisingMarketplace],
      ['Revenue - Enterprise Licensing', ...adjustedRevenue.enterpriseLicensing],
      ['', '', '', ''],
      ['COGS - Hosting & Bandwidth', ...adjustedCogs.hostingBandwidth],
      ['COGS - AI Inference', ...adjustedCogs.aiInference],
      ['COGS - Payment Processing', ...adjustedCogs.paymentProcessing],
      ['', '', '', ''],
      ['OpEx - Product & Engineering', ...adjustedOpex.productEngineering],
      ['OpEx - Sales & Marketing', ...adjustedOpex.salesMarketing],
      ['OpEx - G&A', ...adjustedOpex.generalAdmin],
      ['OpEx - Customer Success', ...adjustedOpex.customerSuccess],
      ['OpEx - Contractors/AI', ...adjustedOpex.contractorsAI],
      ['', '', '', ''],
      ['ARR', ...metrics.arr],
      ['Gross Margin %', ...metrics.grossMargin.map(v => `${v.toFixed(1)}%`)],
      ['EBITDA', ...metrics.ebitda],
    ];
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seeksy-proforma-v2-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Excel export complete');
  };

  const shareToBoard = () => setShowShareModal(true);

  // Version management handlers
  const mappedVersions: CFOStudioVersion[] = useMemo(() => {
    return (versions || []).map((v) => ({
      id: v.id,
      name: v.name,
      notes: v.notes,
      created_at: v.created_at,
      assumptions: v.assumptions,
      is_live: v.is_published,
    }));
  }, [versions]);

  const handleSelectVersion = useCallback((version: CFOStudioVersion | null) => {
    if (!version) {
      // Reset to default draft state
      setCurrentVersionId(null);
      setAssumptions({
        monthlyCreatorGrowth: 8,
        avgRevenuePerCreator: 45,
        advertisingCPM: 22,
        adFillRate: 65,
        churnRate: 5,
        pricingSensitivity: 0,
        organicGrowthMix: 30,
        enterpriseDealValue: 150000,
        hostingCostPerUser: 12,
        bandwidthMultiplier: 1.0,
        aiInferenceCostPerMin: 0.005,
        paymentProcessingFee: 3,
        aiUsageMultiplier: 1.0,
        monthlyMarketingBudget: 10000,
        cacPaid: 85,
        proTierArpu: 29,
        opexChurn: 5,
        headcountProductivity: 1.0,
        salaryInflation: 5,
        hiringRampSpeed: 1.0,
        contractorToEmployee: false,
        cacOrganic: 15,
        grossMarginTarget: 70,
        aiToolsAdoption: 35,
      });
      toast.info('Started new draft');
      return;
    }

    // Load saved version
    setCurrentVersionId(version.id);
    if (version.assumptions?.sliders) {
      setAssumptions(prev => ({ ...prev, ...version.assumptions.sliders }));
    }
    if (version.assumptions?.revenue) {
      setRevenue(version.assumptions.revenue);
    }
    if (version.assumptions?.cogs) {
      setCogs(version.assumptions.cogs);
    }
    if (version.assumptions?.opex) {
      setOpex(version.assumptions.opex);
    }
    if (version.assumptions?.headcount) {
      setHeadcount(version.assumptions.headcount);
    }
    toast.success(`Loaded version: ${version.name}`);
  }, []);

  const handleSaveVersion = useCallback(async (name: string, notes: string) => {
    const fullAssumptions = {
      sliders: assumptions,
      revenue,
      cogs,
      opex,
      headcount,
      metrics: {
        arr: metrics.arr,
        ebitda: metrics.ebitda,
        grossMargin: metrics.grossMargin,
      },
    };
    
    saveVersion({ name, notes, assumptions: fullAssumptions });
  }, [assumptions, revenue, cogs, opex, headcount, metrics, saveVersion]);

  const handleDeleteVersion = useCallback(async (id: string) => {
    deleteVersion(id);
    if (currentVersionId === id) {
      setCurrentVersionId(null);
    }
  }, [deleteVersion, currentVersionId]);

  const renderNumberInput = (
    value: number, 
    onChange: (v: number) => void, 
    prefix = '$',
    className = ''
  ) => (
    <div className={cn("relative", className)}>
      {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{prefix}</span>}
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn("text-right h-9", prefix && "pl-7")}
      />
    </div>
  );

  // Financial data for statements
  const financialData = useMemo(() => {
    const totalRevenue = metrics.arr;
    const totalCogs = YEARS.map((_, i) => 
      adjustedCogs.hostingBandwidth[i] + adjustedCogs.aiInference[i] + adjustedCogs.paymentProcessing[i]
    );
    const totalOpex = YEARS.map((_, i) =>
      adjustedOpex.productEngineering[i] + adjustedOpex.salesMarketing[i] + adjustedOpex.generalAdmin[i] +
      adjustedOpex.customerSuccess[i] + adjustedOpex.contractorsAI[i]
    );
    const grossProfit = totalRevenue.map((rev, i) => rev - totalCogs[i]);
    
    return {
      revenue: totalRevenue,
      cogs: totalCogs,
      opex: totalOpex,
      ebitda: metrics.ebitda,
      grossProfit,
      grossMargin: metrics.grossMargin,
    };
  }, [metrics, adjustedCogs, adjustedOpex]);

  // Show loading while checking access
  if (rolesLoading) {
    return (
      <div className="w-full min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Don't render if no access (redirect will happen via useEffect)
  if (!hasAccess) {
    return null;
  }

  return (
    <div className="w-full min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="max-w-[1600px] mx-auto px-6 py-4 space-y-4">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/admin')}
                className="shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">CFO Studio V2.5</h1>
                <p className="text-muted-foreground text-sm">3-Year Financial Pro Forma • Fine-Tune Sliders • Investor Package</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={exportPDF}>
                <FileText className="w-4 h-4 mr-1.5" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={exportExcel}>
                <FileSpreadsheet className="w-4 h-4 mr-1.5" />
                Excel
              </Button>
              <Button variant="default" size="sm" onClick={shareToBoard}>
                <Share2 className="w-4 h-4 mr-1.5" />
                Share to Board
              </Button>
            </div>
          </div>

          {/* Version Manager & Mode Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CFOVersionManager
                versions={mappedVersions}
                currentVersionId={currentVersionId}
                onSelectVersion={handleSelectVersion}
                onSaveVersion={handleSaveVersion}
                onDeleteVersion={handleDeleteVersion}
                isSaving={isSaving}
                isLoading={versionsLoading}
              />
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs bg-background border shadow-lg">
                    <p className="text-sm">
                      <strong>Auto-save:</strong> Sliders update the model in real-time as you adjust them.
                      <br /><br />
                      <strong>Calculators:</strong> Click "Apply to Model" to apply calculator results to your forecast.
                      <br /><br />
                      <strong>Versions:</strong> Click "Save Version" to create a named snapshot you can return to later.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                <Button
                  variant={forecastMode === 'custom' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setForecastMode('custom')}
                  className="h-8"
                >
                  <Target className="w-4 h-4 mr-1.5" />
                  Custom
                </Button>
                <Button
                  variant={forecastMode === 'ai' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={generateAIForecast}
                  disabled={isGenerating}
                  className="h-8"
                >
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  {isGenerating ? 'Generating...' : 'AI Forecast'}
                </Button>
              </div>

              <Badge variant="outline" className="h-8 px-3">
                {forecastMode === 'ai' ? 'AI-Generated' : 'Custom Assumptions'}
              </Badge>
            </div>
          </div>

          {/* Key Metrics Strip with Glossary Tooltips */}
          <div className="grid grid-cols-8 gap-3">
            {[
              { label: 'Y3 ARR', glossaryTerm: 'ARR', value: formatCurrency(metrics.arr[2]), icon: TrendingUp, color: 'text-emerald-600' },
              { label: 'CAC', glossaryTerm: 'CAC', value: formatCurrency(metrics.cac, false), icon: DollarSign, color: 'text-blue-600' },
              { label: 'LTV', glossaryTerm: 'LTV', value: formatCurrency(metrics.ltv), icon: Users, color: 'text-purple-600' },
              { label: 'LTV:CAC', glossaryTerm: 'LTV:CAC Ratio', value: `${(metrics.ltv / metrics.cac).toFixed(1)}x`, icon: Target, color: 'text-amber-600' },
              { label: 'Gross Margin', glossaryTerm: 'Gross Margin', value: formatPercent(metrics.grossMargin[2]), icon: Calculator, color: 'text-indigo-600' },
              { label: 'Burn Rate', glossaryTerm: 'Burn Rate', value: formatCurrency(metrics.burnRate[0]), icon: TrendingUp, color: metrics.burnRate[0] > 0 ? 'text-red-600' : 'text-emerald-600' },
              { label: 'Runway', glossaryTerm: 'Runway', value: `${Math.round(metrics.runway)}mo`, icon: Building2, color: 'text-cyan-600' },
              { label: 'Breakeven', glossaryTerm: 'Breakeven Month', value: metrics.breakEvenMonth ? `M${metrics.breakEvenMonth}` : 'N/A', icon: Briefcase, color: 'text-green-600' },
            ].map((metric, i) => (
              <Card key={i} className="bg-card">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <metric.icon className={cn("w-4 h-4", metric.color)} />
                    <GlossaryTerm term={metric.glossaryTerm} className="text-xs text-muted-foreground">
                      {metric.label}
                    </GlossaryTerm>
                  </div>
                  <p className="text-lg font-semibold">{metric.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Scenario Summary Banner */}
      <div className="max-w-[1600px] mx-auto px-6 pt-4">
        <CFOScenarioSummary scenario={activeScenario} compact />
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto p-6 space-y-6">

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-9 w-full max-w-5xl">
            <TabsTrigger value="revenue" className={cn("relative", savedTabs.revenue && "bg-emerald-100 data-[state=active]:bg-emerald-200")}>
              Revenue
              {savedTabs.revenue && <Check className="w-3 h-3 text-emerald-600 absolute -top-1 -right-1" />}
            </TabsTrigger>
            <TabsTrigger value="cogs" className={cn("relative", savedTabs.cogs && "bg-emerald-100 data-[state=active]:bg-emerald-200")}>
              COGS
              {savedTabs.cogs && <Check className="w-3 h-3 text-emerald-600 absolute -top-1 -right-1" />}
            </TabsTrigger>
            <TabsTrigger value="opex" className={cn("relative", savedTabs.opex && "bg-emerald-100 data-[state=active]:bg-emerald-200")}>
              OpEx
              {savedTabs.opex && <Check className="w-3 h-3 text-emerald-600 absolute -top-1 -right-1" />}
            </TabsTrigger>
            <TabsTrigger value="headcount" className={cn("relative", savedTabs.headcount && "bg-emerald-100 data-[state=active]:bg-emerald-200")}>
              Headcount
              {savedTabs.headcount && <Check className="w-3 h-3 text-emerald-600 absolute -top-1 -right-1" />}
            </TabsTrigger>
            <TabsTrigger value="metrics" className={cn("relative", savedTabs.metrics && "bg-emerald-100 data-[state=active]:bg-emerald-200")}>
              Metrics
              {savedTabs.metrics && <Check className="w-3 h-3 text-emerald-600 absolute -top-1 -right-1" />}
            </TabsTrigger>
            <TabsTrigger value="assumptions" className={cn("relative", savedTabs.assumptions && "bg-emerald-100 data-[state=active]:bg-emerald-200")}>
              Assumptions
              {savedTabs.assumptions && <Check className="w-3 h-3 text-emerald-600 absolute -top-1 -right-1" />}
            </TabsTrigger>
            <TabsTrigger value="capital" className={cn("relative", savedTabs.capital && "bg-emerald-100 data-[state=active]:bg-emerald-200")}>
              Capital
              {savedTabs.capital && <Check className="w-3 h-3 text-emerald-600 absolute -top-1 -right-1" />}
            </TabsTrigger>
            <TabsTrigger value="statements" className={cn("relative", savedTabs.statements && "bg-emerald-100 data-[state=active]:bg-emerald-200")}>
              Financials
              {savedTabs.statements && <Check className="w-3 h-3 text-emerald-600 absolute -top-1 -right-1" />}
            </TabsTrigger>
            <TabsTrigger value="summary" className={cn("relative", savedTabs.summary && "bg-emerald-100 data-[state=active]:bg-emerald-200")}>
              Summary
              {savedTabs.summary && <Check className="w-3 h-3 text-emerald-600 absolute -top-1 -right-1" />}
            </TabsTrigger>
          </TabsList>

          {/* Revenue Tab */}
          <TabsContent value="revenue">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Revenue Model</CardTitle>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="enterprise-toggle" className="text-sm text-muted-foreground">Enterprise Licensing</Label>
                    <Switch
                      id="enterprise-toggle"
                      checked={enterpriseEnabled}
                      onCheckedChange={setEnterpriseEnabled}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Line Item</th>
                        {YEARS.map(year => (
                          <th key={year} className="text-right py-2 px-3 font-medium text-muted-foreground w-36">{year}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3">SaaS Platform Subscriptions</td>
                        {YEARS.map((_, i) => (
                          <td key={i} className="py-2 px-3 text-right font-medium">{formatCurrency(adjustedRevenue.saasSubscriptions[i])}</td>
                        ))}
                      </tr>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3">AI + Production Tools (Usage)</td>
                        {YEARS.map((_, i) => (
                          <td key={i} className="py-2 px-3 text-right font-medium">{formatCurrency(adjustedRevenue.aiProductionTools[i])}</td>
                        ))}
                      </tr>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3">Advertising + Marketplace</td>
                        {YEARS.map((_, i) => (
                          <td key={i} className="py-2 px-3 text-right font-medium">{formatCurrency(adjustedRevenue.advertisingMarketplace[i])}</td>
                        ))}
                      </tr>
                      {enterpriseEnabled && (
                        <tr className="border-b hover:bg-muted/50">
                          <td className="py-2 px-3">Enterprise Licensing</td>
                          {YEARS.map((_, i) => (
                            <td key={i} className="py-2 px-3 text-right font-medium">{formatCurrency(adjustedRevenue.enterpriseLicensing[i])}</td>
                          ))}
                        </tr>
                      )}
                      <tr className="bg-muted/30 font-semibold">
                        <td className="py-2 px-3">Total Revenue</td>
                        {YEARS.map((_, i) => (
                          <td key={i} className="py-2 px-3 text-right text-emerald-600">
                            {formatCurrency(
                              adjustedRevenue.saasSubscriptions[i] + 
                              adjustedRevenue.aiProductionTools[i] + 
                              adjustedRevenue.advertisingMarketplace[i] + 
                              adjustedRevenue.enterpriseLicensing[i]
                            )}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Revenue Fine-Tune Sliders */}
                <CollapsibleSliderSection
                  title="Revenue Fine-Tune Controls"
                  isOpen={revenueSliderOpen}
                  onToggle={() => setRevenueSliderOpen(!revenueSliderOpen)}
                >
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
                    <CFOSliderControl
                      label="Monthly Creator Growth"
                      value={assumptions.monthlyCreatorGrowth}
                      onChange={(v) => updateAssumption('monthlyCreatorGrowth', v)}
                      min={0}
                      max={20}
                      step={0.5}
                      unit="percent"
                      helperText="Monthly growth rate of paying creators."
                      tooltip="Monthly % increase in paying creators."
                    />
                    <CFOSliderControl
                      label="ARPU – Creator"
                      value={assumptions.avgRevenuePerCreator}
                      onChange={(v) => updateAssumption('avgRevenuePerCreator', v)}
                      min={10}
                      max={150}
                      step={5}
                      unit="currency"
                      helperText="Revenue per paying creator each month."
                      tooltip="Average monthly revenue from creators."
                    />
                    <CFOSliderControl
                      label="Average CPM"
                      value={assumptions.advertisingCPM}
                      onChange={(v) => updateAssumption('advertisingCPM', v)}
                      min={5}
                      max={75}
                      step={1}
                      unit="currency"
                      helperText="Reflects advertiser demand and pricing strength."
                      tooltip="Cost per thousand impressions. Higher CPM signals stronger advertiser demand."
                    />
                    <CFOSliderControl
                      label="Ad Fill Rate"
                      value={assumptions.adFillRate}
                      onChange={(v) => updateAssumption('adFillRate', v)}
                      min={10}
                      max={100}
                      step={5}
                      unit="percent"
                      helperText="Percent of impressions filled by paid advertisers."
                      tooltip="Percentage of ad inventory successfully filled by demand partners."
                    />
                    <CFOSliderControl
                      label="Monthly Churn"
                      value={assumptions.churnRate}
                      onChange={(v) => updateAssumption('churnRate', v)}
                      min={0}
                      max={15}
                      step={0.5}
                      unit="percent"
                      helperText="Reduces subscriber and revenue projections."
                      tooltip="Percentage of subscribers who cancel each month. Higher churn reduces active subscriber counts and revenue."
                    />
                    <CFOSliderControl
                      label="Pricing Sensitivity"
                      value={assumptions.pricingSensitivity}
                      onChange={(v) => updateAssumption('pricingSensitivity', v)}
                      min={-20}
                      max={20}
                      step={1}
                      unit="percent"
                      helperText="Applies % modifier to subscription prices."
                      tooltip="Simulates effects of raising or lowering subscription or usage pricing."
                    />
                    <CFOSliderControl
                      label="Organic Growth Mix"
                      value={assumptions.organicGrowthMix}
                      onChange={(v) => updateAssumption('organicGrowthMix', v)}
                      min={0}
                      max={100}
                      step={5}
                      unit="percent"
                      helperText="Adjusts CAC and revenue forecast."
                      tooltip="Percentage of new users from organic channels vs paid acquisition."
                    />
                    <CFOSliderControl
                      label="Enterprise Deal Value"
                      value={assumptions.enterpriseDealValue}
                      onChange={(v) => updateAssumption('enterpriseDealValue', v)}
                      min={0}
                      max={5000000}
                      step={50000}
                      unit="currency"
                      helperText="Replaces enterprise licensing revenue"
                    />
                  </div>
                </CollapsibleSliderSection>

                {/* AI Explanation Card */}
                <AIExplanationCard type="revenue" className="mt-4" visible={lastChangedFields.some(f => 
                  ['monthlyCreatorGrowth', 'avgRevenuePerCreator', 'advertisingCPM', 'adFillRate', 'aiToolsAdoption', 'pricingSensitivity'].includes(f)
                )} />

                {/* Save Button */}
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={() => handleSaveTab('revenue')}
                    disabled={savingTab === 'revenue'}
                    className={cn(
                      "transition-all duration-300",
                      savingTab === 'revenue' && "animate-pulse",
                      savedTabs.revenue && "bg-emerald-600 hover:bg-emerald-700"
                    )}
                  >
                    {savingTab === 'revenue' ? (
                      <>Saving...</>
                    ) : savedTabs.revenue ? (
                      <><Check className="w-4 h-4 mr-2" />Saved</>
                    ) : (
                      <><Save className="w-4 h-4 mr-2" />Save & Continue</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* COGS Tab */}
          <TabsContent value="cogs">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Cost of Goods Sold</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Line Item</th>
                        {YEARS.map(year => (
                          <th key={year} className="text-right py-2 px-3 font-medium text-muted-foreground w-36">{year}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3">Hosting + Bandwidth</td>
                        {YEARS.map((_, i) => (
                          <td key={i} className="py-2 px-3 text-right font-medium">{formatCurrency(adjustedCogs.hostingBandwidth[i])}</td>
                        ))}
                      </tr>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3">AI Inference</td>
                        {YEARS.map((_, i) => (
                          <td key={i} className="py-2 px-3 text-right font-medium">{formatCurrency(adjustedCogs.aiInference[i])}</td>
                        ))}
                      </tr>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3">Payment Processing</td>
                        {YEARS.map((_, i) => (
                          <td key={i} className="py-2 px-3 text-right font-medium">{formatCurrency(adjustedCogs.paymentProcessing[i])}</td>
                        ))}
                      </tr>
                      <tr className="bg-muted/30 font-semibold">
                        <td className="py-2 px-3"><GlossaryTerm term="COGS">Total COGS</GlossaryTerm></td>
                        {YEARS.map((_, i) => (
                          <td key={i} className="py-2 px-3 text-right text-red-600">
                            {formatCurrency(adjustedCogs.hostingBandwidth[i] + adjustedCogs.aiInference[i] + adjustedCogs.paymentProcessing[i])}
                          </td>
                        ))}
                      </tr>
                      <tr className="bg-emerald-50 dark:bg-emerald-950/30">
                        <td className="py-2 px-3 font-semibold"><GlossaryTerm term="Gross Margin">Gross Margin %</GlossaryTerm></td>
                        {metrics.grossMargin.map((v, i) => (
                          <td key={i} className="py-2 px-3 text-right font-bold text-emerald-600">{formatPercent(v)}</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* COGS Fine-Tune Sliders */}
                <CollapsibleSliderSection
                  title="COGS Fine-Tune Controls"
                  isOpen={cogsSliderOpen}
                  onToggle={() => setCogsSliderOpen(!cogsSliderOpen)}
                >
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 pt-4">
                    <CFOSliderControl
                      label="Hosting Cost/User ($/yr)"
                      value={assumptions.hostingCostPerUser}
                      onChange={(v) => updateAssumption('hostingCostPerUser', v)}
                      min={2}
                      max={40}
                      step={1}
                      unit="currency"
                      helperText="Modifies Hosting + Bandwidth line"
                    />
                    <CFOSliderControl
                      label="Bandwidth Multiplier"
                      value={assumptions.bandwidthMultiplier}
                      onChange={(v) => updateAssumption('bandwidthMultiplier', v)}
                      min={0.5}
                      max={3}
                      step={0.1}
                      unit="multiplier"
                      helperText="Multiplies hosting cost"
                    />
                    <CFOSliderControl
                      label="AI Inference $/min"
                      value={assumptions.aiInferenceCostPerMin}
                      onChange={(v) => updateAssumption('aiInferenceCostPerMin', v)}
                      min={0.0005}
                      max={0.1}
                      step={0.0005}
                      unit="currency"
                      helperText="Modifies AI Inference line"
                    />
                    <CFOSliderControl
                      label="Payment Processing Fee"
                      value={assumptions.paymentProcessingFee}
                      onChange={(v) => updateAssumption('paymentProcessingFee', v)}
                      min={1}
                      max={8}
                      step={0.5}
                      unit="percent"
                      helperText="Revenue × fee rate"
                    />
                    <CFOSliderControl
                      label="AI Usage Multiplier"
                      value={assumptions.aiUsageMultiplier}
                      onChange={(v) => updateAssumption('aiUsageMultiplier', v)}
                      min={0.5}
                      max={5}
                      step={0.1}
                      unit="multiplier"
                      helperText="Increases inference cost"
                    />
                  </div>
                </CollapsibleSliderSection>

                {/* Save Button */}
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={() => handleSaveTab('cogs')}
                    disabled={savingTab === 'cogs'}
                    className={cn(
                      "transition-all duration-300",
                      savingTab === 'cogs' && "animate-pulse",
                      savedTabs.cogs && "bg-emerald-600 hover:bg-emerald-700"
                    )}
                  >
                    {savingTab === 'cogs' ? (
                      <>Saving...</>
                    ) : savedTabs.cogs ? (
                      <><Check className="w-4 h-4 mr-2" />Saved</>
                    ) : (
                      <><Save className="w-4 h-4 mr-2" />Save & Continue</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="opex">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Operating Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Category</th>
                        {YEARS.map(year => (
                          <th key={year} className="text-right py-2 px-3 font-medium text-muted-foreground w-36">{year}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3">Product & Engineering</td>
                        {YEARS.map((_, i) => (
                          <td key={i} className="py-2 px-3 text-right font-medium">{formatCurrency(adjustedOpex.productEngineering[i])}</td>
                        ))}
                      </tr>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3">Sales & Marketing</td>
                        {YEARS.map((_, i) => (
                          <td key={i} className="py-2 px-3 text-right font-medium">{formatCurrency(adjustedOpex.salesMarketing[i])}</td>
                        ))}
                      </tr>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3">General & Administrative</td>
                        {YEARS.map((_, i) => (
                          <td key={i} className="py-2 px-3 text-right font-medium">{formatCurrency(adjustedOpex.generalAdmin[i])}</td>
                        ))}
                      </tr>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3">Customer Success</td>
                        {YEARS.map((_, i) => (
                          <td key={i} className="py-2 px-3 text-right font-medium">{formatCurrency(adjustedOpex.customerSuccess[i])}</td>
                        ))}
                      </tr>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3">Contractors / AI Automation</td>
                        {YEARS.map((_, i) => (
                          <td key={i} className="py-2 px-3 text-right font-medium">{formatCurrency(adjustedOpex.contractorsAI[i])}</td>
                        ))}
                      </tr>
                      <tr className="bg-muted/30 font-semibold">
                        <td className="py-2 px-3"><GlossaryTerm term="OpEx">Total OpEx</GlossaryTerm></td>
                        {YEARS.map((_, i) => (
                          <td key={i} className="py-2 px-3 text-right text-red-600">
                            {formatCurrency(
                              adjustedOpex.productEngineering[i] + adjustedOpex.salesMarketing[i] + adjustedOpex.generalAdmin[i] +
                              adjustedOpex.customerSuccess[i] + adjustedOpex.contractorsAI[i]
                            )}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* OpEx Fine-Tune Sliders */}
                <CollapsibleSliderSection
                  title="OpEx Fine-Tune Controls"
                  isOpen={opexSliderOpen}
                  onToggle={() => setOpexSliderOpen(!opexSliderOpen)}
                >
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 pt-4">
                    <CFOSliderControl
                      label="Monthly Marketing Budget"
                      value={assumptions.monthlyMarketingBudget}
                      onChange={(v) => updateAssumption('monthlyMarketingBudget', v)}
                      min={0}
                      max={250000}
                      step={5000}
                      unit="currency"
                      helperText="Feeds CAC calculator + OpEx"
                      tooltip="Total monthly spend allocated to paid channels. Impacts CAC, customer acquisition volume, and OpEx."
                    />
                    <CFOSliderControl
                      label="Creator CAC (Paid)"
                      value={assumptions.cacPaid}
                      onChange={(v) => updateAssumption('cacPaid', v)}
                      min={10}
                      max={250}
                      step={5}
                      unit="currency"
                      helperText="Updates acquisition cost"
                      tooltip="Customer Acquisition Cost. The average cost to acquire one paying creator via paid marketing channels."
                    />
                    <CFOSliderControl
                      label="Pro Tier ARPU"
                      value={assumptions.proTierArpu}
                      onChange={(v) => updateAssumption('proTierArpu', v)}
                      min={10}
                      max={100}
                      step={1}
                      unit="currency"
                      helperText="Recalculates subscription revenue"
                      tooltip="Average monthly revenue generated per paying Pro subscriber."
                    />
                    <CFOSliderControl
                      label="Monthly Churn"
                      value={assumptions.opexChurn}
                      onChange={(v) => updateAssumption('opexChurn', v)}
                      min={0}
                      max={20}
                      step={0.5}
                      unit="percent"
                      helperText="Reduces active subscriber counts"
                      tooltip="Percentage of subscribers who cancel each month. Higher churn reduces active subscriber counts and revenue."
                    />
                    <CFOSliderControl
                      label="Headcount Productivity"
                      value={assumptions.headcountProductivity}
                      onChange={(v) => updateAssumption('headcountProductivity', v)}
                      min={0.7}
                      max={2}
                      step={0.1}
                      unit="multiplier"
                      helperText="Adjusts OpEx efficiency in EBITDA"
                      tooltip="Adjusts OpEx efficiency relative to headcount. Higher values simulate improved team output or automation leverage."
                    />
                  </div>
                </CollapsibleSliderSection>

                {/* Inline Calculators */}
                <div className="mt-6 space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Quick Calculators</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <ROICalculator
                      marketingSpend={assumptions.monthlyMarketingBudget}
                      cac={assumptions.cacPaid}
                      churn={assumptions.churnRate}
                      arpu={assumptions.proTierArpu}
                      onApply={handleROIApply}
                    />
                    <BreakevenCalculator
                      fixedOpex={adjustedOpex.productEngineering[0] + adjustedOpex.generalAdmin[0] + adjustedOpex.customerSuccess[0]}
                      variableOpexPct={20}
                      revenueGrowth={assumptions.monthlyCreatorGrowth * 12}
                      initialRevenue={metrics.arr[0]}
                      onApply={handleBreakevenApply}
                    />
                    <GrowthImpactCalculator
                      baseRevenue={metrics.arr}
                      baseEbitda={metrics.ebitda}
                      onApply={handleGrowthImpactApply}
                    />
                  </div>
                </div>

                {/* Save Button */}
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={() => handleSaveTab('opex')}
                    disabled={savingTab === 'opex'}
                    className={cn(
                      "transition-all duration-300",
                      savingTab === 'opex' && "animate-pulse",
                      savedTabs.opex && "bg-emerald-600 hover:bg-emerald-700"
                    )}
                  >
                    {savingTab === 'opex' ? (
                      <>Saving...</>
                    ) : savedTabs.opex ? (
                      <><Check className="w-4 h-4 mr-2" />Saved</>
                    ) : (
                      <><Save className="w-4 h-4 mr-2" />Save & Continue</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="headcount">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Headcount Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Department</th>
                        <th className="text-center py-2 px-3 font-medium text-muted-foreground w-24">2025</th>
                        <th className="text-center py-2 px-3 font-medium text-muted-foreground w-24">2026</th>
                        <th className="text-center py-2 px-3 font-medium text-muted-foreground w-24">2027</th>
                        <th className="text-right py-2 px-3 font-medium text-muted-foreground w-32">Avg Salary</th>
                      </tr>
                    </thead>
                    <tbody>
                      {headcount.map((row, index) => (
                        <tr key={row.department} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-3">{row.department}</td>
                          <td className="py-2 px-3">
                            <Input
                              type="number"
                              value={Math.round(row.year1 * assumptions.hiringRampSpeed)}
                              onChange={(e) => updateHeadcount(index, 'year1', Number(e.target.value))}
                              className="text-center h-9 w-20 mx-auto"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Input
                              type="number"
                              value={Math.round(row.year2 * assumptions.hiringRampSpeed)}
                              onChange={(e) => updateHeadcount(index, 'year2', Number(e.target.value))}
                              className="text-center h-9 w-20 mx-auto"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Input
                              type="number"
                              value={Math.round(row.year3 * assumptions.hiringRampSpeed)}
                              onChange={(e) => updateHeadcount(index, 'year3', Number(e.target.value))}
                              className="text-center h-9 w-20 mx-auto"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Input
                              type="number"
                              value={Math.round(row.avgSalary * (1 + assumptions.salaryInflation / 100))}
                              onChange={(e) => updateHeadcount(index, 'avgSalary', Number(e.target.value))}
                              className="text-right h-9 w-28 ml-auto"
                            />
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-muted/30 font-semibold">
                        <td className="py-2 px-3">Total Headcount</td>
                        <td className="py-2 px-3 text-center">{Math.round(headcount.reduce((sum, r) => sum + r.year1, 0) * assumptions.hiringRampSpeed)}</td>
                        <td className="py-2 px-3 text-center">{Math.round(headcount.reduce((sum, r) => sum + r.year2, 0) * assumptions.hiringRampSpeed)}</td>
                        <td className="py-2 px-3 text-center">{Math.round(headcount.reduce((sum, r) => sum + r.year3, 0) * assumptions.hiringRampSpeed)}</td>
                        <td className="py-2 px-3"></td>
                      </tr>
                      <tr className="bg-amber-50 dark:bg-amber-950/30">
                        <td className="py-2 px-3 font-semibold">Total Payroll</td>
                        {[0, 1, 2].map(yearIdx => {
                          const yearField = ['year1', 'year2', 'year3'][yearIdx] as 'year1' | 'year2' | 'year3';
                          const total = headcount.reduce((sum, r) => 
                            sum + Math.round(r[yearField] * assumptions.hiringRampSpeed) * 
                                  Math.round(r.avgSalary * (1 + assumptions.salaryInflation / 100) * Math.pow(1 + assumptions.salaryInflation / 100, yearIdx))
                          , 0);
                          return (
                            <td key={yearIdx} className="py-2 px-3 text-center font-bold text-amber-600">{formatCurrency(total)}</td>
                          );
                        })}
                        <td className="py-2 px-3"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Headcount Fine-Tune Sliders */}
                <CollapsibleSliderSection
                  title="Headcount Fine-Tune Controls"
                  isOpen={headcountSliderOpen}
                  onToggle={() => setHeadcountSliderOpen(!headcountSliderOpen)}
                >
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
                    <CFOSliderControl
                      label="Salary Inflation"
                      value={assumptions.salaryInflation}
                      onChange={(v) => updateAssumption('salaryInflation', v)}
                      min={0}
                      max={15}
                      step={0.5}
                      unit="percent"
                      helperText="Increases salary line YoY"
                    />
                    <CFOSliderControl
                      label="Hiring Ramp Speed"
                      value={assumptions.hiringRampSpeed}
                      onChange={(v) => updateAssumption('hiringRampSpeed', v)}
                      min={0.5}
                      max={2}
                      step={0.1}
                      unit="multiplier"
                      helperText="Scales all headcount entries"
                    />
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Contractor → Employee</Label>
                        <Switch
                          checked={assumptions.contractorToEmployee}
                          onCheckedChange={(v) => updateAssumption('contractorToEmployee', v)}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Switching ON increases cost by 20%</p>
                    </div>
                  </div>
                </CollapsibleSliderSection>

                {/* Save Button */}
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={() => handleSaveTab('headcount')}
                    disabled={savingTab === 'headcount'}
                    className={cn(
                      "transition-all duration-300",
                      savingTab === 'headcount' && "animate-pulse",
                      savedTabs.headcount && "bg-emerald-600 hover:bg-emerald-700"
                    )}
                  >
                    {savingTab === 'headcount' ? (
                      <>Saving...</>
                    ) : savedTabs.headcount ? (
                      <><Check className="w-4 h-4 mr-2" />Saved</>
                    ) : (
                      <><Save className="w-4 h-4 mr-2" />Save & Continue</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Metrics Tab */}
          <TabsContent value="metrics">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Key Metrics (Auto-Calculated)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Metric</th>
                        {YEARS.map(year => (
                          <th key={year} className="text-right py-2 px-3 font-medium text-muted-foreground w-36">{year}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3 font-medium"><GlossaryTerm term="ARR">ARR</GlossaryTerm></td>
                        {metrics.arr.map((v, i) => (
                          <td key={i} className="py-2 px-3 text-right font-semibold text-emerald-600">{formatCurrency(v)}</td>
                        ))}
                      </tr>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3 font-medium"><GlossaryTerm term="Gross Margin">Gross Margin %</GlossaryTerm></td>
                        {metrics.grossMargin.map((v, i) => (
                          <td key={i} className="py-2 px-3 text-right">{formatPercent(v)}</td>
                        ))}
                      </tr>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3 font-medium"><GlossaryTerm term="EBITDA">EBITDA</GlossaryTerm></td>
                        {metrics.ebitda.map((v, i) => (
                          <td key={i} className={cn("py-2 px-3 text-right font-semibold", v >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                            {formatCurrency(v)}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3 font-medium"><GlossaryTerm term="Burn Rate">Burn Rate (Monthly)</GlossaryTerm></td>
                        {metrics.burnRate.map((v, i) => (
                          <td key={i} className={cn("py-2 px-3 text-right", v > 0 ? 'text-red-600' : 'text-emerald-600')}>
                            {v > 0 ? formatCurrency(v) : 'Cash Positive'}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3 font-medium"><GlossaryTerm term="CAC">CAC (Blended)</GlossaryTerm></td>
                        <td colSpan={3} className="py-2 px-3 text-right">{formatCurrency(metrics.cac, false)}</td>
                      </tr>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3 font-medium"><GlossaryTerm term="LTV">LTV</GlossaryTerm></td>
                        <td colSpan={3} className="py-2 px-3 text-right">{formatCurrency(metrics.ltv)}</td>
                      </tr>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3 font-medium"><GlossaryTerm term="LTV:CAC Ratio">LTV:CAC Ratio</GlossaryTerm></td>
                        <td colSpan={3} className={cn("py-2 px-3 text-right font-semibold", metrics.ltv / metrics.cac >= 3 ? 'text-emerald-600' : 'text-amber-600')}>
                          {(metrics.ltv / metrics.cac).toFixed(1)}x
                        </td>
                      </tr>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3 font-medium"><GlossaryTerm term="Runway">Runway (Months)</GlossaryTerm></td>
                        <td colSpan={3} className="py-2 px-3 text-right">{Math.round(metrics.runway)} months</td>
                      </tr>
                      <tr className="bg-emerald-50 dark:bg-emerald-950/30">
                        <td className="py-2 px-3 font-semibold"><GlossaryTerm term="Breakeven Month">Breakeven Month</GlossaryTerm></td>
                        <td colSpan={3} className="py-2 px-3 text-right font-bold text-emerald-600">
                          {metrics.breakEvenMonth ? `Month ${metrics.breakEvenMonth}` : 'Beyond Y3'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {/* Save Button */}
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={() => handleSaveTab('metrics')}
                    disabled={savingTab === 'metrics'}
                    className={cn(
                      "transition-all duration-300",
                      savingTab === 'metrics' && "animate-pulse",
                      savedTabs.metrics && "bg-emerald-600 hover:bg-emerald-700"
                    )}
                  >
                    {savingTab === 'metrics' ? (
                      <>Saving...</>
                    ) : savedTabs.metrics ? (
                      <><Check className="w-4 h-4 mr-2" />Saved</>
                    ) : (
                      <><Save className="w-4 h-4 mr-2" />Save & Continue</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assumptions Tab */}
          <TabsContent value="assumptions">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">CFO Assumptions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Growth</h3>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm">Monthly Creator Growth (%)</Label>
                        <Input
                          type="number"
                          value={assumptions.monthlyCreatorGrowth}
                          onChange={(e) => updateAssumption('monthlyCreatorGrowth', Number(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Avg Revenue Per Creator ($)</Label>
                        <Input
                          type="number"
                          value={assumptions.avgRevenuePerCreator}
                          onChange={(e) => updateAssumption('avgRevenuePerCreator', Number(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Monthly Churn Rate (%)</Label>
                        <Input
                          type="number"
                          value={assumptions.churnRate}
                          onChange={(e) => updateAssumption('churnRate', Number(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Advertising</h3>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm">AI Tools Adoption (%)</Label>
                        <Input
                          type="number"
                          value={assumptions.aiToolsAdoption}
                          onChange={(e) => updateAssumption('aiToolsAdoption', Number(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Ad Fill Rate (%)</Label>
                        <Input
                          type="number"
                          value={assumptions.adFillRate}
                          onChange={(e) => updateAssumption('adFillRate', Number(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Average CPM ($)</Label>
                        <Input
                          type="number"
                          value={assumptions.advertisingCPM}
                          onChange={(e) => updateAssumption('advertisingCPM', Number(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Unit Economics</h3>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm">CAC Paid ($)</Label>
                        <Input
                          type="number"
                          value={assumptions.cacPaid}
                          onChange={(e) => updateAssumption('cacPaid', Number(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">CAC Organic ($)</Label>
                        <Input
                          type="number"
                          value={assumptions.cacOrganic}
                          onChange={(e) => updateAssumption('cacOrganic', Number(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Gross Margin Target (%)</Label>
                        <Input
                          type="number"
                          value={assumptions.grossMarginTarget}
                          onChange={(e) => updateAssumption('grossMarginTarget', Number(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={() => handleSaveTab('assumptions')}
                    disabled={savingTab === 'assumptions'}
                    className={cn(
                      "transition-all duration-300",
                      savingTab === 'assumptions' && "animate-pulse",
                      savedTabs.assumptions && "bg-emerald-600 hover:bg-emerald-700"
                    )}
                  >
                    {savingTab === 'assumptions' ? (
                      <>Saving...</>
                    ) : savedTabs.assumptions ? (
                      <><Check className="w-4 h-4 mr-2" />Saved</>
                    ) : (
                      <><Save className="w-4 h-4 mr-2" />Save & Continue</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          {/* Capital & Runway Tab */}
          <TabsContent value="capital">
            <CFOCapitalRunway
              settings={capitalSettings}
              onSettingsChange={setCapitalSettings}
              infusions={capitalInfusions}
              onInfusionsChange={setCapitalInfusions}
              ebitda={metrics.ebitda}
              years={YEARS}
            />
            {/* Save Button */}
            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => handleSaveTab('capital')}
                disabled={savingTab === 'capital'}
                className={cn(
                  "transition-all duration-300",
                  savingTab === 'capital' && "animate-pulse",
                  savedTabs.capital && "bg-emerald-600 hover:bg-emerald-700"
                )}
              >
                {savingTab === 'capital' ? (
                  <>Saving...</>
                ) : savedTabs.capital ? (
                  <><Check className="w-4 h-4 mr-2" />Saved</>
                ) : (
                  <><Save className="w-4 h-4 mr-2" />Save & Continue</>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="statements">
            <CFOFinancialStatements
              data={financialData}
              years={YEARS}
              cashBalance={500000}
            />
            {/* Save Button */}
            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => handleSaveTab('statements')}
                disabled={savingTab === 'statements'}
                className={cn(
                  "transition-all duration-300",
                  savingTab === 'statements' && "animate-pulse",
                  savedTabs.statements && "bg-emerald-600 hover:bg-emerald-700"
                )}
              >
                {savingTab === 'statements' ? (
                  <>Saving...</>
                ) : savedTabs.statements ? (
                  <><Check className="w-4 h-4 mr-2" />Saved</>
                ) : (
                  <><Save className="w-4 h-4 mr-2" />Save & Continue</>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Summary Tab */}
          <TabsContent value="summary">
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">P&L Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-medium text-muted-foreground"></th>
                        {YEARS.map(year => (
                          <th key={year} className="text-right py-2 font-medium text-muted-foreground">{year}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2 font-medium">Revenue</td>
                        {metrics.arr.map((v, i) => (
                          <td key={i} className="py-2 text-right">{formatCurrency(v)}</td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">COGS</td>
                        {YEARS.map((_, i) => (
                          <td key={i} className="py-2 text-right text-red-600">
                            ({formatCurrency(adjustedCogs.hostingBandwidth[i] + adjustedCogs.aiInference[i] + adjustedCogs.paymentProcessing[i])})
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b bg-muted/30">
                        <td className="py-2 font-semibold">Gross Profit</td>
                        {financialData.grossProfit.map((v, i) => (
                          <td key={i} className="py-2 text-right font-semibold">{formatCurrency(v)}</td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">Operating Expenses</td>
                        {financialData.opex.map((v, i) => (
                          <td key={i} className="py-2 text-right text-red-600">({formatCurrency(v)})</td>
                        ))}
                      </tr>
                      <tr className="bg-emerald-50 dark:bg-emerald-950/30">
                        <td className="py-2 font-bold">EBITDA</td>
                        {metrics.ebitda.map((v, i) => (
                          <td key={i} className={cn("py-2 text-right font-bold", v >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                            {formatCurrency(v)}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Board Pack Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Year 3 ARR Target</p>
                      <p className="text-2xl font-bold text-emerald-600">{formatCurrency(metrics.arr[2])}</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Year 3 EBITDA</p>
                      <p className={cn("text-2xl font-bold", metrics.ebitda[2] >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                        {formatCurrency(metrics.ebitda[2])}
                      </p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Year 3 Headcount</p>
                      <p className="text-2xl font-bold">{Math.round(headcount.reduce((sum, r) => sum + r.year3, 0) * assumptions.hiringRampSpeed)}</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Breakeven</p>
                      <p className="text-2xl font-bold text-emerald-600">
                        {metrics.breakEvenMonth ? `Month ${metrics.breakEvenMonth}` : 'TBD'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="font-semibold mb-3">Revenue Mix (Year 3)</h4>
                    <div className="space-y-2">
                      {[
                        { label: 'SaaS Subscriptions', value: adjustedRevenue.saasSubscriptions[2], color: 'bg-blue-500' },
                        { label: 'AI + Production', value: adjustedRevenue.aiProductionTools[2], color: 'bg-purple-500' },
                        { label: 'Advertising', value: adjustedRevenue.advertisingMarketplace[2], color: 'bg-amber-500' },
                        ...(enterpriseEnabled ? [{ label: 'Enterprise', value: adjustedRevenue.enterpriseLicensing[2], color: 'bg-emerald-500' }] : []),
                      ].map((item) => {
                        const total = metrics.arr[2];
                        const pct = total > 0 ? (item.value / total) * 100 : 0;
                        return (
                          <div key={item.label} className="flex items-center gap-3">
                            <div className={cn("w-3 h-3 rounded-full", item.color)} />
                            <span className="text-sm flex-1">{item.label}</span>
                            <span className="text-sm font-medium">{formatPercent(pct)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Scenario Summary for Export */}
            <div className="mt-6">
              <ScenarioSummaryExport scenario={activeScenario} />
            </div>

            {/* CFO Brief for Board */}
            <div className="mt-6">
              <CFOBrief
                variant="board"
                metrics={metrics}
                forecastMode={forecastMode}
                scenario="base"
                years={YEARS}
              />
            </div>
            <div className="mt-6 flex justify-center gap-4">
              {!savedTabs.summary ? (
                <Button
                  size="lg"
                  onClick={() => handleSaveTab('summary')}
                  disabled={savingTab === 'summary'}
                  className={cn(
                    "transition-all duration-300 px-8",
                    savingTab === 'summary' && "animate-pulse"
                  )}
                >
                  {savingTab === 'summary' ? (
                    <>Saving...</>
                  ) : (
                    <><Save className="w-4 h-4 mr-2" />Save & Create Pro Forma</>
                  )}
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    onClick={() => {
                      handleSaveTab('summary');
                      navigate('/cfo/proforma');
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 px-6"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Save & View
                  </Button>
                  <Button
                    size="lg"
                    onClick={() => {
                      handleSaveTab('summary');
                      setShowSaveModal(true);
                    }}
                    variant="outline"
                    className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 px-6"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Save, View & Share
                  </Button>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Save Pro Forma Version Modal */}
      <SaveProFormaVersionModal
        open={showSaveModal}
        onOpenChange={setShowSaveModal}
        onSave={(name, notes) => {
          saveVersion({
            name,
            notes,
            assumptions: {
              ...assumptions,
              metrics: {
                arr: metrics.arr,
                ebitda: metrics.ebitda,
                grossMargin: metrics.grossMargin,
                burnRate: metrics.burnRate,
                runway: metrics.runway,
                cac: metrics.cac,
                ltv: metrics.ltv,
                breakEvenMonth: metrics.breakEvenMonth,
              },
              financials: {
                revenue: financialData.revenue,
                cogs: financialData.cogs,
                grossProfit: financialData.grossProfit,
                opex: financialData.opex,
              },
              forecastMode,
              years: YEARS,
            },
          });
          setShowSaveModal(false);
          navigate('/cfo/proforma');
        }}
        isSaving={isSaving}
      />

      {/* Share to Board Modal */}
      <ShareToBoardModal
        open={showShareModal}
        onOpenChange={setShowShareModal}
        versionLabel={currentVersionId ? mappedVersions.find(v => v.id === currentVersionId)?.name : undefined}
        versionId={currentVersionId || undefined}
      />
    </div>
  );
}
