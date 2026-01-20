import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Share2, Eye, Mail, Users, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ShareToBoardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versionLabel?: string;
  versionId?: string;
}

type ShareOption = 'share-view' | 'share-only' | 'share-email';

interface BoardMember {
  id: string;
  email: string;
  full_name: string;
  company: string | null;
  role: string | null;
}

export function ShareToBoardModal({
  open,
  onOpenChange,
  versionLabel,
  versionId,
}: ShareToBoardModalProps) {
  const navigate = useNavigate();
  const [shareOption, setShareOption] = useState<ShareOption>('share-view');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [sendToAll, setSendToAll] = useState(true);
  const [isSharing, setIsSharing] = useState(false);

  // Fetch board members from the board_members table
  const { data: boardMembers, isLoading: loadingMembers } = useQuery({
    queryKey: ['board-members-for-share'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('board_members')
        .select('id, email, full_name, company, role')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      return data as BoardMember[];
    },
    enabled: open,
  });

  const handleMemberToggle = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
    setSendToAll(false);
  };

  const handleSendToAllChange = (checked: boolean) => {
    setSendToAll(checked);
    if (checked) {
      setSelectedMembers([]);
    }
  };

  const handleShare = async () => {
    setIsSharing(true);

    try {
      const recipients = sendToAll
        ? boardMembers?.map((m) => ({ email: m.email, name: m.full_name })) || []
        : boardMembers
            ?.filter((m) => selectedMembers.includes(m.id))
            .map((m) => ({ email: m.email, name: m.full_name })) || [];

      // If email option is selected, send notification emails
      if (shareOption === 'share-email' && recipients.length > 0) {
        const { error } = await supabase.functions.invoke('send-board-proforma-notification', {
          body: {
            recipients,
            versionLabel: versionLabel || 'Latest Pro Forma',
            versionId,
          },
        });

        if (error) {
          console.error('Email error:', error);
          toast.error('Failed to send notification emails');
          setIsSharing(false);
          return;
        }

        toast.success(`Pro Forma shared and ${recipients.length} notification email(s) sent`);
      } else {
        toast.success('Pro Forma shared to Board Portal');
      }

      onOpenChange(false);

      // Navigate to CFO proforma view (admin route) if "share and view" is selected
      if (shareOption === 'share-view') {
        navigate('/cfo/proforma');
      }
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Failed to share Pro Forma');
    } finally {
      setIsSharing(false);
    }
  };

  const shareOptions = [
    {
      value: 'share-view' as ShareOption,
      label: 'Share and View',
      description: 'Share to Board Portal and navigate to view it',
      icon: Eye,
    },
    {
      value: 'share-only' as ShareOption,
      label: 'Share Only',
      description: 'Share to Board Portal without navigating',
      icon: Share2,
    },
    {
      value: 'share-email' as ShareOption,
      label: 'Share and Email Board',
      description: 'Share and send email notification to board members',
      icon: Mail,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Share Pro Forma to Board
          </DialogTitle>
          <DialogDescription>
            {versionLabel
              ? `Share "${versionLabel}" to the Board Portal`
              : 'Share the current Pro Forma to the Board Portal'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Share Option Selection */}
          <RadioGroup
            value={shareOption}
            onValueChange={(v) => setShareOption(v as ShareOption)}
            className="space-y-3"
          >
            {shareOptions.map((option) => {
              const Icon = option.icon;
              return (
                <div
                  key={option.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                    shareOption === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground/50'
                  }`}
                  onClick={() => setShareOption(option.value)}
                >
                  <RadioGroupItem value={option.value} id={option.value} className="mt-0.5" />
                  <div className="flex-1">
                    <Label
                      htmlFor={option.value}
                      className="text-sm font-medium cursor-pointer flex items-center gap-2"
                    >
                      <Icon className="w-4 h-4" />
                      {option.label}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {option.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </RadioGroup>

          {/* Board Member Selection (only for email option) */}
          {shareOption === 'share-email' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Select Recipients
                </Label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="send-all"
                    checked={sendToAll}
                    onCheckedChange={(checked) => handleSendToAllChange(checked === true)}
                  />
                  <Label htmlFor="send-all" className="text-sm cursor-pointer">
                    Send to All
                  </Label>
                </div>
              </div>

              {loadingMembers ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : boardMembers && boardMembers.length > 0 ? (
                <ScrollArea className="h-[180px] border rounded-lg p-2">
                  <div className="space-y-2">
                    {boardMembers.map((member) => (
                      <div
                        key={member.id}
                        className={`flex items-center gap-3 p-2 rounded-md transition-colors ${
                          sendToAll || selectedMembers.includes(member.id)
                            ? 'bg-primary/10'
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        <Checkbox
                          id={`member-${member.id}`}
                          checked={sendToAll || selectedMembers.includes(member.id)}
                          disabled={sendToAll}
                          onCheckedChange={() => handleMemberToggle(member.id)}
                        />
                        <Label
                          htmlFor={`member-${member.id}`}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="text-sm font-medium">{member.full_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {member.email}
                            {member.role && ` · ${member.role}`}
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-4 text-sm text-muted-foreground border rounded-lg">
                  No board members found. Add board members in Board Member Management.
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            disabled={
              isSharing ||
              (shareOption === 'share-email' &&
                !sendToAll &&
                selectedMembers.length === 0)
            }
          >
            {isSharing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sharing...
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 mr-2" />
                {shareOption === 'share-email' ? 'Share & Send Email' : 'Share'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
