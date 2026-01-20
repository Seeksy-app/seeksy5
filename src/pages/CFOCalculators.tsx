import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Calculator, TrendingUp, DollarSign, Users, Radio, Award, Video, Mic, Globe, Save, FolderOpen, Trash2, FileText, Mail, Monitor } from "lucide-react";
import { DigitalAdSegment } from "@/components/cfo/DigitalAdSegment";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface CalculatorResult {
  name: string;
  revenue: number;
  details: string;
  year1?: number;
  year2?: number;
  year3?: number;
}

interface ThreeYearProjection {
  year1: number;
  year2: number;
  year3: number;
}

interface SavedProforma {
  id: string;
  proforma_name: string;
  proforma_data: any;
  created_at: string;
  updated_at: string;
}

export default function CFOCalculators() {
  const navigate = useNavigate();
  
  // Saved Proformas
  const [savedProformas, setSavedProformas] = useState<SavedProforma[]>([]);
  const [proformaName, setProformaName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Podcast Ad Calculator
  const [podcastImpressions, setPodcastImpressions] = useState("");
  const [podcastCpm, setPodcastCpm] = useState("");
  const [podcastResult, setPodcastResult] = useState<number | null>(null);

  // Quick Campaign (Video Ads) Calculator
  const [videoImpressions, setVideoImpressions] = useState("");
  const [videoCpm, setVideoCpm] = useState("");
  const [videoResult, setVideoResult] = useState<number | null>(null);

  // Conversational Ads Calculator
  const [callInquiries, setCallInquiries] = useState("");
  const [payoutPerInquiry, setPayoutPerInquiry] = useState("");
  const [conversionalResult, setConversionalResult] = useState<number | null>(null);

  // User Subscribers Calculator
  const [subscriberCount, setSubscriberCount] = useState("");
  const [avgSubscriptionPrice, setAvgSubscriptionPrice] = useState("");
  const [subscriberResult, setSubscriberResult] = useState<number | null>(null);

  // Studio Livestream Ads Calculator
  const [liveStreamImpressions, setLiveStreamImpressions] = useState("");
  const [liveStreamCpm, setLiveStreamCpm] = useState("");
  const [liveStreamResult, setLiveStreamResult] = useState<number | null>(null);

  // Awards Program Calculator
  const [sponsorships, setSponsorships] = useState("");
  const [registrationCount, setRegistrationCount] = useState("");
  const [registrationFee, setRegistrationFee] = useState("");
  const [awardsResult, setAwardsResult] = useState<number | null>(null);

  // Digital Ad Revenue Calculator - Separate segments with subsegments
  const [blogImpressions, setBlogImpressions] = useState("");
  const [blogCpm, setBlogCpm] = useState("");
  const [blogSubsegments, setBlogSubsegments] = useState<any[]>([]);
  
  const [newsletterImpressions, setNewsletterImpressions] = useState("");
  const [newsletterCpm, setNewsletterCpm] = useState("");
  const [newsletterSubsegments, setNewsletterSubsegments] = useState<any[]>([]);
  
  const [websitePageviews, setWebsitePageviews] = useState("");
  const [websiteCpm, setWebsiteCpm] = useState("");
  const [websiteSubsegments, setWebsiteSubsegments] = useState<any[]>([]);
  
  const [digitalResult, setDigitalResult] = useState<number | null>(null);

  // Proforma Selection
  const [proformaSelections, setProformaSelections] = useState({
    podcastAds: false,
    videoAds: false,
    conversationalAds: false,
    subscribers: false,
    liveStreamAds: false,
    awards: false,
    digital: false,
  });

  useEffect(() => {
    loadSavedProformas();
  }, []);

  const loadSavedProformas = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('saved_proformas')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setSavedProformas(data || []);
    } catch (error) {
      console.error('Error loading saved proformas:', error);
    }
  };

  const handleSaveProforma = async () => {
    if (!proformaName.trim()) {
      toast.error('Please enter a name for this proforma');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const proformaData = {
        selections: proformaSelections,
        calculations: {
          podcast: { impressions: podcastImpressions, cpm: podcastCpm, result: podcastResult },
          video: { impressions: videoImpressions, cpm: videoCpm, result: videoResult },
          conversational: { inquiries: callInquiries, payout: payoutPerInquiry, result: conversionalResult },
          subscribers: { count: subscriberCount, price: avgSubscriptionPrice, result: subscriberResult },
          liveStream: { impressions: liveStreamImpressions, cpm: liveStreamCpm, result: liveStreamResult },
          awards: { sponsorships, registrations: registrationCount, fee: registrationFee, result: awardsResult },
          digital: { 
            blog: { impressions: blogImpressions, cpm: blogCpm, subsegments: blogSubsegments },
            newsletter: { impressions: newsletterImpressions, cpm: newsletterCpm, subsegments: newsletterSubsegments },
            website: { impressions: websitePageviews, cpm: websiteCpm, subsegments: websiteSubsegments },
            result: digitalResult 
          },
        },
        proforma: calculateTotalProforma(),
      };

      const { error } = await supabase
        .from('saved_proformas')
        .insert({
          user_id: user.id,
          proforma_name: proformaName,
          proforma_data: proformaData,
        } as any);

      if (error) throw error;

      toast.success('Proforma saved successfully!');
      setShowSaveDialog(false);
      setProformaName('');
      loadSavedProformas();
    } catch (error) {
      console.error('Error saving proforma:', error);
      toast.error('Failed to save proforma');
    } finally {
      setSaving(false);
    }
  };

  const handleLoadProforma = (savedProforma: SavedProforma) => {
    const data = savedProforma.proforma_data;
    
    // Restore selections
    setProformaSelections(data.selections);
    
    // Restore calculations
    if (data.calculations.podcast) {
      setPodcastImpressions(data.calculations.podcast.impressions);
      setPodcastCpm(data.calculations.podcast.cpm);
      setPodcastResult(data.calculations.podcast.result);
    }
    if (data.calculations.video) {
      setVideoImpressions(data.calculations.video.impressions);
      setVideoCpm(data.calculations.video.cpm);
      setVideoResult(data.calculations.video.result);
    }
    if (data.calculations.conversational) {
      setCallInquiries(data.calculations.conversational.inquiries);
      setPayoutPerInquiry(data.calculations.conversational.payout);
      setConversionalResult(data.calculations.conversational.result);
    }
    if (data.calculations.subscribers) {
      setSubscriberCount(data.calculations.subscribers.count);
      setAvgSubscriptionPrice(data.calculations.subscribers.price);
      setSubscriberResult(data.calculations.subscribers.result);
    }
    if (data.calculations.liveStream) {
      setLiveStreamImpressions(data.calculations.liveStream.impressions);
      setLiveStreamCpm(data.calculations.liveStream.cpm);
      setLiveStreamResult(data.calculations.liveStream.result);
    }
    if (data.calculations.awards) {
      setSponsorships(data.calculations.awards.sponsorships);
      setRegistrationCount(data.calculations.awards.registrations);
      setRegistrationFee(data.calculations.awards.fee);
      setAwardsResult(data.calculations.awards.result);
    }
    if (data.calculations.digital) {
      setBlogImpressions(data.calculations.digital.blog?.impressions || '');
      setBlogCpm(data.calculations.digital.blog?.cpm || '');
      setBlogSubsegments(data.calculations.digital.blog?.subsegments || []);
      setNewsletterImpressions(data.calculations.digital.newsletter?.impressions || '');
      setNewsletterCpm(data.calculations.digital.newsletter?.cpm || '');
      setNewsletterSubsegments(data.calculations.digital.newsletter?.subsegments || []);
      setWebsitePageviews(data.calculations.digital.website?.impressions || '');
      setWebsiteCpm(data.calculations.digital.website?.cpm || '');
      setWebsiteSubsegments(data.calculations.digital.website?.subsegments || []);
      setDigitalResult(data.calculations.digital.result);
    }
    
    setShowLoadDialog(false);
    toast.success(`Loaded proforma: ${savedProforma.proforma_name}`);
  };

  const handleDeleteProforma = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_proformas')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Proforma deleted');
      loadSavedProformas();
    } catch (error) {
      console.error('Error deleting proforma:', error);
      toast.error('Failed to delete proforma');
    }
  };

  const calculatePodcastRevenue = () => {
    const impressions = Number(podcastImpressions);
    const cpm = Number(podcastCpm);
    if (impressions && cpm) {
      const revenue = (impressions / 1000) * cpm;
      setPodcastResult(revenue);
    }
  };

  const calculateVideoRevenue = () => {
    const impressions = Number(videoImpressions);
    const cpm = Number(videoCpm);
    if (impressions && cpm) {
      const revenue = (impressions / 1000) * cpm;
      setVideoResult(revenue);
    }
  };

  const calculateConversationalRevenue = () => {
    const inquiries = Number(callInquiries);
    const payout = Number(payoutPerInquiry);
    if (inquiries && payout) {
      const revenue = inquiries * payout;
      setConversionalResult(revenue);
    }
  };

  const calculateSubscriberRevenue = () => {
    const count = Number(subscriberCount);
    const price = Number(avgSubscriptionPrice);
    if (count && price) {
      const revenue = count * price;
      setSubscriberResult(revenue);
    }
  };

  const calculateLiveStreamRevenue = () => {
    const impressions = Number(liveStreamImpressions);
    const cpm = Number(liveStreamCpm);
    if (impressions && cpm) {
      const revenue = (impressions / 1000) * cpm;
      setLiveStreamResult(revenue);
    }
  };

  const calculateAwardsRevenue = () => {
    const sponsor = Number(sponsorships);
    const regCount = Number(registrationCount);
    const regFee = Number(registrationFee);
    
    let revenue = 0;
    
    // Sponsorship revenue
    if (sponsor) revenue += sponsor;
    
    // Registration revenue
    if (regCount && regFee) revenue += regCount * regFee;
    
    if (revenue > 0) {
      setAwardsResult(revenue);
    }
  };

  const calculateDigitalRevenue = () => {
    let revenue = 0;
    
    // Blog revenue (main + subsegments)
    const blogImps = Number(blogImpressions);
    const blogCpmVal = Number(blogCpm);
    if (blogImps && blogCpmVal) {
      revenue += (blogImps / 1000) * blogCpmVal;
    }
    blogSubsegments.forEach((sub) => {
      const subImps = Number(sub.impressions);
      const subCpm = Number(sub.cpm);
      if (subImps && subCpm) {
        revenue += (subImps / 1000) * subCpm;
      }
    });
    
    // Newsletter revenue (main + subsegments)
    const newsletterImps = Number(newsletterImpressions);
    const newsletterCpmVal = Number(newsletterCpm);
    if (newsletterImps && newsletterCpmVal) {
      revenue += (newsletterImps / 1000) * newsletterCpmVal;
    }
    newsletterSubsegments.forEach((sub) => {
      const subImps = Number(sub.impressions);
      const subCpm = Number(sub.cpm);
      if (subImps && subCpm) {
        revenue += (subImps / 1000) * subCpm;
      }
    });
    
    // Website revenue (main + subsegments)
    const websiteImps = Number(websitePageviews);
    const websiteCpmVal = Number(websiteCpm);
    if (websiteImps && websiteCpmVal) {
      revenue += (websiteImps / 1000) * websiteCpmVal;
    }
    websiteSubsegments.forEach((sub) => {
      const subImps = Number(sub.impressions);
      const subCpm = Number(sub.cpm);
      if (subImps && subCpm) {
        revenue += (subImps / 1000) * subCpm;
      }
    });
    
    if (revenue > 0) {
      setDigitalResult(revenue);
    }
  };

  const calculateTotalProforma = () => {
    let total = 0;
    const results: CalculatorResult[] = [];

    if (proformaSelections.podcastAds && podcastResult !== null) {
      total += podcastResult;
      results.push({
        name: "Podcast Ad Revenue",
        revenue: podcastResult,
        details: `${podcastImpressions} impressions @ $${podcastCpm} CPM`
      });
    }
    
    if (proformaSelections.videoAds && videoResult !== null) {
      total += videoResult;
      results.push({
        name: "Video Ad Revenue (Quick Campaigns)",
        revenue: videoResult,
        details: `${videoImpressions} impressions @ $${videoCpm} CPM`
      });
    }
    
    if (proformaSelections.conversationalAds && conversionalResult !== null) {
      total += conversionalResult;
      results.push({
        name: "Conversational Ads Revenue",
        revenue: conversionalResult,
        details: `${callInquiries} inquiries @ $${payoutPerInquiry} per inquiry`
      });
    }
    
    if (proformaSelections.subscribers && subscriberResult !== null) {
      total += subscriberResult;
      results.push({
        name: "Subscription Revenue (MRR)",
        revenue: subscriberResult,
        details: `${subscriberCount} subscribers @ $${avgSubscriptionPrice}/month`
      });
    }
    
    if (proformaSelections.liveStreamAds && liveStreamResult !== null) {
      total += liveStreamResult;
      results.push({
        name: "Studio Livestream Ad Revenue",
        revenue: liveStreamResult,
        details: `${liveStreamImpressions} impressions @ $${liveStreamCpm} CPM`
      });
    }
    
    if (proformaSelections.awards && awardsResult !== null) {
      total += awardsResult;
      const detailParts = [];
      if (sponsorships) detailParts.push(`Sponsorships: $${sponsorships}`);
      if (registrationCount && registrationFee) detailParts.push(`${registrationCount} registrations @ $${registrationFee}`);
      results.push({
        name: "Awards & Events Revenue",
        revenue: awardsResult,
        details: detailParts.join(', ')
      });
    }

    if (proformaSelections.digital && digitalResult !== null) {
      total += digitalResult;
      const digitalParts = [];
      if (blogImpressions || blogSubsegments.length > 0) digitalParts.push(`Blog`);
      if (newsletterImpressions || newsletterSubsegments.length > 0) digitalParts.push(`Newsletter`);
      if (websitePageviews || websiteSubsegments.length > 0) digitalParts.push(`Website`);
      results.push({
        name: "Digital Ad Revenue",
        revenue: digitalResult,
        details: `${digitalParts.join(', ')} segments with custom placements`
      });
    }

    return { total, results };
  };

  const proforma = calculateTotalProforma();

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/admin')}
          className="mb-2 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Admin
        </Button>
        <h1 className="text-3xl font-bold mb-2">Revenue Calculators</h1>
        <p className="text-muted-foreground">
          Calculate projected revenue across all revenue streams and build comprehensive proformas
        </p>
      </div>

      <Tabs defaultValue="podcast-ads" className="space-y-6">
        <TabsList className="grid grid-cols-2 lg:grid-cols-9 w-full">
          <TabsTrigger value="podcast-ads">Podcast Ads</TabsTrigger>
          <TabsTrigger value="video-ads">Video Ads</TabsTrigger>
          <TabsTrigger value="conversational">Conversational</TabsTrigger>
          <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
          <TabsTrigger value="livestream">Livestream</TabsTrigger>
          <TabsTrigger value="awards">Awards</TabsTrigger>
          <TabsTrigger value="digital">Digital</TabsTrigger>
          <TabsTrigger value="proforma">Proforma</TabsTrigger>
          <TabsTrigger value="tech-stack">Tech Stack</TabsTrigger>
        </TabsList>

        {/* Podcast Ads Calculator */}
        <TabsContent value="podcast-ads">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mic className="h-5 w-5 text-primary" />
                <CardTitle>Podcast Audio Ad Revenue</CardTitle>
              </div>
              <CardDescription>
                Project revenue from podcast ad impressions across pre-roll, mid-roll, and post-roll placements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="podcast-impressions">Total Impressions</Label>
                  <Input
                    id="podcast-impressions"
                    type="number"
                    placeholder="e.g., 100000"
                    value={podcastImpressions}
                    onChange={(e) => setPodcastImpressions(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="podcast-cpm">CPM (Cost Per 1000)</Label>
                  <Input
                    id="podcast-cpm"
                    type="number"
                    placeholder="e.g., 25"
                    value={podcastCpm}
                    onChange={(e) => setPodcastCpm(e.target.value)}
                  />
                </div>
              </div>
              
              <Button onClick={calculatePodcastRevenue} className="w-full">
                <Calculator className="h-4 w-4 mr-2" />
                Calculate Revenue
              </Button>

              {podcastResult !== null && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">Projected Revenue</p>
                      <p className="text-3xl font-bold text-primary">
                        ${podcastResult.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex items-center space-x-2 pt-4 border-t">
                <Checkbox
                  id="proforma-podcast"
                  checked={proformaSelections.podcastAds}
                  onCheckedChange={(checked) => 
                    setProformaSelections(prev => ({ ...prev, podcastAds: checked as boolean }))
                  }
                />
                <label htmlFor="proforma-podcast" className="text-sm font-medium cursor-pointer">
                  Include in Proforma
                </label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Video Ads Calculator (Quick Campaigns) */}
        <TabsContent value="video-ads">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Video className="h-5 w-5 text-primary" />
                <CardTitle>Quick Campaign Video Ads</CardTitle>
              </div>
              <CardDescription>
                Project revenue from video ad impressions deployed through Quick Campaigns on creator My Pages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="video-impressions">Total Impressions</Label>
                  <Input
                    id="video-impressions"
                    type="number"
                    placeholder="e.g., 50000"
                    value={videoImpressions}
                    onChange={(e) => setVideoImpressions(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="video-cpm">CPM (Cost Per 1000)</Label>
                  <Input
                    id="video-cpm"
                    type="number"
                    placeholder="e.g., 15"
                    value={videoCpm}
                    onChange={(e) => setVideoCpm(e.target.value)}
                  />
                </div>
              </div>
              
              <Button onClick={calculateVideoRevenue} className="w-full">
                <Calculator className="h-4 w-4 mr-2" />
                Calculate Revenue
              </Button>

              {videoResult !== null && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">Projected Revenue</p>
                      <p className="text-3xl font-bold text-primary">
                        ${videoResult.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex items-center space-x-2 pt-4 border-t">
                <Checkbox
                  id="proforma-video"
                  checked={proformaSelections.videoAds}
                  onCheckedChange={(checked) => 
                    setProformaSelections(prev => ({ ...prev, videoAds: checked as boolean }))
                  }
                />
                <label htmlFor="proforma-video" className="text-sm font-medium cursor-pointer">
                  Include in Proforma
                </label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conversational Ads Calculator */}
        <TabsContent value="conversational">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Radio className="h-5 w-5 text-primary" />
                <CardTitle>Conversational AI Ads (PPI)</CardTitle>
              </div>
              <CardDescription>
                Project Pay-Per-Inquiry revenue from conversational AI advertising with qualified lead generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="call-inquiries">Call Inquiries</Label>
                  <Input
                    id="call-inquiries"
                    type="number"
                    placeholder="e.g., 250"
                    value={callInquiries}
                    onChange={(e) => setCallInquiries(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payout-per-inquiry">Payout Per Inquiry</Label>
                  <Input
                    id="payout-per-inquiry"
                    type="number"
                    placeholder="e.g., 65"
                    value={payoutPerInquiry}
                    onChange={(e) => setPayoutPerInquiry(e.target.value)}
                  />
                </div>
              </div>
              
              <Button onClick={calculateConversationalRevenue} className="w-full">
                <Calculator className="h-4 w-4 mr-2" />
                Calculate Revenue
              </Button>

              {conversionalResult !== null && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">Projected Revenue</p>
                      <p className="text-3xl font-bold text-primary">
                        ${conversionalResult.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex items-center space-x-2 pt-4 border-t">
                <Checkbox
                  id="proforma-conversational"
                  checked={proformaSelections.conversationalAds}
                  onCheckedChange={(checked) => 
                    setProformaSelections(prev => ({ ...prev, conversationalAds: checked as boolean }))
                  }
                />
                <label htmlFor="proforma-conversational" className="text-sm font-medium cursor-pointer">
                  Include in Proforma
                </label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Subscribers Calculator */}
        <TabsContent value="subscribers">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle>Subscription Revenue (MRR/ARR)</CardTitle>
              </div>
              <CardDescription>
                Calculate recurring revenue from subscriber base with monthly and annual projections
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subscriber-count">Number of Subscribers</Label>
                  <Input
                    id="subscriber-count"
                    type="number"
                    placeholder="e.g., 500"
                    value={subscriberCount}
                    onChange={(e) => setSubscriberCount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subscription-price">Avg Monthly Price</Label>
                  <Input
                    id="subscription-price"
                    type="number"
                    placeholder="e.g., 19"
                    value={avgSubscriptionPrice}
                    onChange={(e) => setAvgSubscriptionPrice(e.target.value)}
                  />
                </div>
              </div>
              
              <Button onClick={calculateSubscriberRevenue} className="w-full">
                <Calculator className="h-4 w-4 mr-2" />
                Calculate Revenue
              </Button>

              {subscriberResult !== null && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">Monthly Recurring Revenue (MRR)</p>
                      <p className="text-3xl font-bold text-primary">
                        ${subscriberResult.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        ARR: ${(subscriberResult * 12).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex items-center space-x-2 pt-4 border-t">
                <Checkbox
                  id="proforma-subscribers"
                  checked={proformaSelections.subscribers}
                  onCheckedChange={(checked) => 
                    setProformaSelections(prev => ({ ...prev, subscribers: checked as boolean }))
                  }
                />
                <label htmlFor="proforma-subscribers" className="text-sm font-medium cursor-pointer">
                  Include in Proforma
                </label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Studio Livestream Calculator */}
        <TabsContent value="livestream">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <CardTitle>Studio Livestream Ads</CardTitle>
              </div>
              <CardDescription>
                Project revenue from live streaming ad inventory across studio broadcast sessions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="livestream-impressions">Total Impressions</Label>
                  <Input
                    id="livestream-impressions"
                    type="number"
                    placeholder="e.g., 75000"
                    value={liveStreamImpressions}
                    onChange={(e) => setLiveStreamImpressions(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="livestream-cpm">CPM (Cost Per 1000)</Label>
                  <Input
                    id="livestream-cpm"
                    type="number"
                    placeholder="e.g., 20"
                    value={liveStreamCpm}
                    onChange={(e) => setLiveStreamCpm(e.target.value)}
                  />
                </div>
              </div>
              
              <Button onClick={calculateLiveStreamRevenue} className="w-full">
                <Calculator className="h-4 w-4 mr-2" />
                Calculate Revenue
              </Button>

              {liveStreamResult !== null && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">Projected Revenue</p>
                      <p className="text-3xl font-bold text-primary">
                        ${liveStreamResult.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex items-center space-x-2 pt-4 border-t">
                <Checkbox
                  id="proforma-livestream"
                  checked={proformaSelections.liveStreamAds}
                  onCheckedChange={(checked) => 
                    setProformaSelections(prev => ({ ...prev, liveStreamAds: checked as boolean }))
                  }
                />
                <label htmlFor="proforma-livestream" className="text-sm font-medium cursor-pointer">
                  Include in Proforma
                </label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Awards Program Calculator */}
        <TabsContent value="awards">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                <CardTitle>Awards & Events Revenue</CardTitle>
              </div>
              <CardDescription>
                Project revenue from sponsorship packages and event registrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sponsorships">Total Sponsorship Revenue</Label>
                  <Input
                    id="sponsorships"
                    type="number"
                    placeholder="e.g., 150000"
                    value={sponsorships}
                    onChange={(e) => setSponsorships(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Combined revenue from all sponsorship packages</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="registration-count"># of Registrations</Label>
                    <Input
                      id="registration-count"
                      type="number"
                      placeholder="e.g., 500"
                      value={registrationCount}
                      onChange={(e) => setRegistrationCount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registration-fee">Ticket Price</Label>
                    <Input
                      id="registration-fee"
                      type="number"
                      placeholder="e.g., 250"
                      value={registrationFee}
                      onChange={(e) => setRegistrationFee(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground col-span-2">Event attendee ticket revenue</p>
                </div>
              </div>
              
              <Button onClick={calculateAwardsRevenue} className="w-full" size="lg">
                <Calculator className="h-4 w-4 mr-2" />
                Calculate Revenue
              </Button>

              {awardsResult !== null && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">Total Awards & Events Revenue</p>
                      <p className="text-3xl font-bold text-primary">
                        ${awardsResult.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                        {sponsorships && (
                          <div>
                            <p className="text-muted-foreground">Sponsorships</p>
                            <p className="font-semibold">${Number(sponsorships).toLocaleString()}</p>
                          </div>
                        )}
                        {registrationCount && registrationFee && (
                          <div>
                            <p className="text-muted-foreground">Event Revenue</p>
                            <p className="font-semibold">${(Number(registrationCount) * Number(registrationFee)).toLocaleString()}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex items-center space-x-2 pt-4 border-t">
                <Checkbox
                  id="proforma-awards"
                  checked={proformaSelections.awards}
                  onCheckedChange={(checked) => 
                    setProformaSelections(prev => ({ ...prev, awards: checked as boolean }))
                  }
                />
                <label htmlFor="proforma-awards" className="text-sm font-medium cursor-pointer">
                  Include in Proforma
                </label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Digital Ad Revenue Calculator */}
        <TabsContent value="digital">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                <CardTitle>Digital Ad Revenue</CardTitle>
              </div>
              <CardDescription>
                Monetize each digital property with custom CPMs and ad placements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <DigitalAdSegment
                  title="Blog Posts"
                  icon={<FileText className="h-4 w-4 text-primary" />}
                  impressions={blogImpressions}
                  cpm={blogCpm}
                  subsegments={blogSubsegments}
                  onImpressionsChange={setBlogImpressions}
                  onCpmChange={setBlogCpm}
                  onSubsegmentsChange={setBlogSubsegments}
                />
                
                <DigitalAdSegment
                  title="Newsletter"
                  icon={<Mail className="h-4 w-4 text-primary" />}
                  impressions={newsletterImpressions}
                  cpm={newsletterCpm}
                  subsegments={newsletterSubsegments}
                  onImpressionsChange={setNewsletterImpressions}
                  onCpmChange={setNewsletterCpm}
                  onSubsegmentsChange={setNewsletterSubsegments}
                />
                
                <DigitalAdSegment
                  title="Website"
                  icon={<Monitor className="h-4 w-4 text-primary" />}
                  impressions={websitePageviews}
                  cpm={websiteCpm}
                  subsegments={websiteSubsegments}
                  onImpressionsChange={setWebsitePageviews}
                  onCpmChange={setWebsiteCpm}
                  onSubsegmentsChange={setWebsiteSubsegments}
                />
              </div>
              
              <Button onClick={calculateDigitalRevenue} className="w-full" size="lg">
                <Calculator className="h-4 w-4 mr-2" />
                Calculate Revenue
              </Button>

              {digitalResult !== null && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">Total Digital Ad Revenue</p>
                      <p className="text-3xl font-bold text-primary">
                        ${digitalResult.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex items-center space-x-2 pt-4 border-t">
                <Checkbox
                  id="proforma-digital"
                  checked={proformaSelections.digital}
                  onCheckedChange={(checked) => 
                    setProformaSelections(prev => ({ ...prev, digital: checked as boolean }))
                  }
                />
                <label htmlFor="proforma-digital" className="text-sm font-medium cursor-pointer">
                  Include in Proforma
                </label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Proforma Builder */}
        <TabsContent value="proforma">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <CardTitle>Revenue Proforma</CardTitle>
              </div>
              <CardDescription>
                Combined revenue projection from selected calculators
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {proforma.results.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Calculate revenue in each tab and select "Include in Proforma" to build your projection</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {proforma.results.map((result, index) => (
                      <div key={index} className="flex justify-between items-start p-4 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">{result.name}</p>
                          <p className="text-sm text-muted-foreground">{result.details}</p>
                        </div>
                        <p className="font-semibold text-lg">
                          ${result.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <Card className="bg-primary/10 border-primary">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Total Projected Revenue</p>
                          <p className="text-lg text-muted-foreground">
                            Based on {proforma.results.length} revenue stream{proforma.results.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-4xl font-bold text-primary">
                            ${proforma.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => setShowSaveDialog(true)}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Proforma
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setShowLoadDialog(true)}
                    >
                      <FolderOpen className="h-4 w-4 mr-2" />
                      Load Saved
                    </Button>
                    <Button 
                      className="flex-1"
                      onClick={() => {
                        // Generate CSV content
                        const headers = ['Revenue Stream', 'Details', 'Projected Revenue'];
                        const rows = proforma.results.map(r => [
                          r.name,
                          r.details,
                          `$${r.revenue.toFixed(2)}`
                        ]);
                        rows.push(['', 'TOTAL', `$${proforma.total.toFixed(2)}`]);
                        
                        const csvContent = [
                          headers.join(','),
                          ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
                        ].join('\n');
                        
                        // Download CSV
                        const blob = new Blob([csvContent], { type: 'text/csv' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `revenue-proforma-${new Date().toISOString().split('T')[0]}.csv`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(url);
                      }}
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Export Proforma
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => window.print()}
                    >
                      Print Summary
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tech Stack Document */}
        <TabsContent value="tech-stack">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl mb-2">Seeksy Technology Stack & Migration Guide</CardTitle>
                  <CardDescription>
                    Comprehensive documentation for investors and technical stakeholders
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      const content = document.getElementById('tech-stack-content');
                      if (content) {
                        const printWindow = window.open('', '', 'width=800,height=600');
                        if (printWindow) {
                          const htmlContent = content.innerHTML;
                          printWindow.document.write('<html><head><title>Seeksy Tech Stack</title><style>body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; } h1 { color: #1a1a1a; margin-bottom: 10px; } h2 { color: #333; margin-top: 30px; border-bottom: 2px solid #ccc; padding-bottom: 5px; } h3 { color: #555; margin-top: 20px; } ul { margin-left: 20px; } .section { margin-bottom: 30px; } code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; } @media print { body { padding: 20px; } }</style></head><body>' + htmlContent + '</body></html>');
                          printWindow.document.close();
                          printWindow.print();
                        }
                      }
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div id="tech-stack-content" className="prose max-w-none space-y-6">
                <div className="section">
                  <h2 className="text-xl font-bold mb-3">Executive Summary</h2>
                  <p className="text-muted-foreground">
                    Seeksy is a modern, full-stack SaaS platform built on cutting-edge web technologies. This document provides a comprehensive overview of the technology stack, architecture, and migration procedures for potential investors and acquirers.
                  </p>
                </div>

                <div className="section">
                  <h2 className="text-xl font-bold mb-3">Core Technology Stack</h2>
                  
                  <h3 className="text-lg font-semibold mt-4 mb-2">Frontend Technologies</h3>
                  <ul className="list-disc ml-6 space-y-2 text-muted-foreground">
                    <li><strong>React 18.3.1</strong> - Modern JavaScript library for building user interfaces with component-based architecture</li>
                    <li><strong>TypeScript</strong> - Strongly-typed JavaScript superset ensuring code quality and maintainability</li>
                    <li><strong>Vite</strong> - Next-generation build tool providing fast development and optimized production builds</li>
                    <li><strong>Tailwind CSS 3.x</strong> - Utility-first CSS framework for rapid UI development and consistent design</li>
                    <li><strong>Shadcn/ui</strong> - High-quality accessible component library built on Radix UI primitives</li>
                    <li><strong>React Router v6</strong> - Client-side routing for seamless navigation</li>
                    <li><strong>TanStack Query</strong> - Powerful data synchronization and caching for React</li>
                    <li><strong>Framer Motion</strong> - Production-ready animation library for sophisticated UI interactions</li>
                  </ul>

                  <h3 className="text-lg font-semibold mt-4 mb-2">Backend & Infrastructure</h3>
                  <ul className="list-disc ml-6 space-y-2 text-muted-foreground">
                    <li><strong>Supabase</strong> - Open-source Firebase alternative providing comprehensive backend services</li>
                    <li><strong>PostgreSQL 15+</strong> - Enterprise-grade relational database with advanced features</li>
                    <li><strong>Deno Edge Functions</strong> - Serverless functions for custom business logic and integrations</li>
                    <li><strong>Row Level Security (RLS)</strong> - Database-level security ensuring data isolation</li>
                    <li><strong>Supabase Auth</strong> - Built-in authentication with OAuth, magic links, and email/password</li>
                    <li><strong>Supabase Storage</strong> - Scalable object storage for media files and assets</li>
                    <li><strong>Supabase Realtime</strong> - WebSocket-based real-time data synchronization</li>
                  </ul>

                  <h3 className="text-lg font-semibold mt-4 mb-2">Media & AI Services</h3>
                  <ul className="list-disc ml-6 space-y-2 text-muted-foreground">
                    <li><strong>Cloudflare R2</strong> - S3-compatible object storage for large media files (videos, podcasts)</li>
                    <li><strong>Cloudflare Stream</strong> - Video hosting and streaming with TUS resumable upload protocol</li>
                    <li><strong>ElevenLabs API</strong> - AI-powered text-to-speech and voice synthesis for content generation</li>
                    <li><strong>Lovable AI Gateway</strong> - Unified access to Google Gemini and OpenAI GPT models</li>
                    <li><strong>FFmpeg (Edge Functions)</strong> - Video processing, editing, and transcoding capabilities</li>
                  </ul>

                  <h3 className="text-lg font-semibold mt-4 mb-2">Third-Party Integrations</h3>
                  <ul className="list-disc ml-6 space-y-2 text-muted-foreground">
                    <li><strong>Stripe</strong> - Payment processing, subscriptions, and financial transactions</li>
                    <li><strong>Stripe Connect</strong> - Multi-party payment flows for creator payouts</li>
                    <li><strong>Daily.co</strong> - Real-time video conferencing and livestreaming infrastructure</li>
                    <li><strong>Meta (Facebook/Instagram) APIs</strong> - Social media integration and analytics</li>
                    <li><strong>Google Calendar API</strong> - Calendar integration for scheduling and availability</li>
                    <li><strong>Microsoft Teams API</strong> - Enterprise meeting integration</li>
                    <li><strong>Zoom API</strong> - Video conferencing integration</li>
                    <li><strong>YouTube API</strong> - Content publishing and analytics</li>
                    <li><strong>Resend</strong> - Transactional email delivery service</li>
                  </ul>
                </div>

                <div className="section">
                  <h2 className="text-xl font-bold mb-3">Architecture Overview</h2>
                  
                  <h3 className="text-lg font-semibold mt-4 mb-2">System Design</h3>
                  <p className="text-muted-foreground mb-3">
                    Seeksy employs a modern JAMstack architecture with the following characteristics:
                  </p>
                  <ul className="list-disc ml-6 space-y-2 text-muted-foreground">
                    <li><strong>Single Page Application (SPA)</strong> - Fast, responsive client-side rendering</li>
                    <li><strong>API-First Design</strong> - Clean separation between frontend and backend</li>
                    <li><strong>Serverless Functions</strong> - Auto-scaling edge functions for custom logic</li>
                    <li><strong>Real-Time Capabilities</strong> - WebSocket connections for live data updates</li>
                    <li><strong>Multi-Tenant Architecture</strong> - Database-level isolation using RLS policies</li>
                    <li><strong>CDN Distribution</strong> - Global content delivery for optimal performance</li>
                  </ul>

                  <h3 className="text-lg font-semibold mt-4 mb-2">Database Architecture</h3>
                  <p className="text-muted-foreground mb-3">
                    The platform uses PostgreSQL with comprehensive schemas covering:
                  </p>
                  <ul className="list-disc ml-6 space-y-2 text-muted-foreground">
                    <li>User profiles and authentication</li>
                    <li>Content management (podcasts, videos, blogs, events)</li>
                    <li>Advertising campaigns and impressions tracking</li>
                    <li>Financial transactions and revenue tracking</li>
                    <li>CRM and customer relationship data</li>
                    <li>Awards programs and voting systems</li>
                    <li>Meeting scheduling and availability</li>
                    <li>Team collaboration and permissions</li>
                  </ul>

                  <h3 className="text-lg font-semibold mt-4 mb-2">Security Features</h3>
                  <ul className="list-disc ml-6 space-y-2 text-muted-foreground">
                    <li><strong>Row Level Security (RLS)</strong> - Database-enforced access control</li>
                    <li><strong>JWT Authentication</strong> - Secure token-based user sessions</li>
                    <li><strong>API Key Management</strong> - Secure storage of third-party credentials</li>
                    <li><strong>HTTPS Everywhere</strong> - End-to-end encryption for all traffic</li>
                    <li><strong>CORS Protection</strong> - Controlled cross-origin resource sharing</li>
                    <li><strong>Input Validation</strong> - Server-side validation for all user inputs</li>
                  </ul>
                </div>

                <div className="section">
                  <h2 className="text-xl font-bold mb-3">Deployment & Hosting</h2>
                  <p className="text-muted-foreground mb-3">
                    Current deployment infrastructure:
                  </p>
                  <ul className="list-disc ml-6 space-y-2 text-muted-foreground">
                    <li><strong>Frontend Hosting</strong> - Lovable Cloud (can be migrated to Vercel, Netlify, Cloudflare Pages)</li>
                    <li><strong>Backend Services</strong> - Supabase managed infrastructure (can be self-hosted)</li>
                    <li><strong>Edge Functions</strong> - Deployed on Supabase Edge Network (Deno runtime)</li>
                    <li><strong>Media Storage</strong> - Cloudflare R2 and Cloudflare Stream</li>
                    <li><strong>Database</strong> - Supabase PostgreSQL (fully managed with automated backups)</li>
                    <li><strong>CDN</strong> - Integrated with hosting provider for global distribution</li>
                  </ul>
                </div>

                <div className="section">
                  <h2 className="text-xl font-bold mb-3">Migration Guide</h2>
                  
                  <h3 className="text-lg font-semibold mt-4 mb-2">Option 1: Transfer to New Lovable Account</h3>
                  <p className="text-muted-foreground mb-3">
                    <strong>Timeline:</strong> 1-2 hours | <strong>Complexity:</strong> Low | <strong>Recommended for:</strong> Quick acquisition
                  </p>
                  <div className="bg-muted p-4 rounded-lg mb-3">
                    <p className="font-semibold mb-2">Steps:</p>
                    <ol className="list-decimal ml-6 space-y-1 text-muted-foreground">
                      <li>Create new Lovable account for acquirer</li>
                      <li>Transfer project ownership through Lovable dashboard (Settings → Transfer Project)</li>
                      <li>Connect acquirer Stripe account for payment processing</li>
                      <li>Update custom domain DNS records (if applicable)</li>
                      <li>Transfer ownership of connected third-party integrations</li>
                      <li>Update environment variables and API keys as needed</li>
                    </ol>
                  </div>
                  <p className="text-muted-foreground">
                    <strong>Advantages:</strong> Zero downtime, maintains all features, ongoing updates, no infrastructure management
                  </p>

                  <h3 className="text-lg font-semibold mt-4 mb-2">Option 2: Self-Hosted Migration</h3>
                  <p className="text-muted-foreground mb-3">
                    <strong>Timeline:</strong> 2-4 weeks | <strong>Complexity:</strong> Medium-High | <strong>Recommended for:</strong> Complete control
                  </p>
                  <div className="bg-muted p-4 rounded-lg mb-3">
                    <p className="font-semibold mb-2">Steps:</p>
                    <ol className="list-decimal ml-6 space-y-1 text-muted-foreground">
                      <li>Export codebase from Lovable (via GitHub integration)</li>
                      <li>Set up Supabase project (managed or self-hosted)</li>
                      <li>Migrate database schema using provided SQL migration files</li>
                      <li>Export and import existing data (users, content, transactions)</li>
                      <li>Deploy edge functions to Supabase or alternative platform</li>
                      <li>Configure media storage (Cloudflare R2 or S3-compatible)</li>
                      <li>Deploy frontend to Vercel, Netlify, or custom infrastructure</li>
                      <li>Configure environment variables and API keys</li>
                      <li>Set up CI/CD pipeline for automated deployments</li>
                      <li>Configure monitoring, logging, and alerting</li>
                      <li>Perform load testing and security audit</li>
                      <li>Execute cutover with DNS changes</li>
                    </ol>
                  </div>
                  <p className="text-muted-foreground mb-3">
                    <strong>Infrastructure Requirements:</strong>
                  </p>
                  <ul className="list-disc ml-6 space-y-1 text-muted-foreground mb-3">
                    <li>PostgreSQL 15+ (minimum 2 CPU cores, 4GB RAM for small-medium scale)</li>
                    <li>Node.js/Deno runtime for edge functions</li>
                    <li>Object storage (R2, S3, or equivalent) for media files</li>
                    <li>CDN for static asset distribution</li>
                    <li>SSL certificates for HTTPS</li>
                    <li>Backup and disaster recovery systems</li>
                  </ul>
                  <p className="text-muted-foreground">
                    <strong>Ongoing Maintenance:</strong> Database management, security patches, scaling, monitoring, backups
                  </p>

                  <h3 className="text-lg font-semibold mt-4 mb-2">Option 3: Hybrid Approach</h3>
                  <p className="text-muted-foreground mb-3">
                    Maintain Lovable Cloud backend while deploying custom frontend, or vice versa. Provides flexibility for gradual migration.
                  </p>
                </div>

                <div className="section">
                  <h2 className="text-xl font-bold mb-3">Development & Maintenance</h2>
                  
                  <h3 className="text-lg font-semibold mt-4 mb-2">Development Tools</h3>
                  <ul className="list-disc ml-6 space-y-2 text-muted-foreground">
                    <li><strong>Version Control</strong> - Git with GitHub integration available</li>
                    <li><strong>Package Manager</strong> - npm/bun for dependency management</li>
                    <li><strong>Code Quality</strong> - ESLint for linting, TypeScript for type safety</li>
                    <li><strong>Testing</strong> - Ready for integration of Jest, React Testing Library, Playwright</li>
                  </ul>

                  <h3 className="text-lg font-semibold mt-4 mb-2">Scalability</h3>
                  <ul className="list-disc ml-6 space-y-2 text-muted-foreground">
                    <li><strong>Database</strong> - PostgreSQL scales vertically and horizontally (read replicas)</li>
                    <li><strong>Edge Functions</strong> - Auto-scaling serverless architecture</li>
                    <li><strong>Storage</strong> - Cloudflare R2 provides unlimited scalability</li>
                    <li><strong>Frontend</strong> - CDN distribution supports global traffic</li>
                    <li><strong>Current Capacity</strong> - Designed to handle 100K+ users with current infrastructure</li>
                  </ul>

                  <h3 className="text-lg font-semibold mt-4 mb-2">Monitoring & Analytics</h3>
                  <ul className="list-disc ml-6 space-y-2 text-muted-foreground">
                    <li>Built-in analytics for user engagement and revenue tracking</li>
                    <li>Database query performance monitoring</li>
                    <li>Edge function execution logs and metrics</li>
                    <li>Integration ready for Sentry, LogRocket, or similar tools</li>
                  </ul>
                </div>

                <div className="section">
                  <h2 className="text-xl font-bold mb-3">Cost Structure (Current Implementation)</h2>
                  
                  <h3 className="text-lg font-semibold mt-4 mb-2">Infrastructure Costs</h3>
                  <ul className="list-disc ml-6 space-y-2 text-muted-foreground">
                    <li><strong>Lovable Cloud</strong> - Usage-based pricing (database, storage, edge functions)</li>
                    <li><strong>Cloudflare R2</strong> - $0.015/GB stored, zero egress fees</li>
                    <li><strong>Cloudflare Stream</strong> - $5/1000 minutes stored, $1/1000 minutes delivered</li>
                    <li><strong>ElevenLabs</strong> - Pay-per-use for text-to-speech generation</li>
                    <li><strong>Lovable AI</strong> - Usage-based pricing for AI model access</li>
                    <li><strong>Daily.co</strong> - Tiered pricing based on meeting minutes</li>
                  </ul>

                  <h3 className="text-lg font-semibold mt-4 mb-2">Self-Hosted Estimated Costs</h3>
                  <ul className="list-disc ml-6 space-y-2 text-muted-foreground">
                    <li><strong>Database Hosting</strong> - $50-500/month depending on scale</li>
                    <li><strong>Compute Resources</strong> - $100-1000/month for edge functions</li>
                    <li><strong>Storage & CDN</strong> - $50-500/month depending on traffic</li>
                    <li><strong>Monitoring Tools</strong> - $50-200/month</li>
                    <li><strong>Total Estimated</strong> - $250-2200/month for self-hosted infrastructure</li>
                  </ul>
                </div>

                <div className="section">
                  <h2 className="text-xl font-bold mb-3">Technical Assets Included</h2>
                  <ul className="list-disc ml-6 space-y-2 text-muted-foreground">
                    <li>Complete source code (frontend and backend)</li>
                    <li>Database schema and migration files</li>
                    <li>80+ edge functions for business logic</li>
                    <li>API documentation and integration guides</li>
                    <li>Design system and component library</li>
                    <li>Deployment configurations and scripts</li>
                    <li>Test data and development seeds</li>
                    <li>Technical documentation</li>
                  </ul>
                </div>

                <div className="section">
                  <h2 className="text-xl font-bold mb-3">Support & Transition</h2>
                  <p className="text-muted-foreground mb-3">
                    During acquisition, the following support is available:
                  </p>
                  <ul className="list-disc ml-6 space-y-2 text-muted-foreground">
                    <li>30-day technical transition support</li>
                    <li>Documentation of all integrations and configurations</li>
                    <li>Knowledge transfer sessions with development team</li>
                    <li>Access to all API keys and credentials</li>
                    <li>Assistance with migration testing and validation</li>
                  </ul>
                </div>

                <div className="section">
                  <h2 className="text-xl font-bold mb-3">Conclusion</h2>
                  <p className="text-muted-foreground">
                    Seeksy is built on modern, scalable, and well-documented technologies. The platform can be transferred to new ownership with minimal disruption through Lovable built-in transfer mechanisms, or migrated to self-hosted infrastructure for complete control. All code, documentation, and technical assets are included in the acquisition.
                  </p>
                </div>

                <div className="mt-8 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Document Version:</strong> 1.0 | <strong>Last Updated:</strong> {new Date().toLocaleDateString()} | <strong>Contact:</strong> For technical questions about this document, please contact the Seeksy development team.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Proforma Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Proforma</DialogTitle>
            <DialogDescription>
              Give this proforma a name to save it for later
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="proforma-name">Proforma Name</Label>
              <Input
                id="proforma-name"
                placeholder="e.g., Q1 2025 Projections"
                value={proformaName}
                onChange={(e) => setProformaName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProforma} disabled={saving}>
              {saving ? 'Saving...' : 'Save Proforma'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Proforma Dialog */}
      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Load Saved Proforma</DialogTitle>
            <DialogDescription>
              Select a previously saved proforma to restore
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4 max-h-[400px] overflow-y-auto">
            {savedProformas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No saved proformas yet</p>
              </div>
            ) : (
              savedProformas.map((saved) => (
                <Card key={saved.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">{saved.proforma_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Saved {new Date(saved.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleLoadProforma(saved)}
                      >
                        Load
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteProforma(saved.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
