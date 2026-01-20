import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Download, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const BASE_MASCOT_STYLE = `A cute, friendly 5-point cartoon star character mascot for Seeksy.

STYLE REQUIREMENTS:
- Cute, friendly 5-point cartoon star
- Soft shading and slight 3D depth (like a premium mascot illustration)
- Warm, cheerful expression
- Two small arms and legs (rounded, friendly proportions)
- Clean vector-like aesthetic, but with soft highlights
- No harsh outlines
- No pixelation
- Warm yellow-to-gold coloring on the star body
- Professional mascot illustration quality

POSE:
- Standing upright
- Big friendly smile
- Waving with one hand
- Feet visible at the bottom

TRANSPARENCY REQUIREMENTS (CRITICAL):
- Final output MUST have a fully transparent background
- No white box, no gray box, no gradients, no shadows
- No glow effects around edges
- Export as PNG with alpha transparency
- Only the star mascot should appear in the final image

NEGATIVE PROMPT (DO NOT INCLUDE ANY OF THIS):
- No logos (especially no Seeksy text or icons)
- No holiday background
- No room, no props
- No watermark, no text
- No background color of any kind

SIZE:
- Square 1:1 aspect ratio
- Minimum 1024×1024 resolution
- Clean edges with proper anti-aliasing`;

interface MascotVersion {
  id: string;
  title: string;
  description: string;
  icon: string;
  variations: number;
  prompt: string;
}

const MASCOT_VERSIONS: MascotVersion[] = [
  {
    id: "santa-hat",
    title: "🎅 Santa Hat",
    description: "Standard holiday mascot with classic Santa hat",
    icon: "🎅",
    variations: 3,
    prompt: `${BASE_MASCOT_STYLE}

ADDITIONAL ACCESSORIES:
- Add a cute Santa hat:
  • Classic red body with soft texture
  • Soft white fur trim
  • White pom-pom at the tip
  • Natural fit on top of the star

OUTPUT: Only the star mascot with Santa hat on a fully transparent background (PNG with alpha channel).`
  },
  {
    id: "santa-scarf",
    title: "🧣 Santa Hat + Cozy Scarf",
    description: "Festive mascot with Santa hat and winter scarf",
    icon: "🧣",
    variations: 3,
    prompt: `${BASE_MASCOT_STYLE}

ADDITIONAL ACCESSORIES:
- Santa hat (same as version 1):
  • Classic red body with soft texture
  • Soft white fur trim
  • White pom-pom at the tip
  
- Add a soft cozy scarf:
  • Wrapped once around the neck naturally
  • Choose red, green, or striped red-white
  • Soft fabric texture
  • Flows naturally with the character

OUTPUT: Only the star mascot with Santa hat and scarf on a fully transparent background (PNG with alpha channel).`
  },
  {
    id: "santa-mic",
    title: "🎤 Santa Hat + Microphone",
    description: "Podcast edition with Santa hat and mini mic",
    icon: "🎤",
    variations: 3,
    prompt: `${BASE_MASCOT_STYLE}

ADDITIONAL ACCESSORIES:
- Santa hat:
  • Classic red body with soft texture
  • Soft white fur trim
  • White pom-pom at the tip
  
- Small handheld microphone:
  • Rounded podcast mic style
  • Held naturally in the non-waving hand
  • Professional podcast microphone design
  • Proportional to the character size

OUTPUT: Only the star mascot with Santa hat and microphone on a fully transparent background (PNG with alpha channel).`
  },
  {
    id: "holiday-sparkles",
    title: "✨ Holiday Sparkles",
    description: "Base mascot with subtle holiday sparkles",
    icon: "✨",
    variations: 2,
    prompt: `${BASE_MASCOT_STYLE}

ADDITIONAL ELEMENTS:
- Add subtle holiday sparkles:
  • Very soft, small glows or twinkles
  • Positioned around the mascot, not touching it
  • Light gold or soft white color
  • Minimal and spaced out
  • Should look like gentle holiday magic

IMPORTANT:
- Keep sparkles minimal and separate from the mascot
- No background behind sparkles
- Sparkles should be subtle and tasteful

OUTPUT: Only the star mascot with subtle sparkles around it on a fully transparent background (PNG with alpha channel).`
  }
];

const MascotGeneratorPage = () => {
  const [generating, setGenerating] = useState<Record<string, boolean>>({});
  const [mascots, setMascots] = useState<Record<string, string[]>>({});

  const generateVersion = async (version: MascotVersion) => {
    setGenerating(prev => ({ ...prev, [version.id]: true }));
    
    try {
      // Generate variations in parallel
      const variationNumbers = Array.from({ length: version.variations }, (_, i) => i + 1);
      const promises = variationNumbers.map(async (variationNumber) => {
        const { data, error } = await supabase.functions.invoke('generate-mascot', {
          body: {
            prompt: version.prompt,
            variationNumber
          }
        });

        if (error) throw error;
        return data.imageUrl;
      });

      const results = await Promise.all(promises);
      setMascots(prev => ({ ...prev, [version.id]: results.filter(Boolean) }));
      toast.success(`Successfully generated ${version.variations} ${version.title} variations!`);
    } catch (error) {
      console.error('Error generating mascots:', error);
      toast.error(`Failed to generate ${version.title} mascots`);
    } finally {
      setGenerating(prev => ({ ...prev, [version.id]: false }));
    }
  };

  const downloadMascot = async (versionId: string, imageUrl: string, index: number) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const timestamp = new Date().toISOString().slice(0, 16).replace(/[:-]/g, '');
      a.href = url;
      a.download = `seeksy-mascot-${versionId}-v${index + 1}-${timestamp}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`Mascot variation ${index + 1} downloaded!`);
    } catch (error) {
      console.error('Error downloading mascot:', error);
      toast.error('Failed to download mascot');
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            Holiday Mascot Generator
          </h1>
          <p className="text-muted-foreground text-lg">
            Generate transparent PNG variations of holiday-themed Seeksy star mascots
          </p>
        </div>

        {/* Base Requirements Card */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Base Mascot Style (All Versions)</CardTitle>
            <CardDescription>Every version uses these core characteristics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <h4 className="font-medium text-sm mb-2">✓ Character</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 5-point cartoon star</li>
                  <li>• Soft 3D shading</li>
                  <li>• Warm expression</li>
                  <li>• Arms and legs</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-sm mb-2">✓ Pose</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Standing upright</li>
                  <li>• Big smile</li>
                  <li>• Waving</li>
                  <li>• Feet visible</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-sm mb-2">✓ Transparency</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Fully transparent</li>
                  <li>• PNG alpha</li>
                  <li>• No halos</li>
                  <li>• 1024×1024</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-sm mb-2">✗ Never Include</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• No logos/text</li>
                  <li>• No backgrounds</li>
                  <li>• No shadows</li>
                  <li>• No watermarks</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Version Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {MASCOT_VERSIONS.map((version) => {
            const isGenerating = generating[version.id];
            const versionMascots = mascots[version.id] || [];

            return (
              <Card key={version.id} className="border-border/50">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl mb-1">{version.title}</CardTitle>
                      <CardDescription>{version.description}</CardDescription>
                    </div>
                    <span className="text-4xl">{version.icon}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={() => generateVersion(version)}
                    disabled={isGenerating}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating {version.variations} variations...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate {version.variations} Variations
                      </>
                    )}
                  </Button>

                  {/* Results Grid */}
                  {versionMascots.length > 0 && (
                    <div className="grid gap-3 grid-cols-3">
                      {versionMascots.map((imageUrl, index) => (
                        <div key={index} className="space-y-2">
                          <div 
                            className="relative aspect-square rounded-lg overflow-hidden border"
                            style={{
                              background: 'repeating-conic-gradient(hsl(var(--muted)) 0% 25%, transparent 0% 50%) 50% / 16px 16px'
                            }}
                          >
                            <img 
                              src={imageUrl} 
                              alt={`${version.title} variation ${index + 1}`}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <Button
                            onClick={() => downloadMascot(version.id, imageUrl, index)}
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            V{index + 1}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Instructions */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <h4 className="font-medium mb-2">Usage Instructions:</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Choose the holiday version that fits your marketing needs</li>
              <li>Generate 2-3 variations for each version you want</li>
              <li>Download your favorites (PNG with transparent background)</li>
              <li>Test transparency by placing over different colored backgrounds</li>
              <li>Use in website, social media, email campaigns, or app interfaces</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MascotGeneratorPage;
