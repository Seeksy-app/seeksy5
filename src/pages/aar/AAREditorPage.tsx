import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAAR } from '@/hooks/useAAR';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Save, Trash2, Eye, Share2, ChevronRight, Calendar, FileText, 
  Target, Users, Trophy, BarChart3, Lightbulb, CheckCircle, Image, Sparkles, 
  Plus, X, Upload, Grid, List, ExternalLink, Download, Copy
} from 'lucide-react';
import { EVENT_TYPES, AAR_STATUS, AAR_VISIBILITY, AAR_SECTIONS, type AARSectionId } from '@/types/aar';
import { AARMediaUpload } from '@/components/aar/AARMediaUpload';
import { AARLivePreview } from '@/components/aar/AARLivePreview';
import { AARGenerateContent } from '@/components/aar/AARGenerateContent';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const SECTION_ICONS: Record<string, any> = {
  Calendar, FileText, Target, Users, Trophy, BarChart3, Lightbulb, CheckCircle, Image, Sparkles
};

export default function AAREditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { aar, media, loading, saving, updateField, updateMultiple, save, deleteAAR, uploadMedia, deleteMedia, completionSections, completionPercentage } = useAAR(id);
  const [activeSection, setActiveSection] = useState<AARSectionId>('metadata');
  const [clientSafeMode, setClientSafeMode] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveRef = useRef<NodeJS.Timeout>();

  // Auto-save every 30 seconds if there are changes
  useEffect(() => {
    if (id && id !== 'new' && aar.event_name) {
      autoSaveRef.current = setInterval(async () => {
        await save();
        setLastSaved(new Date());
      }, 30000);
    }
    return () => {
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    };
  }, [id, aar.event_name, save]);

  const handleSave = async () => {
    const result = await save();
    if (result) setLastSaved(new Date());
  };

  const handleCopyShareLink = () => {
    if (aar.share_slug) {
      const url = `${window.location.origin}/aar/${id}/share`;
      navigator.clipboard.writeText(url);
      toast.success('Share link copied!');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <div className="w-64 p-4 border-r"><Skeleton className="h-full" /></div>
        <div className="flex-1 p-6"><Skeleton className="h-96" /></div>
        <div className="w-96 p-4 border-l"><Skeleton className="h-full" /></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Left: Section Navigation */}
      <div className="w-64 border-r flex flex-col">
        <div className="p-4 border-b">
          <nav className="text-sm text-muted-foreground flex items-center gap-1 mb-3">
            <Link to="/aar" className="hover:text-foreground">AARs</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="truncate text-foreground">{aar.event_name || 'New AAR'}</span>
          </nav>
          <Progress value={completionPercentage} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">{completionPercentage}% complete</p>
        </div>
        
        <ScrollArea className="flex-1 p-2">
          <div className="space-y-1">
            {AAR_SECTIONS.map((section) => {
              const Icon = SECTION_ICONS[section.icon] || FileText;
              const isComplete = completionSections[section.id as keyof typeof completionSections];
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id as AARSectionId)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-left",
                    activeSection === section.id 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{section.label}</span>
                  {isComplete && <CheckCircle className="h-3.5 w-3.5 text-green-500" />}
                </button>
              );
            })}
          </div>
        </ScrollArea>

        <div className="p-4 border-t space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Switch checked={clientSafeMode} onCheckedChange={setClientSafeMode} />
            <span>Client-safe preview</span>
          </div>
          {lastSaved && (
            <p className="text-xs text-muted-foreground">
              Saved {lastSaved.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>

      {/* Main: Section Editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h1 className="text-xl font-semibold">{AAR_SECTIONS.find(s => s.id === activeSection)?.label}</h1>
          <div className="flex gap-2">
            {id && id !== 'new' && (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/aar/${id}/share`} target="_blank">
                    <Eye className="h-4 w-4 mr-1" /> Preview
                  </Link>
                </Button>
                <Button variant="outline" size="sm" onClick={handleCopyShareLink}>
                  <Share2 className="h-4 w-4 mr-1" /> Share
                </Button>
                <Button variant="destructive" size="sm" onClick={deleteAAR}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button onClick={handleSave} disabled={saving} size="sm">
              <Save className="h-4 w-4 mr-1" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 p-6">
          {/* Metadata Section */}
          {activeSection === 'metadata' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <Label>Event Name *</Label>
                <Input 
                  value={aar.event_name || ''} 
                  onChange={e => updateField('event_name', e.target.value)} 
                  placeholder="Q4 Community Activation" 
                  className="mt-1"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Event Type *</Label>
                  <Select value={aar.event_type} onValueChange={v => updateField('event_type', v as any)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Event Date *</Label>
                  <Input type="date" value={aar.event_date_start || ''} onChange={e => updateField('event_date_start', e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input type="date" value={aar.event_date_end || ''} onChange={e => updateField('event_date_end', e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Time Window</Label>
                  <Input value={aar.time_window || ''} onChange={e => updateField('time_window', e.target.value)} placeholder="9am - 5pm" className="mt-1" />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Venue</Label>
                  <Input value={aar.location_venue || ''} onChange={e => updateField('location_venue', e.target.value)} placeholder="City Hall Plaza" className="mt-1" />
                </div>
                <div>
                  <Label>City/State</Label>
                  <Input value={aar.location_city_state || ''} onChange={e => updateField('location_city_state', e.target.value)} placeholder="Austin, TX" className="mt-1" />
                </div>
                <div>
                  <Label>Hosted By</Label>
                  <Input value={aar.hosted_by || ''} onChange={e => updateField('hosted_by', e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Prepared By</Label>
                  <Input value={aar.prepared_by || ''} onChange={e => updateField('prepared_by', e.target.value)} className="mt-1" />
                </div>
              </div>
              <div>
                <Label>Program / Initiative</Label>
                <Input value={aar.program_initiative || ''} onChange={e => updateField('program_initiative', e.target.value)} placeholder="LiveOak Locale" className="mt-1" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Status</Label>
                  <Select value={aar.status} onValueChange={v => updateField('status', v as any)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {AAR_STATUS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Visibility</Label>
                  <Select value={aar.visibility} onValueChange={v => updateField('visibility', v as any)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {AAR_VISIBILITY.map(v => <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={aar.is_client_facing || false} onCheckedChange={v => updateField('is_client_facing', v)} />
                <Label>Client-Facing Report</Label>
              </div>
            </div>
          )}

          {/* Executive Summary */}
          {activeSection === 'executive' && (
            <div className="max-w-2xl">
              <Label>Executive Summary</Label>
              <p className="text-sm text-muted-foreground mb-2">What happened, why it mattered, and the overall outcome.</p>
              <Textarea 
                value={aar.executive_summary || ''} 
                onChange={e => updateField('executive_summary', e.target.value)} 
                placeholder="Provide a concise overview..." 
                rows={10} 
                className="mt-1"
              />
            </div>
          )}

          {/* Purpose & Alignment */}
          {activeSection === 'purpose' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <Label>Event Purpose</Label>
                <Textarea value={aar.event_purpose || ''} onChange={e => updateField('event_purpose', e.target.value)} rows={4} className="mt-1" />
              </div>
              <div>
                <Label>Brand / ESG / GTM Alignment</Label>
                <Textarea value={aar.brand_esg_gtm_alignment || ''} onChange={e => updateField('brand_esg_gtm_alignment', e.target.value)} rows={4} className="mt-1" />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={aar.not_designed_for_lead_gen || false} onCheckedChange={v => updateField('not_designed_for_lead_gen', v)} />
                <Label>Not designed for lead generation</Label>
              </div>
            </div>
          )}

          {/* Stakeholders */}
          {activeSection === 'stakeholders' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <Label>Attendance Estimate</Label>
                <Input type="number" value={aar.attendance_estimate || ''} onChange={e => updateField('attendance_estimate', parseInt(e.target.value) || undefined)} className="mt-1" />
              </div>
              <div>
                <Label>Community Description</Label>
                <Textarea value={aar.community_description || ''} onChange={e => updateField('community_description', e.target.value)} rows={4} className="mt-1" />
              </div>
              <div>
                <Label>Weather / Environmental Notes</Label>
                <Textarea value={aar.weather_environmental_notes || ''} onChange={e => updateField('weather_environmental_notes', e.target.value)} rows={2} className="mt-1" />
              </div>
            </div>
          )}

          {/* Wins & Impact */}
          {activeSection === 'wins' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <Label>Community Impact</Label>
                <Textarea value={aar.wins_community_impact || ''} onChange={e => updateField('wins_community_impact', e.target.value)} rows={4} className="mt-1" />
              </div>
              <div>
                <Label>Relationship Building</Label>
                <Textarea value={aar.wins_relationship_building || ''} onChange={e => updateField('wins_relationship_building', e.target.value)} rows={4} className="mt-1" />
              </div>
              <div>
                <Label>Business Support</Label>
                <Textarea value={aar.wins_business_support || ''} onChange={e => updateField('wins_business_support', e.target.value)} rows={4} className="mt-1" />
              </div>
              <div>
                <Label>ESG Execution</Label>
                <Textarea value={aar.wins_esg_execution || ''} onChange={e => updateField('wins_esg_execution', e.target.value)} rows={4} className="mt-1" />
              </div>
              <div>
                <Label>Civic / Brand Visibility</Label>
                <Textarea value={aar.wins_civic_visibility || ''} onChange={e => updateField('wins_civic_visibility', e.target.value)} rows={4} className="mt-1" />
              </div>
            </div>
          )}

          {/* Metrics & Spend */}
          {activeSection === 'metrics' && (
            <div className="space-y-6 max-w-2xl">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Attendance Count</Label>
                  <Input type="number" value={aar.attendance_count || ''} onChange={e => updateField('attendance_count', parseInt(e.target.value) || undefined)} className="mt-1" />
                </div>
                <div>
                  <Label>Engagement Scans</Label>
                  <Input type="number" value={aar.engagement_scans || ''} onChange={e => updateField('engagement_scans', parseInt(e.target.value) || undefined)} className="mt-1" />
                </div>
                <div>
                  <Label>Engagement Interactions</Label>
                  <Input type="number" value={aar.engagement_interactions || ''} onChange={e => updateField('engagement_interactions', parseInt(e.target.value) || undefined)} className="mt-1" />
                </div>
                <div>
                  <Label>Leads Generated</Label>
                  <Input type="number" value={aar.leads_generated || ''} onChange={e => updateField('leads_generated', parseInt(e.target.value) || undefined)} className="mt-1" />
                </div>
                <div>
                  <Label>Funnel Views</Label>
                  <Input type="number" value={aar.funnel_views || ''} onChange={e => updateField('funnel_views', parseInt(e.target.value) || undefined)} className="mt-1" />
                </div>
                <div>
                  <Label>Funnel Submissions</Label>
                  <Input type="number" value={aar.funnel_submissions || ''} onChange={e => updateField('funnel_submissions', parseInt(e.target.value) || undefined)} className="mt-1" />
                </div>
              </div>
              <div>
                <Label>Total Spend ($)</Label>
                <Input type="number" value={aar.total_spend || ''} onChange={e => updateField('total_spend', parseFloat(e.target.value) || 0)} className="mt-1" />
              </div>
              <div>
                <Label>ROI Summary</Label>
                <Textarea value={aar.roi_summary || ''} onChange={e => updateField('roi_summary', e.target.value)} rows={3} className="mt-1" />
              </div>
            </div>
          )}

          {/* Recommendations */}
          {activeSection === 'recommendations' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <Label>What to Repeat</Label>
                <Textarea 
                  value={(aar.recommendations_repeat || []).join('\n')} 
                  onChange={e => updateField('recommendations_repeat', e.target.value.split('\n').filter(Boolean))} 
                  placeholder="One item per line"
                  rows={4} 
                  className="mt-1" 
                />
              </div>
              <div>
                <Label>What to Expand</Label>
                <Textarea 
                  value={(aar.recommendations_expand || []).join('\n')} 
                  onChange={e => updateField('recommendations_expand', e.target.value.split('\n').filter(Boolean))} 
                  placeholder="One item per line"
                  rows={4} 
                  className="mt-1" 
                />
              </div>
              <div>
                <Label>What to Improve</Label>
                <Textarea 
                  value={(aar.recommendations_improve || []).join('\n')} 
                  onChange={e => updateField('recommendations_improve', e.target.value.split('\n').filter(Boolean))} 
                  placeholder="One item per line"
                  rows={4} 
                  className="mt-1" 
                />
              </div>
              <div>
                <Label>Future Partnership Ideas</Label>
                <Textarea 
                  value={(aar.future_partnership_ideas || []).join('\n')} 
                  onChange={e => updateField('future_partnership_ideas', e.target.value.split('\n').filter(Boolean))} 
                  placeholder="One item per line"
                  rows={4} 
                  className="mt-1" 
                />
              </div>
            </div>
          )}

          {/* Final Assessment */}
          {activeSection === 'assessment' && (
            <div className="max-w-2xl">
              <Label>Final Assessment</Label>
              <p className="text-sm text-muted-foreground mb-2">Executive takeaway: emotional ROI, strategic value, long-term significance.</p>
              <Textarea 
                value={aar.final_assessment || ''} 
                onChange={e => updateField('final_assessment', e.target.value)} 
                rows={8} 
                className="mt-1"
              />
            </div>
          )}

          {/* Media & Assets */}
          {activeSection === 'media' && (
            <AARMediaUpload 
              aarId={id || ''} 
              media={media} 
              onUpload={uploadMedia} 
              onDelete={deleteMedia} 
            />
          )}

          {/* Generate Content */}
          {activeSection === 'generate' && (
            <AARGenerateContent aarId={id || ''} aar={aar} />
          )}
        </ScrollArea>
      </div>

      {/* Right: Live Preview */}
      <div className="w-96 border-l flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold">Live Preview</h2>
          <Badge variant={clientSafeMode ? "default" : "secondary"}>
            {clientSafeMode ? "Client-Safe" : "Internal"}
          </Badge>
        </div>
        <ScrollArea className="flex-1">
          <AARLivePreview aar={aar} media={media} clientSafe={clientSafeMode} />
        </ScrollArea>
      </div>
    </div>
  );
}
