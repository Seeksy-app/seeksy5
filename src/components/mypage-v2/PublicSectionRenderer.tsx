import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MyPageSection } from "@/lib/mypage/sectionTypes";
import { 
  Play, 
  Radio, 
  Calendar, 
  ExternalLink,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  Globe,
  Book,
  Tag,
  Store,
  DollarSign,
  Link as LinkIcon,
  Mic,
  FileText,
  Mail
} from "lucide-react";
import { format } from "date-fns";

interface PublicSectionRendererProps {
  sections: MyPageSection[];
  username: string;
}

const SocialIcon = ({ platform }: { platform: string }) => {
  switch (platform) {
    case 'facebook': return <Facebook className="w-5 h-5" />;
    case 'instagram': return <Instagram className="w-5 h-5" />;
    case 'x': return <span className="text-lg font-bold">𝕏</span>;
    case 'youtube': return <Youtube className="w-5 h-5" />;
    case 'linkedin': return <Linkedin className="w-5 h-5" />;
    case 'website': return <Globe className="w-5 h-5" />;
    default: return <ExternalLink className="w-5 h-5" />;
  }
};

function FeaturedVideoSection({ section }: { section: MyPageSection }) {
  const { data: video } = useQuery({
    queryKey: ["video", section.config.videoId],
    queryFn: async () => {
      if (!section.config.videoId) return null;
      const { data, error } = await supabase
        .from("media_files")
        .select("*")
        .eq("id", section.config.videoId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!section.config.videoId,
  });

  if (!video) {
    return (
      <Card className="overflow-hidden backdrop-blur-sm bg-card/80 border-border/50">
        <CardContent className="p-6 text-center text-muted-foreground">
          <Play className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Add your featured video</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden backdrop-blur-sm bg-card/80 border-border/50 shadow-lg rounded-2xl">
      <div className="relative aspect-video bg-muted">
        {video.file_url && (
          <video
            src={video.file_url}
            poster={video.file_url}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <Button size="lg" className="rounded-full w-16 h-16">
            <Play className="w-8 h-8" />
          </Button>
        </div>
      </div>
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold mb-2">
          {section.config.videoTitle || video.file_name}
        </h3>
        {section.config.videoDescription && (
          <p className="text-muted-foreground mb-4">{section.config.videoDescription}</p>
        )}
        {section.config.ctaUrl && (
          <Button asChild className="w-full">
            <a href={section.config.ctaUrl} target="_blank" rel="noopener noreferrer">
              {section.config.ctaText || "Watch Now"}
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function StreamChannelSection({ section, username }: { section: MyPageSection; username: string }) {
  const isLive = false; // TODO: Check live status from profile

  return (
    <Card className="backdrop-blur-sm bg-card/80 border-border/50 shadow-lg rounded-2xl">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Radio className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-semibold">Stream Channel</h3>
          {isLive && (
            <Badge variant="destructive" className="animate-pulse">
              LIVE
            </Badge>
          )}
        </div>

        {isLive ? (
          <div>
            <p className="text-muted-foreground mb-4">
              {username} is live right now!
            </p>
            <Button className="w-full">
              <Play className="w-4 h-4 mr-2" />
              Join Stream
            </Button>
          </div>
        ) : (
          <div>
            <p className="text-muted-foreground mb-4">
              Not live right now. Check back soon or watch a recent replay.
            </p>
            {section.config.showPastStreams && (
              <Button variant="outline" className="w-full">
                View Recent Streams
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SocialLinksSection({ section }: { section: MyPageSection }) {
  if (!section.config.links || section.config.links.length === 0) {
    return (
      <Card className="backdrop-blur-sm bg-card/80 border-border/50 shadow-lg rounded-2xl">
        <CardContent className="p-6 text-center text-muted-foreground">
          <ExternalLink className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Add your social links</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="backdrop-blur-sm bg-card/80 border-border/50 shadow-lg rounded-2xl">
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold mb-4">Connect with me</h3>
        <div className="grid grid-cols-2 gap-3">
          {section.config.links.map((link: any, index: number) => (
            <Button
              key={index}
              variant="outline"
              className="justify-start"
              asChild
            >
              <a href={link.url} target="_blank" rel="noopener noreferrer">
                <SocialIcon platform={link.platform} />
                <span className="ml-2">
                  {link.label || link.platform.charAt(0).toUpperCase() + link.platform.slice(1)}
                </span>
              </a>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function MeetingsSection({ section }: { section: MyPageSection }) {
  const { data: meeting } = useQuery({
    queryKey: ["meeting", section.config.meetingTypeId],
    queryFn: async () => {
      if (!section.config.meetingTypeId) return null;
      const { data, error } = await supabase
        .from("meetings")
        .select("*")
        .eq("id", section.config.meetingTypeId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!section.config.meetingTypeId,
  });

  const bookingUrl = section.config.meetingTypeId 
    ? `/meetings/${section.config.meetingTypeId}/book`
    : section.config.externalUrl;

  if (!bookingUrl) {
    return (
      <Card className="backdrop-blur-sm bg-card/80 border-border/50 shadow-lg rounded-2xl">
        <CardContent className="p-6 text-center text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Add a meeting link</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="backdrop-blur-sm bg-card/80 border-border/50 shadow-lg rounded-2xl">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-semibold">
            {section.config.title || meeting?.title || "Book a Meeting"}
          </h3>
        </div>
        
        {section.config.description && (
          <p className="text-muted-foreground mb-4">{section.config.description}</p>
        )}

        <Button className="w-full" asChild>
          <a href={bookingUrl} target={section.config.externalUrl ? "_blank" : undefined} rel="noopener noreferrer">
            <Calendar className="w-4 h-4 mr-2" />
            Schedule Time
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

function BooksSection({ section }: { section: MyPageSection }) {
  if (!section.config.books || section.config.books.length === 0) {
    return (
      <Card className="backdrop-blur-sm bg-card/80 border-border/50 shadow-lg rounded-2xl">
        <CardContent className="p-6 text-center text-muted-foreground">
          <Book className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Add your books</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="backdrop-blur-sm bg-card/80 border-border/50 shadow-lg rounded-2xl">
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold mb-4">Books</h3>
        <div className="space-y-4">
          {section.config.books.map((book: any) => (
            <div key={book.id} className="flex gap-4 p-4 border rounded-xl bg-card/50">
              <img 
                src={book.coverImage} 
                alt={book.title}
                className="w-20 h-28 object-cover rounded-lg shadow-md"
              />
              <div className="flex-1">
                <h4 className="font-semibold mb-1">{book.title}</h4>
                {book.subtitle && (
                  <p className="text-sm text-muted-foreground mb-2">{book.subtitle}</p>
                )}
                <p className="text-sm mb-3">{book.description}</p>
                <Button size="sm" asChild>
                  <a href={book.ctaUrl} target="_blank" rel="noopener noreferrer">
                    {book.ctaLabel}
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PromoCodesSection({ section }: { section: MyPageSection }) {
  if (!section.config.promoCodes || section.config.promoCodes.length === 0) {
    return (
      <Card className="backdrop-blur-sm bg-card/80 border-border/50 shadow-lg rounded-2xl">
        <CardContent className="p-6 text-center text-muted-foreground">
          <Tag className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Add promo codes</p>
        </CardContent>
      </Card>
    );
  }

  const activePromos = section.config.promoCodes.filter((promo: any) => {
    if (!promo.expirationDate) return true;
    return new Date(promo.expirationDate) > new Date();
  });

  if (activePromos.length === 0) return null;

  return (
    <Card className="backdrop-blur-sm bg-card/80 border-border/50 shadow-lg rounded-2xl">
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold mb-4">Promo Codes</h3>
        <div className="grid gap-3">
          {activePromos.map((promo: any) => (
            <div key={promo.id} className="p-4 border rounded-xl bg-gradient-to-br from-primary/5 to-primary/10">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold">{promo.title}</h4>
                  <div className="mt-1 inline-flex items-center gap-2 px-3 py-1 bg-background border-2 border-dashed border-primary rounded-lg">
                    <Tag className="w-4 h-4 text-primary" />
                    <span className="font-mono font-bold text-primary">{promo.code}</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{promo.description}</p>
              {promo.expirationDate && (
                <p className="text-xs text-muted-foreground mb-2">
                  Expires: {format(new Date(promo.expirationDate), 'MMM d, yyyy')}
                </p>
              )}
              <Button size="sm" className="w-full" asChild>
                <a href={promo.ctaUrl} target="_blank" rel="noopener noreferrer">
                  {promo.ctaLabel}
                </a>
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function StoreSection({ section }: { section: MyPageSection }) {
  const products = section.config.products || [];

  if (products.length === 0) {
    return (
      <Card className="backdrop-blur-sm bg-card/80 border-border/50 shadow-lg rounded-2xl">
        <CardContent className="p-6 text-center text-muted-foreground">
          <Store className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Add products to your store</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="backdrop-blur-sm bg-card/80 border-border/50 shadow-lg rounded-2xl">
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold mb-4">Shop</h3>
        <div className="grid grid-cols-2 gap-4">
          {products.map((product: any) => (
            <div key={product.id} className="border rounded-xl overflow-hidden bg-card/50 hover:shadow-md transition-shadow">
              <img 
                src={product.image} 
                alt={product.name}
                className="w-full aspect-square object-cover"
              />
              <div className="p-3">
                <h4 className="font-semibold text-sm mb-1">{product.name}</h4>
                <p className="text-lg font-bold text-primary mb-2">${product.price}</p>
                <Button size="sm" className="w-full" asChild>
                  <a href={product.ctaUrl} target="_blank" rel="noopener noreferrer">
                    {product.ctaLabel}
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TipsSection({ section }: { section: MyPageSection }) {
  if (!section.config.tipsEnabled) return null;

  const amounts = section.config.tipAmounts || [1, 3, 5, 10];
  const paymentMethods = section.config.paymentMethods || [];

  return (
    <Card className="backdrop-blur-sm bg-card/80 border-border/50 shadow-lg rounded-2xl">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <DollarSign className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-semibold">Support Me</h3>
        </div>
        
        {section.config.tipsMessage && (
          <p className="text-muted-foreground mb-4">{section.config.tipsMessage}</p>
        )}

        <div className="grid grid-cols-4 gap-2 mb-4">
          {amounts.map((amount) => (
            <Button key={amount} variant="outline" size="lg">
              ${amount}
            </Button>
          ))}
        </div>

        {paymentMethods.length > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-2">Or send directly via:</p>
            {paymentMethods.map((method: any, idx: number) => (
              <Button key={idx} variant="outline" className="w-full justify-start" asChild>
                <a href={method.url} target="_blank" rel="noopener noreferrer">
                  <DollarSign className="w-4 h-4 mr-2" />
                  {method.type.charAt(0).toUpperCase() + method.type.slice(1)}: {method.username}
                </a>
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CustomLinksSection({ section }: { section: MyPageSection }) {
  const links = section.config.customLinks || [];

  if (links.length === 0) {
    return (
      <Card className="backdrop-blur-sm bg-card/80 border-border/50 shadow-lg rounded-2xl">
        <CardContent className="p-6 text-center text-muted-foreground">
          <LinkIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Add custom links</p>
        </CardContent>
      </Card>
    );
  }

  // Group links by groupName
  const grouped: Record<string, any[]> = {};
  links.forEach((link: any) => {
    const group = link.groupName || 'Links';
    if (!grouped[group]) grouped[group] = [];
    grouped[group].push(link);
  });

  return (
    <Card className="backdrop-blur-sm bg-card/80 border-border/50 shadow-lg rounded-2xl">
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold mb-4">Links</h3>
        {Object.entries(grouped).map(([groupName, groupLinks]) => (
          <div key={groupName} className="mb-6 last:mb-0">
            {Object.keys(grouped).length > 1 && (
              <h4 className="font-medium text-sm text-muted-foreground mb-2">{groupName}</h4>
            )}
            <div className="space-y-2">
              {groupLinks.map((link: any) => (
                <Button
                  key={link.id}
                  variant="outline"
                  className="w-full justify-start"
                  asChild
                >
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    {link.thumbnail && (
                      <img src={link.thumbnail} alt="" className="w-6 h-6 rounded mr-2" />
                    )}
                    {!link.thumbnail && <LinkIcon className="w-4 h-4 mr-2" />}
                    {link.label}
                  </a>
                </Button>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function PodcastSection({ section }: { section: MyPageSection }) {
  const { data: podcast } = useQuery({
    queryKey: ["podcast", section.config.podcastId],
    queryFn: async () => {
      if (!section.config.podcastId) return null;
      const { data, error } = await supabase
        .from("podcasts")
        .select("*")
        .eq("id", section.config.podcastId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!section.config.podcastId,
  });

  const { data: episodes } = useQuery({
    queryKey: ["podcast-episodes", section.config.podcastId],
    queryFn: async () => {
      if (!section.config.podcastId) return [];
      const { data, error } = await supabase
        .from("episodes")
        .select("*")
        .eq("podcast_id", section.config.podcastId)
        .order("created_at", { ascending: false })
        .limit(section.config.episodeCount || 3);
      if (error) throw error;
      return data;
    },
    enabled: !!section.config.podcastId,
  });

  if (!podcast) {
    return (
      <Card className="backdrop-blur-sm bg-card/80 border-border/50 shadow-lg rounded-2xl">
        <CardContent className="p-6 text-center text-muted-foreground">
          <Mic className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Connect your podcast</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="backdrop-blur-sm bg-card/80 border-border/50 shadow-lg rounded-2xl">
      <CardContent className="p-6">
        <div className="flex items-start gap-4 mb-4">
          {podcast.cover_image_url && (
            <img 
              src={podcast.cover_image_url} 
              alt={podcast.title}
              className="w-20 h-20 rounded-lg shadow-md"
            />
          )}
          <div className="flex-1">
            <h3 className="text-xl font-semibold mb-1">{podcast.title}</h3>
            <p className="text-sm text-muted-foreground">{podcast.description}</p>
          </div>
        </div>

        {section.config.showLatestEpisodes && episodes && episodes.length > 0 && (
          <div className="space-y-2 mb-4">
            <h4 className="font-medium text-sm">Latest Episodes</h4>
            {episodes.map((episode: any) => (
              <div key={episode.id} className="p-3 border rounded-lg bg-card/50 text-sm">
                <p className="font-medium">{episode.title}</p>
                <p className="text-xs text-muted-foreground">
                  {episode.created_at && format(new Date(episode.created_at), 'MMM d, yyyy')}
                </p>
              </div>
            ))}
          </div>
        )}

        <Button className="w-full" asChild>
          <a href={`/podcasts/${podcast.id}`}>
            Listen Now
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

function BlogSection({ section }: { section: MyPageSection }) {
  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: posts } = useQuery({
    queryKey: ["blog-posts", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await (supabase as any)
        .from("blog_posts")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(section.config.blogPostCount || 3);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  if (!posts || posts.length === 0) {
    return (
      <Card className="backdrop-blur-sm bg-card/80 border-border/50 shadow-lg rounded-2xl">
        <CardContent className="p-6 text-center text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No blog posts yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="backdrop-blur-sm bg-card/80 border-border/50 shadow-lg rounded-2xl">
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold mb-4">Latest Posts</h3>
        <div className="space-y-3">
          {posts.map((post: any) => (
            <div key={post.id} className="p-4 border rounded-xl bg-card/50 hover:shadow-md transition-shadow">
              <h4 className="font-semibold mb-1">{post.title}</h4>
              {post.excerpt && (
                <p className="text-sm text-muted-foreground mb-2">{post.excerpt}</p>
              )}
              <Button size="sm" variant="ghost" asChild>
                <a href={`/blog/${post.slug}`}>
                  Read More →
                </a>
              </Button>
            </div>
          ))}
        </div>
        <Button variant="outline" className="w-full mt-4" asChild>
          <a href="/blog">View All Posts</a>
        </Button>
      </CardContent>
    </Card>
  );
}

function NewsletterSection({ section }: { section: MyPageSection }) {
  return (
    <Card className="backdrop-blur-sm bg-card/80 border-border/50 shadow-lg rounded-2xl">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Mail className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-semibold">
            {section.config.newsletterTitle || "Subscribe to Newsletter"}
          </h3>
        </div>
        
        {section.config.newsletterDescription && (
          <p className="text-muted-foreground mb-4">{section.config.newsletterDescription}</p>
        )}

        <div className="flex gap-2">
          <Input 
            type="email" 
            placeholder="Enter your email" 
            className="flex-1"
          />
          <Button>Subscribe</Button>
        </div>
        
        <p className="text-xs text-muted-foreground mt-2">
          We respect your privacy. Unsubscribe at any time.
        </p>
      </CardContent>
    </Card>
  );
}

export function PublicSectionRenderer({ sections, username }: PublicSectionRendererProps) {
  const enabledSections = sections
    .filter(s => s.is_enabled)
    .sort((a, b) => a.display_order - b.display_order);

  return (
    <div className="space-y-6">
      {enabledSections.map((section) => {
        switch (section.section_type) {
          case 'featured_video':
            return <FeaturedVideoSection key={section.id} section={section} />;
          case 'stream_channel':
            return <StreamChannelSection key={section.id} section={section} username={username} />;
          case 'social_links':
            return <SocialLinksSection key={section.id} section={section} />;
          case 'meetings':
            return <MeetingsSection key={section.id} section={section} />;
          case 'books':
            return <BooksSection key={section.id} section={section} />;
          case 'promo_codes':
            return <PromoCodesSection key={section.id} section={section} />;
          case 'store':
            return <StoreSection key={section.id} section={section} />;
          case 'tips':
            return <TipsSection key={section.id} section={section} />;
          case 'custom_links':
            return <CustomLinksSection key={section.id} section={section} />;
          case 'podcast':
            return <PodcastSection key={section.id} section={section} />;
          case 'blog':
            return <BlogSection key={section.id} section={section} />;
          case 'newsletter':
            return <NewsletterSection key={section.id} section={section} />;
          default:
            return null;
        }
      })}
    </div>
  );
}