import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AssumptionsTab } from "@/components/cfo/AssumptionsTab";
import { ScenariosTab } from "@/components/cfo/ScenariosTab";
import { CreatorEarningsTab } from "@/components/cfo/CreatorEarningsTab";
import { InvestorViewTab } from "@/components/cfo/InvestorViewTab";
import { DollarSign, TrendingUp, Users, PresentationIcon } from "lucide-react";

export default function AdFinancialModels() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Map URL segments to tab values
  const getTabFromPath = (pathname: string): string => {
    if (pathname.endsWith('/scenarios')) return 'scenarios';
    if (pathname.endsWith('/creator-earnings')) return 'earnings';
    if (pathname.endsWith('/investor-view')) return 'investor';
    return 'assumptions'; // default
  };

  const [activeTab, setActiveTab] = useState(() => getTabFromPath(location.pathname));

  // Sync tab with URL changes
  useEffect(() => {
    const newTab = getTabFromPath(location.pathname);
    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }
  }, [location.pathname]);

  // Update URL when tab changes via UI
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const basePath = '/admin/financial-models/ads';
    const tabPaths: Record<string, string> = {
      assumptions: basePath,
      scenarios: `${basePath}/scenarios`,
      earnings: `${basePath}/creator-earnings`,
      investor: `${basePath}/investor-view`,
    };
    navigate(tabPaths[value] || basePath, { replace: true });
  };

  return (
    <div className="px-10 py-6 space-y-8">
      <div className="flex flex-col items-start">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <DollarSign className="h-8 w-8 text-primary" />
          Ad Revenue Financial Model
        </h1>
        <p className="text-muted-foreground mt-1">
          12-36 month projections, scenario planning, and investor reporting
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="assumptions" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Assumptions
          </TabsTrigger>
          <TabsTrigger value="scenarios" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Scenarios
          </TabsTrigger>
          <TabsTrigger value="earnings" className="gap-2">
            <Users className="h-4 w-4" />
            Creator Earnings
          </TabsTrigger>
          <TabsTrigger value="investor" className="gap-2">
            <PresentationIcon className="h-4 w-4" />
            Investor View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assumptions" className="space-y-4">
          <AssumptionsTab />
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-4">
          <ScenariosTab />
        </TabsContent>

        <TabsContent value="earnings" className="space-y-4">
          <CreatorEarningsTab />
        </TabsContent>

        <TabsContent value="investor" className="space-y-4">
          <InvestorViewTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
