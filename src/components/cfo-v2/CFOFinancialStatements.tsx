import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

import { CFOCapitalSummaryCard, CapitalSummaryData } from './CFOCapitalRunway';

interface FinancialData {
  revenue: number[];
  cogs: number[];
  opex: number[];
  ebitda: number[];
  grossProfit: number[];
  grossMargin: number[];
}

interface CFOFinancialStatementsProps {
  data: FinancialData;
  years: number[];
  cashBalance?: number;
  capitalSummary?: CapitalSummaryData;
}

const formatCurrency = (value: number, compact = true) => {
  if (compact) {
    if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
};

export function CFOFinancialStatements({ data, years, cashBalance = 500000, capitalSummary }: CFOFinancialStatementsProps) {
  // Simplified balance sheet calculations
  const calculateBalanceSheet = (yearIndex: number) => {
    const cash = cashBalance + data.ebitda.slice(0, yearIndex + 1).reduce((a, b) => a + b, 0);
    const ar = data.revenue[yearIndex] * 0.08; // 1 month AR
    const liabilities = data.opex[yearIndex] * 0.1; // ~1 month payables
    const equity = cash + ar - liabilities;
    return { cash, ar, liabilities, equity };
  };

  // Cash flow calculations
  const calculateCashFlow = (yearIndex: number) => {
    const netIncome = data.ebitda[yearIndex];
    const da = data.revenue[yearIndex] * 0.02; // 2% D&A
    const workingCapitalChange = yearIndex > 0 
      ? (data.revenue[yearIndex] - data.revenue[yearIndex - 1]) * 0.05 
      : data.revenue[0] * 0.05;
    const fcf = netIncome + da - workingCapitalChange;
    return { netIncome, da, workingCapitalChange, fcf };
  };

  // Chart data
  const chartData = years.map((year, i) => ({
    name: year.toString(),
    revenue: data.revenue[i] / 1000000,
    grossProfit: data.grossProfit[i] / 1000000,
    ebitda: data.ebitda[i] / 1000000,
    grossMargin: data.grossMargin[i],
  }));

  return (
    <div className="space-y-6">
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
                {data.revenue.map((v, i) => (
                  <td key={i} className="py-2 text-right font-semibold text-foreground">{formatCurrency(v)}</td>
                ))}
              </tr>
              <tr className="border-b hover:bg-muted/30">
                <td className="py-2 text-muted-foreground pl-4">Cost of Goods Sold</td>
                {data.cogs.map((v, i) => (
                  <td key={i} className="py-2 text-right text-red-600">({formatCurrency(v)})</td>
                ))}
              </tr>
              <tr className="border-b bg-muted/30">
                <td className="py-2 font-semibold">Gross Profit</td>
                {data.grossProfit.map((v, i) => (
                  <td key={i} className="py-2 text-right font-semibold">{formatCurrency(v)}</td>
                ))}
              </tr>
              <tr className="border-b hover:bg-muted/30">
                <td className="py-2 text-muted-foreground text-xs pl-4">Gross Margin</td>
                {data.grossMargin.map((v, i) => (
                  <td key={i} className="py-2 text-right text-xs text-muted-foreground">{v.toFixed(1)}%</td>
                ))}
              </tr>
              <tr className="border-b hover:bg-muted/30">
                <td className="py-2 text-muted-foreground pl-4">Operating Expenses</td>
                {data.opex.map((v, i) => (
                  <td key={i} className="py-2 text-right text-red-600">({formatCurrency(v)})</td>
                ))}
              </tr>
              <tr className="bg-gradient-to-r from-emerald-50 to-transparent dark:from-emerald-950/30">
                <td className="py-3 font-bold text-base">EBITDA</td>
                {data.ebitda.map((v, i) => (
                  <td key={i} className={cn("py-3 text-right font-bold text-base", v >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                    {formatCurrency(v)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Balance Sheet */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-500" />
            Balance Sheet (Simplified 3-Year)
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
                <td className="py-2 font-medium">Cash</td>
                {years.map((_, i) => {
                  const bs = calculateBalanceSheet(i);
                  return <td key={i} className="py-2 text-right font-semibold text-emerald-600">{formatCurrency(bs.cash)}</td>;
                })}
              </tr>
              <tr className="border-b hover:bg-muted/30">
                <td className="py-2 text-muted-foreground pl-4">Accounts Receivable</td>
                {years.map((_, i) => {
                  const bs = calculateBalanceSheet(i);
                  return <td key={i} className="py-2 text-right">{formatCurrency(bs.ar)}</td>;
                })}
              </tr>
              <tr className="border-b hover:bg-muted/30">
                <td className="py-2 text-muted-foreground pl-4">Liabilities</td>
                {years.map((_, i) => {
                  const bs = calculateBalanceSheet(i);
                  return <td key={i} className="py-2 text-right text-red-600">({formatCurrency(bs.liabilities)})</td>;
                })}
              </tr>
              <tr className="bg-muted/30">
                <td className="py-2 font-semibold">Equity</td>
                {years.map((_, i) => {
                  const bs = calculateBalanceSheet(i);
                  return <td key={i} className="py-2 text-right font-semibold">{formatCurrency(bs.equity)}</td>;
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
            Cash Flow Statement (3-Year)
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
                {years.map((_, i) => {
                  const cf = calculateCashFlow(i);
                  return <td key={i} className={cn("py-2 text-right", cf.netIncome >= 0 ? 'text-foreground' : 'text-red-600')}>{formatCurrency(cf.netIncome)}</td>;
                })}
              </tr>
              <tr className="border-b hover:bg-muted/30">
                <td className="py-2 text-muted-foreground pl-4">+ D&A</td>
                {years.map((_, i) => {
                  const cf = calculateCashFlow(i);
                  return <td key={i} className="py-2 text-right">{formatCurrency(cf.da)}</td>;
                })}
              </tr>
              <tr className="border-b hover:bg-muted/30">
                <td className="py-2 text-muted-foreground pl-4">+/– Working Capital Change</td>
                {years.map((_, i) => {
                  const cf = calculateCashFlow(i);
                  return <td key={i} className="py-2 text-right text-red-600">({formatCurrency(cf.workingCapitalChange)})</td>;
                })}
              </tr>
              <tr className="bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-950/30">
                <td className="py-3 font-bold">Free Cash Flow</td>
                {years.map((_, i) => {
                  const cf = calculateCashFlow(i);
                  return <td key={i} className={cn("py-3 text-right font-bold", cf.fcf >= 0 ? 'text-emerald-600' : 'text-red-600')}>{formatCurrency(cf.fcf)}</td>;
                })}
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenue Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis tickFormatter={(v) => `$${v}M`} className="text-xs" />
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toFixed(2)}M`, 'Revenue']}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gross Margin %</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis tickFormatter={(v) => `${v}%`} domain={[0, 100]} className="text-xs" />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Gross Margin']}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Line type="monotone" dataKey="grossMargin" stroke="hsl(142, 76%, 36%)" strokeWidth={2} dot={{ fill: 'hsl(142, 76%, 36%)' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Capital & Runway Summary Card */}
      {capitalSummary && (
        <CFOCapitalSummaryCard data={capitalSummary} />
      )}
    </div>
  );
}
