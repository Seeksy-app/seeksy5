import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Download, Share2, Copy, Check } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import ProFormaFinancialTables from "@/components/cfo/proforma/ProFormaFinancialTables";
import ProFormaCharts from "@/components/cfo/proforma/ProFormaCharts";
import ProFormaAssumptions from "@/components/cfo/proforma/ProFormaAssumptions";
import { useProFormaData, ProFormaAssumptions as AssumptionsType } from "@/hooks/useProFormaData";
import { CFONotesCard } from "@/components/cfo/CFONotesCard";

const CombinedProForma = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const contentRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  
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
      pdf.text("Seeksy Combined Platform - 3-Year Pro Forma", 10, 13);
      
      pdf.addImage(imgData, "PNG", 0, 25, imgWidth, imgHeight);
      
      pdf.save("seeksy-combined-platform-proforma.pdf");
      toast.success("PDF exported successfully!");
    } catch (error) {
      toast.error("Failed to export PDF");
    } finally {
      setExporting(false);
    }
  };

  const handleCopyShareLink = () => {
    const shareUrl = `${window.location.origin}/proforma/combined/share`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Share link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const content = (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-6">
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
              onClick={handleCopyShareLink}
              className="gap-2"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy Share Link"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate("/proforma/combined/share")}
              className="gap-2"
            >
              <Share2 className="h-4 w-4" />
              Preview Share Page
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

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#053877] mb-2">
            Combined Platform - 3-Year Pro Forma
          </h1>
          <p className="text-muted-foreground">
            Unified financial projections for the Seeksy platform including subscriptions, ads, and all revenue streams
          </p>
        </div>

        {/* Main Content */}
        <div ref={contentRef}>
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="charts">Charts</TabsTrigger>
              <TabsTrigger value="assumptions">Assumptions</TabsTrigger>
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
              
              {/* CFO Notes - Editable for Admin */}
              <CFONotesCard pageKey="financial_statements" />
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
          </Tabs>
        </div>
      </div>
    </div>
  );

  return content;
};

export default CombinedProForma;
