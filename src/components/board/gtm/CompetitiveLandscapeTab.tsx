import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, Calendar, Video, Link2, CreditCard, Shield } from 'lucide-react';
import { CompetitiveCategoryModal } from './CompetitiveCategoryModal';

const categories = [
  {
    icon: Mic,
    title: 'Category 1: Podcast Hosting',
    competitors: 'Buzzsprout, Podbean, Libsyn, Anchor',
    weakness: 'Audio-only focus, limited AI, no unified CRM, no monetization engine.',
    color: 'bg-blue-100 text-blue-700',
  },
  {
    icon: Calendar,
    title: 'Category 2: Scheduling & Events',
    competitors: 'Calendly, Eventbrite, Kajabi Events',
    weakness: 'No creator identity layer, no content workflow, no analytics for creators.',
    color: 'bg-purple-100 text-purple-700',
  },
  {
    icon: Video,
    title: 'Category 3: Studio & Editing',
    competitors: 'Riverside, Streamyard, Descript, Adobe Podcast',
    weakness: 'Hyper specialized, siloed workflows, limited discovery/CRM/monetization.',
    color: 'bg-orange-100 text-orange-700',
  },
  {
    icon: Link2,
    title: 'Category 4: Link-in-Bio + Identity',
    competitors: 'Linktree, Beacons, Koji',
    weakness: 'No AI, no advanced media handling, limited monetization, no owned audience tools.',
    color: 'bg-pink-100 text-pink-700',
  },
  {
    icon: CreditCard,
    title: 'Category 5: CRM & Monetization',
    competitors: 'Kajabi, Patreon, Substack',
    weakness: 'Steep learning curve, expensive, not built for hybrid creators + podcasters.',
    color: 'bg-emerald-100 text-emerald-700',
  },
];

interface CompetitiveLandscapeTabProps {
  isInvestorView?: boolean;
}

export function CompetitiveLandscapeTab({ isInvestorView = false }: CompetitiveLandscapeTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      {/* Overview */}
      <Card className="bg-gradient-to-br from-slate-50 to-blue-50/50 border-slate-200">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Competitive Landscape Overview</h2>
          <p className="text-slate-600">
            The creator tools market is crowded, but fragmented. Seeksy competes across multiple categories — 
            and the strength of our model is <strong>unification</strong>.
          </p>
        </CardContent>
      </Card>

      {/* Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <Card 
            key={category.title} 
            className="bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
            onClick={() => setSelectedCategory(category.title)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${category.color} group-hover:scale-105 transition-transform`}>
                  <category.icon className="w-5 h-5" />
                </div>
                <CardTitle className="text-base text-slate-900">{category.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Competitors</p>
                <p className="text-sm text-slate-700 mt-1">{category.competitors}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Their Weakness</p>
                <p className="text-sm text-slate-600 mt-1">{category.weakness}</p>
              </div>
              <p className="text-xs text-blue-600 font-medium pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Click to learn more →
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Seeksy's Advantage */}
      <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Seeksy's Advantage</h2>
              <p className="text-slate-700">
                We unify the entire ecosystem — <strong>identity, hosting, events, CRM, monetization, and AI</strong> — into one system. 
                No other platform offers this level of integration for creators.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Detail Modal */}
      <CompetitiveCategoryModal
        open={!!selectedCategory}
        onOpenChange={(open) => !open && setSelectedCategory(null)}
        categoryKey={selectedCategory}
        isInvestorView={isInvestorView}
      />
    </div>
  );
}
