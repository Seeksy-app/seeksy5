import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Rocket, Eye, TrendingUp, Settings, Sparkles, Save, Check, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCEOVTO } from '@/hooks/useCEOVTO';
import { VisionSection } from '@/components/ceo-vto/VisionSection';
import { TractionSection } from '@/components/ceo-vto/TractionSection';
import { OperationsSection } from '@/components/ceo-vto/OperationsSection';
import { AIBriefingSection } from '@/components/ceo-vto/AIBriefingSection';
import { BoardFloatingAIButton } from '@/components/board/BoardFloatingAIButton';
import { BoardAISlidePanel } from '@/components/board/BoardAISlidePanel';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
};

export default function BoardCEOVTO() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('vision');
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const {
    vision,
    setVision,
    rocks,
    setRocks,
    yearGoals,
    setYearGoals,
    sliders,
    setSliders,
    milestones,
    setMilestones,
    isLoading,
    isSaving,
    lastSaved,
    getKPIs,
  } = useCEOVTO();

  const kpis = getKPIs();

  // Board members and investors are view-only; only Admin/CEO can edit
  // For now, we check the route - if accessed from /board, it's view-only
  const isAdminRoute = window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/cfo');
  const canEdit = isAdminRoute;

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let y = 25;

      // Header
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text("Seeksy", margin, 15);
      doc.text("CEO VTO", pageWidth - margin - 25, 15);
      
      // Title
      doc.setFontSize(18);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text("CEO VTO: Vision • Traction • Operations", margin, y);
      y += 10;

      // Vision Summary
      doc.setFontSize(12);
      doc.text("Vision Summary", margin, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(vision.oneYearFocus, pageWidth - margin * 2);
      doc.text(lines, margin, y);
      y += lines.length * 5 + 8;

      // KPIs
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Key Metrics", margin, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`ARR: $${(kpis.arr / 1000).toFixed(0)}K | Creators: ${kpis.creatorCount.toLocaleString()} | Verified: ${kpis.verifiedCreators.toLocaleString()} | AI Adoption: ${kpis.aiToolAdoption}%`, margin, y);
      y += 10;

      // Rocks
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Quarterly Rocks", margin, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      rocks.forEach(rock => {
        doc.text(`• ${rock.name} (${rock.status.replace('_', ' ')}) — ${rock.owner}`, margin + 5, y);
        y += 5;
      });
      y += 8;

      // Milestones
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Operational Milestones", margin, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      milestones.slice(0, 5).forEach(m => {
        doc.text(`• ${m.title} — Due: ${new Date(m.deadline).toLocaleDateString()} (${m.status.replace('_', ' ')})`, margin + 5, y);
        y += 5;
      });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text("Seeksy Board Portal — Confidential & Internal Use Only", margin, pageHeight - 10);

      doc.save("Seeksy-CEO-VTO.pdf");
      toast({ title: "PDF Downloaded", description: "CEO VTO document saved successfully" });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({ title: "Error", description: "Failed to generate PDF", variant: "destructive" });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="w-full"
    >
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border -mx-6 px-6 py-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/board')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">CEO VTO</h1>
                <p className="text-xs text-muted-foreground">Vision • Traction • Operations</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isSaving && (
              <Badge variant="outline" className="gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Saving...
              </Badge>
            )}
            {lastSaved && !isSaving && (
              <Badge variant="outline" className="gap-1 text-emerald-600">
                <Check className="w-3 h-3" />
                Auto-saved
              </Badge>
            )}
            <Button onClick={handleDownloadPDF} disabled={isGeneratingPDF} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              {isGeneratingPDF ? "Generating..." : "Export PDF"}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="vision" className="gap-2">
              <Eye className="w-4 h-4" />
              Vision
            </TabsTrigger>
            <TabsTrigger value="traction" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Traction
            </TabsTrigger>
            <TabsTrigger value="operations" className="gap-2">
              <Settings className="w-4 h-4" />
              Operations
            </TabsTrigger>
            <TabsTrigger value="ai-briefing" className="gap-2">
              <Sparkles className="w-4 h-4" />
              AI Briefing
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Tab Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsContent value="vision" className="mt-0">
          <VisionSection 
            vision={vision} 
            setVision={setVision} 
            kpis={kpis}
            readOnly={!canEdit}
          />
        </TabsContent>
        <TabsContent value="traction" className="mt-0">
          <TractionSection 
            rocks={rocks}
            setRocks={setRocks}
            yearGoals={yearGoals}
            setYearGoals={setYearGoals}
            sliders={sliders}
            setSliders={setSliders}
            kpis={kpis}
            readOnly={!canEdit}
          />
        </TabsContent>
        <TabsContent value="operations" className="mt-0">
          <OperationsSection 
            milestones={milestones}
            setMilestones={setMilestones}
            kpis={kpis}
            readOnly={!canEdit}
          />
        </TabsContent>
        <TabsContent value="ai-briefing" className="mt-0">
          <AIBriefingSection 
            vision={vision}
            rocks={rocks}
            yearGoals={yearGoals}
            sliders={sliders}
            milestones={milestones}
            kpis={kpis}
          />
        </TabsContent>
      </Tabs>

      {/* Floating AI Button */}
      <BoardFloatingAIButton onClick={() => setIsAIPanelOpen(true)} />
      <BoardAISlidePanel isOpen={isAIPanelOpen} onClose={() => setIsAIPanelOpen(false)} />
    </motion.div>
  );
}
