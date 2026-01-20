/**
 * Portal-scoped Help Center Panel
 * Shows help topics relevant to the current portal
 */

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, HelpCircle, MessageSquare, FileText, Video, ExternalLink } from 'lucide-react';
import { PortalType, PORTAL_LABELS } from '@/hooks/useHelpDrawer';
import { useNavigate } from 'react-router-dom';
import { useHelpDrawerStore } from '@/hooks/useHelpDrawer';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface HelpCenterPanelProps {
  portal: PortalType;
  contentKey: string;
}

interface HelpTopic {
  id: string;
  title: string;
  description: string;
  icon: 'faq' | 'guide' | 'video' | 'article';
}

// Portal-specific help topics - Creator-focused content
const PORTAL_HELP: Record<PortalType, HelpTopic[]> = {
  admin: [
    { id: 'ah1', title: 'Admin Quick Start', description: 'Get started with platform administration.', icon: 'guide' },
    { id: 'ah2', title: 'Managing Users', description: 'How to add, remove, and manage user accounts.', icon: 'article' },
    { id: 'ah3', title: 'Security Best Practices', description: 'Keep the platform secure.', icon: 'article' },
    { id: 'ah4', title: 'Admin FAQ', description: 'Common questions about administration.', icon: 'faq' },
  ],
  creator: [
    { id: 'ch1', title: 'Getting Started', description: 'Set up your creator profile and start your journey.', icon: 'guide' },
    { id: 'ch2', title: 'Recording Your First Episode', description: 'Step-by-step guide to recording in the Studio.', icon: 'video' },
    { id: 'ch3', title: 'Booking Links Setup', description: 'Create and share booking links for guest appearances.', icon: 'article' },
    { id: 'ch4', title: 'Monetization Guide', description: 'Unlock revenue with ads, sponsorships, and subscriptions.', icon: 'article' },
    { id: 'ch5', title: 'Podcast Distribution', description: 'Get your show on Spotify, Apple, and more.', icon: 'guide' },
    { id: 'ch6', title: 'AI Clip Generation', description: 'Auto-generate clips for social media.', icon: 'video' },
    { id: 'ch7', title: 'Analytics & Insights', description: 'Track your downloads, listens, and audience growth.', icon: 'article' },
    { id: 'ch8', title: 'Creator FAQ', description: 'Common questions from creators and podcasters.', icon: 'faq' },
    { id: 'ch9', title: 'Troubleshooting Audio', description: 'Fix common recording and playback issues.', icon: 'article' },
  ],
  advertiser: [
    { id: 'advh1', title: 'Advertiser Quick Start', description: 'Launch your first campaign.', icon: 'guide' },
    { id: 'advh2', title: 'Campaign Setup Tutorial', description: 'Video walkthrough of campaign creation.', icon: 'video' },
    { id: 'advh3', title: 'Targeting Guide', description: 'Reach your ideal audience.', icon: 'article' },
    { id: 'advh4', title: 'Advertiser FAQ', description: 'Common advertising questions.', icon: 'faq' },
  ],
  board: [
    { id: 'bh1', title: 'Board Portal Guide', description: 'Navigate the board member portal.', icon: 'guide' },
    { id: 'bh2', title: 'Understanding Reports', description: 'How to read financial reports.', icon: 'article' },
    { id: 'bh3', title: 'Investor Access', description: 'Sharing information with investors.', icon: 'article' },
    { id: 'bh4', title: 'Board FAQ', description: 'Common questions for board members.', icon: 'faq' },
  ],
};

export function HelpCenterPanel({ portal, contentKey }: HelpCenterPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<HelpTopic | null>(null);
  const navigate = useNavigate();
  const { close } = useHelpDrawerStore();
  
  const topics = PORTAL_HELP[portal] || [];
  
  const filteredTopics = topics.filter(topic =>
    topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    topic.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleViewFullCenter = () => {
    close();
    // Route to portal-specific knowledge hub, NOT admin helpdesk
    const route = portal === 'admin' ? '/admin/knowledge-base' : '/knowledge/creator';
    navigate(route);
  };
  
  const getIcon = (type: string) => {
    switch (type) {
      case 'faq': return <MessageSquare className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'guide': return <FileText className="h-4 w-4" />;
      default: return <HelpCircle className="h-4 w-4" />;
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Help resources for {PORTAL_LABELS[portal]}
        </p>
        <Button variant="outline" size="sm" onClick={handleViewFullCenter}>
          <ExternalLink className="h-4 w-4 mr-1" />
          Full Help Center
        </Button>
      </div>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search help topics..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <div className="space-y-2">
        {filteredTopics.map(topic => (
          <Card 
            key={topic.id} 
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => setSelectedTopic(topic)}
          >
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-primary/10 text-primary">
                  {getIcon(topic.icon)}
                </div>
                <CardTitle className="text-sm font-medium">{topic.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0 px-4 pb-3">
              <CardDescription className="text-xs">
                {topic.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filteredTopics.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <HelpCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No help topics found</p>
        </div>
      )}
      
      {/* Topic Detail Dialog */}
      <Dialog open={!!selectedTopic} onOpenChange={() => setSelectedTopic(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-primary/10 text-primary">
                {selectedTopic && getIcon(selectedTopic.icon)}
              </div>
              {selectedTopic?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p>{selectedTopic?.description}</p>
            <p className="text-muted-foreground text-sm mt-4">
              For more detailed information, click "Full Help Center" to browse all available resources.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
