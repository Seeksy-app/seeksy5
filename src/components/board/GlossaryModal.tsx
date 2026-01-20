import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Search, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GlossaryTerm {
  term: string;
  definition: string;
  category: string;
}

// Comprehensive glossary of financial and business terms
const GLOSSARY_TERMS: GlossaryTerm[] = [
  // Revenue & Growth
  { term: 'ARR', definition: 'Annual Recurring Revenue. The annualized value of subscription revenue, representing the core valuation metric for SaaS businesses.', category: 'Revenue' },
  { term: 'MRR', definition: 'Monthly Recurring Revenue. The predictable revenue generated each month from active subscriptions.', category: 'Revenue' },
  { term: 'ARPU', definition: 'Average Revenue Per User. The average monthly revenue generated per active user, calculated as total revenue divided by active users.', category: 'Revenue' },
  { term: 'ACV', definition: 'Annual Contract Value. The average annualized revenue per customer contract.', category: 'Revenue' },
  { term: 'TCV', definition: 'Total Contract Value. The full value of a customer contract over its entire duration.', category: 'Revenue' },
  
  // Advertising
  { term: 'CPM', definition: 'Cost Per Mille (Thousand). The cost advertisers pay per 1,000 ad impressions served.', category: 'Advertising' },
  { term: 'Fill Rate', definition: 'The percentage of available ad inventory that is successfully sold to advertisers. Higher fill rates indicate better monetization.', category: 'Advertising' },
  { term: 'Impression', definition: 'A single instance of an advertisement being displayed to a user.', category: 'Advertising' },
  { term: 'eCPM', definition: 'Effective CPM. The actual revenue earned per 1,000 impressions, accounting for fill rate.', category: 'Advertising' },
  { term: 'Ad Inventory', definition: 'The total number of ad slots available for sale across all content.', category: 'Advertising' },
  
  // Customer Metrics
  { term: 'CAC', definition: 'Customer Acquisition Cost. The average cost to acquire one new paying customer, including marketing and sales expenses.', category: 'Customer' },
  { term: 'LTV', definition: 'Customer Lifetime Value. The total revenue expected from a customer over their entire relationship with the company.', category: 'Customer' },
  { term: 'LTV:CAC Ratio', definition: 'The ratio of customer lifetime value to acquisition cost. A ratio of 3× or higher indicates a healthy unit economics.', category: 'Customer' },
  { term: 'Churn', definition: 'The percentage of customers who cancel or stop paying each month. Lower churn indicates better retention.', category: 'Customer' },
  { term: 'Retention', definition: 'The percentage of customers who remain active over a given period. The inverse of churn.', category: 'Customer' },
  { term: 'NRR', definition: 'Net Revenue Retention. The percentage of recurring revenue retained from existing customers, including expansion and contraction.', category: 'Customer' },
  { term: 'Payback Period', definition: 'The number of months required to recover the cost of acquiring a customer through their revenue.', category: 'Customer' },
  
  // Profitability
  { term: 'Gross Margin', definition: 'Revenue minus Cost of Goods Sold (COGS), expressed as a percentage. Shows profitability before operating expenses.', category: 'Profitability' },
  { term: 'EBITDA', definition: 'Earnings Before Interest, Taxes, Depreciation, and Amortization. A measure of operational profitability.', category: 'Profitability' },
  { term: 'EBITDA Margin', definition: 'EBITDA as a percentage of revenue. Indicates operational efficiency.', category: 'Profitability' },
  { term: 'Net Margin', definition: 'Net income as a percentage of revenue, after all expenses including taxes and interest.', category: 'Profitability' },
  { term: 'Operating Margin', definition: 'Operating income as a percentage of revenue, before interest and taxes.', category: 'Profitability' },
  
  // Costs
  { term: 'COGS', definition: 'Cost of Goods Sold. Direct costs required to deliver the product, including hosting, AI inference, and payment processing.', category: 'Costs' },
  { term: 'OpEx', definition: 'Operating Expenses. Ongoing costs for running the business including salaries, marketing, and administrative costs.', category: 'Costs' },
  { term: 'Hosting Cost/User', definition: 'The annual infrastructure cost (servers, bandwidth) per active user.', category: 'Costs' },
  { term: 'Bandwidth Multiplier', definition: 'A factor that scales hosting costs based on traffic intensity and media delivery requirements.', category: 'Costs' },
  { term: 'AI Inference Cost', definition: 'The cost per minute of AI processing, including transcription, editing, and content generation.', category: 'Costs' },
  { term: 'AI Usage Multiplier', definition: 'A factor that scales AI inference costs based on feature adoption and usage patterns.', category: 'Costs' },
  { term: 'Payment Processing Fee', definition: 'The percentage fee charged on transactions by payment processors like Stripe.', category: 'Costs' },
  
  // Cash & Capital
  { term: 'Burn Rate', definition: 'The rate at which a company spends its cash reserves, typically expressed monthly.', category: 'Cash' },
  { term: 'Runway', definition: 'The number of months a company can operate at current burn rate before running out of cash.', category: 'Cash' },
  { term: 'Break-Even', definition: 'The point at which total revenue equals total costs, resulting in zero profit or loss.', category: 'Cash' },
  { term: 'Break-Even Month', definition: 'The projected month when the company becomes operationally profitable.', category: 'Cash' },
  { term: 'Capital Infusion', definition: 'Cash raised through investment rounds (SAFE, equity) or debt financing.', category: 'Cash' },
  
  // Cap Table
  { term: 'Cap Table', definition: 'Capitalization Table. A spreadsheet showing ownership stakes, equity dilution, and valuation.', category: 'Cap Table' },
  { term: 'Pre-Money Valuation', definition: 'Company valuation before receiving new investment.', category: 'Cap Table' },
  { term: 'Post-Money Valuation', definition: 'Company valuation after receiving new investment (Pre-Money + Investment Amount).', category: 'Cap Table' },
  { term: 'Dilution', definition: 'The reduction in existing shareholders ownership percentage when new shares are issued.', category: 'Cap Table' },
  { term: 'SAFE', definition: 'Simple Agreement for Future Equity. A convertible investment instrument that converts to equity at a future priced round.', category: 'Cap Table' },
  
  // Operations
  { term: 'Headcount Productivity', definition: 'An efficiency multiplier representing team output relative to headcount. Higher values indicate more efficient operations.', category: 'Operations' },
  { term: 'AI Efficiency Multiplier', definition: 'A factor representing how AI automation improves operational efficiency and reduces costs.', category: 'Operations' },
  { term: 'Verified Creator %', definition: 'The percentage of creators who have completed identity verification (voice and/or face certification).', category: 'Operations' },
  { term: 'Identity Verification Adoption', definition: 'The rate at which creators adopt identity verification features, which typically correlates with higher trust and revenue.', category: 'Operations' },
];

const CATEGORIES = [...new Set(GLOSSARY_TERMS.map(t => t.category))];

interface GlossaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlossaryModal({ open, onOpenChange }: GlossaryModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const filteredTerms = useMemo(() => {
    return GLOSSARY_TERMS.filter(term => {
      const matchesSearch = searchQuery === '' || 
        term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
        term.definition.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || term.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);
  
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
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BookOpen className="w-5 h-5" />
            Financial Glossary
          </DialogTitle>
          <DialogDescription>
            Definitions for financial metrics, KPIs, and business terms used across the platform.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search terms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedCategory === null ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Badge>
            {CATEGORIES.map(category => (
              <Badge
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
          
          {/* Terms List */}
          <ScrollArea className="h-[50vh]">
            <div className="space-y-6 pr-4">
              {Object.entries(groupedTerms).map(([category, terms]) => (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    {category}
                  </h3>
                  <div className="space-y-3">
                    {terms.map(term => (
                      <div
                        key={term.term}
                        className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="font-medium text-foreground">{term.term}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {term.definition}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              {filteredTerms.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No terms found matching "{searchQuery}"
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Button trigger component for the header
export function GlossaryButton() {
  const [open, setOpen] = useState(false);
  
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        title="Financial Glossary"
      >
        <BookOpen className="w-4 h-4" />
        <span className="hidden sm:inline">Glossary</span>
      </button>
      <GlossaryModal open={open} onOpenChange={setOpen} />
    </>
  );
}
