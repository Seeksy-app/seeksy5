import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SpreadsheetData {
  assumptions: any;
  forecast: any[];
  type: 'ai' | 'custom';
}

interface SpreadsheetViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: SpreadsheetData;
}

export function SpreadsheetViewerDialog({ open, onOpenChange, data }: SpreadsheetViewerDialogProps) {
  const { assumptions, forecast } = data;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Group forecast by year
  const year1Data = forecast.slice(0, 12);
  const year2Data = forecast.slice(12, 24);
  const year3Data = forecast.slice(24, 36);

  // Calculate annual summaries
  const calculateAnnualSummary = (yearData: any[]) => {
    return {
      revenue: yearData.reduce((sum, m) => sum + m.totalRevenue, 0),
      costs: yearData.reduce((sum, m) => sum + m.totalCosts, 0),
      profit: yearData.reduce((sum, m) => sum + m.netProfit, 0),
      users: yearData[yearData.length - 1].totalUsers,
    };
  };

  const year1Summary = calculateAnnualSummary(year1Data);
  const year2Summary = calculateAnnualSummary(year2Data);
  const year3Summary = calculateAnnualSummary(year3Data);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Financial Spreadsheet - {data.type === 'ai' ? 'AI-Generated' : 'Custom'} Pro Forma</span>
          </DialogTitle>
          <DialogDescription>
            Interactive view of all financial data and assumptions
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-full pr-4">
          <Tabs defaultValue="executive" className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="executive">Executive</TabsTrigger>
              <TabsTrigger value="assumptions">Assumptions</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="annual">Annual</TabsTrigger>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="costs">Costs</TabsTrigger>
              <TabsTrigger value="metrics">Metrics</TabsTrigger>
            </TabsList>

            {/* Executive Summary */}
            <TabsContent value="executive" className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Year 1 Revenue</p>
                  <p className="text-2xl font-bold">{formatCurrency(year1Summary.revenue)}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Year 2 Revenue</p>
                  <p className="text-2xl font-bold">{formatCurrency(year2Summary.revenue)}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Year 3 Revenue</p>
                  <p className="text-2xl font-bold">{formatCurrency(year3Summary.revenue)}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Year 1 Net Profit</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(year1Summary.profit)}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Year 2 Net Profit</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(year2Summary.profit)}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Year 3 Net Profit</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(year3Summary.profit)}</p>
                </div>
              </div>
            </TabsContent>

            {/* Assumptions */}
            <TabsContent value="assumptions">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="font-semibold bg-muted/50">
                    <TableCell colSpan={3}>Pricing</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Podcaster</TableCell>
                    <TableCell>Basic</TableCell>
                    <TableCell className="text-right">{formatCurrency(assumptions.podcasterBasicPrice)}/mo</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Podcaster</TableCell>
                    <TableCell>Pro</TableCell>
                    <TableCell className="text-right">{formatCurrency(assumptions.podcasterProPrice)}/mo</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Podcaster</TableCell>
                    <TableCell>Enterprise</TableCell>
                    <TableCell className="text-right">{formatCurrency(assumptions.podcasterEnterprisePrice)}/mo</TableCell>
                  </TableRow>
                  <TableRow className="font-semibold bg-muted/50">
                    <TableCell colSpan={3}>Growth Rates</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Podcaster</TableCell>
                    <TableCell>Monthly Growth</TableCell>
                    <TableCell className="text-right">{assumptions.podcasterGrowthRate}%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>My Page</TableCell>
                    <TableCell>Monthly Growth</TableCell>
                    <TableCell className="text-right">{assumptions.myPageGrowthRate}%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>All Users</TableCell>
                    <TableCell>Monthly Churn</TableCell>
                    <TableCell className="text-right">{assumptions.monthlyChurnRate}%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TabsContent>

            {/* Monthly Forecast */}
            <TabsContent value="monthly">
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">Users</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Costs</TableHead>
                      <TableHead className="text-right">Profit</TableHead>
                      <TableHead className="text-right">Margin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {forecast.map((month) => (
                      <TableRow key={month.month}>
                        <TableCell>Month {month.month}</TableCell>
                        <TableCell className="text-right">{month.totalUsers}</TableCell>
                        <TableCell className="text-right">{formatCurrency(month.totalRevenue)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(month.totalCosts)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(month.netProfit)}</TableCell>
                        <TableCell className="text-right">{formatPercent(month.netMargin)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>

            {/* Annual Summary */}
            <TabsContent value="annual">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Year</TableHead>
                    <TableHead className="text-right">Total Users</TableHead>
                    <TableHead className="text-right">Annual Revenue</TableHead>
                    <TableHead className="text-right">Annual Costs</TableHead>
                    <TableHead className="text-right">Net Profit</TableHead>
                    <TableHead className="text-right">Margin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-semibold">Year 1 (2026)</TableCell>
                    <TableCell className="text-right">{year1Summary.users}</TableCell>
                    <TableCell className="text-right">{formatCurrency(year1Summary.revenue)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(year1Summary.costs)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(year1Summary.profit)}</TableCell>
                    <TableCell className="text-right">
                      {formatPercent((year1Summary.profit / year1Summary.revenue) * 100)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold">Year 2 (2027)</TableCell>
                    <TableCell className="text-right">{year2Summary.users}</TableCell>
                    <TableCell className="text-right">{formatCurrency(year2Summary.revenue)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(year2Summary.costs)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(year2Summary.profit)}</TableCell>
                    <TableCell className="text-right">
                      {formatPercent((year2Summary.profit / year2Summary.revenue) * 100)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold">Year 3 (2028)</TableCell>
                    <TableCell className="text-right">{year3Summary.users}</TableCell>
                    <TableCell className="text-right">{formatCurrency(year3Summary.revenue)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(year3Summary.costs)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(year3Summary.profit)}</TableCell>
                    <TableCell className="text-right">
                      {formatPercent((year3Summary.profit / year3Summary.revenue) * 100)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TabsContent>

            {/* Revenue Breakdown */}
            <TabsContent value="revenue">
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">Podcaster</TableHead>
                      <TableHead className="text-right">Event Creator</TableHead>
                      <TableHead className="text-right">My Page</TableHead>
                      <TableHead className="text-right">Ad Revenue</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {forecast.map((month) => (
                      <TableRow key={month.month}>
                        <TableCell>Month {month.month}</TableCell>
                        <TableCell className="text-right">{formatCurrency(month.podcasterRevenue)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(month.eventCreatorRevenue)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(month.myPageRevenue)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(month.adRevenuePlatform)}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(month.totalRevenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>

            {/* Cost Breakdown */}
            <TabsContent value="costs">
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">AI Costs</TableHead>
                      <TableHead className="text-right">Storage</TableHead>
                      <TableHead className="text-right">Streaming</TableHead>
                      <TableHead className="text-right">Marketing</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {forecast.map((month) => (
                      <TableRow key={month.month}>
                        <TableCell>Month {month.month}</TableCell>
                        <TableCell className="text-right">{formatCurrency(month.aiCosts)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(month.storageCosts)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(month.streamingCosts)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(month.marketingCosts)}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(month.totalCosts)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>

            {/* Unit Economics */}
            <TabsContent value="metrics">
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">ARPU</TableHead>
                      <TableHead className="text-right">CAC</TableHead>
                      <TableHead className="text-right">LTV</TableHead>
                      <TableHead className="text-right">LTV:CAC</TableHead>
                      <TableHead className="text-right">Gross Margin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {forecast.map((month) => {
                      const arpu = month.totalUsers > 0 ? month.totalRevenue / month.totalUsers : 0;
                      const ltv = arpu * (1 / (assumptions.monthlyChurnRate / 100));
                      const ltvCac = assumptions.marketingCAC > 0 ? ltv / assumptions.marketingCAC : 0;
                      return (
                        <TableRow key={month.month}>
                          <TableCell>Month {month.month}</TableCell>
                          <TableCell className="text-right">{formatCurrency(arpu)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(assumptions.marketingCAC)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(ltv)}</TableCell>
                          <TableCell className="text-right">{ltvCac.toFixed(2)}x</TableCell>
                          <TableCell className="text-right">{formatPercent(month.grossMargin)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
