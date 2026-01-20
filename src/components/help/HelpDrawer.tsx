/**
 * Unified Help Drawer Component
 * 
 * Renders portal-scoped help content based on activeActionKey and portal.
 * 
 * Content mapping:
 * - admin:help_center → AdminHelpCenterPanel
 * - creator:help_center → CreatorHelpCenterPanel
 * - advertiser:help_center → AdvertiserHelpCenterPanel
 * - board:help_center → BoardHelpCenterPanel
 * (Same pattern for knowledge_hub, daily_brief, glossary, contact_support)
 */

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  useHelpDrawerStore, 
  HelpActionKey, 
  PortalType, 
  PORTAL_LABELS, 
  ACTION_LABELS,
  getHelpContentKey 
} from '@/hooks/useHelpDrawer';
import { KnowledgeHubPanel } from './panels/KnowledgeHubPanel';
import { DailyBriefPanel } from './panels/DailyBriefPanel';
import { GlossaryPanel } from './panels/GlossaryPanel';
import { HelpCenterPanel } from './panels/HelpCenterPanel';
import { ContactSupportPanel } from './panels/ContactSupportPanel';

export function HelpDrawer() {
  const { isOpen, activeActionKey, portal, currentRoute, close } = useHelpDrawerStore();
  
  if (!activeActionKey || !portal) {
    return null;
  }
  
  const contentKey = getHelpContentKey(portal, activeActionKey);
  
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <SheetTitle>{ACTION_LABELS[activeActionKey]}</SheetTitle>
            <Badge variant="outline" className="text-xs">
              {PORTAL_LABELS[portal]}
            </Badge>
          </div>
          <SheetDescription className="sr-only">
            {ACTION_LABELS[activeActionKey]} for {PORTAL_LABELS[portal]} portal
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="p-6">
            <HelpDrawerContent 
              actionKey={activeActionKey} 
              portal={portal} 
              contentKey={contentKey}
              currentRoute={currentRoute}
            />
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

interface HelpDrawerContentProps {
  actionKey: HelpActionKey;
  portal: PortalType;
  contentKey: string;
  currentRoute: string | null;
}

function HelpDrawerContent({ actionKey, portal, contentKey, currentRoute }: HelpDrawerContentProps) {
  switch (actionKey) {
    case 'knowledge_hub':
      return <KnowledgeHubPanel portal={portal} contentKey={contentKey} />;
    case 'daily_brief':
      return <DailyBriefPanel portal={portal} contentKey={contentKey} />;
    case 'glossary':
      return <GlossaryPanel portal={portal} contentKey={contentKey} />;
    case 'help_center':
      return <HelpCenterPanel portal={portal} contentKey={contentKey} />;
    case 'contact_support':
      return <ContactSupportPanel portal={portal} contentKey={contentKey} currentRoute={currentRoute} />;
    default:
      return (
        <div className="text-center text-muted-foreground py-8">
          Content not available for {contentKey}
        </div>
      );
  }
}
