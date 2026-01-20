import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  LayoutDashboard, 
  MapPin, 
  Search, 
  Activity, 
  Zap, 
  History,
  Link2,
  TrendingUp
} from "lucide-react";
import { useLocalVisibilityStore } from "@/hooks/useLocalVisibilityStore";
import { OverviewSection } from "@/components/local-visibility/OverviewSection";
import { GBPSection } from "@/components/local-visibility/GBPSection";
import { LocalSearchSection } from "@/components/local-visibility/LocalSearchSection";
import { TrackingHealthSection } from "@/components/local-visibility/TrackingHealthSection";
import { GrowthActionsSection } from "@/components/local-visibility/GrowthActionsSection";
import { ActivityLogSection } from "@/components/local-visibility/ActivityLogSection";
import { ConnectionsSection } from "@/components/local-visibility/ConnectionsSection";

export default function LocalVisibilityApp() {
  const { activeTab, setActiveTab } = useLocalVisibilityStore();

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'gbp', label: 'Business Profile', icon: MapPin },
    { id: 'search', label: 'Local Search', icon: Search },
    { id: 'tracking', label: 'Tracking Health', icon: Activity },
    { id: 'actions', label: 'Growth Actions', icon: Zap },
    { id: 'log', label: 'Activity Log', icon: History },
    { id: 'connections', label: 'Connections', icon: Link2 },
  ];

  return (
    <div className="container max-w-6xl py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Local Visibility & Growth</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            AI-guided control center for your local online presence
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          Beta
        </Badge>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7 h-auto p-1">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="flex flex-col items-center gap-1 py-2 px-1 text-xs data-[state=active]:bg-background"
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewSection />
        </TabsContent>

        <TabsContent value="gbp" className="mt-6">
          <GBPSection />
        </TabsContent>

        <TabsContent value="search" className="mt-6">
          <LocalSearchSection />
        </TabsContent>

        <TabsContent value="tracking" className="mt-6">
          <TrackingHealthSection />
        </TabsContent>

        <TabsContent value="actions" className="mt-6">
          <GrowthActionsSection />
        </TabsContent>

        <TabsContent value="log" className="mt-6">
          <ActivityLogSection />
        </TabsContent>

        <TabsContent value="connections" className="mt-6">
          <ConnectionsSection />
        </TabsContent>
      </Tabs>

      {/* Footer Note */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground">
            This app reads data safely and explains insights in plain language. 
            High-risk actions require explicit confirmation. Nothing destructive happens without your approval.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
