/**
 * Team & Org Overview - Org chart, role gaps, hiring needs
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  Users, User, AlertCircle, CheckCircle2, 
  TrendingUp, Calendar, Brain, Building, ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TeamMember {
  name: string;
  role: string;
  department: string;
  avatar?: string;
  startDate: string;
}

interface RoleGap {
  role: string;
  department: string;
  priority: 'high' | 'medium' | 'low';
  impact: string;
  timeline: string;
  salary: number;
}

interface Department {
  name: string;
  headcount: number;
  budget: number;
  growth: number;
}

const TEAM: TeamMember[] = [
  { name: 'CEO', role: 'Chief Executive Officer', department: 'Executive', startDate: '2023-01-01' },
  { name: 'CTO', role: 'Chief Technology Officer', department: 'Engineering', startDate: '2023-03-01' },
  { name: 'Lead Engineer', role: 'Senior Full Stack Developer', department: 'Engineering', startDate: '2023-06-01' },
  { name: 'Product Designer', role: 'UI/UX Designer', department: 'Design', startDate: '2024-01-01' },
  { name: 'Growth Lead', role: 'Head of Growth', department: 'Marketing', startDate: '2024-03-01' },
];

const ROLE_GAPS: RoleGap[] = [
  {
    role: 'Senior Backend Engineer',
    department: 'Engineering',
    priority: 'high',
    impact: 'Critical for scaling infrastructure and API development',
    timeline: 'Q1 2025',
    salary: 150000,
  },
  {
    role: 'AI/ML Engineer',
    department: 'Engineering',
    priority: 'high',
    impact: 'Needed for clips engine and content analysis features',
    timeline: 'Q1 2025',
    salary: 170000,
  },
  {
    role: 'Customer Success Manager',
    department: 'Operations',
    priority: 'medium',
    impact: 'Reduce churn and improve creator retention',
    timeline: 'Q2 2025',
    salary: 80000,
  },
  {
    role: 'Content Marketing Manager',
    department: 'Marketing',
    priority: 'medium',
    impact: 'Scale organic acquisition and brand awareness',
    timeline: 'Q2 2025',
    salary: 90000,
  },
  {
    role: 'Mobile Developer',
    department: 'Engineering',
    priority: 'low',
    impact: 'Required for iOS/Android app development',
    timeline: 'Q3 2025',
    salary: 140000,
  },
];

const DEPARTMENTS: Department[] = [
  { name: 'Engineering', headcount: 3, budget: 450000, growth: 100 },
  { name: 'Design', headcount: 1, budget: 120000, growth: 0 },
  { name: 'Marketing', headcount: 1, budget: 130000, growth: 100 },
  { name: 'Operations', headcount: 0, budget: 0, growth: 100 },
  { name: 'Executive', headcount: 1, budget: 200000, growth: 0 },
];

function formatCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
}

export default function BoardTeamOrg() {
  const navigate = useNavigate();
  const totalHeadcount = TEAM.length;
  const plannedHires = ROLE_GAPS.length;
  const highPriorityGaps = ROLE_GAPS.filter(r => r.priority === 'high').length;
  const totalHiringBudget = ROLE_GAPS.reduce((sum, r) => sum + r.salary, 0);
  
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Team & Org Overview</h1>
        <p className="text-muted-foreground">Organization structure, role gaps, and hiring roadmap</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{totalHeadcount}</p>
                <p className="text-sm text-muted-foreground">Current Team</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{plannedHires}</p>
                <p className="text-sm text-muted-foreground">Planned Hires</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{highPriorityGaps}</p>
                <p className="text-sm text-muted-foreground">Critical Gaps</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalHiringBudget)}</p>
                <p className="text-sm text-muted-foreground">Hiring Budget</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Org Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Organization Chart
          </CardTitle>
          <CardDescription>Current team structure</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center">
            {/* CEO at top */}
            <div className="p-4 rounded-lg border-2 border-primary bg-primary/5 mb-4">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <p className="font-semibold">CEO</p>
                <p className="text-xs text-muted-foreground">Chief Executive Officer</p>
              </div>
            </div>
            
            {/* Connecting line */}
            <div className="w-px h-8 bg-border" />
            
            {/* Department heads */}
            <div className="flex gap-8 flex-wrap justify-center">
              {TEAM.filter(m => m.department !== 'Executive').map((member, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-px h-4 bg-border" />
                  <div className="p-4 rounded-lg border bg-card">
                    <div className="text-center">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <p className="font-medium text-sm">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.role}</p>
                      <Badge variant="outline" className="text-xs mt-1">{member.department}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Department Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Department Overview</CardTitle>
          <CardDescription>Headcount and budget by department</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {DEPARTMENTS.map((dept, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-32 font-medium">{dept.name}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>{dept.headcount} people</span>
                    <span className="text-muted-foreground">{formatCurrency(dept.budget)}/yr</span>
                  </div>
                  <Progress value={(dept.headcount / 5) * 100} className="h-2" />
                </div>
                {dept.growth > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    +{dept.growth}% growth
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Role Gaps - AI Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-yellow-500" />
            AI-Identified Role Gaps
          </CardTitle>
          <CardDescription>Critical hiring needs based on growth projections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ROLE_GAPS.map((gap, i) => (
              <div key={i} className={cn(
                "p-4 rounded-lg border",
                gap.priority === 'high' && "border-red-500/30 bg-red-500/5",
                gap.priority === 'medium' && "border-yellow-500/30 bg-yellow-500/5",
                gap.priority === 'low' && "border-border"
              )}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{gap.role}</h4>
                      <Badge variant={
                        gap.priority === 'high' ? 'destructive' :
                        gap.priority === 'medium' ? 'default' : 'outline'
                      }>
                        {gap.priority} priority
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{gap.department}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(gap.salary)}</p>
                    <p className="text-xs text-muted-foreground">annual</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{gap.impact}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  Target: {gap.timeline}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Hiring Roadmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Hiring Roadmap
          </CardTitle>
          <CardDescription>Planned hiring by quarter</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {['Q1 2025', 'Q2 2025', 'Q3 2025'].map(quarter => {
              const quarterHires = ROLE_GAPS.filter(r => r.timeline === quarter);
              const quarterBudget = quarterHires.reduce((sum, r) => sum + r.salary, 0);
              
              return (
                <div key={quarter}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{quarter}</h4>
                    <span className="text-sm text-muted-foreground">
                      {quarterHires.length} hires • {formatCurrency(quarterBudget)}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {quarterHires.length > 0 ? (
                      quarterHires.map((hire, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/30">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{hire.role}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">{hire.department}</Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No hires planned</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
