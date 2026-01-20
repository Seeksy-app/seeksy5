import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Download, Share2, Copy, Check, ExternalLink } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import ProFormaFinancialTables from "@/components/cfo/proforma/ProFormaFinancialTables";
import ProFormaCharts from "@/components/cfo/proforma/ProFormaCharts";
import ProFormaAssumptions from "@/components/cfo/proforma/ProFormaAssumptions";
import { useProFormaData, ProFormaAssumptions as AssumptionsType } from "@/hooks/useProFormaData";
import { ProFormaShareModal } from "@/components/cfo/proforma/ProFormaShareModal";

const EventsAwardsProForma = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const contentRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  
  // Check if we're on a board route for navigation
  const isBoardRoute = location.pathname.startsWith('/board');

  const { financialData, assumptions, updateAssumptions } = useProFormaData();

  const handleExportPDF = async () => {
    if (!contentRef.current) return;
    
    setExporting(true);
    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.setFillColor(5, 56, 119);
      pdf.rect(0, 0, 210, 20, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.text("Seeksy Awards Pro Forma", 10, 13);
      
      pdf.addImage(imgData, "PNG", 0, 25, imgWidth, imgHeight);
      
      pdf.save("seeksy-events-awards-proforma.pdf");
      toast.success("PDF exported successfully!");
    } catch (error) {
      toast.error("Failed to export PDF");
    } finally {
      setExporting(false);
    }
  };

  const handleCopyShareLink = () => {
    const shareUrl = `${window.location.origin}/proforma/events-awards/share`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Share link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const content = (
    <div className="bg-background w-full">
      <div className="mx-auto max-w-7xl px-6 py-6 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate(isBoardRoute ? "/board" : "/admin")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {isBoardRoute ? "Back to Board" : "Back to CFO"}
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShareModalOpen(true)}
              className="gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share Pro Forma
            </Button>
            <Button 
              onClick={handleExportPDF} 
              disabled={exporting}
              className="gap-2 bg-[#053877] hover:bg-[#053877]/90"
            >
              <Download className="h-4 w-4" />
              {exporting ? "Exporting..." : "Download PDF"}
            </Button>
          </div>
        </div>

        {/* Title with VPA Link */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#053877] mb-2">
            Awards Pro Forma
          </h1>
          <p className="text-muted-foreground mb-3">
            Financial projections for the Seeksy Events & Awards platform
          </p>
          <a 
            href="https://veteranpodcastawards.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[#053877] hover:underline text-sm font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            View the Veteran Podcast Awards site
          </a>
        </div>

        {/* Main Content */}
        <div ref={contentRef}>
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="charts">Charts</TabsTrigger>
              <TabsTrigger value="assumptions">Assumptions</TabsTrigger>
              <TabsTrigger value="summary">Summary</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-l-4 border-l-[#053877] rounded-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      2028 Projected Revenue
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-[#053877]">
                      ${(financialData.revenue[2] / 1000000).toFixed(2)}M
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      +{(((financialData.revenue[2] - financialData.revenue[0]) / financialData.revenue[0]) * 100).toFixed(0)}% growth from 2026
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-emerald-500 rounded-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      2028 Projected EBITDA
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-emerald-600">
                      ${(financialData.ebitda[2] / 1000).toFixed(0)}K
                    </p>
                    <p className="text-sm text-emerald-600 mt-1">
                      {((financialData.ebitda[2] / financialData.revenue[2]) * 100).toFixed(1)}% margin
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-500 rounded-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      3-Year CAGR
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-amber-600">
                      {(Math.pow(financialData.revenue[2] / financialData.revenue[0], 1/2) * 100 - 100).toFixed(1)}%
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Compound Annual Growth Rate
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Financial Tables */}
              <ProFormaFinancialTables data={financialData} />
            </TabsContent>

            <TabsContent value="charts">
              <ProFormaCharts data={financialData} />
            </TabsContent>

            <TabsContent value="assumptions">
              <ProFormaAssumptions 
                assumptions={assumptions} 
                onUpdate={updateAssumptions}
              />
            </TabsContent>

            <TabsContent value="summary">
              <Card className="rounded-lg">
                <CardHeader>
                  <CardTitle className="text-xl text-[#053877]">
                    Events & Awards Platform — Offering Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="max-h-[70vh] overflow-y-auto space-y-8">
                  <p className="text-muted-foreground leading-relaxed">
                    The Seeksy Events & Awards Platform is a fully developed, production-ready system designed to power category-based award shows, live competitions, creator recognition programs, and branded event experiences across multiple verticals. Originally built to support the Veteran Podcast Awards, the platform now operates as a scalable SaaS engine capable of hosting unlimited award programs for creators, influencers, industry professionals, or enterprise brands.
                  </p>

                  {/* What the Platform Includes */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      📌 What the Platform Includes
                    </h3>
                    <ul className="space-y-2 text-muted-foreground ml-6">
                      <li className="list-disc">End-to-end awards infrastructure: nominations, submissions, voting, jury scoring, category management, and automated workflows</li>
                      <li className="list-disc">Livestream & broadcast integration: Daily.co + Seeksy Studio for real-time shows, interviews, and presentations</li>
                      <li className="list-disc">Sponsor-ready architecture: persistent logo placements, ad inventory, presenting sponsor modules, and branded content blocks</li>
                      <li className="list-disc">Creator + audience engagement: user dashboards, notifications, voting experiences, and social amplification tools</li>
                      <li className="list-disc">Reporting & analytics: engagement tracking, vote counts, category performance, and sponsor impact</li>
                      <li className="list-disc">Award fulfillment system: winner pages, announcements, certificates, and merch/award ordering</li>
                      <li className="list-disc">Multichannel distribution: Apple TV, Seeksy mobile apps, web experiences, and the Parade Deck verified creator network</li>
                    </ul>
                  </div>

                  {/* Strategic Opportunity */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      📈 Strategic Opportunity for Buyers
                    </h3>
                    <p className="text-muted-foreground">
                      The platform supports high-margin, repeatable annual revenue through:
                    </p>
                    <ul className="space-y-2 text-muted-foreground ml-6">
                      <li className="list-disc">Presenting sponsors</li>
                      <li className="list-disc">Category sponsorships</li>
                      <li className="list-disc">Livestream ads</li>
                      <li className="list-disc">Branded editorial content</li>
                      <li className="list-disc">Event licensing</li>
                      <li className="list-disc">Vertical expansions</li>
                      <li className="list-disc">Cross-platform integrations (MIC, Military Spouse Fest, Task & Purpose, etc.)</li>
                    </ul>
                    <p className="text-muted-foreground mt-3">
                      Under ownership by a strong media group, the Events & Awards Platform becomes a franchise model, allowing rapid cloning of vertical award shows—creator categories, tactical/outdoors, tech innovators, health & wellness, entrepreneurship, and more.
                    </p>
                  </div>

                  {/* Financial Outlook */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      💰 Financial Outlook
                    </h3>
                    <p className="text-muted-foreground">
                      3-year projections show:
                    </p>
                    <ul className="space-y-2 text-muted-foreground ml-6">
                      <li className="list-disc">$503K revenue in Year 1 post-acquisition</li>
                      <li className="list-disc">$1.55M+ revenue by Year 3</li>
                      <li className="list-disc">EBITDA approaching $1M annually by Year 3</li>
                      <li className="list-disc">57%+ CAGR</li>
                      <li className="list-disc">Low operational overhead due to automated workflows and scalable architecture</li>
                    </ul>
                    <p className="text-muted-foreground mt-3">
                      This positions the platform as a high-growth, low-cost, high-repeatability asset inside any media portfolio.
                    </p>
                  </div>

                  {/* Why This Platform Is Valuable */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      🔑 Why This Platform Is Valuable
                    </h3>
                    <ul className="space-y-2 text-muted-foreground ml-6">
                      <li className="list-disc">Proven audience and brand traction</li>
                      <li className="list-disc">Fully built SaaS infrastructure (240+ development hours)</li>
                      <li className="list-disc">Zero rebuild costs for buyer</li>
                      <li className="list-disc">Ready for new categories and sponsorship expansion</li>
                      <li className="list-disc">Seamless integration with Seeksy's creator ecosystem</li>
                      <li className="list-disc">Designed for recurring annual revenue</li>
                      <li className="list-disc">Can power entire award franchises across multiple markets</li>
                    </ul>
                  </div>

                  {/* Delivered With Acquisition */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      📦 Delivered With the Acquisition
                    </h3>
                    <ul className="space-y-2 text-muted-foreground ml-6">
                      <li className="list-disc">Full platform codebase + UI</li>
                      <li className="list-disc">All award workflows and automations</li>
                      <li className="list-disc">Creator tools and dashboards</li>
                      <li className="list-disc">Studio-recording integration (Daily.co / Seeksy Studio)</li>
                      <li className="list-disc">Sponsorship modules</li>
                      <li className="list-disc">Event hosting and distribution channels</li>
                      <li className="list-disc">Analytics + reporting suite</li>
                      <li className="list-disc">Optional continuity support from Seeksy team</li>
                    </ul>
                  </div>

                  {/* Summary */}
                  <div className="space-y-3 border-t pt-6">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      ✨ Summary
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      The Events & Awards Platform is not just an app—it is a repeatable revenue engine that can power a multi-year, multi-vertical award franchise. Its combination of technology, community reach, sponsorship scalability, and distribution channels makes it a uniquely valuable asset for any company looking to lead within creator, veteran, or industry influencer ecosystems.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {content}
      <ProFormaShareModal open={shareModalOpen} onOpenChange={setShareModalOpen} />
    </>
  );
};

export default EventsAwardsProForma;
