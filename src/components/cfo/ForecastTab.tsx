import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, Printer, Share2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { ShareInvestorDialog } from "./ShareInvestorDialog";
import { ShareProformaDialog } from "./ShareProformaDialog";
import { useState } from "react";

interface ForecastTabProps {
  isReadOnly?: boolean;
  assumptions?: {
    avgSubscriptionPrice: number;
    monthlyUserGrowth: number;
    conversionRate: number;
    churnRate: number;
    hostReadCpm: number;
    announcerReadCpm: number;
    programmaticAudioCpm: number;
    videoAdsCpm: number;
    displayAdsCpm: number;
    creatorPayoutPercent: number;
    aiCostPerEpisode: number;
    storageCostPerGB: number;
    bandwidthCostPerGB: number;
  };
}

export const ForecastTab = ({ assumptions: providedAssumptions, isReadOnly = false }: ForecastTabProps) => {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [proformaType] = useState<'ai' | 'custom'>('ai'); // Default to AI for ForecastTab
  
  // Default assumptions
  const assumptions = providedAssumptions || {
    avgSubscriptionPrice: 19,
    monthlyUserGrowth: 15,
    conversionRate: 5,
    churnRate: 5,
    hostReadCpm: 25,
    announcerReadCpm: 18,
    programmaticAudioCpm: 12,
    videoAdsCpm: 15,
    displayAdsCpm: 8,
    creatorPayoutPercent: 70,
    aiCostPerEpisode: 2.5,
    storageCostPerGB: 0.023,
    bandwidthCostPerGB: 0.05,
  };
  
  // Market growth assumptions (research-based)
  const marketGrowth = {
    podcasting: 0.22, // 22% CAGR
    creatorEconomy: 0.28, // 28% CAGR
    aiTools: 0.35, // 35% CAGR
    digitalAds: 0.18, // 18% CAGR
  };

  // Calculate 3-year projections using assumptions
  const calculate3YearForecast = () => {
    const years = [2026, 2027, 2028];
    const forecast = [];

    let baseUsers = 50; // Starting users in Q1 2026
    const avgCPM = (assumptions.hostReadCpm + assumptions.announcerReadCpm + assumptions.videoAdsCpm) / 3;

    for (let i = 0; i < years.length; i++) {
      const year = years[i];
      const growthMultiplier = Math.pow(1 + assumptions.monthlyUserGrowth / 100, 12);
      
      // User growth based on assumptions
      const users = Math.floor(baseUsers * Math.pow(growthMultiplier, i));
      const paidUsers = Math.floor(users * (assumptions.conversionRate / 100));
      
      // Revenue calculations
      const subscriptionRevenue = paidUsers * assumptions.avgSubscriptionPrice * 12;
      
      // Ad revenue (assuming avg 4 episodes/month per creator)
      const avgImpressions = users * 4 * 1000; // 4 episodes * 1000 listeners
      const adRevenue = (avgImpressions * avgCPM / 1000) * 12;
      
      // Total revenue
      const totalRevenue = subscriptionRevenue + adRevenue;
      
      // Cost calculations
      const aiCosts = users * assumptions.aiCostPerEpisode * 4 * 12; // 4 episodes/month
      const storageCosts = users * 50 * assumptions.storageCostPerGB * 12; // 50GB avg per user
      const bandwidthCosts = avgImpressions * 0.5 * assumptions.bandwidthCostPerGB / 1000; // 0.5MB per listen
      const creatorPayouts = adRevenue * (assumptions.creatorPayoutPercent / 100);
      const supportCosts = users * 1.2 * 12; // $1.20/user/month
      const marketingCosts = (users * 0.2) * 45 * 12; // 20% churn replacement * $45 CAC
      
      const totalCosts = aiCosts + storageCosts + bandwidthCosts + creatorPayouts + supportCosts + marketingCosts;
      
      // Margins
      const grossProfit = totalRevenue - creatorPayouts;
      const grossMargin = (grossProfit / totalRevenue) * 100;
      const netProfit = totalRevenue - totalCosts;
      const netMargin = (netProfit / totalRevenue) * 100;
      
      // Metrics
      const arpu = totalRevenue / users / 12;
      const ltv = arpu * (1 / (assumptions.churnRate / 100));
      const cac = 45; // Marketing CAC
      const ltvCacRatio = ltv / cac;
      const paybackMonths = cac / arpu;

      forecast.push({
        year,
        users,
        paidUsers,
        subscriptionRevenue,
        adRevenue,
        totalRevenue,
        aiCosts,
        storageCosts,
        bandwidthCosts,
        creatorPayouts,
        supportCosts,
        marketingCosts,
        totalCosts,
        grossProfit,
        grossMargin,
        netProfit,
        netMargin,
        arpu,
        ltv,
        cac,
        ltvCacRatio,
        paybackMonths,
      });

      baseUsers = users;
    }

    return forecast;
  };

  const forecast = calculate3YearForecast();

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF();
      let yPos = 20;
      
      // Title
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("3-Year Financial Forecast (2026-2028)", 20, yPos);
      yPos += 8;
      
      // Subtitle
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text("Investment-ready pro forma using your custom assumptions", 20, yPos);
      yPos += 15;
      
      // Forecast Assumptions Section
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Forecast Assumptions", 20, yPos);
      yPos += 6;
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text("These values drive all projections below", 20, yPos);
      yPos += 10;
      
      // Assumptions grid
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text("Monthly User Growth", 20, yPos);
      doc.text("Conversion Rate", 70, yPos);
      doc.text("Churn Rate", 120, yPos);
      doc.text("Avg Subscription", 170, yPos);
      yPos += 4;
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(`${assumptions.monthlyUserGrowth}%`, 20, yPos);
      doc.text(`${assumptions.conversionRate}%`, 70, yPos);
      doc.text(`${assumptions.churnRate}%`, 120, yPos);
      doc.text(`$${assumptions.avgSubscriptionPrice}`, 170, yPos);
      yPos += 15;
      
      // Annual Summaries
      forecast.forEach((year, index) => {
        const xPos = 20 + (index * 60);
        const cardY = yPos;
        
        // Card background
        doc.setFillColor(248, 249, 250);
        doc.rect(xPos - 3, cardY - 3, 55, 50, 'F');
        
        // Year title
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(year.year.toString(), xPos, cardY + 5);
        
        // Description
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text("Annual financial summary", xPos, cardY + 10);
        
        // Total Revenue
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text("Total Revenue", xPos, cardY + 18);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(`$${Math.round(year.totalRevenue).toLocaleString()}`, xPos, cardY + 24);
        
        // Net Profit
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text("Net Profit", xPos, cardY + 31);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        const profitColor = year.netProfit >= 0 ? [34, 197, 94] : [239, 68, 68];
        doc.setTextColor(profitColor[0], profitColor[1], profitColor[2]);
        doc.text(`$${Math.round(year.netProfit).toLocaleString()}`, xPos, cardY + 37);
        
        // Metrics
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text(`Total Users: ${year.users.toLocaleString()}`, xPos, cardY + 43);
        doc.text(`Paid Users: ${year.paidUsers.toLocaleString()}`, xPos, cardY + 47);
      });
      
      yPos += 60;
      
      // Revenue Breakdown
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Revenue Breakdown", 20, yPos);
      yPos += 6;
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text("Annual revenue streams", 20, yPos);
      yPos += 10;
      
      // Table headers
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Year", 20, yPos);
      doc.text("Subscription", 80, yPos, { align: "right" });
      doc.text("Ad Revenue", 140, yPos, { align: "right" });
      doc.text("Total Revenue", 190, yPos, { align: "right" });
      yPos += 2;
      
      // Separator line
      doc.setDrawColor(200, 200, 200);
      doc.line(20, yPos, 190, yPos);
      yPos += 5;
      
      // Table data
      doc.setFont("helvetica", "normal");
      forecast.forEach((year) => {
        doc.text(year.year.toString(), 20, yPos);
        doc.text(`$${Math.round(year.subscriptionRevenue).toLocaleString()}`, 80, yPos, { align: "right" });
        doc.text(`$${Math.round(year.adRevenue).toLocaleString()}`, 140, yPos, { align: "right" });
        doc.setFont("helvetica", "bold");
        doc.text(`$${Math.round(year.totalRevenue).toLocaleString()}`, 190, yPos, { align: "right" });
        doc.setFont("helvetica", "normal");
        yPos += 6;
      });
      
      yPos += 10;
      
      // Key Metrics
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Key Financial Metrics", 20, yPos);
      yPos += 10;
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      
      forecast.forEach((year) => {
        doc.text(`${year.year}: Net Margin ${year.netMargin.toFixed(1)}% | LTV:CAC ${year.ltvCacRatio.toFixed(1)}:1 | Payback ${year.paybackMonths.toFixed(1)} months`, 20, yPos);
        yPos += 6;
      });
      
      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Generated by Seeksy Financial Models | ${new Date().toLocaleDateString()}`, 20, 285);
      
      doc.save("seeksy-3year-forecast.pdf");
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareInvestor = () => {
    setShareDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">3-Year Financial Forecast (2026-2028)</h2>
          <p className="text-muted-foreground mt-1">
            Investment-ready pro forma using your custom assumptions
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleDownloadPDF} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button onClick={handlePrint} variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          {!isReadOnly && (
            <Button onClick={handleShareInvestor} variant="default" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share with Investors
            </Button>
          )}
        </div>
      </div>

      {/* Key Assumptions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Forecast Assumptions</CardTitle>
          <CardDescription>These values drive all projections below</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">Monthly User Growth</span>
              <p className="text-lg font-semibold">{assumptions.monthlyUserGrowth}%</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Conversion Rate</span>
              <p className="text-lg font-semibold">{assumptions.conversionRate}%</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Churn Rate</span>
              <p className="text-lg font-semibold">{assumptions.churnRate}%</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Avg Subscription</span>
              <p className="text-lg font-semibold">${assumptions.avgSubscriptionPrice}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Annual Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {forecast.map((year) => (
          <Card key={year.year}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {year.year}
                <TrendingUp className="h-5 w-5 text-primary" />
              </CardTitle>
              <CardDescription>Annual financial summary</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-sm text-muted-foreground">Total Revenue</span>
                <p className="text-2xl font-bold">${Math.round(year.totalRevenue).toLocaleString()}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Net Profit</span>
                <p className="text-xl font-semibold text-primary">
                  ${Math.round(year.netProfit).toLocaleString()}
                </p>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Users</span>
                <span className="font-medium">{year.users.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Paid Users</span>
                <span className="font-medium">{year.paidUsers.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Net Margin</span>
                <Badge variant={year.netMargin > 0 ? "default" : "destructive"}>
                  {year.netMargin.toFixed(1)}%
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Tables */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="costs">Costs</TabsTrigger>
          <TabsTrigger value="margins">Margins & Metrics</TabsTrigger>
        </TabsList>

        {/* Revenue Breakdown */}
        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
              <CardDescription>Annual revenue streams</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Year</TableHead>
                    <TableHead className="text-right">Subscription</TableHead>
                    <TableHead className="text-right">Ad Revenue</TableHead>
                    <TableHead className="text-right">Total Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {forecast.map((year) => (
                    <TableRow key={year.year}>
                      <TableCell className="font-medium">{year.year}</TableCell>
                      <TableCell className="text-right">
                        ${Math.round(year.subscriptionRevenue).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        ${Math.round(year.adRevenue).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        ${Math.round(year.totalRevenue).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cost Breakdown */}
        <TabsContent value="costs">
          <Card>
            <CardHeader>
              <CardTitle>Cost Breakdown</CardTitle>
              <CardDescription>Annual operating costs</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Year</TableHead>
                    <TableHead className="text-right">AI Processing</TableHead>
                    <TableHead className="text-right">Infrastructure</TableHead>
                    <TableHead className="text-right">Creator Payouts</TableHead>
                    <TableHead className="text-right">Support</TableHead>
                    <TableHead className="text-right">Marketing</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {forecast.map((year) => (
                    <TableRow key={year.year}>
                      <TableCell className="font-medium">{year.year}</TableCell>
                      <TableCell className="text-right">
                        ${Math.round(year.aiCosts).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        ${Math.round(year.storageCosts + year.bandwidthCosts).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        ${Math.round(year.creatorPayouts).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        ${Math.round(year.supportCosts).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        ${Math.round(year.marketingCosts).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        ${Math.round(year.totalCosts).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Margins & Metrics */}
        <TabsContent value="margins">
          <Card>
            <CardHeader>
              <CardTitle>Margins & Key Metrics</CardTitle>
              <CardDescription>Profitability and unit economics</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Year</TableHead>
                    <TableHead className="text-right">Gross Margin</TableHead>
                    <TableHead className="text-right">Net Margin</TableHead>
                    <TableHead className="text-right">ARPU</TableHead>
                    <TableHead className="text-right">LTV</TableHead>
                    <TableHead className="text-right">LTV:CAC</TableHead>
                    <TableHead className="text-right">Payback (mo)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {forecast.map((year) => (
                    <TableRow key={year.year}>
                      <TableCell className="font-medium">{year.year}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">{year.grossMargin.toFixed(1)}%</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={year.netMargin > 0 ? "default" : "destructive"}>
                          {year.netMargin.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">${year.arpu.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${Math.round(year.ltv)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={year.ltvCacRatio >= 3 ? "default" : "secondary"}>
                          {year.ltvCacRatio.toFixed(1)}:1
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {year.paybackMonths.toFixed(1)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Market Growth Context */}
      <Card>
        <CardHeader>
          <CardTitle>Market Growth Context</CardTitle>
          <CardDescription>Industry trends supporting these projections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold text-primary">{(marketGrowth.podcasting * 100).toFixed(0)}%</p>
              <p className="text-sm text-muted-foreground mt-1">Podcasting CAGR</p>
              <p className="text-xs text-muted-foreground mt-1">Edison Research 2024</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold text-primary">{(marketGrowth.creatorEconomy * 100).toFixed(0)}%</p>
              <p className="text-sm text-muted-foreground mt-1">Creator Economy</p>
              <p className="text-xs text-muted-foreground mt-1">Goldman Sachs 2024</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold text-primary">{(marketGrowth.aiTools * 100).toFixed(0)}%</p>
              <p className="text-sm text-muted-foreground mt-1">AI Tools CAGR</p>
              <p className="text-xs text-muted-foreground mt-1">McKinsey 2024</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold text-primary">{(marketGrowth.digitalAds * 100).toFixed(0)}%</p>
              <p className="text-sm text-muted-foreground mt-1">Digital Ad Growth</p>
              <p className="text-xs text-muted-foreground mt-1">eMarketer 2024</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {!isReadOnly && <ShareProformaDialog open={shareDialogOpen} onOpenChange={setShareDialogOpen} proformaType={proformaType} />}
    </div>
  );
};
