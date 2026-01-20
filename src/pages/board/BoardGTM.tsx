import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MarketOverviewTab } from '@/components/board/gtm/MarketOverviewTab';
import { GTMStrategyTab } from '@/components/board/gtm/GTMStrategyTab';
import { CompetitiveLandscapeTab } from '@/components/board/gtm/CompetitiveLandscapeTab';
import { KeyMetricsTab } from '@/components/board/gtm/KeyMetricsTab';
import { ChannelsTab } from '@/components/board/gtm/ChannelsTab';
import { ROICalculatorTab } from '@/components/board/gtm/ROICalculatorTab';
import { SWOTAnalysisTab } from '@/components/board/gtm/SWOTAnalysisTab';
import { BoardPageHeader } from '@/components/board/BoardPageHeader';
import { motion, AnimatePresence } from 'framer-motion';

const tabContentVariants = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 }
};

export default function BoardGTM() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("market-overview");

  return (
    <div className="space-y-6 w-full">
        {/* Sticky Header */}
        <BoardPageHeader
          icon={<Target className="w-5 h-5 text-white" />}
          title="GTM Strategy"
          subtitle="Go-to-market plan, channels & acquisition strategy"
        />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-slate-100 p-1 rounded-xl h-auto flex-wrap gap-1">
            <TabsTrigger value="market-overview" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2">
              Market Overview
            </TabsTrigger>
            <TabsTrigger value="gtm-strategy" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2">
              GTM Strategy
            </TabsTrigger>
            <TabsTrigger value="competitive" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2">
              Competitive Landscape
            </TabsTrigger>
            <TabsTrigger value="metrics" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2">
              Key Metrics
            </TabsTrigger>
            <TabsTrigger value="channels" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2">
              Channels
            </TabsTrigger>
            <TabsTrigger value="roi" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2">
              ROI Calculator
            </TabsTrigger>
            <TabsTrigger value="swot" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2">
              SWOT Analysis
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                variants={tabContentVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                {activeTab === "market-overview" && <MarketOverviewTab />}
                {activeTab === "gtm-strategy" && <GTMStrategyTab />}
                {activeTab === "competitive" && <CompetitiveLandscapeTab />}
                {activeTab === "metrics" && <KeyMetricsTab />}
                {activeTab === "channels" && <ChannelsTab />}
                {activeTab === "roi" && <ROICalculatorTab />}
                {activeTab === "swot" && <SWOTAnalysisTab />}
              </motion.div>
            </AnimatePresence>
          </div>
        </Tabs>
    </div>
  );
}
