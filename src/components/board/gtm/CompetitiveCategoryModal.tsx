import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ArrowRight, Mic, Calendar, Video, Link2, CreditCard, LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CategoryDetails {
  icon: LucideIcon;
  title: string;
  competitors: string;
  color: string;
  whyMatters: string;
  marketGap: string[];
  howSeeksySolves: string[];
}

const categoryDetails: Record<string, CategoryDetails> = {
  'Category 1: Podcast Hosting': {
    icon: Mic,
    title: 'Podcast Hosting',
    competitors: 'Buzzsprout, Podbean, Libsyn, Anchor',
    color: 'bg-blue-100 text-blue-700',
    whyMatters: 'Podcast hosting is the foundation of a creator\'s distribution stack. It controls where episodes live, how they are delivered, and which platforms a creator can reach. Owning this relationship is critical for long-term monetization and analytics.',
    marketGap: [
      'audience identity',
      'unified CRM',
      'modern monetization tools',
      'AI-powered editing and content repurposing'
    ],
    howSeeksySolves: [
      'creator identity',
      'unified CRM',
      'AI editing',
      'multi-platform scheduling',
      'event/meeting tools',
      'monetization workflows'
    ]
  },
  'Category 2: Scheduling & Events': {
    icon: Calendar,
    title: 'Scheduling & Events',
    competitors: 'Calendly, Eventbrite, Kajabi Events',
    color: 'bg-purple-100 text-purple-700',
    whyMatters: 'Scheduling, bookings, and events are high-intent interactions. They drive revenue, audience growth, guest acquisition, and workflow automation. Creators rely on them to operate at scale.',
    marketGap: [
      'content integration',
      'CRM connectivity',
      'identity layer',
      'analytics',
      'podcast workflows'
    ],
    howSeeksySolves: [
      'creator identity',
      'podcast guest workflows',
      'CRM',
      'calendar + booking',
      'automated reminders',
      'AI meeting prep'
    ]
  },
  'Category 3: Studio & Editing': {
    icon: Video,
    title: 'Studio & Editing',
    competitors: 'Riverside, Streamyard, Descript, Adobe Podcast',
    color: 'bg-orange-100 text-orange-700',
    whyMatters: 'Recording and editing are the most time-consuming parts of the creator workflow. They directly impact content volume, quality, consistency, and distribution speed. Owning this layer is key to retention.',
    marketGap: [
      'hyper specialized',
      'not integrated with CRM',
      'not tied to identity or monetization',
      'complex and expensive'
    ],
    howSeeksySolves: [
      'identity',
      'AI editing',
      'guest booking',
      'content repurposing',
      'monetization tools',
      'multi-platform posting'
    ]
  },
  'Category 4: Link-in-Bio + Identity': {
    icon: Link2,
    title: 'Link-in-Bio + Identity',
    competitors: 'Linktree, Beacons, Koji',
    color: 'bg-pink-100 text-pink-700',
    whyMatters: 'Identity is the center of every creator business. It determines how audiences discover them, how they convert, how they communicate, and how they monetize. Link-in-bio is the gateway to a creator\'s digital universe.',
    marketGap: [
      'no AI',
      'minimal analytics',
      'cannot host content',
      'cannot handle events or meetings',
      'do not support monetization',
      'do not integrate with CRM or email'
    ],
    howSeeksySolves: [
      'hosting',
      'events',
      'CRM',
      'monetization',
      'AI content generation',
      'unified analytics',
      'podcast & video integration'
    ]
  },
  'Category 5: CRM & Monetization': {
    icon: CreditCard,
    title: 'CRM & Monetization',
    competitors: 'Kajabi, Patreon, Substack',
    color: 'bg-emerald-100 text-emerald-700',
    whyMatters: 'Without CRM + monetization, creators cannot build sustainable revenue, recurring income, audience relationships, or automated funnels. This is the most valuable layer of the stack.',
    marketGap: [
      'expensive',
      'complex',
      'not designed for podcast-native creators',
      'siloed from hosting, content, and events',
      'lacking AI automation'
    ],
    howSeeksySolves: [
      'CRM',
      'memberships',
      'subscriptions',
      'digital products',
      'events',
      'analytics',
      'AI automations'
    ]
  }
};

interface CompetitiveCategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryKey: string | null;
  isInvestorView?: boolean;
}

export function CompetitiveCategoryModal({ 
  open, 
  onOpenChange, 
  categoryKey,
  isInvestorView = false
}: CompetitiveCategoryModalProps) {
  const navigate = useNavigate();
  
  if (!categoryKey || !categoryDetails[categoryKey]) return null;
  
  const category = categoryDetails[categoryKey];
  const Icon = category.icon;

  const handleGTMClick = () => {
    onOpenChange(false);
    if (!isInvestorView) {
      navigate('/board/gtm#channels');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="w-[560px] max-w-[95vw] rounded-xl shadow-lg p-0 overflow-hidden bg-white border-0 animate-in fade-in-0 zoom-in-95 duration-200 [&>button]:hidden"
      >
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${category.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <DialogTitle className="text-xl font-semibold text-slate-900">
                {category.title}
              </DialogTitle>
            </div>
            <button 
              onClick={() => onOpenChange(false)}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
          <p className="text-sm text-slate-500 mt-2">
            <b>Competitors:</b> {category.competitors}
          </p>
        </DialogHeader>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Why This Category Matters */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-2">
              Why This Category Matters
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {category.whyMatters}
            </p>
          </div>

          {/* The Market Gap */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-2">
              The Market Gap
            </h3>
            <p className="text-sm text-slate-600 mb-2">
              Traditional tools in this space lack:
            </p>
            <ul className="space-y-1.5">
              {category.marketGap.map((gap, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                  {gap}
                </li>
              ))}
            </ul>
            <p className="text-sm text-slate-500 mt-3 italic">
              Creators are forced to stitch together multiple platforms.
            </p>
          </div>

          {/* How Seeksy Solves It */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-2">
              How Seeksy Solves It
            </h3>
            <p className="text-sm text-slate-600 mb-2">
              Seeksy merges this category with:
            </p>
            <ul className="space-y-1.5">
              {category.howSeeksySolves.map((solution, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                  {solution}
                </li>
              ))}
            </ul>
            <p className="text-sm text-slate-700 mt-3 font-medium">
              This transforms {category.title.toLowerCase()} from a utility into a growth engine.
            </p>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="p-6 pt-4 border-t border-slate-100 bg-slate-50/50">
          <Button 
            onClick={handleGTMClick}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
          >
            See how this connects to our GTM Strategy
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
