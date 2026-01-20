import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Users, TrendingUp, TrendingDown, DollarSign, Headphones, 
  ChevronRight, MessageSquare, Sparkles, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface SegmentMetrics {
  name: string;
  active: number;
  arpu: number;
  churn: number;
  description: string;
  whyMatters: string;
}

const mockSegments: SegmentMetrics[] = [
  { 
    name: "Creators", 
    active: 8750, 
    arpu: 29, 
    churn: 3.2,
    description: "Individual content creators using Seeksy for podcasting, clips, and monetization.",
    whyMatters: "Core user base driving platform engagement and content volume. High retention indicates product-market fit."
  },
  { 
    name: "Advertisers", 
    active: 450, 
    arpu: 1250, 
    churn: 5.1,
    description: "Brands and agencies purchasing ad inventory across the creator network.",
    whyMatters: "Primary revenue driver. ARPU growth signals expanding campaign sizes and trust in platform."
  },
  { 
    name: "Business / Events", 
    active: 320, 
    arpu: 89, 
    churn: 4.5,
    description: "Event organizers, venues, and businesses using scheduling and event tools.",
    whyMatters: "Emerging vertical with high expansion potential. Events drive creator acquisition."
  },
  { 
    name: "Military / Veteran", 
    active: 180, 
    arpu: 0, 
    churn: 1.2,
    description: "Veterans and military-affiliated creators with special program access.",
    whyMatters: "Mission-aligned segment with strong community loyalty and PR value."
  },
];

const mockPlans = [
  { name: "Free", active: 5200, arpu: 0, upgradeRate: 8.5 },
  { name: "Starter", active: 2100, arpu: 19, upgradeRate: 12.3 },
  { name: "Pro", active: 950, arpu: 49, upgradeRate: 15.1 },
  { name: "Business", active: 320, arpu: 149, upgradeRate: 0 },
];

const mockOpportunities = [
  { segment: "Advertiser A", value: 45000, stage: "Proposal", close: "Jan 2025" },
  { segment: "Brand B", value: 32000, stage: "Negotiation", close: "Dec 2024" },
  { segment: "Agency C", value: 28000, stage: "Discovery", close: "Feb 2025" },
  { segment: "Partner D", value: 25000, stage: "Qualified", close: "Jan 2025" },
  { segment: "Advertiser E", value: 22000, stage: "Proposal", close: "Dec 2024" },
];

export default function BoardCustomerHealth() {
  const [selectedSegment, setSelectedSegment] = useState<SegmentMetrics | null>(null);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Customer Health
          </h1>
          <p className="text-muted-foreground mt-1">
            Aggregate view of customer metrics, pipeline, and support
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Sparkles className="h-4 w-4 mr-2" />
          Ask Board AI
        </Button>
      </div>

      {/* Section A: Top KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">9,700</span>
              <Badge variant="secondary" className="text-green-600">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +312 this month
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Creators + Advertisers + Businesses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Churn & Retention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">3.2%</span>
              <span className="text-sm text-muted-foreground">MRR Churn</span>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-sm">NRR: <strong>108%</strong></span>
              <span className="text-xs text-muted-foreground">Logo churn: 2.8%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">$285K</span>
              <span className="text-sm text-muted-foreground">Open</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Avg deal: $28K • Avg cycle: 45 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Support Load</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">847</span>
              <span className="text-sm text-muted-foreground">tickets (30d)</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Median resolution: 4.2h
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Section B: Segment Performance */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>By Segment</CardTitle>
            <CardDescription>Click a segment for details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mockSegments.map((seg) => (
                <div 
                  key={seg.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                  onClick={() => setSelectedSegment(seg)}
                >
                  <div>
                    <p className="font-medium">{seg.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {seg.active.toLocaleString()} active • ARPU ${seg.arpu}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={seg.churn < 4 ? "secondary" : "destructive"} className="text-xs">
                      {seg.churn}% churn
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>By Plan</CardTitle>
            <CardDescription>Subscription tier breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mockPlans.map((plan) => (
                <div 
                  key={plan.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{plan.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {plan.active.toLocaleString()} active • ARPU ${plan.arpu}
                    </p>
                  </div>
                  {plan.upgradeRate > 0 && (
                    <Badge variant="secondary" className="text-xs text-green-600">
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      {plan.upgradeRate}% upgrade
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section C: Funnel & Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-2 mb-6">
            {[
              { label: "Traffic", value: "125K", color: "bg-slate-200" },
              { label: "Leads", value: "8.2K", color: "bg-slate-300" },
              { label: "Qualified", value: "2.1K", color: "bg-blue-200" },
              { label: "Customers", value: "1.2K", color: "bg-blue-400" },
              { label: "Active Creators", value: "8.7K", color: "bg-primary" },
            ].map((stage, i) => (
              <div key={stage.label} className="flex-1 text-center">
                <div 
                  className={`h-16 ${stage.color} rounded-lg flex items-center justify-center mb-2`}
                  style={{ opacity: 0.5 + (i * 0.12) }}
                >
                  <span className="font-bold text-lg">{stage.value}</span>
                </div>
                <p className="text-xs text-muted-foreground">{stage.label}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="font-medium mb-3">Top 10 Opportunities</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Segment</th>
                    <th className="text-right py-2 font-medium">Est. Value</th>
                    <th className="text-left py-2 font-medium">Stage</th>
                    <th className="text-left py-2 font-medium">Expected Close</th>
                  </tr>
                </thead>
                <tbody>
                  {mockOpportunities.map((opp, i) => (
                    <tr key={i} className="border-b border-muted">
                      <td className="py-2">{opp.segment}</td>
                      <td className="py-2 text-right font-medium">${opp.value.toLocaleString()}</td>
                      <td className="py-2">
                        <Badge variant="outline">{opp.stage}</Badge>
                      </td>
                      <td className="py-2 text-muted-foreground">{opp.close}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section D: Support & Experience */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Headphones className="h-5 w-5" />
            Support & Experience
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium mb-3">Ticket Volume (3 months)</p>
              <div className="space-y-2">
                {[
                  { month: "October", count: 892, change: -5 },
                  { month: "November", count: 847, change: -5 },
                  { month: "December", count: 756, change: -11 },
                ].map((m) => (
                  <div key={m.month} className="flex items-center justify-between">
                    <span className="text-sm">{m.month}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{m.count}</span>
                      <Badge variant="secondary" className="text-xs text-green-600">
                        {m.change}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-3">By Category</p>
              <div className="space-y-2">
                {[
                  { cat: "Billing", pct: 28 },
                  { cat: "Bugs", pct: 22 },
                  { cat: "Onboarding", pct: 18 },
                  { cat: "UX", pct: 17 },
                  { cat: "Monetization", pct: 15 },
                ].map((c) => (
                  <div key={c.cat} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{c.cat}</span>
                      <span className="text-muted-foreground">{c.pct}%</span>
                    </div>
                    <Progress value={c.pct} className="h-2" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Customer Satisfaction (CSAT)</p>
                <p className="text-xs text-muted-foreground">Based on post-resolution surveys</p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold">4.6</span>
                <span className="text-sm text-muted-foreground"> / 5.0</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Segment Detail Modal */}
      <Dialog open={!!selectedSegment} onOpenChange={() => setSelectedSegment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedSegment?.name} Segment</DialogTitle>
          </DialogHeader>
          {selectedSegment && (
            <div className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">{selectedSegment.description}</p>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-muted rounded-lg text-center">
                  <p className="text-2xl font-bold">{selectedSegment.active.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
                <div className="p-3 bg-muted rounded-lg text-center">
                  <p className="text-2xl font-bold">${selectedSegment.arpu}</p>
                  <p className="text-xs text-muted-foreground">ARPU</p>
                </div>
                <div className="p-3 bg-muted rounded-lg text-center">
                  <p className="text-2xl font-bold">{selectedSegment.churn}%</p>
                  <p className="text-xs text-muted-foreground">Churn</p>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-800 mb-1">Why This Matters</p>
                <p className="text-sm text-blue-700">{selectedSegment.whyMatters}</p>
              </div>

              <Button variant="outline" className="w-full">
                <Sparkles className="h-4 w-4 mr-2" />
                Ask AI to Explain Recent Changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
