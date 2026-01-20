import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { HeroAsset, HeroOverlaySettings, HeroVariant, MotionType } from "@/types/hero";
import { Sparkles } from "lucide-react";

interface HeroPreviewPanelProps {
  asset?: HeroAsset;
  overlaySettings: HeroOverlaySettings;
  selectedVariant: HeroVariant;
  onOverlayChange: (partial: Partial<HeroOverlaySettings>) => void;
  onVariantChange: (variant: HeroVariant) => void;
}

export function HeroPreviewPanel({
  asset,
  overlaySettings,
  selectedVariant,
  onOverlayChange,
  onVariantChange
}: HeroPreviewPanelProps) {
  const getOverlayGradient = () => {
    const opacity = overlaySettings.overlayOpacity;
    switch (overlaySettings.overlayPosition) {
      case 'left':
        return `linear-gradient(to right, rgba(0,0,0,${opacity}) 0%, rgba(0,0,0,${opacity * 0.8}) 35%, rgba(0,0,0,0) 60%)`;
      case 'center':
        return `linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,${opacity}) 30%, rgba(0,0,0,${opacity}) 70%, rgba(0,0,0,0) 100%)`;
      case 'right':
        return `linear-gradient(to left, rgba(0,0,0,${opacity}) 0%, rgba(0,0,0,${opacity * 0.8}) 35%, rgba(0,0,0,0) 60%)`;
      default:
        return `linear-gradient(to right, rgba(0,0,0,${opacity}) 0%, rgba(0,0,0,0) 60%)`;
    }
  };

  const getContentAlignment = () => {
    switch (overlaySettings.overlayPosition) {
      case 'left':
        return 'items-start text-left';
      case 'center':
        return 'items-center text-center';
      case 'right':
        return 'items-end text-right';
      default:
        return 'items-start text-left';
    }
  };

  const shouldShowMotionBadge = overlaySettings.motionEnabled && 
    overlaySettings.motionType !== 'none' && 
    !asset?.motionUrl;

  return (
    <div className="space-y-6">
      {/* Live Hero Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Live Hero Preview</CardTitle>
          <CardDescription>
            Preview how your hero will look on the homepage with text overlay
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted"
            style={{
              backgroundImage: asset?.staticUrl ? `url(${asset.staticUrl})` : 'linear-gradient(135deg, hsl(var(--muted)) 0%, hsl(var(--muted-foreground) / 0.1) 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            {/* Motion layer simulation */}
            {overlaySettings.motionEnabled && overlaySettings.motionType !== 'none' && (
              <div className="absolute inset-0 pointer-events-none">
                {overlaySettings.motionType === 'light_shimmer' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_3s_ease-in-out_infinite]" />
                )}
                {overlaySettings.motionType === 'bokeh_twinkle' && (
                  <div className="absolute inset-0">
                    <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-white/20 animate-pulse" />
                    <div className="absolute top-1/3 right-1/3 w-3 h-3 rounded-full bg-white/15 animate-pulse delay-150" />
                    <div className="absolute bottom-1/3 left-1/2 w-2 h-2 rounded-full bg-white/25 animate-pulse delay-300" />
                  </div>
                )}
              </div>
            )}

            {/* Text overlay */}
            <div 
              className="absolute inset-0 flex flex-col justify-center p-8 md:p-12 lg:p-16"
              style={{ background: getOverlayGradient() }}
            >
              <div className={`flex flex-col gap-6 max-w-2xl ${getContentAlignment()}`}>
                <div className="space-y-4">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
                    {overlaySettings.headline || "Your headline here"}
                  </h1>
                  <p className="text-lg md:text-xl text-white/90 leading-relaxed">
                    {overlaySettings.subheadline || "Your subheadline here"}
                  </p>
                </div>
                
                <div className="flex gap-4 flex-wrap">
                  <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Create Your Free Account
                  </Button>
                  <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
                    Book a Demo
                  </Button>
                </div>
              </div>
            </div>

            {/* Motion preview badge */}
            {shouldShowMotionBadge && (
              <div className="absolute top-4 right-4 bg-primary/90 text-primary-foreground px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" />
                Motion: {overlaySettings.motionType.replace('_', ' ')} (preview only)
              </div>
            )}

            {!asset?.staticUrl && (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                <p className="text-center">Generate a hero to see preview</p>
              </div>
            )}
          </div>

          {/* Usage note */}
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>How to use:</strong> Use the static hero as your homepage background image. 
              If you enable motion overlays in your frontend, layer the motion asset on top and keep it subtle for best performance.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Hero Settings</CardTitle>
          <CardDescription>Customize overlay, text, and motion effects</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Hero Type */}
          <div className="space-y-2">
            <Label>Hero Type</Label>
            <Select value={selectedVariant} onValueChange={(v) => onVariantChange(v as HeroVariant)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="studio">Studio</SelectItem>
                <SelectItem value="holiday">Holiday</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Overlay Settings */}
          <div className="space-y-4">
            <h4 className="font-medium">Overlay Settings</h4>
            
            <div className="space-y-2">
              <Label>Overlay Position</Label>
              <Select 
                value={overlaySettings.overlayPosition} 
                onValueChange={(v) => onOverlayChange({ overlayPosition: v as 'left' | 'center' | 'right' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Overlay Strength: {Math.round(overlaySettings.overlayOpacity * 100)}%</Label>
              <Slider
                value={[overlaySettings.overlayOpacity * 100]}
                onValueChange={([v]) => onOverlayChange({ overlayOpacity: v / 100 })}
                min={0}
                max={100}
                step={5}
              />
            </div>
          </div>

          {/* Text Settings */}
          <div className="space-y-4">
            <h4 className="font-medium">Text Settings</h4>
            
            <div className="space-y-2">
              <Label>Headline</Label>
              <Input
                value={overlaySettings.headline}
                onChange={(e) => onOverlayChange({ headline: e.target.value })}
                placeholder="Your headline here"
              />
            </div>

            <div className="space-y-2">
              <Label>Subheadline</Label>
              <Textarea
                value={overlaySettings.subheadline}
                onChange={(e) => onOverlayChange({ subheadline: e.target.value })}
                placeholder="Your subheadline here"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Text Alignment</Label>
              <Select 
                value={overlaySettings.textAlign} 
                onValueChange={(v) => onOverlayChange({ textAlign: v as 'left' | 'center' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Motion Settings */}
          <div className="space-y-4">
            <h4 className="font-medium">Motion Settings</h4>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="motion-enabled">Enable Motion</Label>
              <Switch
                id="motion-enabled"
                checked={overlaySettings.motionEnabled}
                onCheckedChange={(checked) => onOverlayChange({ motionEnabled: checked })}
              />
            </div>

            {overlaySettings.motionEnabled && (
              <div className="space-y-2">
                <Label>Motion Type</Label>
                <Select 
                  value={overlaySettings.motionType} 
                  onValueChange={(v) => onOverlayChange({ motionType: v as MotionType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="light_shimmer">Light Shimmer</SelectItem>
                    <SelectItem value="bokeh_twinkle">Bokeh Twinkle</SelectItem>
                    <SelectItem value="icon_float">Icon Float</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Motion effects are simulated with CSS. Backend motion generation coming soon.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Add shimmer keyframe to global styles if needed
const style = document.createElement('style');
style.textContent = `
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
`;
document.head.appendChild(style);
