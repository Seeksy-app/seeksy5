import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Helmet } from "react-helmet";
import { 
  Verified, 
  ExternalLink, 
  Youtube, 
  Music, 
  Radio,
  Twitter,
  Linkedin,
  Instagram,
  Globe,
  Mail
} from "lucide-react";
import { GuestRequestModal } from "@/components/landing/GuestRequestModal";

const platformIcons = {
  youtube: Youtube,
  spotify: Music,
  apple_podcasts: Radio,
  rss_audio: Radio,
  other: ExternalLink,
};

const socialIcons = {
  twitter: Twitter,
  linkedin: Linkedin,
  instagram: Instagram,
  youtube: Youtube,
  website: Globe,
  newsletter: Mail,
  tiktok: Music,
  other: Globe,
};

export default function PublicLandingPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: landingPage, isLoading } = useQuery({
    queryKey: ["landing-page", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landing_pages")
        .select(`
          *,
          landing_social_links(*),
          guest_appearances(*),
          landing_ctas(*)
        `)
        .eq("slug", slug)
        .eq("is_published", true)
        .single();

      if (error) throw error;
      return data as any;
    },
    enabled: !!slug,
  });

  const { data: identityStatus } = useQuery<{ voiceVerified: boolean; faceVerified: boolean }>({
    queryKey: ["identity-status", landingPage?.owner_user_id],
    queryFn: async () => {
      if (!landingPage?.owner_user_id) return { voiceVerified: false, faceVerified: false };

      // Check face verification
      // @ts-ignore - Bypass deep Supabase type inference
      const faceResult = await supabase
        .from("identity_assets")
        .select("cert_status")
        .eq("user_id", landingPage.owner_user_id)
        .eq("asset_type", "FACE_IDENTITY")
        .eq("cert_status", "minted")
        .limit(1);
      
      const faceAssets = (faceResult.data || []) as Array<{ cert_status: string }>;

      // Check voice verification
      const { data: voiceProfiles } = await supabase
        .from("creator_voice_profiles")
        .select("is_verified")
        .eq("user_id", landingPage.owner_user_id)
        .eq("is_verified", true)
        .limit(1);

      return {
        faceVerified: (faceAssets && faceAssets.length > 0),
        voiceVerified: (voiceProfiles && voiceProfiles.length > 0),
      } as { voiceVerified: boolean; faceVerified: boolean };
    },
    enabled: !!landingPage?.owner_user_id,
  });

  const [guestRequestOpen, setGuestRequestOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!landingPage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Page Not Found</h1>
          <p className="text-muted-foreground">This landing page doesn't exist or hasn't been published yet.</p>
        </div>
      </div>
    );
  }

  const appearances = (landingPage.guest_appearances || []).sort((a: any, b: any) => {
    if (a.is_featured && !b.is_featured) return -1;
    if (!a.is_featured && b.is_featured) return 1;
    return new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime();
  });

  const socialLinks = (landingPage.landing_social_links || []).sort((a: any, b: any) => a.sort_order - b.sort_order);
  const ctas = (landingPage.landing_ctas || []).sort((a: any, b: any) => a.sort_order - b.sort_order);

  return (
    <>
      <Helmet>
        <title>{landingPage.title} | Seeksy</title>
        <meta name="description" content={landingPage.subtitle || landingPage.bio} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-primary/10 via-background to-accent/10 pt-20 pb-16">
          <div className="max-w-4xl mx-auto px-6 text-center">
            {landingPage.avatar_url && (
              <img
                src={landingPage.avatar_url}
                alt={landingPage.title}
                className="w-32 h-32 rounded-full mx-auto mb-6 border-4 border-background shadow-xl"
              />
            )}
            
            <h1 className="text-5xl font-bold mb-4">{landingPage.title}</h1>
            
            {landingPage.subtitle && (
              <p className="text-xl text-muted-foreground mb-6">{landingPage.subtitle}</p>
            )}

            {/* Identity Badges */}
            {identityStatus && (identityStatus.voiceVerified || identityStatus.faceVerified) && (
              <div className="flex items-center justify-center gap-3 mb-8">
                {identityStatus.faceVerified && (
                  <Badge variant="secondary" className="gap-2 px-4 py-2">
                    <Verified className="h-4 w-4" />
                    Face Verified
                  </Badge>
                )}
                {identityStatus.voiceVerified && (
                  <Badge variant="secondary" className="gap-2 px-4 py-2">
                    <Verified className="h-4 w-4" />
                    Voice Verified
                  </Badge>
                )}
              </div>
            )}

            {landingPage.bio && (
              <p className="text-lg text-foreground/80 max-w-2xl mx-auto mb-8">{landingPage.bio}</p>
            )}

            {/* Primary CTAs */}
            {ctas.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-4">
                {ctas.map((cta: any) => {
                  const isGuestRequest = cta.url === '#guest-request';
                  
                  if (isGuestRequest) {
                    return (
                      <Button
                        key={cta.id}
                        variant={cta.cta_type as any}
                        size="lg"
                        onClick={() => setGuestRequestOpen(true)}
                      >
                        {cta.label}
                      </Button>
                    );
                  }
                  
                  return (
                    <Button
                      key={cta.id}
                      variant={cta.cta_type as any}
                      size="lg"
                      asChild
                    >
                      <a href={cta.url} target={cta.url.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
                        {cta.label}
                        {cta.url.startsWith('http') && <ExternalLink className="ml-2 h-4 w-4" />}
                      </a>
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Main Player Section - For Creator Pages */}
        {landingPage.page_type === 'creator' && landingPage.main_player_url && (
          <div className="max-w-4xl mx-auto px-6 py-12">
            <h2 className="text-3xl font-bold mb-6 text-center">Listen Now</h2>
            <div className="aspect-video rounded-lg overflow-hidden shadow-2xl">
              <iframe
                src={landingPage.main_player_url}
                className="w-full h-full"
                allow="encrypted-media; autoplay; clipboard-write"
                loading="lazy"
              />
            </div>
          </div>
        )}

        {/* Guest Appearances / Episodes Section */}
        {appearances.length > 0 && (
          <div className="max-w-6xl mx-auto px-6 py-12">
            <h2 className="text-3xl font-bold mb-8 text-center">
              {landingPage.page_type === 'guest' ? 'Podcast Appearances' : 'Featured Episodes'}
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {appearances.map((appearance: any) => {
                const PlatformIcon = platformIcons[appearance.platform as keyof typeof platformIcons] || ExternalLink;
                
                return (
                  <Card key={appearance.id} className="group hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      {appearance.is_featured && (
                        <Badge className="mb-3">Featured</Badge>
                      )}
                      
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                        {appearance.title}
                      </h3>
                      
                      <p className="text-sm text-muted-foreground mb-3">
                        {appearance.show_name}
                      </p>

                      <div className="flex items-center gap-2 mb-4">
                        <Badge variant="outline" className="gap-1.5">
                          <PlatformIcon className="h-3 w-3" />
                          {appearance.platform.replace('_', ' ')}
                        </Badge>
                        {appearance.published_at && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(appearance.published_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {appearance.tags && appearance.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {appearance.tags.slice(0, 3).map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                        asChild
                      >
                        <a href={appearance.episode_url} target="_blank" rel="noopener noreferrer">
                          Listen Now
                          <ExternalLink className="ml-2 h-3 w-3" />
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Social Links Section */}
        {socialLinks.length > 0 && (
          <div className="max-w-4xl mx-auto px-6 py-12">
            <h2 className="text-2xl font-bold mb-6 text-center">Connect</h2>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {socialLinks.map((link: any) => {
                const SocialIcon = socialIcons[link.platform as keyof typeof socialIcons] || Globe;
                
                return (
                  <Button
                    key={link.id}
                    variant="outline"
                    size="lg"
                    asChild
                  >
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="gap-2">
                      <SocialIcon className="h-5 w-5" />
                      {link.label || link.platform}
                    </a>
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-12 text-muted-foreground text-sm">
          <p>Powered by Seeksy</p>
        </div>
      </div>

      {/* Guest Request Modal */}
      <GuestRequestModal
        open={guestRequestOpen}
        onOpenChange={setGuestRequestOpen}
        creatorId={landingPage?.owner_user_id || ''}
        creatorName={landingPage?.title || 'this creator'}
      />
    </>
  );
}
