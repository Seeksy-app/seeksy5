import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Sparkles, FileText, Linkedin, Facebook, Instagram, RefreshCw, Copy, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { AAR } from '@/types/aar';

interface AARGenerateContentProps {
  aarId: string;
  aar: Partial<AAR>;
}

type ContentMode = 'blog' | 'linkedin_article' | 'linkedin_post' | 'facebook_post' | 'instagram_caption';

const CONTENT_TYPES: { mode: ContentMode; label: string; icon: any; description: string }[] = [
  { mode: 'blog', label: 'Blog Article', icon: FileText, description: 'Long-form narrative blog post' },
  { mode: 'linkedin_article', label: 'LinkedIn Article', icon: Linkedin, description: 'Thought leadership article' },
  { mode: 'linkedin_post', label: 'LinkedIn Post', icon: Linkedin, description: 'Short-form social post' },
  { mode: 'facebook_post', label: 'Facebook Post', icon: Facebook, description: 'Engaging Facebook update' },
  { mode: 'instagram_caption', label: 'Instagram Caption', icon: Instagram, description: 'Caption with hashtags' },
];

const FIELD_MAP: Record<ContentMode, keyof AAR> = {
  blog: 'generated_blog',
  linkedin_article: 'generated_linkedin_article',
  linkedin_post: 'generated_linkedin_post',
  facebook_post: 'generated_facebook_post',
  instagram_caption: 'generated_instagram_caption',
};

export function AARGenerateContent({ aarId, aar }: AARGenerateContentProps) {
  const [generating, setGenerating] = useState<ContentMode | null>(null);
  const [confirmRegenerate, setConfirmRegenerate] = useState<ContentMode | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleGenerate = async (mode: ContentMode, force = false) => {
    const existingContent = aar[FIELD_MAP[mode]];
    
    if (existingContent && !force) {
      setConfirmRegenerate(mode);
      return;
    }

    setGenerating(mode);
    setConfirmRegenerate(null);

    try {
      const { data, error } = await supabase.functions.invoke('aar-generate-content', {
        body: { aar_id: aarId, mode, client_safe: aar.is_client_facing },
      });

      if (error) throw error;
      
      toast.success(`${CONTENT_TYPES.find(t => t.mode === mode)?.label} generated!`);
      
      // The edge function updates the AAR directly, but we need to refresh
      // In a real implementation, you'd want to refetch or update local state
      window.location.reload();
    } catch (err) {
      console.error('Generation error:', err);
      toast.error('Failed to generate content. Please try again.');
    } finally {
      setGenerating(null);
    }
  };

  const handleCopy = (content: string, field: string) => {
    navigator.clipboard.writeText(content);
    setCopiedField(field);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getContent = (mode: ContentMode) => {
    return aar[FIELD_MAP[mode]] as string | undefined;
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Content Generation
        </h3>
        <p className="text-sm text-muted-foreground">
          Generate derivative content from your AAR data. Each output is tailored for its platform.
        </p>
      </div>

      <div className="grid gap-4">
        {CONTENT_TYPES.map(({ mode, label, icon: Icon, description }) => {
          const content = getContent(mode);
          const isGenerating = generating === mode;
          
          return (
            <Card key={mode}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{label}</CardTitle>
                      <CardDescription>{description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {content && (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleCopy(content, mode)}
                      >
                        {copiedField === mode ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant={content ? 'outline' : 'default'}
                      onClick={() => handleGenerate(mode)}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Generating...
                        </>
                      ) : content ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Regenerate
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-1" />
                          Generate
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {content && (
                <CardContent>
                  <div className="bg-muted/50 rounded-lg p-4 max-h-64 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm font-sans">{content}</pre>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Regenerate Confirmation Dialog */}
      <Dialog open={!!confirmRegenerate} onOpenChange={() => setConfirmRegenerate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate Content?</DialogTitle>
            <DialogDescription>
              This will replace the existing {CONTENT_TYPES.find(t => t.mode === confirmRegenerate)?.label}. 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRegenerate(null)}>Cancel</Button>
            <Button onClick={() => confirmRegenerate && handleGenerate(confirmRegenerate, true)}>
              Regenerate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generation timestamp */}
      {aar.generated_at && (
        <p className="text-xs text-muted-foreground">
          Last generated: {new Date(aar.generated_at).toLocaleString()}
        </p>
      )}
    </div>
  );
}
