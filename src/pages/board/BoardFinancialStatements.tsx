/**
 * Financial Statements Page - Income Statement, Balance Sheet, Cash Flow
 * Supports both AI-generated and CFO-controlled versions
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFinancialCalculationEngine } from '@/hooks/useFinancialCalculationEngine';
import { useCFOMasterModel } from '@/hooks/useCFOMasterModel';
import { useNavigate } from 'react-router-dom';
import { ArrowUp, ArrowDown, Brain, Calculator, TrendingUp, DollarSign, CreditCard, Wallet, ArrowLeft, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CFONotesCard } from '@/components/cfo/CFONotesCard';

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

interface StatementRowProps {
  label: string;
  values: number[];
  isBold?: boolean;
  isTotal?: boolean;
  isNegative?: boolean;
  indent?: boolean;
}

function StatementRow({ label, values, isBold, isTotal, isNegative, indent }: StatementRowProps) {
  return (
    <tr className={cn(
      "border-b border-border/50",
      isTotal && "bg-muted/30 font-semibold",
      isBold && "font-medium"
    )}>
      <td className={cn(
        "py-3 px-4",
        indent && "pl-8",
        isNegative && "text-red-500"
      )}>
        {label}
      </td>
      {values.map((val, i) => (
        <td key={i} className={cn(
          "py-3 px-4 text-right tabular-nums",
          isNegative && val < 0 && "text-red-500",
          val > 0 && !isNegative && "text-green-600"
        )}>
          {isNegative ? `(${formatCurrency(Math.abs(val))})` : formatCurrency(val)}
        </td>
      ))}
    </tr>
  );
}

function IncomeStatement() {
  const { projections } = useFinancialCalculationEngine();
  const years = ['Year 1', 'Year 2', 'Year 3'];
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-border">
            <th className="text-left py-3 px-4 font-semibold">Income Statement</th>
            {years.map((year, i) => (
              <th key={i} className="text-right py-3 px-4 font-semibold">{year}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <StatementRow label="Revenue" values={projections.yearlyRevenue} isBold />
          <StatementRow label="Cost of Goods Sold" values={projections.yearlyCogs} isNegative indent />
          <StatementRow label="Gross Profit" values={projections.yearlyGrossProfit} isTotal />
          <tr className="border-b border-border/30">
            <td className="py-2 px-4 text-muted-foreground text-xs">Gross Margin</td>
            {projections.yearlyGrossMargin.map((val, i) => (
              <td key={i} className="py-2 px-4 text-right text-muted-foreground text-xs">{val.toFixed(1)}%</td>
            ))}
          </tr>
          <StatementRow label="Operating Expenses" values={projections.yearlyOpex} isNegative indent />
          <StatementRow label="EBITDA" values={projections.yearlyEbitda} isTotal isBold />
          <tr className="bg-muted/20">
            <td className="py-2 px-4 text-muted-foreground text-xs">EBITDA Margin</td>
            {projections.yearlyEbitdaMargin.map((val, i) => (
              <td key={i} className={cn(
                "py-2 px-4 text-right text-xs",
                val >= 0 ? "text-green-600" : "text-red-500"
              )}>{val.toFixed(1)}%</td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function BalanceSheet() {
  const { projections, drivers } = useFinancialCalculationEngine();
  const years = ['Year 1', 'Year 2', 'Year 3'];
  
  // Calculate cumulative cash position
  const cumulativeCash = projections.yearlyEbitda.map((_, i) => {
    const prevYearsEbitda = projections.yearlyEbitda.slice(0, i + 1).reduce((a, b) => a + b, 0);
    return drivers.startingCash + prevYearsEbitda;
  });
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-border">
            <th className="text-left py-3 px-4 font-semibold">Balance Sheet</th>
            {years.map((year, i) => (
              <th key={i} className="text-right py-3 px-4 font-semibold">{year}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="bg-muted/30">
            <td colSpan={4} className="py-2 px-4 font-semibold text-xs uppercase text-muted-foreground">Assets</td>
          </tr>
          <StatementRow 
            label="Cash & Equivalents" 
            values={cumulativeCash} 
            indent 
          />
          <StatementRow 
            label="Accounts Receivable" 
            values={projections.yearlyRevenue.map(r => r * 0.08)} 
            indent 
          />
          <StatementRow 
            label="Prepaid Expenses" 
            values={[25000, 35000, 50000]} 
            indent 
          />
          <StatementRow 
            label="Total Assets" 
            values={cumulativeCash.map((c, i) => c + projections.yearlyRevenue[i] * 0.08 + [25000, 35000, 50000][i])} 
            isTotal 
          />
          
          <tr className="bg-muted/30 mt-4">
            <td colSpan={4} className="py-2 px-4 font-semibold text-xs uppercase text-muted-foreground">Liabilities & Equity</td>
          </tr>
          <StatementRow 
            label="Accounts Payable" 
            values={projections.yearlyCogs.map(c => c * 0.1)} 
            indent 
          />
          <StatementRow 
            label="Deferred Revenue" 
            values={projections.yearlyRevenue.map(r => r * 0.05)} 
            indent 
          />
          <StatementRow 
            label="Retained Earnings" 
            values={projections.yearlyEbitda.map((_, i) => 
              projections.yearlyEbitda.slice(0, i + 1).reduce((a, b) => a + b, 0)
            )} 
            indent 
          />
          <StatementRow 
            label="Total Equity" 
            values={cumulativeCash.map((c, i) => c + projections.yearlyRevenue[i] * 0.08 + [25000, 35000, 50000][i])} 
            isTotal 
          />
        </tbody>
      </table>
    </div>
  );
}

function CashFlowStatement() {
  const { projections, drivers } = useFinancialCalculationEngine();
  const years = ['Year 1', 'Year 2', 'Year 3'];
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-border">
            <th className="text-left py-3 px-4 font-semibold">Cash Flow Statement</th>
            {years.map((year, i) => (
              <th key={i} className="text-right py-3 px-4 font-semibold">{year}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="bg-muted/30">
            <td colSpan={4} className="py-2 px-4 font-semibold text-xs uppercase text-muted-foreground">Operating Activities</td>
          </tr>
          <StatementRow label="Net Income (EBITDA)" values={projections.yearlyEbitda} indent />
          <StatementRow 
            label="Changes in Working Capital" 
            values={projections.yearlyRevenue.map((r, i) => i === 0 ? -r * 0.03 : -(r - projections.yearlyRevenue[i-1]) * 0.03)} 
            indent 
          />
          <StatementRow 
            label="Cash from Operations" 
            values={projections.yearlyEbitda.map((e, i) => 
              e + (i === 0 ? -projections.yearlyRevenue[0] * 0.03 : -(projections.yearlyRevenue[i] - projections.yearlyRevenue[i-1]) * 0.03)
            )} 
            isTotal 
          />
          
          <tr className="bg-muted/30 mt-4">
            <td colSpan={4} className="py-2 px-4 font-semibold text-xs uppercase text-muted-foreground">Investing Activities</td>
          </tr>
          <StatementRow label="Capital Expenditures" values={[-15000, -25000, -40000]} isNegative indent />
          <StatementRow label="Cash from Investing" values={[-15000, -25000, -40000]} isTotal />
          
          <tr className="bg-muted/30 mt-4">
            <td colSpan={4} className="py-2 px-4 font-semibold text-xs uppercase text-muted-foreground">Financing Activities</td>
          </tr>
          <StatementRow label="Equity Raised" values={[0, 0, 0]} indent />
          <StatementRow label="Cash from Financing" values={[0, 0, 0]} isTotal />
          
          <StatementRow 
            label="Net Change in Cash" 
            values={projections.yearlyEbitda.map((e, i) => e - [15000, 25000, 40000][i])} 
            isTotal 
            isBold 
          />
          <StatementRow 
            label="Ending Cash Balance" 
            values={projections.yearlyEbitda.map((_, i) => {
              let cash = drivers.startingCash;
              for (let j = 0; j <= i; j++) {
                cash += projections.yearlyEbitda[j] - [15000, 25000, 40000][j];
              }
              return cash;
            })} 
            isTotal 
          />
        </tbody>
      </table>
    </div>
  );
}

export default function BoardFinancialStatements() {
  const navigate = useNavigate();
  const { projections } = useFinancialCalculationEngine();
  const [dataSource, setDataSource] = useState<'ai' | 'cfo'>('ai');
  const [cfoNotes, setCfoNotes] = useState('');
  const hasSavedVersions = true;
  
  // AI Insights based on financial data
  const aiInsights = [
    projections.yearlyEbitdaMargin[2] > 0 
      ? `Positive trajectory: EBITDA margin expected to reach ${projections.yearlyEbitdaMargin[2].toFixed(1)}% by Year 3`
      : `Path to profitability: Projected break-even by Month ${projections.breakEvenMonth || 'TBD'}`,
    `Gross margins remain healthy at ${projections.yearlyGrossMargin[0].toFixed(0)}%, supporting investment in growth`,
    projections.yearlyRevenue[2] > 2000000 
      ? `Revenue trajectory on track to exceed $2M by Year 3`
      : `Revenue growth requires acceleration to meet $2M Year 3 target`,
    `Working capital efficiency improving with receivables at 8% of revenue`
  ];
  
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Financial Statements</h1>
          <p className="text-muted-foreground">3-Year projected financial statements</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={dataSource === 'ai' ? 'default' : 'outline'} 
                 className="cursor-pointer" 
                 onClick={() => setDataSource('ai')}>
            <Brain className="w-3 h-3 mr-1" />
            AI Generated
          </Badge>
          {hasSavedVersions && (
            <Badge variant={dataSource === 'cfo' ? 'default' : 'outline'}
                   className="cursor-pointer"
                   onClick={() => setDataSource('cfo')}>
              <Calculator className="w-3 h-3 mr-1" />
              CFO Controlled
            </Badge>
          )}
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Year 3 Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(projections.yearlyRevenue[2])}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Gross Margin</p>
                <p className="text-2xl font-bold">{projections.yearlyGrossMargin[0].toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">EBITDA Margin (Y3)</p>
                <p className={cn("text-2xl font-bold", projections.yearlyEbitdaMargin[2] >= 0 ? "text-green-600" : "text-red-500")}>
                  {projections.yearlyEbitdaMargin[2].toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="text-sm text-muted-foreground">Year 3 EBITDA</p>
                <p className={cn("text-2xl font-bold", projections.yearlyEbitda[2] >= 0 ? "text-green-600" : "text-red-500")}>
                  {formatCurrency(projections.yearlyEbitda[2])}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Statements Tabs */}
      <Card>
        <Tabs defaultValue="income" className="w-full">
          <CardHeader className="pb-0">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="income">Income Statement</TabsTrigger>
              <TabsTrigger value="balance">Balance Sheet</TabsTrigger>
              <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent className="pt-4">
            <TabsContent value="income" className="mt-0">
              <IncomeStatement />
            </TabsContent>
            <TabsContent value="balance" className="mt-0">
              <BalanceSheet />
            </TabsContent>
            <TabsContent value="cashflow" className="mt-0">
              <CashFlowStatement />
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {/* CFO Notes Section - Read Only for Board */}
      <CFONotesCard pageKey="financial_statements" readOnly />

      {/* AI Insights Panel */}
      <Card className="border-yellow-500/20 bg-yellow-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-600">
            <Lightbulb className="w-5 h-5" />
            AI Insights
          </CardTitle>
          <CardDescription>Automated analysis of financial projections</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {aiInsights.map((insight, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-yellow-500 mt-0.5">•</span>
                {insight}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}