import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { motion } from 'framer-motion';
import { 
  Banknote, TrendingUp, Calendar, Plus, Trash2, RefreshCw, Save,
  PiggyBank, Clock, Target, ArrowRight, Info, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { useCFOCapital, type CapitalEvent } from '@/hooks/useCFOCapital';
import { useCFOExpenses } from '@/hooks/useCFOExpenses';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Area, AreaChart
} from 'recharts';

interface Props {
  onSave?: (data?: Record<string, any>) => void;
}

const EVENT_TYPES = [
  { value: 'investment', label: 'Investment Round' },
  { value: 'loan', label: 'Debt/Loan' },
  { value: 'grant', label: 'Grant' },
  { value: 'revenue_milestone', label: 'Revenue Milestone' },
  { value: 'expense_reduction', label: 'Expense Reduction' },
];

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
const YEARS = [2025, 2026, 2027, 2028];

export function CapitalRunwayCalculator({ onSave }: Props) {
  const { 
    capitalEvents, 
    cashPosition, 
    addCapitalEvent, 
    deleteCapitalEvent,
    updateCashPosition,
    calculateRunway,
    isSaving 
  } = useCFOCapital();
  const { summary: expenseSummary } = useCFOExpenses();

  // Local state
  const [currentCash, setCurrentCash] = useState(cashPosition?.current_cash || 250000);
  const [monthlyRevenue, setMonthlyRevenue] = useState(15000);
  const [revenueGrowth, setRevenueGrowth] = useState(5);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // New event form
  const [newEvent, setNewEvent] = useState({
    event_type: 'investment' as CapitalEvent['event_type'],
    amount: 500000,
    timing_quarter: 'Q2',
    timing_year: 2025,
    allocation_runway: 40,
    allocation_cac: 30,
    allocation_hiring: 20,
    allocation_infrastructure: 10,
    label: '',
    notes: ''
  });

  // Calculate burn rate from expenses
  const monthlyBurnRate = expenseSummary.totalMonthlyExpenses || 50000;

  // Calculate runway forecast
  const runwayData = useMemo(() => {
    return calculateRunway(
      currentCash,
      monthlyBurnRate,
      monthlyRevenue,
      revenueGrowth / 100
    );
  }, [currentCash, monthlyBurnRate, monthlyRevenue, revenueGrowth, capitalEvents, calculateRunway]);

  // Chart data
  const chartData = runwayData.forecast.slice(0, 24).map(f => ({
    month: `M${f.month}`,
    cash: Math.round(f.endingCash),
    revenue: Math.round(f.revenue),
    expenses: Math.round(f.expenses),
    breakEven: f.isBreakEven
  }));

  const handleAddEvent = () => {
    addCapitalEvent({
      ...newEvent,
      timing_quarter: `${newEvent.timing_quarter}-${newEvent.timing_year}`
    });
    setAddDialogOpen(false);
    setNewEvent({
      event_type: 'investment',
      amount: 500000,
      timing_quarter: 'Q2',
      timing_year: 2025,
      allocation_runway: 40,
      allocation_cac: 30,
      allocation_hiring: 20,
      allocation_infrastructure: 10,
      label: '',
      notes: ''
    });
  };

  const handleSave = () => {
    updateCashPosition({
      current_cash: currentCash,
      monthly_burn_rate: monthlyBurnRate,
      cash_runway_months: runwayData.runwayMonths,
      break_even_month: runwayData.breakEvenMonth
    });
    onSave?.({
      currentCash,
      monthlyBurnRate,
      monthlyRevenue,
      revenueGrowth,
      runwayMonths: runwayData.runwayMonths,
      breakEvenMonth: runwayData.breakEvenMonth,
      capitalEvents: capitalEvents?.map(e => ({ id: e.id, amount: e.amount, timing: e.timing_quarter })),
    });
  };

  const totalCapital = capitalEvents?.reduce((sum, e) => sum + e.amount, 0) || 0;

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="border-b border-border py-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <PiggyBank className="w-5 h-5 text-emerald-500" />
              Capital & Runway Engine
            </CardTitle>
            <CardDescription>
              Model cash position, investment timing, and runway scenarios
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
            Cash Management
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Key Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { 
              label: 'Cash Runway', 
              value: `${runwayData.runwayMonths}+ months`,
              icon: Clock,
              color: runwayData.runwayMonths > 18 ? 'text-emerald-600' : runwayData.runwayMonths > 12 ? 'text-amber-600' : 'text-rose-600'
            },
            { 
              label: 'Break-Even', 
              value: runwayData.breakEvenMonth ? `Month ${runwayData.breakEvenMonth}` : 'Not projected',
              icon: Target,
              color: runwayData.breakEvenMonth && runwayData.breakEvenMonth <= 24 ? 'text-emerald-600' : 'text-amber-600'
            },
            { 
              label: 'Monthly Burn', 
              value: `$${monthlyBurnRate.toLocaleString()}`,
              icon: TrendingUp,
              color: 'text-rose-600'
            },
            { 
              label: 'Capital Planned', 
              value: `$${(totalCapital / 1000000).toFixed(1)}M`,
              icon: Banknote,
              color: 'text-blue-600'
            },
          ].map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-4 bg-muted rounded-lg"
              >
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Icon className="w-4 h-4" />
                  <span className="text-xs">{metric.label}</span>
                </div>
                <p className={`text-xl font-bold ${metric.color}`}>{metric.value}</p>
              </motion.div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Inputs */}
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>Current Cash Position</span>
                <span className="text-sm font-medium text-foreground">${currentCash.toLocaleString()}</span>
              </Label>
              <Slider
                value={[currentCash]}
                onValueChange={([v]) => setCurrentCash(v)}
                min={0}
                max={5000000}
                step={50000}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>Monthly Revenue (Current)</span>
                <span className="text-sm font-medium text-foreground">${monthlyRevenue.toLocaleString()}</span>
              </Label>
              <Slider
                value={[monthlyRevenue]}
                onValueChange={([v]) => setMonthlyRevenue(v)}
                min={0}
                max={500000}
                step={5000}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>Monthly Revenue Growth Rate</span>
                <span className="text-sm font-medium text-foreground">{revenueGrowth}%</span>
              </Label>
              <Slider
                value={[revenueGrowth]}
                onValueChange={([v]) => setRevenueGrowth(v)}
                min={0}
                max={25}
                step={1}
              />
            </div>

            {/* Capital Events */}
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-semibold">Capital Events</Label>
                <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add Event
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add Capital Event</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Event Type</Label>
                        <Select
                          value={newEvent.event_type}
                          onValueChange={(v) => setNewEvent(prev => ({ ...prev, event_type: v as any }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {EVENT_TYPES.map(t => (
                              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Amount</Label>
                        <Input
                          type="number"
                          value={newEvent.amount}
                          onChange={(e) => setNewEvent(prev => ({ ...prev, amount: Number(e.target.value) }))}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Quarter</Label>
                          <Select
                            value={newEvent.timing_quarter}
                            onValueChange={(v) => setNewEvent(prev => ({ ...prev, timing_quarter: v }))}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {QUARTERS.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Year</Label>
                          <Select
                            value={String(newEvent.timing_year)}
                            onValueChange={(v) => setNewEvent(prev => ({ ...prev, timing_year: Number(v) }))}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Label (optional)</Label>
                        <Input
                          value={newEvent.label}
                          onChange={(e) => setNewEvent(prev => ({ ...prev, label: e.target.value }))}
                          placeholder="e.g., Seed Round"
                        />
                      </div>
                      <Button onClick={handleAddEvent} className="w-full">
                        Add Capital Event
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {capitalEvents && capitalEvents.length > 0 ? (
                <div className="space-y-2">
                  {capitalEvents.map(event => (
                    <div key={event.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{event.label || EVENT_TYPES.find(t => t.value === event.event_type)?.label}</p>
                        <p className="text-xs text-muted-foreground">{event.timing_quarter}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-emerald-600">
                          +${(event.amount / 1000).toFixed(0)}K
                        </span>
                        <Button size="icon" variant="ghost" onClick={() => deleteCapitalEvent(event.id)}>
                          <Trash2 className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-muted rounded-lg text-center text-muted-foreground text-sm">
                  No capital events planned. Add investments, loans, or grants to see their impact on runway.
                </div>
              )}
            </div>
          </div>

          {/* Right: Chart */}
          <div className="space-y-4">
            <Card className="border-0 bg-muted/50">
              <CardContent className="p-4">
                <p className="text-sm font-medium mb-3">Cash Runway Projection (24 months)</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="cashGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, '']} />
                      <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="5 5" />
                      <Area 
                        type="monotone" 
                        dataKey="cash" 
                        stroke="hsl(var(--primary))" 
                        fill="url(#cashGradient)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Status Indicator */}
            <div className={`p-4 rounded-lg flex items-start gap-3 ${
              runwayData.runwayMonths > 18 
                ? 'bg-emerald-50 border border-emerald-200' 
                : runwayData.runwayMonths > 12 
                  ? 'bg-amber-50 border border-amber-200'
                  : 'bg-rose-50 border border-rose-200'
            }`}>
              {runwayData.runwayMonths > 18 ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
              ) : runwayData.runwayMonths > 12 ? (
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5" />
              )}
              <div className="text-sm">
                {runwayData.runwayMonths > 18 ? (
                  <p className="text-emerald-800">
                    <strong>Healthy runway.</strong> With planned capital events, you have {runwayData.runwayMonths}+ months of runway
                    {runwayData.breakEvenMonth && ` and project break-even in month ${runwayData.breakEvenMonth}`}.
                  </p>
                ) : runwayData.runwayMonths > 12 ? (
                  <p className="text-amber-800">
                    <strong>Monitor closely.</strong> Runway is {runwayData.runwayMonths} months. Consider accelerating revenue or raising capital.
                  </p>
                ) : (
                  <p className="text-rose-800">
                    <strong>Action required.</strong> Runway is only {runwayData.runwayMonths} months. Immediate fundraising or cost reduction needed.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button onClick={handleSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700">
            <Save className="w-4 h-4 mr-2" />
            Save to Pro Forma
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}