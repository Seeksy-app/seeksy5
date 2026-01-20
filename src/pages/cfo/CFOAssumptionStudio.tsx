import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Sliders, TrendingUp, CreditCard, DollarSign, Calendar, ArrowLeft, Sparkles, Info, Lock, Unlock, CheckCircle2, Check, Building2, PiggyBank, RefreshCw, FileCheck2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCFOAssumptions } from '@/hooks/useCFOAssumptions';
import { useCFOLockStatus } from '@/hooks/useCFOLockStatus';
import { useCFOProFormaStatus, type CFOSectionKey } from '@/hooks/useCFOProFormaStatus';
import { useCFOProFormaVersions } from '@/hooks/useCFOProFormaVersions';
import { GrowthCACCalculator } from '@/components/cfo/calculators/GrowthCACCalculator';
import { SubscriptionRevenueCalculator } from '@/components/cfo/calculators/SubscriptionRevenueCalculator';
import { AdRevenueCalculator } from '@/components/cfo/calculators/AdRevenueCalculator';
import { EventsAwardsCalculator } from '@/components/cfo/calculators/EventsAwardsCalculator';
import { ExpenseCalculator } from '@/components/cfo/calculators/ExpenseCalculator';
import { CapitalRunwayCalculator } from '@/components/cfo/calculators/CapitalRunwayCalculator';
import { AssumptionsSummaryPanel } from '@/components/cfo/AssumptionsSummaryPanel';
import { ProFormaVersionsControl } from '@/components/cfo/ProFormaVersionsControl';
import { SaveProFormaVersionModal } from '@/components/cfo/SaveProFormaVersionModal';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function CFOAssumptionStudio() {
  const navigate = useNavigate();
  const { rdCount, cfoOverrideCount, schemaCount, isLoading, deleteAssumption, cfoAssumptions, effectiveAssumptions } = useCFOAssumptions();
  const { isLocked, lockedAt, toggleLock, isToggling } = useCFOLockStatus();
  const { sectionStatus, markSectionSaved, resetAllSections } = useCFOProFormaStatus();
  const { versions, latestVersion, saveVersion, deleteVersion, isSaving, isProFormaComplete, buildFullAssumptions } = useCFOProFormaVersions();
  
  const [activeTab, setActiveTab] = useState('growth');
  const [saveModalOpen, setSaveModalOpen] = useState(false);

  const handleResetAll = async () => {
    if (cfoAssumptions) {
      for (const assumption of cfoAssumptions) {
        deleteAssumption(assumption.metric_key);
      }
    }
    resetAllSections();
    toast.success('Assumptions reset — rebuild required.');
  };

  // Tab order for auto-advance
  const tabOrder: CFOSectionKey[] = ['growth', 'subscriptions', 'adRevenue', 'events', 'expenses', 'capital'];
  
  // Map section keys to tab values
  const sectionToTabValue = (section: CFOSectionKey): string => {
    return section === 'adRevenue' ? 'ads' : section;
  };

  // Handler for when a calculator saves - mark section as saved and auto-advance to next unsaved
  const handleCalculatorSave = (section: CFOSectionKey, data?: Record<string, any>) => {
    markSectionSaved(section, data);
    toast.success('Saved to Pro Forma — this section is now included in the forecast.');
    
    // Find the next UNSAVED section and auto-advance to it
    const currentIndex = tabOrder.indexOf(section);
    for (let i = currentIndex + 1; i < tabOrder.length; i++) {
      if (!sectionStatus[tabOrder[i]]) {
        setActiveTab(sectionToTabValue(tabOrder[i]));
        return;
      }
    }
    // If no unsaved section after current, check from beginning
    for (let i = 0; i < currentIndex; i++) {
      if (!sectionStatus[tabOrder[i]]) {
        setActiveTab(sectionToTabValue(tabOrder[i]));
        return;
      }
    }
    // All sections saved - stay on current tab
  };

  // Handle full version save
  const handleSaveFullVersion = (name: string, notes?: string) => {
    const assumptions = {
      ...buildFullAssumptions(),
      effectiveAssumptions: Object.fromEntries(
        Object.entries(effectiveAssumptions).map(([k, v]) => [k, v.value])
      ),
    };
    saveVersion({ name, notes, assumptions });
    setSaveModalOpen(false);
  };

  // Handle version preview
  const handlePreviewVersion = (version: any) => {
    navigate('/cfo/proforma', { state: { viewVersion: version } });
  };

  // Count saved sections
  const savedCount = Object.values(sectionStatus).filter(Boolean).length;
  const totalSections = Object.keys(sectionStatus).length;

  // Tab configuration
  const tabs = [
    { key: 'growth' as CFOSectionKey, label: 'Growth & CAC', icon: <TrendingUp className="w-4 h-4" /> },
    { key: 'subscriptions' as CFOSectionKey, label: 'Subscriptions', icon: <CreditCard className="w-4 h-4" /> },
    { key: 'adRevenue' as CFOSectionKey, label: 'Ad Revenue', icon: <DollarSign className="w-4 h-4" /> },
    { key: 'events' as CFOSectionKey, label: 'Events & Awards', icon: <Calendar className="w-4 h-4" /> },
    { key: 'expenses' as CFOSectionKey, label: 'Expenses', icon: <Building2 className="w-4 h-4" /> },
    { key: 'capital' as CFOSectionKey, label: 'Capital & Runway', icon: <PiggyBank className="w-4 h-4" /> },
  ];

  return (
    <div className="w-full min-h-screen bg-background">
      <div className="max-w-[1600px] mx-auto p-6 space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="text-muted-foreground hover:text-foreground -ml-2"
          onClick={() => navigate('/admin')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Admin
        </Button>

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-md">
              <Sliders className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">CFO Assumption Studio</h1>
              <p className="text-muted-foreground">Configure financial assumptions for AI Pro Forma forecasts</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="outline" className="text-sm">
              {schemaCount} total metrics
            </Badge>
            <Badge variant="outline" className="text-sm bg-slate-50 text-slate-700 border-slate-200">
              {rdCount} R&D benchmarks
            </Badge>
            <Badge variant="outline" className="text-sm bg-blue-50 text-blue-700 border-blue-200">
              {cfoOverrideCount} CFO overrides
            </Badge>
            
            {/* Pro Forma Versions Control */}
            <ProFormaVersionsControl
              versions={versions}
              latestVersion={latestVersion}
              onPreview={handlePreviewVersion}
              onDelete={deleteVersion}
            />
            
            {/* Lock Toggle for Board */}
            <div className="flex items-center gap-2 border-l border-border pl-3 ml-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    {isLocked ? (
                      <Lock className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Unlock className="w-4 h-4 text-muted-foreground" />
                    )}
                    <Switch
                      checked={isLocked}
                      onCheckedChange={(checked) => toggleLock(checked)}
                      disabled={isToggling}
                    />
                    <span className="text-sm font-medium">
                      {isLocked ? 'Locked for Board' : 'Unlock for Board'}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-xs">
                    When locked, Board members can only view published assumptions. 
                    They cannot see real-time changes until you unlock.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Pro Forma Status Bar - Single Banner */}
        <div className={cn(
          "p-4 rounded-lg border flex items-center justify-between",
          isProFormaComplete 
            ? "bg-emerald-50 border-emerald-200" 
            : "bg-amber-50 border-amber-200"
        )}>
          <div className="flex items-center gap-3">
            {isProFormaComplete ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <Info className="w-5 h-5 text-amber-600" />
            )}
            <p className={cn(
              "font-medium",
              isProFormaComplete ? "text-emerald-800" : "text-amber-800"
            )}>
              {isProFormaComplete 
                ? 'All sections saved — ready to publish!' 
                : `${savedCount} of ${totalSections} sections saved — complete all sections before saving a Pro Forma version.`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleResetAll}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reset All
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => navigate('/cfo/proforma')}
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Preview Pro Forma
            </Button>
            <Button 
              onClick={() => setSaveModalOpen(true)}
              disabled={!isProFormaComplete}
              size="sm"
              className={cn(
                "gap-2 transition-all",
                isProFormaComplete 
                  ? "bg-emerald-600 hover:bg-emerald-700" 
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              <FileCheck2 className="w-4 h-4" />
              Save Full Pro Forma Version
            </Button>
          </div>
        </div>

        {/* Section Status Chips - Single Row of Clickable Tabs */}
        <div className="flex flex-wrap gap-2 p-2 bg-muted/50 rounded-lg border">
          {tabs.map(tab => {
            const tabValue = tab.key === 'adRevenue' ? 'ads' : tab.key;
            const isActive = activeTab === tabValue;
            const isSaved = sectionStatus[tab.key];
            
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tabValue)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                  isActive 
                    ? "bg-background shadow-sm ring-1 ring-border" 
                    : "hover:bg-background/50",
                  isSaved 
                    ? "text-emerald-700" 
                    : "text-muted-foreground"
                )}
              >
                {isSaved ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <span className={cn(
                    "w-4 h-4 rounded-full border-2",
                    isActive ? "border-primary" : "border-muted-foreground/40"
                  )} />
                )}
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid lg:grid-cols-[1fr,420px] gap-6 overflow-visible">
          {/* Left: Calculators */}
          <div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsContent value="growth" className="mt-0">
                <GrowthCACCalculator onSave={(data) => handleCalculatorSave('growth', data)} />
              </TabsContent>

              <TabsContent value="subscriptions">
                <SubscriptionRevenueCalculator onSave={(data) => handleCalculatorSave('subscriptions', data)} />
              </TabsContent>

              <TabsContent value="ads">
                <AdRevenueCalculator onSave={(data) => handleCalculatorSave('adRevenue', data)} />
              </TabsContent>

              <TabsContent value="events">
                <EventsAwardsCalculator onSave={(data) => handleCalculatorSave('events', data)} />
              </TabsContent>

              <TabsContent value="expenses">
                <ExpenseCalculator onSave={(data) => handleCalculatorSave('expenses', data)} />
              </TabsContent>

              <TabsContent value="capital">
                <CapitalRunwayCalculator onSave={(data) => handleCalculatorSave('capital', data)} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right: Key Assumptions Summary */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <AssumptionsSummaryPanel onResetAll={handleResetAll} />
          </div>
        </div>
      </div>

      {/* Save Version Modal */}
      <SaveProFormaVersionModal
        open={saveModalOpen}
        onOpenChange={setSaveModalOpen}
        onSave={handleSaveFullVersion}
        isSaving={isSaving}
      />
    </div>
  );
}
