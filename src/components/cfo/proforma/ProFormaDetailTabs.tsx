import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { 
  RevenueModel, COGSModel, OpExModel, HeadcountRow, CFOAssumptions, KeyMetrics 
} from '@/hooks/useCFOMasterModel';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, Legend
} from 'recharts';

interface ProFormaDetailTabsProps {
  revenue: RevenueModel;
  cogs: COGSModel;
  opex: OpExModel;
  headcount: HeadcountRow[];
  assumptions: CFOAssumptions;
  metrics: KeyMetrics;
  years: number[];
}

const formatCurrency = (value: number, compact = true) => {
  if (compact) {
    if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
};

export function ProFormaDetailTabs({
  revenue,
  cogs,
  opex,
  headcount,
  assumptions,
  metrics,
  years,
}: ProFormaDetailTabsProps) {
  // Build chart data from metrics
  const incomeStatementData = years.map((year, i) => ({
    year,
    revenue: metrics.totalRevenue[i],
    cogs: metrics.totalCogs[i],
    grossProfit: metrics.grossProfit[i],
    opex: metrics.totalOpex[i],
    ebitda: metrics.ebitda[i],
  }));

  const revenueDetailData = years.map((year, i) => ({
    year,
    subscriptions: revenue.saasSubscriptions[i],
    aiTools: revenue.aiProductionTools[i],
    advertising: revenue.advertisingMarketplace[i],
    enterprise: revenue.enterpriseLicensing[i],
  }));

  const opexDetailData = years.map((year, i) => ({
    year,
    engineering: opex.productEngineering[i],
    salesMarketing: opex.salesMarketing[i],
    gna: opex.generalAdmin[i],
    customerSuccess: opex.customerSuccess[i],
    contractors: opex.contractorsAI[i],
  }));

  const headcountData = years.map((year, i) => {
    const field = `year${i + 1}` as 'year1' | 'year2' | 'year3';
    return {
      year,
      ...headcount.reduce((acc, row) => ({
        ...acc,
        [row.department]: row[field],
      }), {}),
      total: headcount.reduce((sum, row) => sum + row[field], 0),
    };
  });

  return (
    <Tabs defaultValue="statements" className="w-full">
      <TabsList className="bg-muted border border-border p-1 flex-wrap h-auto gap-1">
        <TabsTrigger value="statements">Financial Statements</TabsTrigger>
        <TabsTrigger value="revenue">Revenue Detail</TabsTrigger>
        <TabsTrigger value="opex">OpEx Detail</TabsTrigger>
        <TabsTrigger value="headcount">Headcount</TabsTrigger>
        <TabsTrigger value="assumptions">Assumptions Sheet</TabsTrigger>
      </TabsList>

      {/* Financial Statements Tab */}
      <TabsContent value="statements" className="space-y-6 mt-6">
        {/* Income Statement */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              Income Statement (3-Year)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium text-muted-foreground w-48"></th>
                  {years.map(year => (
                    <th key={year} className="text-right py-2 font-medium text-muted-foreground">{year}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-muted/30">
                  <td className="py-2 font-medium">Revenue</td>
                  {metrics.totalRevenue.map((v, i) => (
                    <td key={i} className="py-2 text-right font-semibold text-foreground">{formatCurrency(v)}</td>
                  ))}
                </tr>
                <tr className="border-b hover:bg-muted/30">
                  <td className="py-2 text-muted-foreground pl-4">Cost of Goods Sold</td>
                  {metrics.totalCogs.map((v, i) => (
                    <td key={i} className="py-2 text-right text-red-600">({formatCurrency(v)})</td>
                  ))}
                </tr>
                <tr className="border-b bg-muted/30">
                  <td className="py-2 font-semibold">Gross Profit</td>
                  {metrics.grossProfit.map((v, i) => (
                    <td key={i} className="py-2 text-right font-semibold">{formatCurrency(v)}</td>
                  ))}
                </tr>
                <tr className="border-b hover:bg-muted/30">
                  <td className="py-2 text-muted-foreground text-xs pl-4">Gross Margin</td>
                  {metrics.grossMargin.map((v, i) => (
                    <td key={i} className="py-2 text-right text-xs text-muted-foreground">{v.toFixed(1)}%</td>
                  ))}
                </tr>
                <tr className="border-b hover:bg-muted/30">
                  <td className="py-2 text-muted-foreground pl-4">Operating Expenses</td>
                  {metrics.totalOpex.map((v, i) => (
                    <td key={i} className="py-2 text-right text-red-600">({formatCurrency(v)})</td>
                  ))}
                </tr>
                <tr className="bg-gradient-to-r from-emerald-50 to-transparent dark:from-emerald-950/30">
                  <td className="py-3 font-bold text-base">EBITDA</td>
                  {metrics.ebitda.map((v, i) => (
                    <td key={i} className={cn("py-3 text-right font-bold text-base", v >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                      {formatCurrency(v)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Balance Sheet (Simplified) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-500" />
              Balance Sheet (Simplified)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium text-muted-foreground w-48"></th>
                  {years.map(year => (
                    <th key={year} className="text-right py-2 font-medium text-muted-foreground">{year}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {years.map((_, i) => {
                  const cumEbitda = metrics.ebitda.slice(0, i + 1).reduce((a, b) => a + b, 0);
                  const cash = 500000 + cumEbitda;
                  const ar = metrics.totalRevenue[i] * 0.08;
                  const liabilities = metrics.totalOpex[i] * 0.1;
                  const equity = cash + ar - liabilities;
                  
                  return null; // We'll render rows below
                })}
                <tr className="border-b hover:bg-muted/30">
                  <td className="py-2 font-medium">Cash</td>
                  {years.map((_, i) => {
                    const cumEbitda = metrics.ebitda.slice(0, i + 1).reduce((a, b) => a + b, 0);
                    const cash = 500000 + cumEbitda;
                    return <td key={i} className="py-2 text-right font-semibold text-emerald-600">{formatCurrency(cash)}</td>;
                  })}
                </tr>
                <tr className="border-b hover:bg-muted/30">
                  <td className="py-2 text-muted-foreground pl-4">Accounts Receivable</td>
                  {metrics.totalRevenue.map((v, i) => (
                    <td key={i} className="py-2 text-right">{formatCurrency(v * 0.08)}</td>
                  ))}
                </tr>
                <tr className="border-b hover:bg-muted/30">
                  <td className="py-2 text-muted-foreground pl-4">Liabilities</td>
                  {metrics.totalOpex.map((v, i) => (
                    <td key={i} className="py-2 text-right text-red-600">({formatCurrency(v * 0.1)})</td>
                  ))}
                </tr>
                <tr className="bg-muted/30">
                  <td className="py-2 font-semibold">Equity</td>
                  {years.map((_, i) => {
                    const cumEbitda = metrics.ebitda.slice(0, i + 1).reduce((a, b) => a + b, 0);
                    const cash = 500000 + cumEbitda;
                    const ar = metrics.totalRevenue[i] * 0.08;
                    const liabilities = metrics.totalOpex[i] * 0.1;
                    const equity = cash + ar - liabilities;
                    return <td key={i} className="py-2 text-right font-semibold">{formatCurrency(equity)}</td>;
                  })}
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Cash Flow Statement */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              Cash Flow Statement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium text-muted-foreground w-48"></th>
                  {years.map(year => (
                    <th key={year} className="text-right py-2 font-medium text-muted-foreground">{year}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-muted/30">
                  <td className="py-2 font-medium">Net Income (EBITDA)</td>
                  {metrics.ebitda.map((v, i) => (
                    <td key={i} className={cn("py-2 text-right", v >= 0 ? 'text-foreground' : 'text-red-600')}>{formatCurrency(v)}</td>
                  ))}
                </tr>
                <tr className="border-b hover:bg-muted/30">
                  <td className="py-2 text-muted-foreground pl-4">+ D&A</td>
                  {metrics.totalRevenue.map((v, i) => (
                    <td key={i} className="py-2 text-right">{formatCurrency(v * 0.02)}</td>
                  ))}
                </tr>
                <tr className="border-b hover:bg-muted/30">
                  <td className="py-2 text-muted-foreground pl-4">+/– Working Capital Change</td>
                  {metrics.totalRevenue.map((v, i) => {
                    const wcChange = i > 0 
                      ? (v - metrics.totalRevenue[i - 1]) * 0.05 
                      : v * 0.05;
                    return <td key={i} className="py-2 text-right text-red-600">({formatCurrency(wcChange)})</td>;
                  })}
                </tr>
                <tr className="bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-950/30">
                  <td className="py-3 font-bold">Free Cash Flow</td>
                  {metrics.ebitda.map((e, i) => {
                    const da = metrics.totalRevenue[i] * 0.02;
                    const wcChange = i > 0 
                      ? (metrics.totalRevenue[i] - metrics.totalRevenue[i - 1]) * 0.05 
                      : metrics.totalRevenue[i] * 0.05;
                    const fcf = e + da - wcChange;
                    return <td key={i} className={cn("py-3 text-right font-bold", fcf >= 0 ? 'text-emerald-600' : 'text-red-600')}>{formatCurrency(fcf)}</td>;
                  })}
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Revenue Detail Tab */}
      <TabsContent value="revenue" className="space-y-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Stream (3-Year)</CardTitle>
            <CardDescription>Breakdown of revenue sources</CardDescription>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm mb-6">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium text-muted-foreground">Revenue Stream</th>
                  {years.map(year => (
                    <th key={year} className="text-right py-2 font-medium text-muted-foreground">{year}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-muted/30">
                  <td className="py-2">SaaS Subscriptions</td>
                  {revenue.saasSubscriptions.map((v, i) => (
                    <td key={i} className="py-2 text-right">{formatCurrency(v)}</td>
                  ))}
                </tr>
                <tr className="border-b hover:bg-muted/30">
                  <td className="py-2">AI Production Tools</td>
                  {revenue.aiProductionTools.map((v, i) => (
                    <td key={i} className="py-2 text-right">{formatCurrency(v)}</td>
                  ))}
                </tr>
                <tr className="border-b hover:bg-muted/30">
                  <td className="py-2">Advertising Marketplace</td>
                  {revenue.advertisingMarketplace.map((v, i) => (
                    <td key={i} className="py-2 text-right">{formatCurrency(v)}</td>
                  ))}
                </tr>
                <tr className="border-b hover:bg-muted/30">
                  <td className="py-2">Enterprise Licensing</td>
                  {revenue.enterpriseLicensing.map((v, i) => (
                    <td key={i} className="py-2 text-right">{formatCurrency(v)}</td>
                  ))}
                </tr>
                <tr className="bg-muted/30 font-semibold">
                  <td className="py-2">Total Revenue</td>
                  {metrics.totalRevenue.map((v, i) => (
                    <td key={i} className="py-2 text-right">{formatCurrency(v)}</td>
                  ))}
                </tr>
              </tbody>
            </table>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueDetailData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={(v) => formatCurrency(v)} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend />
                  <Bar dataKey="subscriptions" name="Subscriptions" stackId="a" fill="hsl(var(--primary))" />
                  <Bar dataKey="aiTools" name="AI Tools" stackId="a" fill="hsl(220, 70%, 60%)" />
                  <Bar dataKey="advertising" name="Advertising" stackId="a" fill="hsl(150, 60%, 50%)" />
                  <Bar dataKey="enterprise" name="Enterprise" stackId="a" fill="hsl(280, 60%, 60%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* OpEx Detail Tab */}
      <TabsContent value="opex" className="space-y-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Operating Expenses (3-Year)</CardTitle>
            <CardDescription>Breakdown by department</CardDescription>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm mb-6">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium text-muted-foreground">Department</th>
                  {years.map(year => (
                    <th key={year} className="text-right py-2 font-medium text-muted-foreground">{year}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-muted/30">
                  <td className="py-2">Product & Engineering</td>
                  {opex.productEngineering.map((v, i) => (
                    <td key={i} className="py-2 text-right">{formatCurrency(v)}</td>
                  ))}
                </tr>
                <tr className="border-b hover:bg-muted/30">
                  <td className="py-2">Sales & Marketing</td>
                  {opex.salesMarketing.map((v, i) => (
                    <td key={i} className="py-2 text-right">{formatCurrency(v)}</td>
                  ))}
                </tr>
                <tr className="border-b hover:bg-muted/30">
                  <td className="py-2">G&A</td>
                  {opex.generalAdmin.map((v, i) => (
                    <td key={i} className="py-2 text-right">{formatCurrency(v)}</td>
                  ))}
                </tr>
                <tr className="border-b hover:bg-muted/30">
                  <td className="py-2">Customer Success</td>
                  {opex.customerSuccess.map((v, i) => (
                    <td key={i} className="py-2 text-right">{formatCurrency(v)}</td>
                  ))}
                </tr>
                <tr className="border-b hover:bg-muted/30">
                  <td className="py-2">Contractors & AI</td>
                  {opex.contractorsAI.map((v, i) => (
                    <td key={i} className="py-2 text-right">{formatCurrency(v)}</td>
                  ))}
                </tr>
                <tr className="bg-muted/30 font-semibold">
                  <td className="py-2">Total OpEx</td>
                  {metrics.totalOpex.map((v, i) => (
                    <td key={i} className="py-2 text-right">{formatCurrency(v)}</td>
                  ))}
                </tr>
              </tbody>
            </table>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={opexDetailData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={(v) => formatCurrency(v)} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend />
                  <Bar dataKey="engineering" name="Engineering" stackId="a" fill="hsl(var(--primary))" />
                  <Bar dataKey="salesMarketing" name="Sales & Marketing" stackId="a" fill="hsl(220, 70%, 60%)" />
                  <Bar dataKey="gna" name="G&A" stackId="a" fill="hsl(45, 80%, 50%)" />
                  <Bar dataKey="customerSuccess" name="Customer Success" stackId="a" fill="hsl(150, 60%, 50%)" />
                  <Bar dataKey="contractors" name="Contractors" stackId="a" fill="hsl(280, 60%, 60%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Headcount Tab */}
      <TabsContent value="headcount" className="space-y-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Headcount Plan (3-Year)</CardTitle>
            <CardDescription>Team growth by department</CardDescription>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm mb-6">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium text-muted-foreground">Department</th>
                  {years.map(year => (
                    <th key={year} className="text-right py-2 font-medium text-muted-foreground">{year}</th>
                  ))}
                  <th className="text-right py-2 font-medium text-muted-foreground">Avg Salary</th>
                </tr>
              </thead>
              <tbody>
                {headcount.map((row, idx) => (
                  <tr key={idx} className="border-b hover:bg-muted/30">
                    <td className="py-2">{row.department}</td>
                    <td className="py-2 text-right">{row.year1}</td>
                    <td className="py-2 text-right">{row.year2}</td>
                    <td className="py-2 text-right">{row.year3}</td>
                    <td className="py-2 text-right text-muted-foreground">{formatCurrency(row.avgSalary)}</td>
                  </tr>
                ))}
                <tr className="bg-muted/30 font-semibold">
                  <td className="py-2">Total Headcount</td>
                  <td className="py-2 text-right">{headcount.reduce((s, r) => s + r.year1, 0)}</td>
                  <td className="py-2 text-right">{headcount.reduce((s, r) => s + r.year2, 0)}</td>
                  <td className="py-2 text-right">{headcount.reduce((s, r) => s + r.year3, 0)}</td>
                  <td className="py-2 text-right">—</td>
                </tr>
              </tbody>
            </table>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={headcountData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {headcount.map((row, i) => (
                    <Bar 
                      key={row.department} 
                      dataKey={row.department} 
                      stackId="a" 
                      fill={`hsl(${(i * 50) % 360}, 60%, 50%)`} 
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Assumptions Tab */}
      <TabsContent value="assumptions" className="space-y-6 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Revenue Assumptions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Revenue Assumptions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly Creator Growth</span>
                <span className="font-medium">{assumptions.monthlyCreatorGrowth}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ARPU (Creator)</span>
                <span className="font-medium">${assumptions.avgRevenuePerCreator}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Advertising CPM</span>
                <span className="font-medium">${assumptions.advertisingCPM}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ad Fill Rate</span>
                <span className="font-medium">{assumptions.adFillRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Churn Rate</span>
                <span className="font-medium">{assumptions.churnRate}%/mo</span>
              </div>
            </CardContent>
          </Card>

          {/* COGS Assumptions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">COGS Assumptions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hosting Cost/User</span>
                <span className="font-medium">${assumptions.hostingCostPerUser}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">AI Inference Cost/Min</span>
                <span className="font-medium">${assumptions.aiInferenceCostPerMin}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Processing</span>
                <span className="font-medium">{assumptions.paymentProcessingFee}%</span>
              </div>
            </CardContent>
          </Card>

          {/* OpEx Assumptions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">OpEx Assumptions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly Marketing Budget</span>
                <span className="font-medium">${assumptions.monthlyMarketingBudget.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">CAC (Paid)</span>
                <span className="font-medium">${assumptions.cacPaid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pro Tier ARPU</span>
                <span className="font-medium">${assumptions.proTierArpu}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Headcount Productivity</span>
                <span className="font-medium">{assumptions.headcountProductivity}x</span>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Key Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Blended CAC</span>
                <span className="font-medium">${metrics.cac.toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">LTV</span>
                <span className="font-medium">${metrics.ltv.toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">LTV:CAC Ratio</span>
                <span className="font-medium">{metrics.ltvCacRatio.toFixed(1)}x</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Runway</span>
                <span className="font-medium">{metrics.runway.toFixed(0)} months</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Break-Even</span>
                <span className="font-medium">{metrics.breakEvenMonth ? `Month ${metrics.breakEvenMonth}` : 'N/A'}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}
