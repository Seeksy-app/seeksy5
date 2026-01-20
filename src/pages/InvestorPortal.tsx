import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Lock, FileSpreadsheet, Settings, ShieldCheck, Download, TrendingUp, Mail, Loader2 } from "lucide-react";
import { InteractiveSpreadsheet } from "@/components/cfo/InteractiveSpreadsheet";
import { CFOAIChat } from "@/components/cfo/CFOAIChat";
import { BusinessModelTab } from "@/components/cfo/BusinessModelTab";
import { SpreadsheetList } from "@/components/investor/SpreadsheetList";
import { SpreadsheetViewer } from "@/components/investor/SpreadsheetViewer";
import { GenerateLinkModal } from "@/components/board/investor/GenerateLinkModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function InvestorPortal() {
  const [searchParams] = useSearchParams();
  const [accessCode, setAccessCode] = useState(searchParams.get("code") || "");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true); // New: prevent flash
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [investorEmail, setInvestorEmail] = useState("");
  const [showDisclosure, setShowDisclosure] = useState(false);
  const [pendingAccessData, setPendingAccessData] = useState<any>(null);
  const [viewingSpreadsheet, setViewingSpreadsheet] = useState<any>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const theme = "light"; // Always use light theme
  const [shareConfig, setShareConfig] = useState<any>({
    allowHtmlView: true,
    allowDownload: true,
    proformaType: 'ai',
    adjustmentMultiplier: 1,
    useRealTimeData: true,
  });

  // Auto-authenticate admin/CFO users without requiring access code
  useEffect(() => {
    const checkAdminAccess = async () => {
      setCheckingAdmin(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setCheckingAdmin(false);
          return;
        }

        // Check if user is admin/CFO
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        const adminRoles = ['admin', 'super_admin', 'cfo', 'board_member'];
        const isAdmin = roles?.some(r => adminRoles.includes(r.role));

        if (isAdmin) {
          setIsAuthenticated(true);
          setIsAdminUser(true);
          setInvestorEmail(user.email || 'Admin Access');
        }
      } finally {
        setCheckingAdmin(false);
      }
    };

    checkAdminAccess();
  }, []);

  useEffect(() => {
    // Pre-fill access code from URL but don't auto-validate
    const code = searchParams.get("code");
    if (code && code.length === 8) {
      setAccessCode(code);
    }
  }, [searchParams]);

  const validateAccessCode = async () => {
    if (!accessCode) {
      toast.error("Please enter an access code");
      return;
    }

    setLoading(true);
    try {
      console.log('Validating access code:', accessCode.toUpperCase());
      
      const { data, error } = await supabase
        .from('investor_shares')
        .select('*')
        .eq('access_code', accessCode.toUpperCase())
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      console.log('Query result:', { data, error });

      if (error) {
        console.error('Database error:', error);
        toast.error("Error validating access code");
        return;
      }

      if (!data) {
        toast.error("Invalid, expired, or revoked access code");
        return;
      }

      setPendingAccessData(data);
      setShowDisclosure(true);
    } catch (error: any) {
      console.error("Error validating access:", error);
      toast.error("Failed to validate access code");
    } finally {
      setLoading(false);
    }
  };

  const acceptDisclosure = () => {
    if (pendingAccessData) {
      setInvestorEmail(pendingAccessData.investor_email);
      setShareConfig(pendingAccessData.share_config || {
        allowHtmlView: true,
        allowDownload: false,
        proformaType: 'ai',
        adjustmentMultiplier: 1,
        useRealTimeData: true,
      });
      setIsAuthenticated(true);
      setShowDisclosure(false);
      toast.success("Access granted! Welcome to the financial portal.");
    }
  };

  const declineDisclosure = () => {
    setShowDisclosure(false);
    setPendingAccessData(null);
    toast.info("Access declined. You must accept the agreement to continue.");
  };

  // Show loading while checking admin status to prevent flash
  if (checkingAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Seeksy Investor Portal</CardTitle>
              <CardDescription>
                Enter your access code to view financial forecasts and models
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Access Code</Label>
                <Input
                  id="code"
                  placeholder="Enter 8-character code"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  maxLength={8}
                  className="font-mono text-lg text-center"
                />
              </div>
              <Button
                onClick={validateAccessCode}
                disabled={loading || accessCode.length !== 8}
                className="w-full"
              >
                {loading ? "Validating..." : "Access Portal"}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                If you don't have an access code, please contact the Seeksy team
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Confidentiality Agreement Dialog */}
        <AlertDialog open={showDisclosure} onOpenChange={setShowDisclosure}>
          <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <AlertDialogHeader>
              <div className="mx-auto w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <AlertDialogTitle className="text-xl text-center">
                Confidentiality & Non-Disclosure Agreement
              </AlertDialogTitle>
              <AlertDialogDescription className="text-left space-y-3 pt-2">
                <p className="text-sm">
                  By accessing this financial information, you acknowledge and agree to the following terms:
                </p>
                
                <div className="space-y-2 text-xs">
                  <div>
                    <h4 className="font-semibold text-foreground mb-0.5">1. Confidential Information</h4>
                    <p>
                      All financial forecasts, models, assumptions, projections, and business information 
                      (collectively, "Confidential Information") shared through this portal are proprietary 
                      and confidential to Seeksy and its stakeholders.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-0.5">2. Non-Disclosure Obligation</h4>
                    <p>
                      You agree to maintain the confidentiality of all Confidential Information and not to 
                      disclose, share, distribute, or make available such information to any third party 
                      without prior written consent from Seeksy.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-0.5">3. Limited Use</h4>
                    <p>
                      The Confidential Information is provided solely for your evaluation purposes as a 
                      potential or current investor. You may not use this information for any other purpose, 
                      including competitive analysis or business development.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-0.5">4. No Guarantees</h4>
                    <p>
                      All projections and forecasts are based on assumptions and estimates. Actual results 
                      may differ materially. This information does not constitute investment advice or a 
                      recommendation to invest.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-0.5">5. Read-Only Access</h4>
                    <p>
                      Your access is read-only and for viewing purposes only. You may not download, copy, 
                      reproduce, or create derivative works from the Confidential Information without 
                      express written permission.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-0.5">6. Access Termination</h4>
                    <p>
                      Seeksy reserves the right to revoke your access at any time. Upon termination or 
                      expiration of access, you agree to cease all use of the Confidential Information.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <p className="text-xs font-medium text-foreground">
                    By clicking "I Accept" below, you confirm that you have read, understood, and agree 
                    to be bound by these terms and will maintain the confidentiality of all information 
                    accessed through this portal.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-2">
              <AlertDialogCancel onClick={declineDisclosure}>
                Decline
              </AlertDialogCancel>
              <AlertDialogAction onClick={acceptDisclosure}>
                I Accept
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Seeksy Financial Portal
              </h1>
              <p className="text-sm text-muted-foreground">
                Read-only access for {investorEmail}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isAdminUser && (
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => setShowShareModal(true)}
                  className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email to Investor
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => setIsAuthenticated(false)}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="proforma" className="space-y-8">
          <TabsList className="grid w-full max-w-3xl grid-cols-3 h-12 bg-muted/30 border-border border">
            <TabsTrigger 
              value="proforma" 
              className="text-base font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <FileSpreadsheet className="h-5 w-5 mr-2" />
              3-Year Pro Forma
            </TabsTrigger>
            <TabsTrigger 
              value="business-model" 
              className="text-base font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <TrendingUp className="h-5 w-5 mr-2" />
              Business Model
            </TabsTrigger>
            <TabsTrigger 
              value="assumptions" 
              className="text-base font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Settings className="h-5 w-5 mr-2" />
              Assumptions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="proforma" className="space-y-6">
            <Card className="bg-gradient-to-br from-purple-500/5 to-pink-600/5 border-purple-200/20">
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 animate-pulse" />
                    <span className="text-sm font-medium text-foreground">Powered by</span>
                    <span className="text-sm font-semibold bg-gradient-to-br from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Google Gemini 2.5 Flash
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">AI-Generated Financial Model</span>
                </div>
              </CardContent>
            </Card>
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <InteractiveSpreadsheet isReadOnly={true} />
              </div>
              <div className="self-start">
                <CFOAIChat />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="business-model" className="space-y-6">
            <BusinessModelTab theme="light" />
          </TabsContent>

          <TabsContent value="assumptions" className="space-y-6">
            <Card className="bg-card">
              <CardHeader>
                <CardTitle>Financial Model Assumptions</CardTitle>
                <CardDescription>
                  Key assumptions driving the 3-year financial projections
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Subscription Pricing */}
                <div>
                  <h3 className="font-semibold text-lg mb-4">Subscription Pricing</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
                      <p className="text-sm text-emerald-700">Podcaster Basic</p>
                      <p className="text-2xl font-bold text-emerald-900">$19<span className="text-sm font-normal">/mo</span></p>
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200">
                      <p className="text-sm text-blue-700">Podcaster Pro</p>
                      <p className="text-2xl font-bold text-blue-900">$49<span className="text-sm font-normal">/mo</span></p>
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200">
                      <p className="text-sm text-purple-700">Enterprise</p>
                      <p className="text-2xl font-bold text-purple-900">$199<span className="text-sm font-normal">/mo</span></p>
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
                      <p className="text-sm text-amber-700">My Page Basic</p>
                      <p className="text-2xl font-bold text-amber-900">$9<span className="text-sm font-normal">/mo</span></p>
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-br from-rose-50 to-red-50 border border-rose-200">
                      <p className="text-sm text-rose-700">My Page Pro</p>
                      <p className="text-2xl font-bold text-rose-900">$29<span className="text-sm font-normal">/mo</span></p>
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-200">
                      <p className="text-sm text-indigo-700">Event Creator</p>
                      <p className="text-2xl font-bold text-indigo-900">$29<span className="text-sm font-normal">/mo</span></p>
                    </div>
                  </div>
                </div>

                {/* Growth & Users */}
                <div>
                  <h3 className="font-semibold text-lg mb-4">Growth & Customer Acquisition</h3>
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200">
                      <p className="text-sm text-blue-700">Starting Users</p>
                      <p className="text-2xl font-bold text-blue-900">20</p>
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
                      <p className="text-sm text-emerald-700">Monthly Growth</p>
                      <p className="text-2xl font-bold text-emerald-900">25<span className="text-sm font-normal">%</span></p>
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
                      <p className="text-sm text-amber-700">Monthly Churn</p>
                      <p className="text-2xl font-bold text-amber-900">5<span className="text-sm font-normal">%</span></p>
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-br from-rose-50 to-red-50 border border-rose-200">
                      <p className="text-sm text-rose-700">Customer CAC</p>
                      <p className="text-2xl font-bold text-rose-900">$45</p>
                    </div>
                  </div>
                </div>

                {/* Ad Revenue */}
                <div>
                  <h3 className="font-semibold text-lg mb-4">Ad Revenue Model</h3>
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200">
                      <p className="text-sm text-purple-700">Average CPM</p>
                      <p className="text-2xl font-bold text-purple-900">$25</p>
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-200">
                      <p className="text-sm text-indigo-700">Ad Fill Rate</p>
                      <p className="text-2xl font-bold text-indigo-900">80<span className="text-sm font-normal">%</span></p>
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
                      <p className="text-sm text-emerald-700">Platform Share</p>
                      <p className="text-2xl font-bold text-emerald-900">30<span className="text-sm font-normal">%</span></p>
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200">
                      <p className="text-sm text-blue-700">Episodes/Mo</p>
                      <p className="text-2xl font-bold text-blue-900">4</p>
                    </div>
                  </div>
                </div>

                {/* Cost Structure */}
                <div>
                  <h3 className="font-semibold text-lg mb-4">Cost Structure</h3>
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
                      <p className="text-sm text-amber-700">AI Compute</p>
                      <p className="text-2xl font-bold text-amber-900">$2.50<span className="text-sm font-normal">/user</span></p>
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-br from-rose-50 to-red-50 border border-rose-200">
                      <p className="text-sm text-rose-700">Storage</p>
                      <p className="text-2xl font-bold text-rose-900">$0.023<span className="text-sm font-normal">/GB</span></p>
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-200">
                      <p className="text-sm text-indigo-700">Bandwidth</p>
                      <p className="text-2xl font-bold text-indigo-900">$0.05<span className="text-sm font-normal">/GB</span></p>
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200">
                      <p className="text-sm text-purple-700">Streaming</p>
                      <p className="text-2xl font-bold text-purple-900">$0.15<span className="text-sm font-normal">/hr</span></p>
                    </div>
                  </div>
                </div>

                {/* Tier Distribution */}
                <div>
                  <h3 className="font-semibold text-lg mb-4">Customer Tier Distribution</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
                      <p className="text-sm text-emerald-700">Podcaster Basic</p>
                      <p className="text-2xl font-bold text-emerald-900">40<span className="text-sm font-normal">%</span></p>
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200">
                      <p className="text-sm text-blue-700">Podcaster Pro</p>
                      <p className="text-2xl font-bold text-blue-900">45<span className="text-sm font-normal">%</span></p>
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200">
                      <p className="text-sm text-purple-700">Enterprise</p>
                      <p className="text-2xl font-bold text-purple-900">15<span className="text-sm font-normal">%</span></p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    <strong>Note:</strong> These assumptions are configured by the Seeksy CFO team and drive all financial projections. 
                    The Custom 3-Year Pro Forma model uses these values to calculate monthly and annual forecasts.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="mt-12 text-center text-sm border-t pt-6 text-muted-foreground border-border">
          <p>For questions or additional information, please contact <a href="mailto:Hello@Seeksy.io" className="hover:underline font-medium text-primary">Hello@Seeksy.io</a></p>
        </div>
      </div>

      {/* Email to Investor Modal */}
      <GenerateLinkModal
        open={showShareModal}
        onOpenChange={setShowShareModal}
        onSuccess={() => {}}
      />
    </div>
  );
}
