/**
 * Portal-scoped Glossary Panel
 * Shows glossary terms relevant to the current portal
 */

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, BookOpen } from 'lucide-react';
import { PortalType, PORTAL_LABELS } from '@/hooks/useHelpDrawer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface GlossaryPanelProps {
  portal: PortalType;
  contentKey: string;
}

interface GlossaryTerm {
  term: string;
  definition: string;
  category: string;
  portals: PortalType[];
}

// All glossary terms with portal scoping
const ALL_TERMS: GlossaryTerm[] = [
  // Admin terms
  { term: 'RLS', definition: 'Row Level Security - Database security feature that controls access to rows based on user policies.', category: 'Technical', portals: ['admin'] },
  { term: 'Edge Function', definition: 'Serverless functions that run on Supabase infrastructure for backend logic.', category: 'Technical', portals: ['admin'] },
  { term: 'Super Admin', definition: 'Highest privilege level with full platform access.', category: 'Roles', portals: ['admin'] },
  
  // Creator terms
  { term: 'CPM', definition: 'Cost Per Mille - The cost per 1,000 ad impressions.', category: 'Monetization', portals: ['creator', 'advertiser'] },
  { term: 'Episode', definition: 'A single piece of audio content within a podcast.', category: 'Content', portals: ['creator'] },
  { term: 'RSS Feed', definition: 'Really Simple Syndication - A feed that distributes podcast episodes to platforms.', category: 'Distribution', portals: ['creator'] },
  { term: 'Voice Certification', definition: 'Process of verifying your voice identity on the platform.', category: 'Identity', portals: ['creator'] },
  
  // Advertiser terms
  { term: 'Impression', definition: 'A single instance of an ad being displayed to a user.', category: 'Metrics', portals: ['advertiser'] },
  { term: 'CTR', definition: 'Click-Through Rate - Percentage of impressions that result in clicks.', category: 'Metrics', portals: ['advertiser'] },
  { term: 'Campaign', definition: 'A set of ads with shared settings, targeting, and budget.', category: 'Advertising', portals: ['advertiser'] },
  { term: 'Fill Rate', definition: 'Percentage of ad requests that are filled with ads.', category: 'Metrics', portals: ['advertiser'] },
  
  // Board terms
  { term: 'MRR', definition: 'Monthly Recurring Revenue - Predictable revenue earned each month.', category: 'Finance', portals: ['board', 'admin'] },
  { term: 'ARR', definition: 'Annual Recurring Revenue - MRR multiplied by 12.', category: 'Finance', portals: ['board', 'admin'] },
  { term: 'CAC', definition: 'Customer Acquisition Cost - Cost to acquire a new customer.', category: 'Finance', portals: ['board', 'admin'] },
  { term: 'LTV', definition: 'Lifetime Value - Total revenue expected from a customer.', category: 'Finance', portals: ['board', 'admin'] },
  { term: 'Runway', definition: 'How long the company can operate with current cash.', category: 'Finance', portals: ['board'] },
  { term: 'EBITDA', definition: 'Earnings Before Interest, Taxes, Depreciation, and Amortization.', category: 'Finance', portals: ['board'] },
  
  // Shared terms
  { term: 'Dashboard', definition: 'Central hub displaying key metrics and quick actions.', category: 'General', portals: ['admin', 'creator', 'advertiser', 'board'] },
  { term: 'Workspace', definition: 'A container for organizing projects and content.', category: 'General', portals: ['admin', 'creator'] },
];

export function GlossaryPanel({ portal, contentKey }: GlossaryPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter terms by portal and search query
  const filteredTerms = useMemo(() => {
    return ALL_TERMS
      .filter(term => term.portals.includes(portal))
      .filter(term =>
        term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
        term.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
        term.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [portal, searchQuery]);
  
  // Group by category
  const groupedTerms = useMemo(() => {
    const grouped: Record<string, GlossaryTerm[]> = {};
    filteredTerms.forEach(term => {
      if (!grouped[term.category]) {
        grouped[term.category] = [];
      }
      grouped[term.category].push(term);
    });
    return grouped;
  }, [filteredTerms]);
  
  const categories = Object.keys(groupedTerms).sort();
  
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Glossary terms for {PORTAL_LABELS[portal]} portal
      </p>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search terms..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>
      
      {categories.length > 0 ? (
        <Accordion type="multiple" defaultValue={categories} className="space-y-2">
          {categories.map(category => (
            <AccordionItem key={category} value={category} className="border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium py-3">
                <div className="flex items-center gap-2">
                  <span>{category}</span>
                  <Badge variant="secondary" className="text-xs">
                    {groupedTerms[category].length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <div className="space-y-3">
                  {groupedTerms[category].map(term => (
                    <div key={term.term} className="border-l-2 border-primary/20 pl-3">
                      <p className="font-medium text-sm">{term.term}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {term.definition}
                      </p>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No terms found</p>
        </div>
      )}
    </div>
  );
}
