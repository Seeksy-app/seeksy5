import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, TrendingUp, BarChart3, Megaphone, Calculator, FileText } from "lucide-react";
import { MarketOverviewTab } from "@/components/gtm/MarketOverviewTab";
import { GTMStrategyTab } from "@/components/gtm/GTMStrategyTab";
import { KeyMetricsTab } from "@/components/gtm/KeyMetricsTab";
import { ChannelsTab } from "@/components/gtm/ChannelsTab";
import { ROICalculatorTab } from "@/components/gtm/ROICalculatorTab";
import { GTMBoardReport } from "@/components/cfo/GTMBoardReport";

const MarketingGTMPlan = () => {
  const [activeTab, setActiveTab] = useState("board-report");

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-4 mb-4">
            <Target className="w-12 h-12" />
            <h1 className="text-4xl md:text-5xl font-bold">Marketing & GTM Plan</h1>
          </div>
          <p className="text-xl text-primary-foreground/90 max-w-3xl">
            Strategic roadmap to capture the $487B creator economy opportunity with AI-powered content tools
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 h-auto gap-2 bg-muted/50 p-1">
            <TabsTrigger 
              value="board-report" 
              className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Board Report</span>
            </TabsTrigger>
            <TabsTrigger 
              value="market-overview" 
              className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Market Overview</span>
            </TabsTrigger>
            <TabsTrigger 
              value="gtm-strategy"
              className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground"
            >
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">GTM Strategy</span>
            </TabsTrigger>
            <TabsTrigger 
              value="key-metrics"
              className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground"
            >
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Key Metrics</span>
            </TabsTrigger>
            <TabsTrigger 
              value="channels"
              className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground"
            >
              <Megaphone className="w-4 h-4" />
              <span className="hidden sm:inline">Channels</span>
            </TabsTrigger>
            <TabsTrigger 
              value="roi-calculator"
              className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground"
            >
              <Calculator className="w-4 h-4" />
              <span className="hidden sm:inline">ROI Calculator</span>
            </TabsTrigger>
          </TabsList>

          {/* Board Report Tab - Investor Ready View */}
          <TabsContent value="board-report" className="space-y-6">
            <GTMBoardReport />
          </TabsContent>

          <TabsContent value="market-overview" className="space-y-6">
            <MarketOverviewTab />
          </TabsContent>

          <TabsContent value="gtm-strategy" className="space-y-6">
            <GTMStrategyTab />
          </TabsContent>

          <TabsContent value="key-metrics" className="space-y-6">
            <KeyMetricsTab />
          </TabsContent>

          <TabsContent value="channels" className="space-y-6">
            <ChannelsTab />
          </TabsContent>

          <TabsContent value="roi-calculator" className="space-y-6">
            <ROICalculatorTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MarketingGTMPlan;
