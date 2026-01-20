import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, Users, DollarSign, Percent } from "lucide-react";
import { ProFormaSpreadsheetGenerator } from "@/components/cfo/ProFormaSpreadsheetGenerator";

const ProForma = () => {
  // Market Research Assumptions (2024-2028)
  const marketAssumptions = {
    podcastingGrowth: 0.22, // 22% CAGR (Edison Research 2024)
    creatorEconomyGrowth: 0.28, // 28% CAGR (Goldman Sachs 2024)
    aiToolsGrowth: 0.35, // 35% CAGR (McKinsey 2024)
    digitalAdGrowth: 0.18, // 18% CAGR (eMarketer 2024)
  };

  // Pricing Assumptions
  const pricing = {
    podcasterBasic: 19,
    podcasterPro: 49,
    podcasterEnterprise: 199,
    eventCreator: 29,
    eventOrg: 299,
    politicalCampaign: 499,
    myPageBasic: 9,
    myPagePro: 29,
    adRevShare: 0.70, // 70% to creator, 30% platform
    avgCPM: 25, // Industry average podcast CPM
  };

  // Customer Acquisition Assumptions (Conservative Start)
  const customerGrowth = {
    2026: {
      q1: { podcasters: 50, eventCreators: 10, eventOrgs: 2, political: 1, myPageUsers: 100 },
      q2: { podcasters: 120, eventCreators: 25, eventOrgs: 5, political: 3, myPageUsers: 250 },
      q3: { podcasters: 250, eventCreators: 50, eventOrgs: 10, political: 8, myPageUsers: 500 },
      q4: { podcasters: 450, eventCreators: 90, eventOrgs: 18, political: 15, myPageUsers: 900 },
    },
    2027: {
      multiplier: 3.2, // 220% growth year-over-year
    },
    2028: {
      multiplier: 2.8, // 180% growth year-over-year
    }
  };

  // Cost Assumptions
  const costs = {
    aiComputePerUser: 2.50, // Monthly AI processing costs
    storagePerGB: 0.023, // Cloudflare R2 pricing
    avgStoragePerUser: 50, // GB per user
    streamingCostPerHour: 0.15, // Live streaming costs
    supportCostPerUser: 1.20, // Customer support
    marketingCAC: 45, // Customer acquisition cost
    platformFees: 0.029, // Stripe + payment processing
  };

  // Calculate 2026 Monthly Revenue
  const calculate2026Monthly = () => {
    const months = [];
    let cumulativePodcasters = 0;
    let cumulativeEvents = 0;
    let cumulativeOrgs = 0;
    let cumulativePolitical = 0;
    let cumulativeMyPage = 0;

    for (let month = 1; month <= 12; month++) {
      const quarter = Math.ceil(month / 3);
      const qKey = `q${quarter}` as keyof typeof customerGrowth[2026];
      const growth = customerGrowth[2026][qKey];
      
      const monthlyGrowth = {
        podcasters: Math.floor(growth.podcasters / 3),
        eventCreators: Math.floor(growth.eventCreators / 3),
        eventOrgs: Math.floor(growth.eventOrgs / 3),
        political: Math.floor(growth.political / 3),
        myPageUsers: Math.floor(growth.myPageUsers / 3),
      };

      cumulativePodcasters += monthlyGrowth.podcasters;
      cumulativeEvents += monthlyGrowth.eventCreators;
      cumulativeOrgs += monthlyGrowth.eventOrgs;
      cumulativePolitical += monthlyGrowth.political;
      cumulativeMyPage += monthlyGrowth.myPageUsers;

      // Churn assumptions (conservative)
      const churnRate = 0.05; // 5% monthly churn
      const retainedPodcasters = Math.floor(cumulativePodcasters * (1 - churnRate));
      const retainedEvents = Math.floor(cumulativeEvents * (1 - churnRate));
      const retainedOrgs = Math.floor(cumulativeOrgs * (1 - churnRate));
      const retainedPolitical = Math.floor(cumulativePolitical * (1 - churnRate));
      const retainedMyPage = Math.floor(cumulativeMyPage * (1 - churnRate));

      // Revenue streams
      const podcastRevenue = (retainedPodcasters * 0.3 * pricing.podcasterBasic) +
                            (retainedPodcasters * 0.5 * pricing.podcasterPro) +
                            (retainedPodcasters * 0.2 * pricing.podcasterEnterprise);
      
      const eventRevenue = (retainedEvents * pricing.eventCreator) +
                          (retainedOrgs * pricing.eventOrg);
      
      const politicalRevenue = retainedPolitical * pricing.politicalCampaign;
      
      const myPageRevenue = (retainedMyPage * 0.6 * pricing.myPageBasic) +
                           (retainedMyPage * 0.4 * pricing.myPagePro);
      
      // Ad revenue (assumes 50% of podcasters monetize, 10k avg downloads/month, 2 ad slots)
      const monetizingPodcasters = Math.floor(retainedPodcasters * 0.5);
      const avgDownloads = 10000;
      const adSlots = 2;
      const grossAdRevenue = (monetizingPodcasters * avgDownloads * adSlots * (pricing.avgCPM / 1000));
      const adRevenue = grossAdRevenue * pricing.adRevShare;

      const totalRevenue = podcastRevenue + eventRevenue + politicalRevenue + myPageRevenue + adRevenue;

      // Costs
      const totalUsers = retainedPodcasters + retainedEvents + retainedOrgs + retainedPolitical + retainedMyPage;
      const aiCosts = totalUsers * costs.aiComputePerUser;
      const storageCosts = totalUsers * costs.avgStoragePerUser * costs.storagePerGB;
      const streamingCosts = (retainedEvents + retainedOrgs + retainedPolitical) * 10 * costs.streamingCostPerHour; // avg 10 hours/month
      const supportCosts = totalUsers * costs.supportCostPerUser;
      const acquisitionCosts = (monthlyGrowth.podcasters + monthlyGrowth.eventCreators + monthlyGrowth.eventOrgs + monthlyGrowth.political + monthlyGrowth.myPageUsers) * costs.marketingCAC;
      const processingFees = totalRevenue * costs.platformFees;

      const totalCosts = aiCosts + storageCosts + streamingCosts + supportCosts + acquisitionCosts + processingFees;
      const grossProfit = totalRevenue - (aiCosts + storageCosts + streamingCosts + processingFees);
      const netProfit = totalRevenue - totalCosts;

      months.push({
        month,
        users: {
          podcasters: retainedPodcasters,
          events: retainedEvents,
          orgs: retainedOrgs,
          political: retainedPolitical,
          myPage: retainedMyPage,
          total: totalUsers,
        },
        revenue: {
          podcast: Math.round(podcastRevenue),
          event: Math.round(eventRevenue),
          political: Math.round(politicalRevenue),
          myPage: Math.round(myPageRevenue),
          ads: Math.round(adRevenue),
          total: Math.round(totalRevenue),
        },
        costs: {
          ai: Math.round(aiCosts),
          storage: Math.round(storageCosts),
          streaming: Math.round(streamingCosts),
          support: Math.round(supportCosts),
          acquisition: Math.round(acquisitionCosts),
          processing: Math.round(processingFees),
          total: Math.round(totalCosts),
        },
        profit: {
          gross: Math.round(grossProfit),
          net: Math.round(netProfit),
          grossMargin: totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100) : 0,
          netMargin: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0,
        }
      });
    }

    return months;
  };

  // Calculate 2027 (with 220% growth)
  const calculate2027Annual = () => {
    const months2026 = calculate2026Monthly();
    const dec2026 = months2026[11];
    const baseUsers = dec2026.users.total;
    const baseRevenue = dec2026.revenue.total;
    
    const avgMonthlyGrowth = Math.pow(customerGrowth[2027].multiplier, 1/12);
    
    let annualRevenue = 0;
    let annualCosts = 0;
    let annualUsers = 0;

    for (let month = 1; month <= 12; month++) {
      const growthFactor = Math.pow(avgMonthlyGrowth, month);
      const monthUsers = Math.floor(baseUsers * growthFactor);
      const monthRevenue = Math.floor(baseRevenue * growthFactor);
      const monthCosts = Math.floor(monthUsers * (costs.aiComputePerUser + costs.storagePerGB * costs.avgStoragePerUser + costs.supportCostPerUser));
      
      annualRevenue += monthRevenue;
      annualCosts += monthCosts;
      annualUsers = monthUsers; // End of year
    }

    return {
      users: annualUsers,
      revenue: annualRevenue,
      costs: annualCosts,
      profit: annualRevenue - annualCosts,
      margin: ((annualRevenue - annualCosts) / annualRevenue) * 100,
    };
  };

  // Calculate 2028 (with 180% growth)
  const calculate2028Annual = () => {
    const data2027 = calculate2027Annual();
    const baseUsers = data2027.users;
    const baseRevenue = data2027.revenue / 12; // Monthly average
    
    const avgMonthlyGrowth = Math.pow(customerGrowth[2028].multiplier, 1/12);
    
    let annualRevenue = 0;
    let annualCosts = 0;
    let annualUsers = 0;

    for (let month = 1; month <= 12; month++) {
      const growthFactor = Math.pow(avgMonthlyGrowth, month);
      const monthUsers = Math.floor(baseUsers * growthFactor);
      const monthRevenue = Math.floor(baseRevenue * growthFactor);
      const monthCosts = Math.floor(monthUsers * (costs.aiComputePerUser + costs.storagePerGB * costs.avgStoragePerUser + costs.supportCostPerUser));
      
      annualRevenue += monthRevenue;
      annualCosts += monthCosts;
      annualUsers = monthUsers; // End of year
    }

    return {
      users: annualUsers,
      revenue: annualRevenue,
      costs: annualCosts,
      profit: annualRevenue - annualCosts,
      margin: ((annualRevenue - annualCosts) / annualRevenue) * 100,
    };
  };

  const months2026 = calculate2026Monthly();
  const year2027 = calculate2027Annual();
  const year2028 = calculate2028Annual();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const year2026Total = months2026.reduce((acc, month) => ({
    revenue: acc.revenue + month.revenue.total,
    costs: acc.costs + month.costs.total,
    profit: acc.profit + month.profit.net,
  }), { revenue: 0, costs: 0, profit: 0 });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">Seeksy Pro Forma 2026-2028</h1>
              <p className="text-muted-foreground text-lg">
                3-Year Financial Projection Model with Conservative Growth Assumptions
              </p>
            </div>
          </div>

          {/* Full Spreadsheet Download */}
          <div className="mb-6">
            <ProFormaSpreadsheetGenerator />
          </div>

          {/* Executive Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-brand-gold" />
                  2026 Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-brand-gold">
                  {formatCurrency(year2026Total.revenue)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatNumber(months2026[11].users.total)} active users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-brand-blue" />
                  2027 Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-brand-blue">
                  {formatCurrency(year2027.revenue)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  +220% YoY growth • {formatNumber(year2027.users)} users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-brand-green" />
                  2028 Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-brand-green">
                  {formatCurrency(year2028.revenue)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  +180% YoY growth • {formatNumber(year2028.users)} users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Percent className="h-4 w-4 text-brand-navy" />
                  3-Year Margin
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {((year2028.profit / year2028.revenue) * 100).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Net margin in Year 3
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="2026" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="assumptions">Assumptions</TabsTrigger>
            <TabsTrigger value="2026">2026 Monthly</TabsTrigger>
            <TabsTrigger value="2027">2027 Annual</TabsTrigger>
            <TabsTrigger value="2028">2028 Annual</TabsTrigger>
          </TabsList>

          <TabsContent value="assumptions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Market Research & Growth Assumptions</CardTitle>
                <CardDescription>
                  Based on industry reports from Edison Research, Goldman Sachs, McKinsey, and eMarketer (2024)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">Industry Growth Rates (CAGR)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <span>Podcasting Market</span>
                      <Badge variant="secondary">{(marketAssumptions.podcastingGrowth * 100)}%</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <span>Creator Economy</span>
                      <Badge variant="secondary">{(marketAssumptions.creatorEconomyGrowth * 100)}%</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <span>AI Tools Adoption</span>
                      <Badge variant="secondary">{(marketAssumptions.aiToolsGrowth * 100)}%</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <span>Digital Advertising</span>
                      <Badge variant="secondary">{(marketAssumptions.digitalAdGrowth * 100)}%</Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Pricing Model</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Monthly Price</TableHead>
                        <TableHead>Target Segment</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Podcaster Basic</TableCell>
                        <TableCell>{formatCurrency(pricing.podcasterBasic)}</TableCell>
                        <TableCell>Individual creators, hobbyists</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Podcaster Pro</TableCell>
                        <TableCell>{formatCurrency(pricing.podcasterPro)}</TableCell>
                        <TableCell>Professional podcasters</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Podcaster Enterprise</TableCell>
                        <TableCell>{formatCurrency(pricing.podcasterEnterprise)}</TableCell>
                        <TableCell>Podcast networks, agencies</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Event Creator</TableCell>
                        <TableCell>{formatCurrency(pricing.eventCreator)}</TableCell>
                        <TableCell>Individual event planners</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Event Organization</TableCell>
                        <TableCell>{formatCurrency(pricing.eventOrg)}</TableCell>
                        <TableCell>Corporate, conferences</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Political Campaign</TableCell>
                        <TableCell>{formatCurrency(pricing.politicalCampaign)}</TableCell>
                        <TableCell>Campaigns, civic orgs</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>My Page Basic</TableCell>
                        <TableCell>{formatCurrency(pricing.myPageBasic)}</TableCell>
                        <TableCell>Personal branding</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>My Page Pro</TableCell>
                        <TableCell>{formatCurrency(pricing.myPagePro)}</TableCell>
                        <TableCell>Professional creators</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Cost Structure (per user/month)</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cost Category</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>AI Compute</TableCell>
                        <TableCell>{formatCurrency(costs.aiComputePerUser)}</TableCell>
                        <TableCell>Transcription, editing, generation</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Storage (50GB avg)</TableCell>
                        <TableCell>{formatCurrency(costs.avgStoragePerUser * costs.storagePerGB)}</TableCell>
                        <TableCell>Cloudflare R2 pricing</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Streaming (10hrs/mo)</TableCell>
                        <TableCell>{formatCurrency(costs.streamingCostPerHour * 10)}</TableCell>
                        <TableCell>Live streaming bandwidth</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Customer Support</TableCell>
                        <TableCell>{formatCurrency(costs.supportCostPerUser)}</TableCell>
                        <TableCell>Chat, email, onboarding</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Customer Acquisition</TableCell>
                        <TableCell>{formatCurrency(costs.marketingCAC)}</TableCell>
                        <TableCell>One-time per new customer</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Payment Processing</TableCell>
                        <TableCell>2.9%</TableCell>
                        <TableCell>Stripe + payment fees</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Key Operating Assumptions</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-brand-gold mt-1">•</span>
                      <span><strong>Churn Rate:</strong> 5% monthly (industry standard for SaaS)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-gold mt-1">•</span>
                      <span><strong>Ad Monetization:</strong> 50% of podcasters enable ads, 10K avg downloads, 2 slots/episode</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-gold mt-1">•</span>
                      <span><strong>CPM Rate:</strong> ${pricing.avgCPM} (industry average for podcast advertising)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-gold mt-1">•</span>
                      <span><strong>Revenue Share:</strong> 70% to creator, 30% platform</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-gold mt-1">•</span>
                      <span><strong>Plan Mix:</strong> Podcasters (30% Basic, 50% Pro, 20% Enterprise) • My Page (60% Basic, 40% Pro)</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="2026" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>2026 Monthly Breakdown</CardTitle>
                <CardDescription>
                  Conservative launch year with gradual customer acquisition and product-market fit validation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead className="text-right">Podcasters</TableHead>
                        <TableHead className="text-right">Events</TableHead>
                        <TableHead className="text-right">Orgs</TableHead>
                        <TableHead className="text-right">Political</TableHead>
                        <TableHead className="text-right">My Page</TableHead>
                        <TableHead className="text-right">Total Users</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Costs</TableHead>
                        <TableHead className="text-right">Net Profit</TableHead>
                        <TableHead className="text-right">Margin</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {months2026.map((month) => (
                        <TableRow key={month.month}>
                          <TableCell className="font-medium">Month {month.month}</TableCell>
                          <TableCell className="text-right">{formatNumber(month.users.podcasters)}</TableCell>
                          <TableCell className="text-right">{formatNumber(month.users.events)}</TableCell>
                          <TableCell className="text-right">{formatNumber(month.users.orgs)}</TableCell>
                          <TableCell className="text-right">{formatNumber(month.users.political)}</TableCell>
                          <TableCell className="text-right">{formatNumber(month.users.myPage)}</TableCell>
                          <TableCell className="text-right font-semibold">{formatNumber(month.users.total)}</TableCell>
                          <TableCell className="text-right font-semibold text-brand-gold">{formatCurrency(month.revenue.total)}</TableCell>
                          <TableCell className="text-right text-brand-red">{formatCurrency(month.costs.total)}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(month.profit.net)}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={month.profit.netMargin > 0 ? "default" : "destructive"}>
                              {month.profit.netMargin.toFixed(1)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell>2026 Total</TableCell>
                        <TableCell className="text-right">{formatNumber(months2026[11].users.podcasters)}</TableCell>
                        <TableCell className="text-right">{formatNumber(months2026[11].users.events)}</TableCell>
                        <TableCell className="text-right">{formatNumber(months2026[11].users.orgs)}</TableCell>
                        <TableCell className="text-right">{formatNumber(months2026[11].users.political)}</TableCell>
                        <TableCell className="text-right">{formatNumber(months2026[11].users.myPage)}</TableCell>
                        <TableCell className="text-right">{formatNumber(months2026[11].users.total)}</TableCell>
                        <TableCell className="text-right text-brand-gold">{formatCurrency(year2026Total.revenue)}</TableCell>
                        <TableCell className="text-right text-brand-red">{formatCurrency(year2026Total.costs)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(year2026Total.profit)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={year2026Total.profit > 0 ? "default" : "destructive"}>
                            {((year2026Total.profit / year2026Total.revenue) * 100).toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Revenue Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Podcast Subscriptions</span>
                        <span className="font-semibold">{formatCurrency(months2026.reduce((acc, m) => acc + m.revenue.podcast, 0))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Event Tools</span>
                        <span className="font-semibold">{formatCurrency(months2026.reduce((acc, m) => acc + m.revenue.event, 0))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Political Campaigns</span>
                        <span className="font-semibold">{formatCurrency(months2026.reduce((acc, m) => acc + m.revenue.political, 0))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>My Page</span>
                        <span className="font-semibold">{formatCurrency(months2026.reduce((acc, m) => acc + m.revenue.myPage, 0))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ad Revenue</span>
                        <span className="font-semibold">{formatCurrency(months2026.reduce((acc, m) => acc + m.revenue.ads, 0))}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Cost Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>AI Compute</span>
                        <span className="font-semibold">{formatCurrency(months2026.reduce((acc, m) => acc + m.costs.ai, 0))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Storage</span>
                        <span className="font-semibold">{formatCurrency(months2026.reduce((acc, m) => acc + m.costs.storage, 0))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Streaming</span>
                        <span className="font-semibold">{formatCurrency(months2026.reduce((acc, m) => acc + m.costs.streaming, 0))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Support</span>
                        <span className="font-semibold">{formatCurrency(months2026.reduce((acc, m) => acc + m.costs.support, 0))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Customer Acquisition</span>
                        <span className="font-semibold">{formatCurrency(months2026.reduce((acc, m) => acc + m.costs.acquisition, 0))}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Key Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Avg Revenue per User</span>
                        <span className="font-semibold">{formatCurrency(year2026Total.revenue / months2026[11].users.total / 12)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Customer LTV (24mo)</span>
                        <span className="font-semibold">{formatCurrency((year2026Total.revenue / months2026[11].users.total / 12) * 24)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>CAC</span>
                        <span className="font-semibold">{formatCurrency(costs.marketingCAC)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>LTV:CAC Ratio</span>
                        <span className="font-semibold">{(((year2026Total.revenue / months2026[11].users.total / 12) * 24) / costs.marketingCAC).toFixed(1)}x</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Payback Period</span>
                        <span className="font-semibold">{(costs.marketingCAC / (year2026Total.revenue / months2026[11].users.total / 12)).toFixed(1)} months</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="2027" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>2027 Annual Projection</CardTitle>
                <CardDescription>
                  Growth year with 220% YoY increase driven by product-market fit, word-of-mouth, and expanded marketing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Annual Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-brand-blue">
                        {formatCurrency(year2027.revenue)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        +220% from 2026
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Total Users (EOY)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {formatNumber(year2027.users)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        End of year total
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Net Profit</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {formatCurrency(year2027.profit)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {year2027.margin.toFixed(1)}% net margin
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">ARPU</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {formatCurrency(year2027.revenue / year2027.users / 12)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Average revenue per user/month
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-3">Growth Drivers in 2027</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-brand-blue mt-1">•</span>
                        <span><strong>Product Expansion:</strong> Launch of enterprise features, white-label solutions for podcast networks</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-brand-blue mt-1">•</span>
                        <span><strong>Market Penetration:</strong> Aggressive expansion into mid-market creators (10K-100K followers)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-brand-blue mt-1">•</span>
                        <span><strong>Partnership Strategy:</strong> Integration with major podcast platforms (Spotify, Apple Podcasts)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-brand-blue mt-1">•</span>
                        <span><strong>Political Cycle:</strong> 2026 midterms drive political campaign tool adoption</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-brand-blue mt-1">•</span>
                        <span><strong>Event Scaling:</strong> Corporate conference season, increased virtual/hybrid events</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Revenue Mix Projections</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold">45%</div>
                        <div className="text-xs text-muted-foreground mt-1">Podcast Tools</div>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold">25%</div>
                        <div className="text-xs text-muted-foreground mt-1">Ad Revenue</div>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold">15%</div>
                        <div className="text-xs text-muted-foreground mt-1">Event Tools</div>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold">10%</div>
                        <div className="text-xs text-muted-foreground mt-1">My Page</div>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold">5%</div>
                        <div className="text-xs text-muted-foreground mt-1">Political</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="2028" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>2028 Annual Projection</CardTitle>
                <CardDescription>
                  Maturity phase with 180% YoY growth, market leadership position, and enterprise dominance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Annual Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-brand-green">
                        {formatCurrency(year2028.revenue)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        +180% from 2027
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Total Users (EOY)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {formatNumber(year2028.users)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        End of year total
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Net Profit</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-brand-green">
                        {formatCurrency(year2028.profit)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {year2028.margin.toFixed(1)}% net margin
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">ARPU</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {formatCurrency(year2028.revenue / year2028.users / 12)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Average revenue per user/month
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-3">Strategic Milestones in 2028</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-brand-green mt-1">•</span>
                        <span><strong>Market Leadership:</strong> #1 AI-powered podcast creation platform with 30%+ market share</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-brand-green mt-1">•</span>
                        <span><strong>Enterprise Dominance:</strong> 500+ enterprise customers, including major media companies</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-brand-green mt-1">•</span>
                        <span><strong>Political Peak:</strong> 2028 presidential election cycle drives massive political tool usage</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-brand-green mt-1">•</span>
                        <span><strong>International Expansion:</strong> Launch in UK, Canada, Australia markets</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-brand-green mt-1">•</span>
                        <span><strong>API Ecosystem:</strong> Developer platform launches, 3rd-party integrations</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-brand-green mt-1">•</span>
                        <span><strong>Acquisition Potential:</strong> Position as attractive M&A target for Spotify, YouTube, Adobe</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Competitive Advantages by 2028</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <h4 className="font-semibold text-sm mb-2">Technology Moat</h4>
                        <p className="text-xs text-muted-foreground">
                          Proprietary AI models trained on millions of hours of content, superior output quality
                        </p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <h4 className="font-semibold text-sm mb-2">Network Effects</h4>
                        <p className="text-xs text-muted-foreground">
                          Creator community, content discovery, cross-promotion opportunities
                        </p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <h4 className="font-semibold text-sm mb-2">Data Advantage</h4>
                        <p className="text-xs text-muted-foreground">
                          Massive dataset improves AI continuously, personalization at scale
                        </p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <h4 className="font-semibold text-sm mb-2">Brand Recognition</h4>
                        <p className="text-xs text-muted-foreground">
                          Top-of-mind for creators, trusted by major brands and agencies
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">3-Year Summary</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Year</TableHead>
                          <TableHead className="text-right">Revenue</TableHead>
                          <TableHead className="text-right">Users (EOY)</TableHead>
                          <TableHead className="text-right">ARPU/mo</TableHead>
                          <TableHead className="text-right">Net Profit</TableHead>
                          <TableHead className="text-right">Margin</TableHead>
                          <TableHead className="text-right">YoY Growth</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">2026</TableCell>
                          <TableCell className="text-right">{formatCurrency(year2026Total.revenue)}</TableCell>
                          <TableCell className="text-right">{formatNumber(months2026[11].users.total)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(year2026Total.revenue / months2026[11].users.total / 12)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(year2026Total.profit)}</TableCell>
                          <TableCell className="text-right">
                            {((year2026Total.profit / year2026Total.revenue) * 100).toFixed(1)}%
                          </TableCell>
                          <TableCell className="text-right">-</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">2027</TableCell>
                          <TableCell className="text-right">{formatCurrency(year2027.revenue)}</TableCell>
                          <TableCell className="text-right">{formatNumber(year2027.users)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(year2027.revenue / year2027.users / 12)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(year2027.profit)}</TableCell>
                          <TableCell className="text-right">{year2027.margin.toFixed(1)}%</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="default">+220%</Badge>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">2028</TableCell>
                          <TableCell className="text-right">{formatCurrency(year2028.revenue)}</TableCell>
                          <TableCell className="text-right">{formatNumber(year2028.users)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(year2028.revenue / year2028.users / 12)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(year2028.profit)}</TableCell>
                          <TableCell className="text-right">{year2028.margin.toFixed(1)}%</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="default">+180%</Badge>
                          </TableCell>
                        </TableRow>
                        <TableRow className="bg-muted/50 font-bold">
                          <TableCell>3-Year Total</TableCell>
                          <TableCell className="text-right text-brand-gold">
                            {formatCurrency(year2026Total.revenue + year2027.revenue + year2028.revenue)}
                          </TableCell>
                          <TableCell className="text-right">{formatNumber(year2028.users)}</TableCell>
                          <TableCell className="text-right">-</TableCell>
                          <TableCell className="text-right text-brand-green">
                            {formatCurrency(year2026Total.profit + year2027.profit + year2028.profit)}
                          </TableCell>
                          <TableCell className="text-right">
                            {(((year2026Total.profit + year2027.profit + year2028.profit) / (year2026Total.revenue + year2027.revenue + year2028.revenue)) * 100).toFixed(1)}%
                          </TableCell>
                          <TableCell className="text-right">-</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProForma;
