import { Calendar, Clock, Users, Vote, Radio, FileText, Link2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ProfileMenuBarProps {
  counts: {
    events: number;
    meetings: number;
    signupSheets: number;
    polls: number;
    podcasts: number;
    blogPosts: number;
    customLinks: number;
  };
  activeSection?: string;
  onSectionClick?: (section: string) => void;
}

export const ProfileMenuBar = ({ counts, activeSection, onSectionClick }: ProfileMenuBarProps) => {
  const menuItems = [
    { id: 'events', icon: Calendar, count: counts.events, label: 'Events' },
    { id: 'meetings', icon: Clock, count: counts.meetings, label: 'Meetings' },
    { id: 'signup-sheets', icon: Users, count: counts.signupSheets, label: 'Sign-ups' },
    { id: 'polls', icon: Vote, count: counts.polls, label: 'Polls' },
    { id: 'podcasts', icon: Radio, count: counts.podcasts, label: 'Podcasts' },
    { id: 'blog', icon: FileText, count: counts.blogPosts, label: 'Blog' },
    { id: 'custom-sections', icon: Link2, count: counts.customLinks, label: 'Links' },
  ].filter(item => item.count > 0);

  if (menuItems.length === 0) return null;

  return (
    <div className="sticky bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-3 z-40">
      <div className="flex items-center justify-around gap-2 max-w-4xl mx-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onSectionClick?.(item.id)}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg transition-all hover:bg-accent",
                isActive && "bg-accent"
              )}
              aria-label={item.label}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                <Badge 
                  variant="secondary" 
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs font-bold bg-amber-500 text-amber-950 border-0"
                >
                  {item.count}
                </Badge>
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
