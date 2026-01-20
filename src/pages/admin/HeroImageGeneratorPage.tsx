import { useState } from "react";
import { HeroVariantCard } from "@/components/hero/HeroVariantCard";
import { HeroPreviewPanel } from "@/components/hero/HeroPreviewPanel";
import { HeroAsset, HeroOverlaySettings, HeroVariant, DEFAULT_OVERLAY_SETTINGS } from "@/types/hero";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const HERO_PROMPTS = {
  studio: `A 16:9 aspect ratio professional creator studio hero image. Ultra high resolution, photorealistic scene featuring a warm, bright, modern content creation environment. Show a creator speaking into a professional microphone at a clean, well-lit desk. Include soft LED panel lights creating warm highlights, a camera on a tripod, and multiple screens showing other creators in a video call or recording session. The scene should have clean lines, minimal clutter, soft bokeh in the background, and subtle screen reflections. Use natural lighting mixed with professional studio lights. The overall atmosphere should communicate trust, professionalism, and high-quality content creation. Color palette: warm whites, soft grays, gentle warm tones. Premium Apple-like aesthetic with generous negative space.`,
  
  holiday: `A 16:9 aspect ratio professional creator studio hero image with subtle seasonal warmth. Ultra high resolution, photorealistic scene similar to a modern content creation studio but with elegant holiday touches. Show a creator speaking into a professional microphone at a clean desk with soft LED lighting. Include the same professional setup (camera, screens showing other creators) but add subtle golden bokeh lights in the background, a gentle warm amber glow, and a slightly cozier warm palette. No Christmas trees, no red/green colors, no obvious decorations—keep it elegant and premium. The festive element should be minimal and sophisticated: just soft golden light particles and warm atmospheric lighting. The scene should still feel modern and professional, just with added seasonal warmth. Premium aesthetic that says "celebration" without being obvious.`,
  
  technology: `A 16:9 aspect ratio premium technology-focused hero image with modern Apple/Stripe design aesthetic. Ultra high resolution abstract composition with a clean white-to-light-blue gradient background. Feature floating translucent glass UI cards displaying: a stylized face scan icon with geometric grid overlay, an animated voice waveform with frequency visualization, a video clip frame with trim markers, and a blockchain certification badge with chain links. Use soft directional lighting creating subtle reflections on the glass surfaces. Include gentle glows around UI elements in cyan and blue tones. Abstract light rays in the background. Minimal geometric shapes floating in space. The overall composition should feel futuristic, secure, and innovative—like Apple's marketing materials or Stripe's product pages. No physical environment, no people—pure digital interface visualization. Communicate trust, security, and cutting-edge AI technology through abstract visual language.`
};

const VARIANT_INFO = {
  studio: {
    title: "Studio Version",
    description: "Clean, bright creator studio with professional setup"
  },
  holiday: {
    title: "Holiday Version", 
    description: "Studio with subtle seasonal warmth and golden bokeh"
  },
  technology: {
    title: "Technology Version",
    description: "Abstract UI cards with Apple/Stripe aesthetic"
  }
};

const HeroImageGeneratorPage = () => {
  const [generating, setGenerating] = useState<HeroVariant | null>(null);
  const [assets, setAssets] = useState<Record<HeroVariant, HeroAsset[]>>({
    studio: [],
    holiday: [],
    technology: []
  });
  const [selectedVariant, setSelectedVariant] = useState<HeroVariant>('studio');
  const [selectedAssetIndex, setSelectedAssetIndex] = useState<number>(0);
  const [overlaySettings, setOverlaySettings] = useState<HeroOverlaySettings>({
    overlayPosition: 'left',
    overlayOpacity: 0.7,
    textAlign: 'left',
    headline: DEFAULT_OVERLAY_SETTINGS.studio.headline,
    subheadline: DEFAULT_OVERLAY_SETTINGS.studio.subheadline,
    motionEnabled: false,
    motionType: 'none'
  });

  const generateImage = async (variant: HeroVariant) => {
    setGenerating(variant);
    try {
      const { data, error } = await supabase.functions.invoke('generate-hero-image', {
        body: {
          prompt: HERO_PROMPTS[variant],
          variant,
          count: 6 // Generate 6 variations
        }
      });

      if (error) throw error;

      if (data.imageUrls && Array.isArray(data.imageUrls)) {
        const newAssets: HeroAsset[] = data.imageUrls.map((url: string) => ({
          id: crypto.randomUUID(),
          variant,
          staticUrl: url,
          createdAt: new Date().toISOString()
        }));
        
        setAssets(prev => ({ ...prev, [variant]: newAssets }));
        setSelectedVariant(variant);
        setSelectedAssetIndex(0);
        
        // Update text to match variant
        setOverlaySettings(prev => ({
          ...prev,
          headline: DEFAULT_OVERLAY_SETTINGS[variant].headline,
          subheadline: DEFAULT_OVERLAY_SETTINGS[variant].subheadline
        }));
        
        toast.success(`${VARIANT_INFO[variant].title} - ${data.count} variations generated!`);
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Failed to generate hero image');
    } finally {
      setGenerating(null);
    }
  };

  const downloadImage = async (variant: HeroVariant, index: number) => {
    const asset = assets[variant]?.[index];
    if (!asset?.staticUrl) {
      toast.error('No image to download');
      return;
    }

    try {
      const response = await fetch(asset.staticUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const timestamp = new Date().toISOString().slice(0, 16).replace(/[:-]/g, '');
      a.href = url;
      a.download = `seeksy-hero-${variant}-${index + 1}-${timestamp}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Hero image downloaded!');
    } catch (error) {
      console.error('Error downloading image:', error);
      toast.error('Failed to download image');
    }
  };

  const handleOverlayChange = (partial: Partial<HeroOverlaySettings>) => {
    setOverlaySettings(prev => ({ ...prev, ...partial }));
  };

  const handleVariantChange = (variant: HeroVariant) => {
    setSelectedVariant(variant);
    // Update text defaults when switching variants
    setOverlaySettings(prev => ({
      ...prev,
      headline: DEFAULT_OVERLAY_SETTINGS[variant].headline,
      subheadline: DEFAULT_OVERLAY_SETTINGS[variant].subheadline
    }));
  };

  const currentAssets = assets[selectedVariant];
  const currentAsset = currentAssets?.[selectedAssetIndex];

  return (
    <div className="min-h-screen bg-background p-6 space-y-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2">Hero Image Generator</h1>
          <p className="text-muted-foreground text-lg">
            Generate 6 premium hero variations per click with live preview
          </p>
        </div>

        {/* Variant Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {(['studio', 'holiday', 'technology'] as HeroVariant[]).map((variant) => (
            <HeroVariantCard
              key={variant}
              variant={variant}
              title={VARIANT_INFO[variant].title}
              description={VARIANT_INFO[variant].description}
              previewImageUrl={assets[variant]?.[0]?.staticUrl}
              isGenerating={generating === variant}
              onGenerate={() => generateImage(variant)}
              onDownload={() => downloadImage(variant, 0)}
              lastGeneratedAt={assets[variant]?.[0]?.createdAt}
            />
          ))}
        </div>

        {/* Generated Variations Grid */}
        {currentAssets && currentAssets.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">
              {VARIANT_INFO[selectedVariant].title} - {currentAssets.length} Variations
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {currentAssets.map((asset, index) => (
                <div
                  key={asset.id}
                  className="group relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all"
                  style={{
                    borderColor: index === selectedAssetIndex ? 'hsl(var(--primary))' : 'transparent'
                  }}
                  onClick={() => setSelectedAssetIndex(index)}
                >
                  <img
                    src={asset.staticUrl}
                    alt={`Variation ${index + 1}`}
                    className="w-full aspect-video object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadImage(selectedVariant, index);
                      }}
                      className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium"
                    >
                      Download
                    </button>
                  </div>
                  <div className="absolute top-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs font-medium">
                    #{index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Preview & Controls */}
        <HeroPreviewPanel
          asset={currentAsset}
          overlaySettings={overlaySettings}
          selectedVariant={selectedVariant}
          onOverlayChange={handleOverlayChange}
          onVariantChange={handleVariantChange}
        />
      </div>
    </div>
  );
};

export default HeroImageGeneratorPage;
