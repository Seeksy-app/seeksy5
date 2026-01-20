import * as React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// CFO Dictionary - hover tooltips for financial terms
export const CFO_GLOSSARY: Record<string, string> = {
  // Core metrics
  ARR: "Annual Recurring Revenue. Core valuation metric for SaaS.",
  MRR: "Monthly Recurring Revenue.",
  CAC: "Customer Acquisition Cost. The average cost to acquire one paying creator.",
  LTV: "Customer Lifetime Value.",
  "LTV:CAC": "Compares value of a customer to cost of acquiring them. 3× or higher is strong.",
  "LTV:CAC Ratio": "Compares value of a customer to cost of acquiring them. 3× or higher is strong.",
  
  // Profitability
  "Gross Margin": "(Revenue – COGS) ÷ Revenue. Higher margin = scalable business.",
  EBITDA: "Operational profitability excluding non-cash expenses.",
  
  // Cash metrics
  "Burn Rate": "Net monthly cash outflow.",
  Burn: "Net monthly cash outflow.",
  Runway: "Months of cash remaining at current burn.",
  
  // Cost categories
  COGS: "Direct costs required to deliver revenue (AI inference, hosting, payment fees).",
  OpEx: "Operating Expenses including salaries, tools, and marketing.",
  
  // Retention
  Churn: "% of customers canceling each month.",
  Retention: "% of customers remaining active.",
  
  // Unit economics
  ARPU: "Average revenue generated per user each month.",
  CPM: "Cost per 1,000 ad impressions.",
  "Ad Fill Rate": "% of ad inventory sold to advertisers.",
  
  // Operations
  "Headcount Productivity": "Efficiency multiplier for team output.",
  
  // Capital
  "Capital Infusion": "Cash raised (SAFE, equity, debt).",
  
  // Milestones
  "Breakeven Month": "When revenue surpasses expenses.",
  Breakeven: "When revenue surpasses expenses.",
};

interface GlossaryTermProps {
  term: string;
  children?: React.ReactNode;
  className?: string;
}

// Reusable component to wrap any term with a glossary tooltip
export function GlossaryTerm({ term, children, className }: GlossaryTermProps) {
  const definition = CFO_GLOSSARY[term];
  
  if (!definition) {
    return <span className={className}>{children || term}</span>;
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn(
            "cursor-help border-b border-dotted border-muted-foreground/50 hover:border-primary transition-colors",
            className
          )}>
            {children || term}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs bg-background border shadow-lg">
          <p className="text-sm">
            <strong className="text-primary">{term}:</strong> {definition}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Higher-order component to auto-detect and wrap glossary terms in text
export function withGlossaryTerms(text: string): React.ReactNode {
  const terms = Object.keys(CFO_GLOSSARY).sort((a, b) => b.length - a.length);
  let result: React.ReactNode[] = [text];
  
  terms.forEach(term => {
    const newResult: React.ReactNode[] = [];
    
    result.forEach((part, partIndex) => {
      if (typeof part !== 'string') {
        newResult.push(part);
        return;
      }
      
      const regex = new RegExp(`\\b(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'g');
      const parts = part.split(regex);
      
      parts.forEach((p, i) => {
        if (p === term) {
          newResult.push(<GlossaryTerm key={`${partIndex}-${i}-${term}`} term={term} />);
        } else if (p) {
          newResult.push(p);
        }
      });
    });
    
    result = newResult;
  });
  
  return <>{result}</>;
}
