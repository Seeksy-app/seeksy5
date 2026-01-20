import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Facebook, Instagram, Youtube, Linkedin, Globe } from "lucide-react";

interface SocialLink {
  platform: string;
  url: string;
  enabled: boolean;
}

interface SocialLinksEditorProps {
  links: Record<string, SocialLink>;
  onChange: (links: Record<string, SocialLink>) => void;
}

const PLATFORMS = [
  { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/username' },
  { key: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'https://youtube.com/@channel' },
  { key: 'tiktok', label: 'TikTok', icon: Globe, placeholder: 'https://tiktok.com/@username' },
  { key: 'facebook', label: 'Facebook', icon: Facebook, placeholder: 'https://facebook.com/page' },
  { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'https://linkedin.com/in/profile' },
  { key: 'x', label: 'X (Twitter)', icon: Globe, placeholder: 'https://x.com/username' },
  { key: 'website', label: 'Website', icon: Globe, placeholder: 'https://yourwebsite.com' },
];

export function SocialLinksEditor({ links, onChange }: SocialLinksEditorProps) {
  const updateLink = (platform: string, field: 'url' | 'enabled', value: string | boolean) => {
    onChange({
      ...links,
      [platform]: {
        ...links[platform],
        platform,
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-1">Social Links</h3>
        <p className="text-sm text-muted-foreground">
          Manage your social media presence across your My Page
        </p>
      </div>

      {PLATFORMS.map((platform) => {
        const link = links[platform.key] || { platform: platform.key, url: '', enabled: false };
        const Icon = platform.icon;

        return (
          <Card key={platform.key}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5 text-muted-foreground" />
                  <CardTitle className="text-base">{platform.label}</CardTitle>
                </div>
                <Switch
                  checked={link.enabled}
                  onCheckedChange={(checked) => updateLink(platform.key, 'enabled', checked)}
                />
              </div>
            </CardHeader>
            {link.enabled && (
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor={`social-${platform.key}`}>Profile URL</Label>
                  <Input
                    id={`social-${platform.key}`}
                    value={link.url}
                    onChange={(e) => updateLink(platform.key, 'url', e.target.value)}
                    placeholder={platform.placeholder}
                  />
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}