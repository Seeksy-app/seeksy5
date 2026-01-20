/**
 * Capital Strategy Page - Burn rate, runway, fundraising, hiring, stress tests
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useFinancialCalculationEngine } from '@/hooks/useFinancialCalculationEngine';
import { useCFOMasterModel } from '@/hooks/useCFOMasterModel';
import { useNavigate } from 'react-router-dom';
import { 
  Flame, Clock, TrendingUp, Users, AlertTriangle, 
  CheckCircle2, DollarSign, Target, Zap, ArrowLeft, Brain
} from 'lucide-react';
import { cn } from '@/lib/utils';

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

interface FundraisingStage {
  name: string;
  target: number;
  status: 'completed' | 'current' | 'upcoming';
  timeline: string;
  purpose: string;
}

const FUNDRAISING_STAGES: FundraisingStage[] = [
  {
    name: 'Pre-Seed',
    target: 250000,
    status: 'completed',
    timeline: 'Q1 2024',
    purpose: 'Product development & initial team',
  },
  {
    name: 'Seed Round',
    target: 1500000,
    status: 'current',
    timeline: 'Q2 2025',
    purpose: 'Market expansion & creator acquisition',
  },
  {
    name: 'Series A',
    target: 5000000,
    status: 'upcoming',
    timeline: 'Q4 2026',
    purpose: 'Scale platform & international growth',
  },
];

interface HiringPlanItem {
  role: string;
  quarter: string;
  priority: 'high' | 'medium' | 'low';
  salary: number;
  department: string;
}

const HIRING_PLAN: HiringPlanItem[] = [
  { role: 'Senior Backend Engineer', quarter: 'Q1 2025', priority: 'high', salary: 150000, department: 'Engineering' },
  { role: 'Product Designer', quarter: 'Q1 2025', priority: 'high', salary: 120000, department: 'Design' },
  { role: 'Growth Marketing Lead', quarter: 'Q2 2025', priority: 'high', salary: 130000, department: 'Marketing' },
  { role: 'Full Stack Developer', quarter: 'Q2 2025', priority: 'medium', salary: 140000, department: 'Engineering' },
  { role: 'Customer Success Manager', quarter: 'Q3 2025', priority: 'medium', salary: 80000, department: 'Operations' },
  { role: 'Data Analyst', quarter: 'Q3 2025', priority: 'low', salary: 95000, department: 'Analytics' },
];

interface StressScenario {
  name: string;
  description: string;
  revenueImpact: number;
  runwayImpact: number;
  severity: 'low' | 'medium' | 'high';
}

const STRESS_SCENARIOS: StressScenario[] = [
  {
    name: 'Delayed Fundraise',
    description: 'Seed round closes 3 months late',
    revenueImpact: -10,
    runwayImpact: -3,
    severity: 'medium',
  },
  {
    name: 'Creator Churn Spike',
    description: 'Monthly churn increases to 8%',
    revenueImpact: -25,
    runwayImpact: -6,
    severity: 'high',
  },
  {
    name: 'Competitor Pricing War',
    description: 'Major competitor cuts prices 40%',
    revenueImpact: -15,
    runwayImpact: -4,
    severity: 'medium',
  },
  {
    name: 'Economic Downturn',
    description: 'Ad spending reduced across industry',
    revenueImpact: -30,
    runwayImpact: -8,
    severity: 'high',
  },
  {
    name: 'Key Hire Delays',
    description: 'Engineering hire takes 6+ months',
    revenueImpact: -5,
    runwayImpact: 0,
    severity: 'low',
  },
];

export default function BoardCapitalStrategy() {
  const navigate = useNavigate();
  const { projections, drivers } = useFinancialCalculationEngine();
  const { startingCash } = useCFOMasterModel();
  
  // Calculate burn and runway
  const monthlyBurn = projections.monthlyEbitda[0] < 0 ? Math.abs(projections.monthlyEbitda[0]) : 0;
  const currentRunway = monthlyBurn > 0 ? Math.round(startingCash / monthlyBurn) : 36;
  
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Capital Strategy</h1>
        <p className="text-muted-foreground">Financial runway, fundraising, and resource planning</p>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Burn</p>
                <p className="text-2xl font-bold">{formatCurrency(monthlyBurn)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Clock className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Runway</p>
                <p className="text-2xl font-bold">{currentRunway} months</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Break-Even</p>
                <p className="text-2xl font-bold">
                  {projections.breakEvenMonth ? `Month ${projections.breakEvenMonth}` : 'TBD'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-purple-500/30 bg-purple-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <DollarSign className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cash Position</p>
                <p className="text-2xl font-bold">{formatCurrency(startingCash)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fundraising Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Fundraising Stages
          </CardTitle>
          <CardDescription>Capital raise timeline and milestones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {FUNDRAISING_STAGES.map((stage, i) => (
              <div key={stage.name} className="flex items-start gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                  stage.status === 'completed' && "bg-green-500",
                  stage.status === 'current' && "bg-blue-500",
                  stage.status === 'upcoming' && "bg-muted"
                )}>
                  {stage.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  ) : (
                    <span className="text-sm font-bold text-white">{i + 1}</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{stage.name}</h4>
                      <Badge variant={
                        stage.status === 'completed' ? 'default' :
                        stage.status === 'current' ? 'secondary' : 'outline'
                      }>
                        {stage.status}
                      </Badge>
                    </div>
                    <span className="text-lg font-bold">{formatCurrency(stage.target)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{stage.purpose}</p>
                  <p className="text-xs text-muted-foreground">{stage.timeline}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Hiring Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Hiring Plan
          </CardTitle>
          <CardDescription>Planned team expansion over the next 12 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4">Role</th>
                  <th className="text-left py-3 px-4">Department</th>
                  <th className="text-left py-3 px-4">Timeline</th>
                  <th className="text-left py-3 px-4">Priority</th>
                  <th className="text-right py-3 px-4">Salary</th>
                </tr>
              </thead>
              <tbody>
                {HIRING_PLAN.map((hire, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-3 px-4 font-medium">{hire.role}</td>
                    <td className="py-3 px-4 text-muted-foreground">{hire.department}</td>
                    <td className="py-3 px-4">{hire.quarter}</td>
                    <td className="py-3 px-4">
                      <Badge variant={
                        hire.priority === 'high' ? 'destructive' :
                        hire.priority === 'medium' ? 'default' : 'outline'
                      }>
                        {hire.priority}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums">{formatCurrency(hire.salary)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted/30">
                  <td colSpan={4} className="py-3 px-4 font-semibold">Total Annual Salary Increase</td>
                  <td className="py-3 px-4 text-right font-bold tabular-nums">
                    {formatCurrency(HIRING_PLAN.reduce((sum, h) => sum + h.salary, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Stress Tests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Scenario Stress Tests
          </CardTitle>
          <CardDescription>Impact analysis of potential risk scenarios</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {STRESS_SCENARIOS.map((scenario, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={cn(
                      "w-4 h-4",
                      scenario.severity === 'high' && "text-red-500",
                      scenario.severity === 'medium' && "text-yellow-500",
                      scenario.severity === 'low' && "text-blue-500"
                    )} />
                    <h4 className="font-semibold">{scenario.name}</h4>
                    <Badge variant={
                      scenario.severity === 'high' ? 'destructive' :
                      scenario.severity === 'medium' ? 'default' : 'outline'
                    }>
                      {scenario.severity} risk
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{scenario.description}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Revenue Impact</p>
                    <p className={cn(
                      "font-semibold",
                      scenario.revenueImpact < 0 ? "text-red-500" : "text-green-500"
                    )}>
                      {scenario.revenueImpact}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Runway Impact</p>
                    <p className={cn(
                      "font-semibold",
                      scenario.runwayImpact < 0 ? "text-red-500" : "text-green-500"
                    )}>
                      {scenario.runwayImpact} months
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
