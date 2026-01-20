import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check, Sparkles, Mic, PieChart, Image, Layout, Scissors, Podcast, Instagram, Users, Megaphone, Target, Calendar, FormInput, Zap, MessageCircle, UserPlus, FileText, Shield, Video, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface RecommendedToolsStepProps {
  tools: string[];
  onContinue: () => void;
  onBack: () => void;
}

const toolIconMap: Record<string, any> = {
  'Studio & Recording': Mic,
  'Social Analytics': PieChart,
  'Media Library': Image,
  'My Page Builder': Layout,
  'Clips & Editing': Scissors,
  'Podcasts': Podcast,
  'Social Connect': Instagram,
  'Contacts & Audience': Users,
  'Campaigns': Megaphone,
  'Segments': Target,
  'Events': Calendar,
  'Forms': FormInput,
  'Automations': Zap,
  'SMS': MessageCircle,
  'Team & Collaboration': UserPlus,
  'Proposals': FileText,
  'Identity & Verification': Shield,
  'Video Studio': Video,
  'Brand Deals': Star,
};

const toolDescriptions: Record<string, string> = {
  'Studio & Recording': 'Record HD audio & video',
  'Social Analytics': 'Track your growth metrics',
  'Media Library': 'Organize all your content',
  'My Page Builder': 'Create your public profile',
  'Clips & Editing': 'AI-powered clip generation',
  'Podcasts': 'Manage your podcast',
  'Social Connect': 'Import social data',
  'Contacts & Audience': 'Manage your audience',
  'Campaigns': 'Run marketing campaigns',
  'Segments': 'Target specific audiences',
  'Events': 'Create and manage events',
  'Forms': 'Collect information',
  'Automations': 'Automate workflows',
  'SMS': 'Text messaging',
  'Team & Collaboration': 'Work together',
  'Proposals': 'Create proposals',
  'Identity & Verification': 'Verify your identity',
  'Video Studio': 'Professional video editing',
  'Brand Deals': 'Manage sponsorships',
};

const toolGradients: Record<string, string> = {
  'Studio & Recording': 'from-blue-500/20 to-cyan-500/20',
  'Social Analytics': 'from-purple-500/20 to-pink-500/20',
  'Media Library': 'from-green-500/20 to-emerald-500/20',
  'My Page Builder': 'from-orange-500/20 to-amber-500/20',
  'Clips & Editing': 'from-rose-500/20 to-red-500/20',
  'Podcasts': 'from-indigo-500/20 to-purple-500/20',
  'Social Connect': 'from-pink-500/20 to-rose-500/20',
  'Contacts & Audience': 'from-teal-500/20 to-green-500/20',
  'Campaigns': 'from-orange-500/20 to-red-500/20',
  'Segments': 'from-violet-500/20 to-purple-500/20',
  'Events': 'from-blue-500/20 to-indigo-500/20',
  'Forms': 'from-cyan-500/20 to-blue-500/20',
  'Automations': 'from-yellow-500/20 to-orange-500/20',
  'SMS': 'from-green-500/20 to-teal-500/20',
  'Team & Collaboration': 'from-sky-500/20 to-blue-500/20',
  'Proposals': 'from-slate-500/20 to-gray-500/20',
  'Identity & Verification': 'from-emerald-500/20 to-green-500/20',
};

export function RecommendedToolsStep({ tools, onContinue, onBack }: RecommendedToolsStepProps) {
  return (
    <Card className="p-6 shadow-xl border-border/50 bg-gradient-to-br from-card to-muted/20">
      <div className="space-y-5">
        {/* Header with icon */}
        <div className="text-center space-y-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="inline-flex p-3 rounded-2xl bg-gradient-to-r from-brand-gold to-brand-orange mb-2"
          >
            <Sparkles className="h-6 w-6 text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold">Your Personalized Workspace</h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            These tools will be auto-activated. You can customize anytime.
          </p>
        </div>

        {/* Tools Grid - compact */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {tools.map((tool, index) => {
            const Icon = toolIconMap[tool] || Sparkles;
            const description = toolDescriptions[tool] || 'Essential tool';
            const gradient = toolGradients[tool] || 'from-primary/20 to-primary/10';
            
            return (
              <motion.div
                key={tool}
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: index * 0.06 }}
              >
                <div className={cn(
                  "relative flex items-center gap-2.5 p-3 rounded-xl",
                  `bg-gradient-to-br ${gradient}`,
                  "border border-primary/20 hover:border-primary/40 transition-all duration-200"
                )}>
                  {/* Check badge */}
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-2.5 w-2.5 text-primary-foreground" />
                  </div>
                  
                  <div className="w-9 h-9 rounded-lg bg-background/80 flex items-center justify-center shrink-0 shadow-sm">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 pr-4">
                    <p className="font-semibold text-xs truncate">{tool}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{description}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Info box */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="p-3 rounded-lg bg-muted/30 border border-border/50 text-center"
        >
          <p className="text-xs text-muted-foreground">
            ✨ Customize your workspace anytime from the dashboard
          </p>
        </motion.div>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onBack} size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button 
            onClick={onContinue} 
            size="sm"
            className="bg-gradient-to-r from-brand-gold to-brand-orange hover:from-brand-orange hover:to-brand-gold text-slate-900 font-semibold"
          >
            Preview My Dashboard
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
