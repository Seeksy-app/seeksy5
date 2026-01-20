import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  TrendingUp, 
  DollarSign, 
  Target, 
  Users, 
  Plus, 
  Download, 
  Copy,
  Trash2,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { getRateDeskView, formatCurrency, formatNumber, InventoryUnitWithPricing } from "@/lib/ads/salesPricingEngine";

interface ProposalLineItem {
  id: string;
  name: string;
  type: string;
  placement: string;
  cpm: number;
  impressions: number;
  total: number;
}

export default function AdminRateDesk() {
  const [scenario, setScenario] = useState("base");
  const [window, setWindow] = useState("30d");
  const [loading, setLoading] = useState(true);
  const [rateDeskData, setRateDeskData] = useState<Awaited<ReturnType<typeof getRateDeskView>> | null>(null);
  const [proposalItems, setProposalItems] = useState<ProposalLineItem[]>([]);
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    loadRateDeskData();
  }, [scenario]);

  const loadRateDeskData = async () => {
    setLoading(true);
    try {
      const data = await getRateDeskView({ scenarioSlug: scenario });
      setRateDeskData(data);
    } catch (error) {
      console.error("Failed to load rate desk data:", error);
      toast.error("Failed to load rate desk data");
    } finally {
      setLoading(false);
    }
  };

  const addToProposal = (unit: InventoryUnitWithPricing) => {
    const lineItem: ProposalLineItem = {
      id: unit.id,
      name: unit.name,
      type: unit.type,
      placement: unit.placement,
      cpm: unit.recommended_cpm,
      impressions: unit.expected_monthly_impressions,
      total: (unit.expected_monthly_impressions / 1000) * unit.recommended_cpm,
    };

    setProposalItems([...proposalItems, lineItem]);
    toast.success(`Added ${unit.name} to proposal`);
  };

  const removeFromProposal = (id: string) => {
    setProposalItems(proposalItems.filter(item => item.id !== id));
  };

  const updateProposalItem = (id: string, field: 'cpm' | 'impressions', value: number) => {
    setProposalItems(proposalItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        updated.total = (updated.impressions / 1000) * updated.cpm;
        return updated;
      }
      return item;
    }));
  };

  const copyProposalToClipboard = () => {
    const proposalText = proposalItems.map(item => 
      `${item.name} - ${formatCurrency(item.cpm)} CPM x ${formatNumber(item.impressions)} impressions = ${formatCurrency(item.total)}`
    ).join('\n');
    
    const totals = calculateProposalTotals();
    const fullText = `SEEKSY AD PROPOSAL\n\n${proposalText}\n\nSubtotal: ${formatCurrency(totals.subtotal)}\nSeesky Revenue: ${formatCurrency(totals.seeksyRevenue)}\nCreator Payouts: ${formatCurrency(totals.creatorPayouts)}`;
    
    navigator.clipboard.writeText(fullText);
    toast.success("Proposal copied to clipboard");
  };

  const downloadProposalCSV = () => {
    const headers = "Item,Type,Placement,CPM,Impressions,Total\n";
    const rows = proposalItems.map(item => 
      `"${item.name}","${item.type}","${item.placement}",${item.cpm},${item.impressions},${item.total.toFixed(2)}`
    ).join('\n');
    
    const totals = calculateProposalTotals();
    const footer = `\n\nSubtotal,,,,${totals.subtotal.toFixed(2)}\nSeesky Revenue,,,,${totals.seeksyRevenue.toFixed(2)}\nCreator Payouts,,,,${totals.creatorPayouts.toFixed(2)}`;
    
    const csvContent = headers + rows + footer;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `seeksy-ad-proposal-${Date.now()}.csv`;
    link.click();
    toast.success("Proposal downloaded");
  };

  const calculateProposalTotals = () => {
    const subtotal = proposalItems.reduce((sum, item) => sum + item.total, 0);
    const seeksyRevenue = subtotal * 0.3; // Platform share
    const creatorPayouts = subtotal * 0.7; // Creator share
    return { subtotal, seeksyRevenue, creatorPayouts };
  };

  const getSummaryMetric = (metric: keyof typeof rateDeskData.summary) => {
    if (!rateDeskData) return 0;
    
    const metricsByWindow = {
      "30d": {
        impressions: rateDeskData.summary.total_sellable_impressions_30d,
        spend: rateDeskData.summary.potential_gross_spend_30d,
        revenue: rateDeskData.summary.seeksy_revenue_30d,
      },
      "90d": {
        impressions: rateDeskData.summary.total_sellable_impressions_90d,
        spend: rateDeskData.summary.potential_gross_spend_90d,
        revenue: rateDeskData.summary.seeksy_revenue_90d,
      },
      "12m": {
        impressions: rateDeskData.summary.total_sellable_impressions_12m,
        spend: rateDeskData.summary.potential_gross_spend_12m,
        revenue: rateDeskData.summary.seeksy_revenue_12m,
      },
    };

    if (metric === 'total_sellable_impressions_30d') return metricsByWindow[window as keyof typeof metricsByWindow].impressions;
    if (metric === 'potential_gross_spend_30d') return metricsByWindow[window as keyof typeof metricsByWindow].spend;
    if (metric === 'seeksy_revenue_30d') return metricsByWindow[window as keyof typeof metricsByWindow].revenue;
    
    return rateDeskData.summary[metric];
  };

  const filteredInventory = rateDeskData?.inventory.filter(unit => 
    filterType === "all" || unit.type === filterType
  ) || [];

  const proposalTotals = calculateProposalTotals();

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading rate desk...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Sales Rate Desk</h1>
          <p className="text-muted-foreground mt-2">
            Pricing and proposal tool based on financial models
          </p>
        </div>
      </div>

      {/* Filters & Scenario Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Scenario & Window</CardTitle>
          <CardDescription>Select scenario and time window for pricing calculations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Scenario</Label>
              <Select value={scenario} onValueChange={setScenario}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conservative">Conservative</SelectItem>
                  <SelectItem value="base">Base</SelectItem>
                  <SelectItem value="aggressive">Aggressive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Time Window</Label>
              <Select value={window} onValueChange={setWindow}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30d">Next 30 Days</SelectItem>
                  <SelectItem value="90d">Next Quarter</SelectItem>
                  <SelectItem value="12m">Next 12 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Filter by Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="podcast">Podcast</SelectItem>
                  <SelectItem value="livestream">Livestream</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="creator_page">Creator Page</SelectItem>
                  <SelectItem value="newsletter">Newsletter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sellable Impressions</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(getSummaryMetric('total_sellable_impressions_30d'))}
            </div>
            <p className="text-xs text-muted-foreground">
              {window === "30d" ? "Next 30 days" : window === "90d" ? "Next quarter" : "Next 12 months"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potential Gross Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(getSummaryMetric('potential_gross_spend_30d'))}
            </div>
            <p className="text-xs text-muted-foreground">
              Total advertiser spend
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Seeksy Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(getSummaryMetric('seeksy_revenue_30d'))}
            </div>
            <p className="text-xs text-muted-foreground">
              Platform share (30%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Recommended CPM</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(rateDeskData?.summary.average_recommended_cpm || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all inventory
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inventory Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ad Inventory</CardTitle>
            <CardDescription>Available ad placements with recommended pricing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Inventory Unit</TableHead>
                    <TableHead className="text-right">Monthly Impressions</TableHead>
                    <TableHead className="text-right">Recommended CPM</TableHead>
                    <TableHead className="text-right">Floor / Ceiling</TableHead>
                    <TableHead className="text-right">Potential Revenue</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((unit) => {
                    const revenueField = window === "30d" ? unit.potential_revenue_30d : 
                                        window === "90d" ? unit.potential_revenue_90d : 
                                        unit.potential_revenue_12m;
                    
                    return (
                      <TableRow key={unit.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{unit.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {unit.type} • {unit.placement}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{formatNumber(unit.expected_monthly_impressions)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(unit.recommended_cpm)}</TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {formatCurrency(unit.adjusted_floor_cpm)} - {formatCurrency(unit.adjusted_ceiling_cpm)}
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(revenueField)}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              unit.health_status === "Premium" ? "default" :
                              unit.health_status === "Healthy" ? "secondary" :
                              "outline"
                            }
                          >
                            {unit.health_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => addToProposal(unit)}
                            disabled={proposalItems.some(item => item.id === unit.id)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Proposal Builder */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Proposal Builder</CardTitle>
            <CardDescription>Build custom proposals for advertisers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {proposalItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Plus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No items added yet</p>
                <p className="text-sm">Add inventory units to build a proposal</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {proposalItems.map((item) => (
                    <div key={item.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{item.name}</div>
                          <div className="text-xs text-muted-foreground">{item.type}</div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => removeFromProposal(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">CPM</Label>
                          <Input
                            type="number"
                            value={item.cpm}
                            onChange={(e) => updateProposalItem(item.id, 'cpm', parseFloat(e.target.value))}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Impressions</Label>
                          <Input
                            type="number"
                            value={item.impressions}
                            onChange={(e) => updateProposalItem(item.id, 'impressions', parseInt(e.target.value))}
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                      <div className="text-right text-sm font-medium">
                        {formatCurrency(item.total)}
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Proposal Subtotal</span>
                    <span className="font-medium">{formatCurrency(proposalTotals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Seeksy Revenue (30%)</span>
                    <span>{formatCurrency(proposalTotals.seeksyRevenue)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Creator Payouts (70%)</span>
                    <span>{formatCurrency(proposalTotals.creatorPayouts)}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Button className="w-full" size="sm" onClick={copyProposalToClipboard}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Summary
                  </Button>
                  <Button className="w-full" size="sm" variant="outline" onClick={downloadProposalCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    Download CSV
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Assistant */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Ask Sales AI Assistant
          </CardTitle>
          <CardDescription>
            Get pricing recommendations and insights from the CFO AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Example questions:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>"What CPM should we quote for a $50K quarterly buy in the Aggressive scenario?"</li>
              <li>"Which inventory is underpriced in the Base scenario?"</li>
              <li>"If we sell 80% of March impressions, how much Seeksy revenue is generated?"</li>
              <li>"What's our average CPM across all livestream placements?"</li>
            </ul>
            <p className="mt-4">
              Use the <strong>Seeksy AI Chat Widget</strong> (bottom right) to ask these questions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
