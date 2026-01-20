import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Share2, Mail, ExternalLink, Globe, Video, FileText, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ShareWithInvestorsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PLATFORM_VIDEOS = [
  { id: 'board-overview', label: 'Board Overview' },
  { id: 'gtm-strategy', label: 'GTM Strategy' },
  { id: 'platform-demo', label: 'Platform Demo' },
  { id: 'ads-monetization', label: 'Ads & Monetization' },
  { id: 'creator-experience', label: 'Creator Experience' },
];

export function ShareWithInvestorsDialog({
  open,
  onOpenChange,
}: ShareWithInvestorsDialogProps) {
  const navigate = useNavigate();
  const [includeAwards, setIncludeAwards] = useState(false);
  const [includeVideos, setIncludeVideos] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);

  const handleVideoToggle = (videoId: string) => {
    setSelectedVideos(prev => 
      prev.includes(videoId) 
        ? prev.filter(id => id !== videoId)
        : [...prev, videoId]
    );
  };

  const handleSelectAllVideos = () => {
    if (selectedVideos.length === PLATFORM_VIDEOS.length) {
      setSelectedVideos([]);
    } else {
      setSelectedVideos(PLATFORM_VIDEOS.map(v => v.id));
    }
  };

  const handleContinue = () => {
    // Navigate to investor sharing with selected options
    const params = new URLSearchParams();
    if (includeAwards) params.set('awards', 'true');
    if (includeVideos && selectedVideos.length > 0) {
      params.set('videos', selectedVideos.join(','));
    }
    onOpenChange(false);
    navigate(`/board/share?${params.toString()}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-600" />
            Share with Investors
          </DialogTitle>
          <DialogDescription>
            Select what to include in your investor package.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Platform Pro Forma - Always included */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Platform Pro Forma</h3>
                <p className="text-xs text-slate-500">Always included</p>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              AI-Powered 3-Year Pro Forma with key revenue drivers, scenarios, and CFO assumptions.
            </p>
          </div>

          {/* Veterans Podcast Awards Checkbox */}
          <div className="flex items-start gap-3 p-4 border border-border rounded-lg hover:border-purple-200 transition-colors">
            <Checkbox 
              id="include-awards" 
              checked={includeAwards}
              onCheckedChange={(checked) => setIncludeAwards(checked === true)}
              className="mt-0.5"
            />
            <div className="flex-1">
              <Label 
                htmlFor="include-awards" 
                className="flex items-center gap-2 cursor-pointer font-medium"
              >
                <Trophy className="w-4 h-4 text-purple-600" />
                Include Veteran Podcast Awards Pro Forma
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Attach the Events & Awards Platform summary with 3-year financial outlook.
              </p>
              {includeAwards && (
                <Button 
                  variant="link" 
                  size="sm" 
                  className="h-auto p-0 mt-2 text-purple-600"
                  onClick={() => window.open('https://veteranpodcastawards.com', '_blank')}
                >
                  <Globe className="w-3 h-3 mr-1" />
                  View VPA Website
                </Button>
              )}
            </div>
          </div>

          {/* Platform Videos Checkbox */}
          <div className="p-4 border border-border rounded-lg hover:border-blue-200 transition-colors">
            <div className="flex items-start gap-3">
              <Checkbox 
                id="include-videos" 
                checked={includeVideos}
                onCheckedChange={(checked) => {
                  setIncludeVideos(checked === true);
                  if (!checked) setSelectedVideos([]);
                }}
                className="mt-0.5"
              />
              <div className="flex-1">
                <Label 
                  htmlFor="include-videos" 
                  className="flex items-center gap-2 cursor-pointer font-medium"
                >
                  <Video className="w-4 h-4 text-blue-600" />
                  Include Platform Videos
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Select which videos to share with investors.
                </p>
              </div>
            </div>
            
            {includeVideos && (
              <div className="mt-4 pl-7 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Select videos to include:</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-xs"
                    onClick={handleSelectAllVideos}
                  >
                    {selectedVideos.length === PLATFORM_VIDEOS.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
                <div className="space-y-2">
                  {PLATFORM_VIDEOS.map((video) => (
                    <div key={video.id} className="flex items-center gap-2">
                      <Checkbox 
                        id={video.id}
                        checked={selectedVideos.includes(video.id)}
                        onCheckedChange={() => handleVideoToggle(video.id)}
                      />
                      <Label 
                        htmlFor={video.id} 
                        className="text-sm cursor-pointer"
                      >
                        {video.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> All shared links require investors to accept 
            your NDA before viewing. You can revoke access at any time.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleContinue} className="gap-2">
            <ExternalLink className="w-4 h-4" />
            Continue to Sharing
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
