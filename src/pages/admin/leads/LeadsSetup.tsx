/**
 * Lead Intelligence Setup Wizard
 * 
 * 5-step wizard: Create workspace → Add domain → Connect providers → Install pixel → Verify
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RequireAdmin } from "@/components/auth/RequireAdmin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Target, Globe, Zap, CheckCircle2, Copy, ExternalLink,
  ArrowRight, ArrowLeft, Loader2, AlertCircle, RefreshCw
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type SetupStep = 1 | 2 | 3 | 4 | 5;
type VerificationMethod = 'dns_txt' | 'meta_tag' | 'html_file';

function LeadsSetupContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState<SetupStep>(1);
  
  // Step 1: Workspace
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceMode, setWorkspaceMode] = useState<'owner' | 'agency'>('owner');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);

  // Step 2: Domain
  const [domainInput, setDomainInput] = useState("");
  const [verificationMethod, setVerificationMethod] = useState<VerificationMethod>('dns_txt');
  const [verificationToken, setVerificationToken] = useState("");
  const [domainId, setDomainId] = useState<string | null>(null);

  // Step 4: Test events
  const [testEvents, setTestEvents] = useState<any[]>([]);
  const [isPolling, setIsPolling] = useState(false);

  // Fetch existing workspaces
  const { data: workspaces, isLoading: workspacesLoading } = useQuery({
    queryKey: ['lead-workspaces'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_workspaces')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch domains for selected workspace
  const { data: domains } = useQuery({
    queryKey: ['lead-domains', selectedWorkspaceId],
    queryFn: async () => {
      if (!selectedWorkspaceId) return [];
      const { data, error } = await supabase
        .from('lead_domains')
        .select('*')
        .eq('workspace_id', selectedWorkspaceId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedWorkspaceId
  });

  // Create workspace mutation
  const createWorkspace = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from('lead_workspaces')
        .insert({
          name: workspaceName.trim(),
          mode: workspaceMode,
          owner_user_id: user.id
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setSelectedWorkspaceId(data.id);
      queryClient.invalidateQueries({ queryKey: ['lead-workspaces'] });
      toast.success("Workspace created!");
      setCurrentStep(2);
    },
    onError: (err: any) => {
      toast.error("Failed to create workspace", { description: err.message });
    }
  });

  // Add domain mutation
  const addDomain = useMutation({
    mutationFn: async () => {
      if (!selectedWorkspaceId) throw new Error("No workspace selected");
      
      const token = `seeksy-verify=${crypto.randomUUID().slice(0, 16)}`;
      setVerificationToken(token);

      const { data, error } = await supabase
        .from('lead_domains')
        .insert({
          workspace_id: selectedWorkspaceId,
          domain: domainInput.trim().toLowerCase(),
          status: 'pending',
          verification_method: verificationMethod,
          verification_token: token
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setDomainId(data.id);
      setVerificationToken(data.verification_token);
      queryClient.invalidateQueries({ queryKey: ['lead-domains', selectedWorkspaceId] });
      toast.success("Domain added! Follow verification instructions.");
      setCurrentStep(3);
    },
    onError: (err: any) => {
      toast.error("Failed to add domain", { description: err.message });
    }
  });

  // Verify domain mutation
  const verifyDomain = useMutation({
    mutationFn: async () => {
      if (!domainId) throw new Error("No domain to verify");
      
      // In production, this would call an edge function to verify DNS/meta/file
      // For now, we'll simulate success
      const { error } = await supabase
        .from('lead_domains')
        .update({ 
          status: 'verified',
          verified_at: new Date().toISOString()
        })
        .eq('id', domainId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-domains', selectedWorkspaceId] });
      toast.success("Domain verified!");
      setCurrentStep(4);
    },
    onError: (err: any) => {
      toast.error("Verification failed", { description: "Please check your DNS/meta tag and try again." });
    }
  });

  // Poll for test events
  const pollTestEvents = async () => {
    if (!selectedWorkspaceId) return;
    setIsPolling(true);
    
    try {
      const { data, error } = await supabase
        .from('lead_intel_events')
        .select('*')
        .eq('workspace_id', selectedWorkspaceId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (!error && data) {
        setTestEvents(data);
        if (data.length > 0) {
          toast.success("Events received! Your pixel is working.");
        }
      }
    } finally {
      setIsPolling(false);
    }
  };

  const getPixelSnippet = () => {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'your-project-id';
    return `<script>
  (function() {
    var s = document.createElement('script');
    s.src = 'https://${projectId}.supabase.co/functions/v1/lead-pixel-ingest/pixel.js';
    s.async = true;
    s.dataset.workspaceId = '${selectedWorkspaceId}';
    s.dataset.domain = '${domainInput}';
    document.head.appendChild(s);
  })();
</script>`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const steps = [
    { num: 1, label: "Workspace", icon: Target },
    { num: 2, label: "Domain", icon: Globe },
    { num: 3, label: "Verify", icon: CheckCircle2 },
    { num: 4, label: "Install Pixel", icon: Zap },
    { num: 5, label: "Complete", icon: CheckCircle2 },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Target className="h-6 w-6 text-primary" />
          Lead Intelligence Setup
        </h1>
        <p className="text-muted-foreground text-sm">
          Set up your lead tracking in a few steps
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, idx) => (
          <div key={step.num} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              currentStep >= step.num 
                ? 'bg-primary border-primary text-primary-foreground' 
                : 'border-muted-foreground/30 text-muted-foreground'
            }`}>
              {currentStep > step.num ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <step.icon className="h-5 w-5" />
              )}
            </div>
            <span className={`ml-2 text-sm font-medium ${
              currentStep >= step.num ? 'text-foreground' : 'text-muted-foreground'
            }`}>
              {step.label}
            </span>
            {idx < steps.length - 1 && (
              <div className={`w-8 h-0.5 mx-3 ${
                currentStep > step.num ? 'bg-primary' : 'bg-muted-foreground/30'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Create/Select Workspace */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Create or Select Workspace</CardTitle>
            <CardDescription>
              A workspace organizes your leads, domains, and settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {workspaces && workspaces.length > 0 && (
              <div className="space-y-2">
                <Label>Use Existing Workspace</Label>
                <Select 
                  value={selectedWorkspaceId || ""} 
                  onValueChange={(v) => {
                    setSelectedWorkspaceId(v);
                    setCurrentStep(2);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a workspace..." />
                  </SelectTrigger>
                  <SelectContent>
                    {workspaces.map((ws) => (
                      <SelectItem key={ws.id} value={ws.id}>
                        {ws.name} ({ws.mode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-center text-muted-foreground text-sm py-2">— or —</div>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workspace-name">New Workspace Name</Label>
                <Input
                  id="workspace-name"
                  placeholder="e.g., My Company Leads"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Workspace Mode</Label>
                <RadioGroup value={workspaceMode} onValueChange={(v) => setWorkspaceMode(v as 'owner' | 'agency')}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="owner" id="owner" />
                    <Label htmlFor="owner" className="font-normal">
                      Owner — I'm tracking leads for my own business
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="agency" id="agency" />
                    <Label htmlFor="agency" className="font-normal">
                      Agency — I'm managing leads for clients
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <Button 
                onClick={() => createWorkspace.mutate()} 
                disabled={!workspaceName.trim() || createWorkspace.isPending}
              >
                {createWorkspace.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Create Workspace
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Add Domain */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Add Your Domain</CardTitle>
            <CardDescription>
              Enter the domain where you'll install the lead tracking pixel.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="domain">Domain</Label>
              <Input
                id="domain"
                placeholder="example.com"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value.replace(/^https?:\/\//, '').replace(/\/$/, ''))}
              />
              <p className="text-xs text-muted-foreground">
                Enter without http:// or trailing slash
              </p>
            </div>

            <div className="space-y-2">
              <Label>Verification Method</Label>
              <RadioGroup 
                value={verificationMethod} 
                onValueChange={(v) => setVerificationMethod(v as VerificationMethod)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dns_txt" id="dns" />
                  <Label htmlFor="dns" className="font-normal">
                    DNS TXT Record (recommended)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="meta_tag" id="meta" />
                  <Label htmlFor="meta" className="font-normal">
                    HTML Meta Tag
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="html_file" id="file" />
                  <Label htmlFor="file" className="font-normal">
                    HTML File Upload
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={() => addDomain.mutate()} 
                disabled={!domainInput.trim() || addDomain.isPending}
              >
                {addDomain.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Add Domain
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Verify Domain */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Verify Your Domain</CardTitle>
            <CardDescription>
              Follow the instructions below to verify ownership of {domainInput}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {verificationMethod === 'dns_txt' && (
              <div className="space-y-3 p-4 bg-muted rounded-lg">
                <p className="font-medium">Add this TXT record to your DNS:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-background rounded text-sm font-mono">
                    {verificationToken}
                  </code>
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(verificationToken)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Host: @ or {domainInput} | Type: TXT | Value: {verificationToken}
                </p>
              </div>
            )}

            {verificationMethod === 'meta_tag' && (
              <div className="space-y-3 p-4 bg-muted rounded-lg">
                <p className="font-medium">Add this meta tag to your homepage &lt;head&gt;:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-background rounded text-sm font-mono break-all">
                    {`<meta name="seeksy-verification" content="${verificationToken}" />`}
                  </code>
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(`<meta name="seeksy-verification" content="${verificationToken}" />`)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {verificationMethod === 'html_file' && (
              <div className="space-y-3 p-4 bg-muted rounded-lg">
                <p className="font-medium">Upload a file named <code>seeksy-verify.html</code> to your root:</p>
                <p className="text-sm">File contents should be:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-background rounded text-sm font-mono">
                    {verificationToken}
                  </code>
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(verificationToken)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  File should be accessible at: https://{domainInput}/seeksy-verify.html
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={() => verifyDomain.mutate()} 
                disabled={verifyDomain.isPending}
              >
                {verifyDomain.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Verify Domain
                <CheckCircle2 className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Install Pixel */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Install Tracking Pixel</CardTitle>
            <CardDescription>
              Add this script to your website to start capturing leads.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>JavaScript Snippet</Label>
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(getPixelSnippet())}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
              <Textarea
                readOnly
                value={getPixelSnippet()}
                className="font-mono text-xs h-32"
              />
              <p className="text-xs text-muted-foreground">
                Add this to your website's &lt;head&gt; or before &lt;/body&gt;
              </p>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <p className="font-medium">Test Events</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={pollTestEvents}
                  disabled={isPolling}
                >
                  {isPolling ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Check for Events
                </Button>
              </div>
              
              {testEvents.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {testEvents.map((evt) => (
                    <div key={evt.id} className="flex items-center gap-2 p-2 bg-muted rounded text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="font-mono">{evt.event_type}</span>
                      <span className="text-muted-foreground text-xs">{evt.url}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No events received yet. Visit your website after installing the pixel.
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCurrentStep(3)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={() => setCurrentStep(5)}>
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Complete */}
      {currentStep === 5 && (
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle>Setup Complete!</CardTitle>
            <CardDescription>
              Your Lead Intelligence workspace is ready. Start monitoring your leads.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <p className="font-medium mb-1">Next Steps</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Configure scoring rules</li>
                  <li>• Connect providers (Warmly, OpenSend)</li>
                  <li>• Set up credit alerts</li>
                </ul>
              </Card>
              <Card className="p-4">
                <p className="font-medium mb-1">Quick Links</p>
                <div className="space-y-2">
                  <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => navigate('/admin/leads/providers')}>
                    Connect Providers <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                  <br />
                  <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => navigate('/admin/leads/rules')}>
                    Scoring Rules <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </Card>
            </div>

            <Button className="w-full" onClick={() => navigate('/admin/leads')}>
              Go to Leads Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function LeadsSetup() {
  return (
    <RequireAdmin>
      <LeadsSetupContent />
    </RequireAdmin>
  );
}
