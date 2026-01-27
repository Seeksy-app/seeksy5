import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { MyPageSection, SectionConfig, SECTION_TYPE_INFO } from "@/lib/mypage/sectionTypes";
import { Trash2, Plus, X } from "lucide-react";

interface SectionConfigDrawerProps {
  section: MyPageSection | null;
  onClose: () => void;
  userId: string;
}

const SOCIAL_PLATFORMS = [
  { value: 'facebook', label: 'Facebook', icon: '📘' },
  { value: 'instagram', label: 'Instagram', icon: '📷' },
  { value: 'x', label: 'X (Twitter)', icon: '🐦' },
  { value: 'tiktok', label: 'TikTok', icon: '🎵' },
  { value: 'youtube', label: 'YouTube', icon: '▶️' },
  { value: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { value: 'website', label: 'Website', icon: '🌐' },
  { value: 'custom', label: 'Custom Link', icon: '🔗' },
];

export function SectionConfigDrawer({ section, onClose, userId }: SectionConfigDrawerProps) {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<SectionConfig>({});
  const [videos, setVideos] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [podcasts, setPodcasts] = useState<any[]>([]);

  useEffect(() => {
    if (section) {
      setConfig(section.config || {});
      loadData();
    }
  }, [section?.id]);

  const loadData = async () => {
    if (!section) return;

    if (section.section_type === "featured_video") {
      const result: any = await (supabase as any)
        .from("media_files")
        .select("id, file_name, file_url")
        .eq("user_id", userId)
        .eq("file_type", "video");
      setVideos(result.data || []);
    }

    if (section.section_type === "meetings") {
      const result: any = await (supabase as any)
        .from("meetings")
        .select("id, title")
        .eq("user_id", userId);
      setMeetings(result.data || []);
    }

    if (section.section_type === "podcast") {
      const result: any = await (supabase as any)
        .from("podcasts")
        .select("id, title")
        .eq("user_id", userId);
      setPodcasts(result.data || []);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!section) return;
      
      const { error } = await (supabase as any)
        .from("my_page_sections")
        .update({ config: config as any })
        .eq("id", section.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-page-sections", userId] });
      toast.success("Section updated");
      onClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!section) return;
      
      const { error } = await (supabase as any)
        .from("my_page_sections")
        .delete()
        .eq("id", section.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-page-sections", userId] });
      toast.success("Section deleted");
      onClose();
    },
  });

  if (!section) return null;

  const sectionInfo = SECTION_TYPE_INFO[section.section_type];

  const addSocialLink = () => {
    const links = config.links || [];
    setConfig({
      ...config,
      links: [...links, { platform: 'custom' as const, url: '', label: '' }],
    });
  };

  const removeSocialLink = (index: number) => {
    const links = [...(config.links || [])];
    links.splice(index, 1);
    setConfig({ ...config, links });
  };

  const updateSocialLink = (index: number, field: string, value: string) => {
    const links = [...(config.links || [])];
    links[index] = { ...links[index], [field]: value };
    setConfig({ ...config, links });
  };

  // Books helpers
  const addBook = () => {
    const books = config.books || [];
    setConfig({
      ...config,
      books: [...books, {
        id: crypto.randomUUID(),
        title: '',
        subtitle: '',
        coverImage: '',
        description: '',
        ctaLabel: 'Buy Now',
        ctaUrl: '',
      }],
    });
  };

  const removeBook = (id: string) => {
    setConfig({ ...config, books: (config.books || []).filter(b => b.id !== id) });
  };

  const updateBook = (id: string, field: string, value: string) => {
    const books = [...(config.books || [])];
    const index = books.findIndex(b => b.id === id);
    if (index >= 0) {
      books[index] = { ...books[index], [field]: value };
      setConfig({ ...config, books });
    }
  };

  // Promo Codes helpers
  const addPromoCode = () => {
    const promoCodes = config.promoCodes || [];
    setConfig({
      ...config,
      promoCodes: [...promoCodes, {
        id: crypto.randomUUID(),
        title: '',
        code: '',
        description: '',
        ctaLabel: 'Redeem',
        ctaUrl: '',
        expirationDate: '',
      }],
    });
  };

  const removePromoCode = (id: string) => {
    setConfig({ ...config, promoCodes: (config.promoCodes || []).filter(p => p.id !== id) });
  };

  const updatePromoCode = (id: string, field: string, value: string) => {
    const promoCodes = [...(config.promoCodes || [])];
    const index = promoCodes.findIndex(p => p.id === id);
    if (index >= 0) {
      promoCodes[index] = { ...promoCodes[index], [field]: value };
      setConfig({ ...config, promoCodes });
    }
  };

  // Store helpers
  const addProduct = () => {
    const products = config.products || [];
    setConfig({
      ...config,
      products: [...products, {
        id: crypto.randomUUID(),
        name: '',
        price: 0,
        image: '',
        description: '',
        ctaLabel: 'Buy Now',
        ctaUrl: '',
      }],
    });
  };

  const removeProduct = (id: string) => {
    setConfig({ ...config, products: (config.products || []).filter(p => p.id !== id) });
  };

  const updateProduct = (id: string, field: string, value: any) => {
    const products = [...(config.products || [])];
    const index = products.findIndex(p => p.id === id);
    if (index >= 0) {
      products[index] = { ...products[index], [field]: value };
      setConfig({ ...config, products });
    }
  };

  // Custom Links helpers
  const addCustomLink = () => {
    const customLinks = config.customLinks || [];
    setConfig({
      ...config,
      customLinks: [...customLinks, {
        id: crypto.randomUUID(),
        label: '',
        url: '',
        thumbnail: '',
        groupName: '',
      }],
    });
  };

  const removeCustomLink = (id: string) => {
    setConfig({ ...config, customLinks: (config.customLinks || []).filter(l => l.id !== id) });
  };

  const updateCustomLink = (id: string, field: string, value: string) => {
    const customLinks = [...(config.customLinks || [])];
    const index = customLinks.findIndex(l => l.id === id);
    if (index >= 0) {
      customLinks[index] = { ...customLinks[index], [field]: value };
      setConfig({ ...config, customLinks });
    }
  };

  // Payment Methods helpers
  const addPaymentMethod = () => {
    const paymentMethods = config.paymentMethods || [];
    setConfig({
      ...config,
      paymentMethods: [...paymentMethods, {
        type: 'paypal' as const,
        username: '',
        url: '',
      }],
    });
  };

  const removePaymentMethod = (index: number) => {
    const paymentMethods = [...(config.paymentMethods || [])];
    paymentMethods.splice(index, 1);
    setConfig({ ...config, paymentMethods });
  };

  const updatePaymentMethod = (index: number, field: string, value: string) => {
    const paymentMethods = [...(config.paymentMethods || [])];
    paymentMethods[index] = { ...paymentMethods[index], [field]: value };
    setConfig({ ...config, paymentMethods });
  };

  return (
    <Sheet open={!!section} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span className="text-2xl">{sectionInfo.icon}</span>
            {sectionInfo.label}
          </SheetTitle>
          <SheetDescription>{sectionInfo.description}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {section.section_type === "featured_video" && (
            <>
              <div className="space-y-2">
                <Label>Select Video</Label>
                <Select value={config.videoId} onValueChange={(value) => setConfig({ ...config, videoId: value })}>
                  <SelectTrigger><SelectValue placeholder="Choose a video" /></SelectTrigger>
                  <SelectContent>
                    {videos.map((v) => <SelectItem key={v.id} value={v.id}>{v.file_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Title Override</Label>
                <Input value={config.videoTitle || ""} onChange={(e) => setConfig({ ...config, videoTitle: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={config.videoDescription || ""} onChange={(e) => setConfig({ ...config, videoDescription: e.target.value })} rows={3} />
              </div>
            </>
          )}

          {section.section_type === "stream_channel" && (
            <div className="flex items-center justify-between">
              <Label>Show Past Streams</Label>
              <Switch checked={config.showPastStreams || false} onCheckedChange={(c) => setConfig({ ...config, showPastStreams: c })} />
            </div>
          )}

          {section.section_type === "social_links" && (
            <div className="space-y-4">
              <div className="flex justify-between">
                <Label>Social Links</Label>
                <Button size="sm" onClick={addSocialLink}><Plus className="w-4 h-4 mr-2" />Add</Button>
              </div>
              {(config.links || []).map((link, i) => (
                <div key={i} className="p-3 border rounded space-y-2">
                  <div className="flex justify-between">
                    <Select value={link.platform} onValueChange={(v) => updateSocialLink(i, 'platform', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SOCIAL_PLATFORMS.map(p => <SelectItem key={p.value} value={p.value}>{p.icon} {p.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="ghost" onClick={() => removeSocialLink(i)}><X className="w-4 h-4" /></Button>
                  </div>
                  <Input placeholder="URL" value={link.url} onChange={(e) => updateSocialLink(i, 'url', e.target.value)} />
                </div>
              ))}
            </div>
          )}

          {section.section_type === "meetings" && (
            <>
              {meetings.length > 0 ? (
                <div className="space-y-2">
                  <Label>Meeting Type</Label>
                  <Select value={config.meetingTypeId} onValueChange={(v) => setConfig({ ...config, meetingTypeId: v })}>
                    <SelectTrigger><SelectValue placeholder="Choose meeting" /></SelectTrigger>
                    <SelectContent>
                      {meetings.map(m => <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>External URL</Label>
                  <Input value={config.externalUrl || ""} onChange={(e) => setConfig({ ...config, externalUrl: e.target.value })} placeholder="https://calendly.com/..." />
                </div>
              )}
            </>
          )}

          {section.section_type === "books" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Books</Label>
                <Button size="sm" onClick={addBook}><Plus className="w-4 h-4 mr-2" />Add Book</Button>
              </div>
              {(config.books || []).map((book) => (
                <div key={book.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">Book</h4>
                    <Button size="sm" variant="ghost" onClick={() => removeBook(book.id)}><X className="w-4 h-4" /></Button>
                  </div>
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={book.title} onChange={(e) => updateBook(book.id, 'title', e.target.value)} placeholder="Book Title" />
                  </div>
                  <div className="space-y-2">
                    <Label>Subtitle (optional)</Label>
                    <Input value={book.subtitle || ''} onChange={(e) => updateBook(book.id, 'subtitle', e.target.value)} placeholder="Subtitle" />
                  </div>
                  <div className="space-y-2">
                    <Label>Cover Image URL</Label>
                    <Input value={book.coverImage} onChange={(e) => updateBook(book.id, 'coverImage', e.target.value)} placeholder="https://..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={book.description} onChange={(e) => updateBook(book.id, 'description', e.target.value)} placeholder="Brief description..." rows={2} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>CTA Label</Label>
                      <Input value={book.ctaLabel} onChange={(e) => updateBook(book.id, 'ctaLabel', e.target.value)} placeholder="Buy Now" />
                    </div>
                    <div className="space-y-2">
                      <Label>CTA URL</Label>
                      <Input value={book.ctaUrl} onChange={(e) => updateBook(book.id, 'ctaUrl', e.target.value)} placeholder="https://..." />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {section.section_type === "promo_codes" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Promo Codes</Label>
                <Button size="sm" onClick={addPromoCode}><Plus className="w-4 h-4 mr-2" />Add Promo</Button>
              </div>
              {(config.promoCodes || []).map((promo) => (
                <div key={promo.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">Promo Code</h4>
                    <Button size="sm" variant="ghost" onClick={() => removePromoCode(promo.id)}><X className="w-4 h-4" /></Button>
                  </div>
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={promo.title} onChange={(e) => updatePromoCode(promo.id, 'title', e.target.value)} placeholder="20% Off Coaching" />
                  </div>
                  <div className="space-y-2">
                    <Label>Promo Code</Label>
                    <Input value={promo.code} onChange={(e) => updatePromoCode(promo.id, 'code', e.target.value.toUpperCase())} placeholder="COACH20" />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={promo.description} onChange={(e) => updatePromoCode(promo.id, 'description', e.target.value)} placeholder="Save 20% on all coaching sessions" rows={2} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>CTA Label</Label>
                      <Input value={promo.ctaLabel} onChange={(e) => updatePromoCode(promo.id, 'ctaLabel', e.target.value)} placeholder="Redeem" />
                    </div>
                    <div className="space-y-2">
                      <Label>CTA URL</Label>
                      <Input value={promo.ctaUrl} onChange={(e) => updatePromoCode(promo.id, 'ctaUrl', e.target.value)} placeholder="https://..." />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Expiration Date (optional)</Label>
                    <Input type="date" value={promo.expirationDate || ''} onChange={(e) => updatePromoCode(promo.id, 'expirationDate', e.target.value)} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {section.section_type === "tips" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tips Title</Label>
                <Input 
                  value={config.tipsMessage || 'Support My Work'} 
                  onChange={(e) => setConfig({ ...config, tipsMessage: e.target.value })} 
                  placeholder="Support My Work" 
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Enable Tips</Label>
                <Switch checked={config.tipsEnabled ?? true} onCheckedChange={(c) => setConfig({ ...config, tipsEnabled: c })} />
              </div>

              <div className="space-y-2">
                <Label>Tip Amounts (comma-separated)</Label>
                <Input 
                  value={(config.tipAmounts || [1, 3, 5, 10]).join(', ')} 
                  onChange={(e) => {
                    const amounts = e.target.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
                    setConfig({ ...config, tipAmounts: amounts });
                  }}
                  placeholder="1, 3, 5, 10" 
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Payment Methods</Label>
                  <Button size="sm" onClick={addPaymentMethod}><Plus className="w-4 h-4 mr-2" />Add</Button>
                </div>
                {(config.paymentMethods || []).map((method, i) => (
                  <div key={i} className="p-3 border rounded space-y-2">
                    <div className="flex justify-between">
                      <Select value={method.type} onValueChange={(v) => updatePaymentMethod(i, 'type', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="paypal">PayPal</SelectItem>
                          <SelectItem value="venmo">Venmo</SelectItem>
                          <SelectItem value="cashapp">Cash App</SelectItem>
                          <SelectItem value="tipjar">Tip Jar</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="ghost" onClick={() => removePaymentMethod(i)}><X className="w-4 h-4" /></Button>
                    </div>
                    <Input 
                      placeholder="Username" 
                      value={method.username} 
                      onChange={(e) => updatePaymentMethod(i, 'username', e.target.value)} 
                    />
                    <Input 
                      placeholder="Payment URL" 
                      value={method.url} 
                      onChange={(e) => updatePaymentMethod(i, 'url', e.target.value)} 
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {section.section_type === "custom_links" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Custom Links</Label>
                <Button size="sm" onClick={addCustomLink}><Plus className="w-4 h-4 mr-2" />Add Link</Button>
              </div>
              {(config.customLinks || []).map((link) => (
                <div key={link.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">Link</h4>
                    <Button size="sm" variant="ghost" onClick={() => removeCustomLink(link.id)}><X className="w-4 h-4" /></Button>
                  </div>
                  <div className="space-y-2">
                    <Label>Label</Label>
                    <Input value={link.label} onChange={(e) => updateCustomLink(link.id, 'label', e.target.value)} placeholder="Link Label" />
                  </div>
                  <div className="space-y-2">
                    <Label>URL</Label>
                    <Input value={link.url} onChange={(e) => updateCustomLink(link.id, 'url', e.target.value)} placeholder="https://..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Thumbnail URL (optional)</Label>
                    <Input value={link.thumbnail || ''} onChange={(e) => updateCustomLink(link.id, 'thumbnail', e.target.value)} placeholder="https://..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Group Name (optional)</Label>
                    <Input value={link.groupName || ''} onChange={(e) => updateCustomLink(link.id, 'groupName', e.target.value)} placeholder="Resources, Gear, etc." />
                  </div>
                </div>
              ))}
            </div>
          )}

          {section.section_type === "podcast" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Podcast</Label>
                <Select value={config.podcastId} onValueChange={(v) => setConfig({ ...config, podcastId: v })}>
                  <SelectTrigger><SelectValue placeholder="Choose a podcast" /></SelectTrigger>
                  <SelectContent>
                    {podcasts.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label>Show Latest Episodes</Label>
                <Switch checked={config.showLatestEpisodes ?? true} onCheckedChange={(c) => setConfig({ ...config, showLatestEpisodes: c })} />
              </div>

              {config.showLatestEpisodes && (
                <div className="space-y-2">
                  <Label>Number of Episodes to Show</Label>
                  <Select value={String(config.episodeCount || 3)} onValueChange={(v) => setConfig({ ...config, episodeCount: parseInt(v) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {section.section_type === "blog" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Display Mode</Label>
                <Select value={config.blogDisplayMode || 'latest'} onValueChange={(v) => setConfig({ ...config, blogDisplayMode: v as 'latest' | 'featured' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="latest">Latest Posts</SelectItem>
                    <SelectItem value="featured">Featured Posts</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Number of Posts to Show</Label>
                <Select value={String(config.blogPostCount || 3)} onValueChange={(v) => setConfig({ ...config, blogPostCount: parseInt(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {section.section_type === "newsletter" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Newsletter Title</Label>
                <Input 
                  value={config.newsletterTitle || 'Join My Newsletter'} 
                  onChange={(e) => setConfig({ ...config, newsletterTitle: e.target.value })} 
                  placeholder="Join My Newsletter" 
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  value={config.newsletterDescription || ''} 
                  onChange={(e) => setConfig({ ...config, newsletterDescription: e.target.value })} 
                  placeholder="Get updates delivered to your inbox..." 
                  rows={3} 
                />
              </div>
            </div>
          )}

          {section.section_type === "store" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Store Mode</Label>
                <Select value={config.storeMode || 'manual'} onValueChange={(v) => setConfig({ ...config, storeMode: v as 'shopify' | 'manual' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual Products</SelectItem>
                    <SelectItem value="shopify">Shopify Integration</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {config.storeMode === 'shopify' ? (
                <>
                  <div className="space-y-2">
                    <Label>Shopify Domain</Label>
                    <Input value={config.shopifyDomain || ''} onChange={(e) => setConfig({ ...config, shopifyDomain: e.target.value })} placeholder="mystore.myshopify.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Storefront Access Token</Label>
                    <Input value={config.shopifyToken || ''} onChange={(e) => setConfig({ ...config, shopifyToken: e.target.value })} placeholder="Token" type="password" />
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Products</Label>
                    <Button size="sm" onClick={addProduct}><Plus className="w-4 h-4 mr-2" />Add Product</Button>
                  </div>
                  {(config.products || []).map((product) => (
                    <div key={product.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">Product</h4>
                        <Button size="sm" variant="ghost" onClick={() => removeProduct(product.id)}><X className="w-4 h-4" /></Button>
                      </div>
                      <div className="space-y-2">
                        <Label>Product Name</Label>
                        <Input value={product.name} onChange={(e) => updateProduct(product.id, 'name', e.target.value)} placeholder="Product name" />
                      </div>
                      <div className="space-y-2">
                        <Label>Price</Label>
                        <Input type="number" step="0.01" value={product.price} onChange={(e) => updateProduct(product.id, 'price', parseFloat(e.target.value) || 0)} placeholder="29.99" />
                      </div>
                      <div className="space-y-2">
                        <Label>Product Image URL</Label>
                        <Input value={product.image} onChange={(e) => updateProduct(product.id, 'image', e.target.value)} placeholder="https://..." />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea value={product.description} onChange={(e) => updateProduct(product.id, 'description', e.target.value)} placeholder="Product description..." rows={2} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <Label>CTA Label</Label>
                          <Input value={product.ctaLabel} onChange={(e) => updateProduct(product.id, 'ctaLabel', e.target.value)} placeholder="Buy Now" />
                        </div>
                        <div className="space-y-2">
                          <Label>CTA URL</Label>
                          <Input value={product.ctaUrl} onChange={(e) => updateProduct(product.id, 'ctaUrl', e.target.value)} placeholder="https://..." />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-6">
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="flex-1">Save</Button>
            <Button variant="destructive" onClick={() => deleteMutation.mutate()}><Trash2 className="w-4 h-4" /></Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
