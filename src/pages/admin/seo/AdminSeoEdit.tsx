import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Loader2, Upload, AlertCircle, ChevronDown, Check, X, FileQuestion } from "lucide-react";
import { 
  computeSeoScore, 
  getScoreProgressColor, 
  JSON_LD_TEMPLATES,
  SeoPageData 
} from "@/lib/seo/seoScoring";
import { RequireAdmin } from "@/components/auth/RequireAdmin";
import { LinkedGbpPanel } from "@/components/admin/seo/LinkedGbpPanel";
import { SeoAiSuggestionsPanel } from "@/components/admin/seo/SeoAiSuggestionsPanel";
import { SeoPerformancePanel } from "@/components/admin/seo/SeoPerformancePanel";
import { SeoBaselinePanel } from "@/components/admin/seo/SeoBaselinePanel";
import { useSeoPageMetrics } from "@/hooks/useSeoAnalyticsMetrics";

interface FormData {
  route_path: string;
  page_name: string;
  status: 'draft' | 'published' | 'archived';
  meta_title: string;
  meta_description: string;
  canonical_url: string;
  robots: string;
  h1_override: string;
  og_title: string;
  og_description: string;
  og_image_url: string;
  og_image_alt: string;
  twitter_card_type: string;
  twitter_title: string;
  twitter_description: string;
  twitter_image_url: string;
  twitter_image_alt: string;
  json_ld: string;
}

const ROBOTS_OPTIONS = [
  'index, follow',
  'index, nofollow',
  'noindex, follow',
  'noindex, nofollow',
];

function AdminSeoEditContent() {
  const { seo_page_id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isNew = seo_page_id === 'new';

  const [form, setForm] = useState<FormData>({
    route_path: '',
    page_name: '',
    status: 'draft',
    meta_title: '',
    meta_description: '',
    canonical_url: '',
    robots: 'index, follow',
    h1_override: '',
    og_title: '',
    og_description: '',
    og_image_url: '',
    og_image_alt: '',
    twitter_card_type: 'summary_large_image',
    twitter_title: '',
    twitter_description: '',
    twitter_image_url: '',
    twitter_image_alt: '',
    json_ld: '',
  });

  const [jsonError, setJsonError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: page, isLoading } = useQuery({
    queryKey: ['seo-page', seo_page_id],
    queryFn: async () => {
      if (isNew) return null;
      const { data, error } = await supabase
        .from('seo_pages')
        .select('*')
        .eq('id', seo_page_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !isNew
  });

  useEffect(() => {
    if (page) {
      setForm({
        route_path: page.route_path || '',
        page_name: page.page_name || '',
        status: page.status as 'draft' | 'published' | 'archived',
        meta_title: page.meta_title || '',
        meta_description: page.meta_description || '',
        canonical_url: page.canonical_url || '',
        robots: page.robots || 'index, follow',
        h1_override: page.h1_override || '',
        og_title: page.og_title || '',
        og_description: page.og_description || '',
        og_image_url: page.og_image_url || '',
        og_image_alt: page.og_image_alt || '',
        twitter_card_type: page.twitter_card_type || 'summary_large_image',
        twitter_title: page.twitter_title || '',
        twitter_description: page.twitter_description || '',
        twitter_image_url: page.twitter_image_url || '',
        twitter_image_alt: page.twitter_image_alt || '',
        json_ld: page.json_ld || '',
      });
    }
  }, [page]);

  const scoreData: SeoPageData = {
    meta_title: form.meta_title,
    meta_description: form.meta_description,
    h1_override: form.h1_override,
    og_title: form.og_title,
    og_description: form.og_description,
    og_image_url: form.og_image_url,
    og_image_alt: form.og_image_alt,
    twitter_card_type: form.twitter_card_type,
    json_ld: form.json_ld,
  };
  const scoreResult = computeSeoScore(scoreData);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const payload = {
        ...form,
        score: scoreResult.score,
        score_breakdown: JSON.parse(JSON.stringify(scoreResult.breakdown)),
        updated_by: user?.id,
      };

      if (isNew) {
        const { error } = await supabase.from('seo_pages').insert([payload]);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('seo_pages')
          .update(payload)
          .eq('id', seo_page_id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seo-pages'] });
      queryClient.invalidateQueries({ queryKey: ['seo-page', seo_page_id] });
      toast({ title: isNew ? "Page created" : "Changes saved" });
      if (isNew) navigate('/admin/seo');
    },
    onError: (error: any) => {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    }
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'og' | 'twitter') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const path = `og-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('seo-assets')
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('seo-assets')
        .getPublicUrl(path);

      if (target === 'og') {
        setForm(f => ({ ...f, og_image_url: urlData.publicUrl }));
      } else {
        setForm(f => ({ ...f, twitter_image_url: urlData.publicUrl }));
      }

      toast({ title: "Image uploaded" });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const insertJsonLdTemplate = (type: string) => {
    const template = JSON_LD_TEMPLATES[type];
    if (template) {
      setForm(f => ({ ...f, json_ld: JSON.stringify(template, null, 2) }));
      setJsonError(null);
    }
  };

  const validateJsonLd = (value: string) => {
    if (!value.trim()) {
      setJsonError(null);
      return;
    }
    try {
      JSON.parse(value);
      setJsonError(null);
    } catch {
      setJsonError('Invalid JSON syntax');
    }
  };

  const handleRevertToDraft = () => {
    setForm(f => ({ ...f, status: 'draft' }));
  };

  const handlePublish = () => {
    setForm(f => ({ ...f, status: 'published' }));
  };

  const isPublished = form.status === 'published';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Handle not found case (non-new page that doesn't exist)
  if (!isNew && !page) {
    return (
      <div className="container max-w-2xl py-12">
        <Card className="text-center py-12">
          <CardContent className="space-y-4">
            <FileQuestion className="h-16 w-16 text-muted-foreground mx-auto" />
            <div>
              <h2 className="text-xl font-semibold">SEO Page Not Found</h2>
              <p className="text-muted-foreground mt-1">
                The SEO page you're looking for doesn't exist or may have been deleted.
              </p>
            </div>
            <Button onClick={() => navigate('/admin/seo')} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to SEO Manager
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-4 space-y-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/seo')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">
            {isNew ? 'Add Page SEO' : 'Edit SEO'}
          </h1>
          <Badge 
            variant={isPublished ? 'default' : 'outline'}
            className={isPublished ? 'bg-green-100 text-green-800' : ''}
          >
            {form.status}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {/* Score indicator */}
          <div className="flex items-center gap-2 mr-4">
            <span className="text-sm text-muted-foreground">Score:</span>
            <Progress 
              value={scoreResult.score} 
              className="w-20 h-2"
              indicatorClassName={getScoreProgressColor(scoreResult.score)}
            />
            <span className={`text-sm font-bold ${
              scoreResult.score >= 80 ? 'text-green-600' : 
              scoreResult.score >= 60 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {scoreResult.score}%
            </span>
          </div>
          {isPublished && (
            <Button variant="outline" onClick={handleRevertToDraft}>
              Revert to Draft
            </Button>
          )}
          {!isPublished && form.status !== 'archived' && (
            <Button variant="outline" onClick={handlePublish}>
              Publish
            </Button>
          )}
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save
          </Button>
        </div>
      </div>

      {/* Linked GBP Panel - show only for existing pages */}
      {!isNew && seo_page_id && (
        <LinkedGbpPanel seoPageId={seo_page_id} />
      )}

      {/* AI SEO Suggestions Panel - show only for existing pages */}
      {!isNew && seo_page_id && (
        <SeoAiSuggestionsPanel 
          seoPageId={seo_page_id} 
          onSuggestionApplied={() => {
            queryClient.invalidateQueries({ queryKey: ['seo-page', seo_page_id] });
          }}
        />
      )}

      {/* Performance Panel - show only for existing pages */}
      {!isNew && form.route_path && (
        <SeoPerformancePanel routePath={form.route_path} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column - Page Info & Meta */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Page Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Route Path</Label>
                <Input
                  value={form.route_path}
                  onChange={(e) => setForm(f => ({ ...f, route_path: e.target.value }))}
                  placeholder="/about"
                  disabled={isPublished && !isNew}
                />
                {isPublished && <p className="text-xs text-muted-foreground mt-1">Route path is locked when published</p>}
              </div>
              <div>
                <Label>Page Name</Label>
                <Input
                  value={form.page_name}
                  onChange={(e) => setForm(f => ({ ...f, page_name: e.target.value }))}
                  placeholder="About Us"
                />
              </div>
              <div>
                <div className="flex justify-between">
                  <Label>Meta Title</Label>
                  <span className={`text-xs ${form.meta_title.length > 60 ? 'text-yellow-600' : 'text-muted-foreground'}`}>
                    {form.meta_title.length}/60
                  </span>
                </div>
                <Input
                  value={form.meta_title}
                  onChange={(e) => setForm(f => ({ ...f, meta_title: e.target.value }))}
                  placeholder="Page Title | Brand Name"
                  maxLength={70}
                />
                {form.meta_title.length > 0 && form.meta_title.length < 30 && (
                  <p className="text-xs text-yellow-600 mt-1">Title is short (min 30 recommended)</p>
                )}
              </div>
              <div>
                <div className="flex justify-between">
                  <Label>Meta Description</Label>
                  <span className={`text-xs ${form.meta_description.length > 160 ? 'text-yellow-600' : 'text-muted-foreground'}`}>
                    {form.meta_description.length}/160
                  </span>
                </div>
                <Textarea
                  value={form.meta_description}
                  onChange={(e) => setForm(f => ({ ...f, meta_description: e.target.value }))}
                  placeholder="A brief description of this page..."
                  maxLength={170}
                  rows={3}
                />
                {form.meta_description.length > 0 && form.meta_description.length < 120 && (
                  <p className="text-xs text-yellow-600 mt-1">Description is short (min 120 recommended)</p>
                )}
              </div>
              <div>
                <Label>Canonical URL</Label>
                <Input
                  value={form.canonical_url}
                  onChange={(e) => setForm(f => ({ ...f, canonical_url: e.target.value }))}
                  placeholder="https://example.com/about"
                />
              </div>
              <div>
                <Label>Robots</Label>
                <Select value={form.robots} onValueChange={(v) => setForm(f => ({ ...f, robots: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROBOTS_OPTIONS.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>H1 Override</Label>
                <Input
                  value={form.h1_override}
                  onChange={(e) => setForm(f => ({ ...f, h1_override: e.target.value }))}
                  placeholder="Main heading for this page"
                />
              </div>
            </CardContent>
          </Card>

          {/* Structured Data */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Structured Data (JSON-LD)</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Generate Template <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {Object.keys(JSON_LD_TEMPLATES).map(type => (
                      <DropdownMenuItem key={type} onClick={() => insertJsonLdTemplate(type)}>
                        {type}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={form.json_ld}
                onChange={(e) => {
                  setForm(f => ({ ...f, json_ld: e.target.value }));
                  validateJsonLd(e.target.value);
                }}
                placeholder='{"@context": "https://schema.org", ...}'
                rows={8}
                className="font-mono text-sm"
              />
              {jsonError && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {jsonError}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Score Breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">SEO Score Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {scoreResult.breakdown.map(rule => (
                <div key={rule.key} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    {rule.passed ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm">{rule.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {rule.hint && (
                      <span className="text-xs text-muted-foreground">{rule.hint}</span>
                    )}
                    <Badge variant={rule.passed ? 'default' : 'secondary'} className="text-xs">
                      {rule.passed ? rule.points : 0}/{rule.points}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Social */}
        <div className="space-y-4">
          {/* OpenGraph */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">OpenGraph (Facebook, LinkedIn)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>OG Title</Label>
                <Input
                  value={form.og_title}
                  onChange={(e) => setForm(f => ({ ...f, og_title: e.target.value }))}
                  placeholder="Share title"
                />
              </div>
              <div>
                <Label>OG Description</Label>
                <Textarea
                  value={form.og_description}
                  onChange={(e) => setForm(f => ({ ...f, og_description: e.target.value }))}
                  placeholder="Description when shared on social"
                  rows={2}
                />
              </div>
              <div>
                <Label>OG Image</Label>
                <div className="flex gap-2">
                  <Input
                    value={form.og_image_url}
                    onChange={(e) => setForm(f => ({ ...f, og_image_url: e.target.value }))}
                    placeholder="https://... or upload"
                    className="flex-1"
                  />
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'og')}
                      disabled={uploading}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Button variant="outline" disabled={uploading}>
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Recommended: 1200×630px</p>
              </div>
              <div>
                <Label>OG Image Alt Text</Label>
                <Input
                  value={form.og_image_alt}
                  onChange={(e) => setForm(f => ({ ...f, og_image_alt: e.target.value }))}
                  placeholder="Describe the image"
                />
              </div>
            </CardContent>
          </Card>

          {/* Twitter */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Twitter Card</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Card Type</Label>
                <Select value={form.twitter_card_type} onValueChange={(v) => setForm(f => ({ ...f, twitter_card_type: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="summary">Summary</SelectItem>
                    <SelectItem value="summary_large_image">Summary with Large Image</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Twitter Title</Label>
                <Input
                  value={form.twitter_title}
                  onChange={(e) => setForm(f => ({ ...f, twitter_title: e.target.value }))}
                  placeholder="Leave blank to use OG title"
                />
              </div>
              <div>
                <Label>Twitter Description</Label>
                <Textarea
                  value={form.twitter_description}
                  onChange={(e) => setForm(f => ({ ...f, twitter_description: e.target.value }))}
                  placeholder="Leave blank to use OG description"
                  rows={2}
                />
              </div>
              <div>
                <Label>Twitter Image (optional)</Label>
                <div className="flex gap-2">
                  <Input
                    value={form.twitter_image_url}
                    onChange={(e) => setForm(f => ({ ...f, twitter_image_url: e.target.value }))}
                    placeholder="Defaults to OG image if blank"
                    className="flex-1"
                  />
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'twitter')}
                      disabled={uploading}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Button variant="outline" disabled={uploading}>
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
              <div>
                <Label>Twitter Image Alt Text</Label>
                <Input
                  value={form.twitter_image_alt}
                  onChange={(e) => setForm(f => ({ ...f, twitter_image_alt: e.target.value }))}
                  placeholder="Describe the image"
                />
              </div>
            </CardContent>
          </Card>

          {/* Social Previews */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Social Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Facebook/LinkedIn Preview */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Facebook / LinkedIn</p>
                <div className="border rounded-lg overflow-hidden bg-muted/30">
                  {form.og_image_url && (
                    <div className="aspect-[1.91/1] bg-muted">
                      <img 
                        src={form.og_image_url} 
                        alt={form.og_image_alt || 'Preview'} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      {form.canonical_url ? new URL(form.canonical_url).hostname : 'example.com'}
                    </p>
                    <p className="font-semibold text-sm mt-1 line-clamp-2">
                      {form.og_title || form.meta_title || 'Page Title'}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {form.og_description || form.meta_description || 'Page description'}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Twitter Preview */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Twitter</p>
                <div className="border rounded-xl overflow-hidden bg-muted/30">
                  {(form.twitter_image_url || form.og_image_url) && form.twitter_card_type === 'summary_large_image' && (
                    <div className="aspect-[2/1] bg-muted">
                      <img 
                        src={form.twitter_image_url || form.og_image_url} 
                        alt={form.twitter_image_alt || form.og_image_alt || 'Preview'} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-3 flex gap-3">
                    {(form.twitter_image_url || form.og_image_url) && form.twitter_card_type === 'summary' && (
                      <div className="w-24 h-24 bg-muted rounded flex-shrink-0">
                        <img 
                          src={form.twitter_image_url || form.og_image_url} 
                          alt={form.twitter_image_alt || form.og_image_alt || 'Preview'} 
                          className="w-full h-full object-cover rounded"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm line-clamp-1">
                        {form.twitter_title || form.og_title || form.meta_title || 'Page Title'}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {form.twitter_description || form.og_description || form.meta_description || 'Page description'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {form.canonical_url ? new URL(form.canonical_url).hostname : 'example.com'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Wrap with admin guard
export default function AdminSeoEdit() {
  return (
    <RequireAdmin>
      <AdminSeoEditContent />
    </RequireAdmin>
  );
}
