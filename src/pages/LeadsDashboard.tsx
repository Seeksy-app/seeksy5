import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Copy, Eye, Mail, MapPin, Clock, Monitor } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LeadsDashboard() {
  const { toast } = useToast();
  const [copiedPixel, setCopiedPixel] = useState(false);

  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: leads, isLoading } = useQuery({
    queryKey: ['pixel-leads', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      
      const { data, error } = await supabase
        .from('pixel_leads')
        .select('*')
        .eq('creator_id', session.user.id)
        .order('last_seen_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!session?.user?.id,
  });

  const pixelCode = `<!-- Seeksy Lead Pixel -->
<script>
(function() {
  const visitorId = localStorage.getItem('seeksy_visitor_id') || 
    'v_' + Math.random().toString(36).substr(2, 9);
  localStorage.setItem('seeksy_visitor_id', visitorId);
  
  let startTime = Date.now();
  let pageViews = parseInt(sessionStorage.getItem('seeksy_page_views') || '0') + 1;
  sessionStorage.setItem('seeksy_page_views', pageViews);
  
  fetch('${window.location.origin}/api/track-pixel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creator_id: '${session?.user?.id || 'YOUR_CREATOR_ID'}',
      visitor_id: visitorId,
      page_url: window.location.href,
      referrer: document.referrer,
      session_duration: Math.floor((Date.now() - startTime) / 1000),
      page_views: pageViews
    })
  });
})();
</script>`;

  const copyPixelCode = () => {
    navigator.clipboard.writeText(pixelCode);
    setCopiedPixel(true);
    toast({
      title: "Pixel code copied!",
      description: "Paste this code in your website's <head> section",
    });
    setTimeout(() => setCopiedPixel(false), 2000);
  };

  const totalLeads = leads?.length || 0;
  const totalPageViews = leads?.reduce((sum, lead) => sum + (lead.page_views || 0), 0) || 0;
  const enrichedLeads = leads?.filter(l => l.email)?.length || 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Lead Capture Dashboard</h1>
          <p className="text-muted-foreground">Track website visitors and capture leads invisibly</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Get Pixel Code</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Your Lead Capture Pixel</DialogTitle>
              <DialogDescription>
                Copy this code and paste it in the &lt;head&gt; section of any website you want to track
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg relative">
                <pre className="text-xs overflow-x-auto">{pixelCode}</pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={copyPixelCode}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {copiedPixel ? 'Copied!' : 'Copy'}
                </Button>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Privacy Notice:</strong> This pixel tracks behavioral data (page views, session duration, referrer). 
                  Email capture requires additional enrichment services and compliance with GDPR/privacy laws.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Visitors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalLeads}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Page Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalPageViews}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Identified Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{enrichedLeads}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalLeads > 0 ? Math.round((enrichedLeads / totalLeads) * 100) : 0}% conversion
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Session</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {leads && leads.length > 0
                ? Math.round(leads.reduce((sum, l) => sum + (l.session_duration || 0), 0) / leads.length)
                : 0}s
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Captured Leads</CardTitle>
          <CardDescription>Visitors tracked by your pixel</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading leads...</div>
          ) : leads && leads.length > 0 ? (
            <div className="space-y-4">
              {leads.map((lead) => (
                <Card key={lead.id} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          {lead.email ? (
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-primary" />
                              <span className="font-semibold">{lead.email}</span>
                              <Badge variant="default">Identified</Badge>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Eye className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Anonymous Visitor</span>
                              <Badge variant="outline">Pending</Badge>
                            </div>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Monitor className="w-4 h-4 text-muted-foreground" />
                            <span className="truncate">{lead.page_url}</span>
                          </div>
                          
                          {lead.country && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span>{lead.city ? `${lead.city}, ` : ''}{lead.country}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span>{lead.page_views} page views</span>
                          </div>
                          
                          {lead.session_duration && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span>{lead.session_duration}s session</span>
                            </div>
                          )}
                        </div>
                        
                        {lead.referrer && (
                          <div className="text-xs text-muted-foreground">
                            Referred from: {lead.referrer}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right text-sm text-muted-foreground">
                        <div>Last seen:</div>
                        <div>{new Date(lead.last_seen_at).toLocaleString()}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Monitor className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No leads captured yet</h3>
              <p className="text-muted-foreground mb-4">
                Install your pixel code on a website to start tracking visitors
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>Get Pixel Code</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Your Lead Capture Pixel</DialogTitle>
                    <DialogDescription>
                      Copy this code and paste it in the &lt;head&gt; section of any website
                    </DialogDescription>
                  </DialogHeader>
                  <div className="bg-muted p-4 rounded-lg relative">
                    <pre className="text-xs overflow-x-auto">{pixelCode}</pre>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2"
                      onClick={copyPixelCode}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      {copiedPixel ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}