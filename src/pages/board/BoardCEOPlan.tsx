import { useState, useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, FileText, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useBoardDataMode } from '@/contexts/BoardDataModeContext';
import { Badge } from '@/components/ui/badge';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Default content if database is empty
const DEFAULT_CEO_PLAN_HTML = `
<h1>CEO Operating Plan</h1>
<h2>Fiscal Year 2025</h2>

<section class="page-1">
<h2>1. Executive Summary</h2>
<p>Seeksy is positioned to become the leading platform for creators, podcasters, and businesses seeking to build meaningful connections online. Our unified approach combines media production, identity verification, CRM, and monetization into a single ecosystem.</p>

<h3>Key Objectives for 2025:</h3>
<ul>
<li>Achieve 10,000 active creators on the platform</li>
<li>Launch full monetization suite including digital products and paid access</li>
<li>Establish 50+ enterprise brand partnerships</li>
<li>Complete Series A funding round</li>
</ul>

<h2>2. Strategic Priorities</h2>

<h3>Q1 2025: Foundation</h3>
<ul>
<li>Complete identity verification infrastructure (Voice + Face)</li>
<li>Launch Studio 2.0 with AI-powered editing</li>
<li>Deploy R&D Intelligence pipeline for market analysis</li>
</ul>

<h3>Q2 2025: Growth</h3>
<ul>
<li>Scale creator acquisition through partnerships</li>
<li>Launch Advertiser Self-Serve platform</li>
<li>Implement advanced analytics dashboard</li>
</ul>

<h3>Q3 2025: Monetization</h3>
<ul>
<li>Roll out digital products marketplace</li>
<li>Enable paid DM and subscription features</li>
<li>Launch affiliate program for creators</li>
</ul>

<h3>Q4 2025: Enterprise</h3>
<ul>
<li>Enterprise tier launch with custom branding</li>
<li>API access for third-party integrations</li>
<li>International expansion (UK, Canada, Australia)</li>
</ul>

<h2>3. Financial Targets</h2>
<div class="table-wrapper">
<table>
<thead>
<tr><th>Metric</th><th>Q1</th><th>Q2</th><th>Q3</th><th>Q4</th></tr>
</thead>
<tbody>
<tr><td>MRR</td><td>$50K</td><td>$150K</td><td>$400K</td><td>$800K</td></tr>
<tr><td>Active Creators</td><td>2,500</td><td>5,000</td><td>7,500</td><td>10,000</td></tr>
<tr><td>Ad Revenue</td><td>$25K</td><td>$75K</td><td>$200K</td><td>$500K</td></tr>
</tbody>
</table>
</div>
</section>

<div class="page-break">
<span>— Page 2 —</span>
</div>

<section class="page-2">
<h2>4. Team & Organization</h2>

<h3>Current Team (12)</h3>
<ul>
<li>Engineering: 5</li>
<li>Product: 2</li>
<li>Design: 1</li>
<li>Marketing: 2</li>
<li>Operations: 2</li>
</ul>

<h3>Hiring Plan 2025</h3>
<ul>
<li>Q1: 2 Engineers, 1 Sales</li>
<li>Q2: 2 Engineers, 1 Customer Success</li>
<li>Q3: 1 VP Sales, 2 Account Executives</li>
<li>Q4: 3 Engineers, 1 Data Scientist</li>
</ul>

<h2>5. Risk Assessment</h2>

<h3>Key Risks & Mitigations</h3>
<div class="table-wrapper">
<table>
<thead>
<tr><th>Risk</th><th>Impact</th><th>Mitigation</th></tr>
</thead>
<tbody>
<tr><td>Market competition</td><td>High</td><td>Differentiate through unified platform + identity features</td></tr>
<tr><td>Funding timeline</td><td>Medium</td><td>Maintain 18-month runway, pursue multiple funding sources</td></tr>
<tr><td>Technical scalability</td><td>Medium</td><td>Cloud-native architecture, edge computing strategy</td></tr>
<tr><td>Regulatory changes</td><td>Low</td><td>Privacy-first design, compliance monitoring</td></tr>
</tbody>
</table>
</div>

<h2>6. Board Commitments</h2>
<ul>
<li>Monthly financial reporting with variance analysis</li>
<li>Quarterly board meetings with strategic review</li>
<li>Real-time access to key metrics via Board Portal</li>
<li>Immediate notification of material events</li>
</ul>

<h2>7. Success Metrics</h2>
<p>We will measure success through:</p>
<ul>
<li><b>Creator NPS:</b> Target 50+ by Q4</li>
<li><b>Gross Revenue Retention:</b> 95%+</li>
<li><b>Net Revenue Retention:</b> 120%+</li>
<li><b>CAC Payback:</b> Under 12 months</li>
<li><b>Monthly Active Users Growth:</b> 15% MoM</li>
</ul>
</section>
`;

export default function BoardCEOPlan() {
  const navigate = useNavigate();
  const { dataMode, isDemo } = useBoardDataMode();
  const [planContent, setPlanContent] = useState<string>(DEFAULT_CEO_PLAN_HTML);
  const [planTitle, setPlanTitle] = useState<string>('CEO Operating Plan');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPlan();
  }, []);

  const fetchPlan = async () => {
    try {
      const { data, error } = await supabase
        .from('ceo_plan')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching CEO plan:', error);
      }

      if (data) {
        setPlanContent(data.body_html);
        setPlanTitle(data.title);
        setLastUpdated(data.updated_at);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!contentRef.current) return;
    
    setIsExporting(true);
    toast.info('Generating PDF...');

    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      
      // Calculate how many pages we need
      const scaledHeight = imgHeight * ratio * (pdfWidth / imgWidth);
      const pageHeight = pdfHeight - 20; // Leave margin for footer
      let heightLeft = scaledHeight;
      let position = 10;
      let page = 1;

      // Add logo and date header
      pdf.setFontSize(10);
      pdf.setTextColor(100);
      pdf.text('SEEKSY', 10, 8);
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pdfWidth - 50, 8);

      // Add content
      pdf.addImage(imgData, 'PNG', imgX, position, pdfWidth - 20, scaledHeight);
      heightLeft -= pageHeight;

      // Add pages if content overflows
      while (heightLeft > 0) {
        position = heightLeft - scaledHeight + 10;
        pdf.addPage();
        page++;
        
        // Header on each page
        pdf.setFontSize(10);
        pdf.setTextColor(100);
        pdf.text('SEEKSY', 10, 8);
        pdf.text(`Page ${page}`, pdfWidth - 20, 8);
        
        pdf.addImage(imgData, 'PNG', imgX, position, pdfWidth - 20, scaledHeight);
        heightLeft -= pageHeight;
      }

      // Footer on all pages
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150);
        pdf.text('Confidential — Seeksy Board Material', pdfWidth / 2, pdfHeight - 5, { align: 'center' });
      }

      pdf.save(`${planTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold text-slate-900">{planTitle}</h1>
                  {isDemo && (
                    <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                      Demo
                    </Badge>
                  )}
                </div>
                <p className="text-slate-500">
                  Strategic operating plan and objectives
                  {lastUpdated && (
                    <span className="ml-2 text-slate-400">
                      • Last updated: {new Date(lastUpdated).toLocaleDateString()}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <Button
              onClick={handleExportPDF}
              disabled={isExporting || isLoading}
              className="bg-slate-900 hover:bg-slate-800 text-white"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Download PDF
            </Button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <div 
            ref={contentRef}
            className="ceo-plan-content w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 lg:p-12"
          >
            <style>{`
              .ceo-plan-content h1 {
                font-size: 2rem;
                font-weight: 700;
                color: #0f172a;
                margin-bottom: 0.5rem;
                padding-bottom: 0.5rem;
                border-bottom: 3px solid #3b82f6;
              }
              .ceo-plan-content h2 {
                font-size: 1.5rem;
                font-weight: 600;
                color: #1e293b;
                margin-top: 2rem;
                margin-bottom: 1rem;
                padding: 0.5rem 1rem;
                background: linear-gradient(90deg, #eff6ff, transparent);
                border-left: 4px solid #3b82f6;
                border-radius: 0 0.5rem 0.5rem 0;
              }
              .ceo-plan-content h3 {
                font-size: 1.125rem;
                font-weight: 600;
                color: #334155;
                margin-top: 1.5rem;
                margin-bottom: 0.75rem;
              }
              .ceo-plan-content p {
                color: #475569;
                line-height: 1.7;
                margin-bottom: 1rem;
              }
              .ceo-plan-content ul {
                list-style: disc;
                margin-left: 1.5rem;
                margin-bottom: 1rem;
                color: #475569;
              }
              .ceo-plan-content li {
                margin-bottom: 0.5rem;
                line-height: 1.6;
              }
              .ceo-plan-content b {
                font-weight: 600;
                color: #1e293b;
              }
              .ceo-plan-content .table-wrapper {
                overflow-x: auto;
                margin: 1rem 0;
              }
              .ceo-plan-content table {
                width: 100%;
                border-collapse: collapse;
                font-size: 0.875rem;
              }
              .ceo-plan-content th {
                background: #f1f5f9;
                padding: 0.75rem 1rem;
                text-align: left;
                font-weight: 600;
                color: #334155;
                border-bottom: 2px solid #e2e8f0;
              }
              .ceo-plan-content td {
                padding: 0.75rem 1rem;
                border-bottom: 1px solid #e2e8f0;
                color: #475569;
              }
              .ceo-plan-content tr:hover td {
                background: #f8fafc;
              }
              .ceo-plan-content .page-break {
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 3rem 0;
                padding: 1rem 0;
                border-top: 1px dashed #cbd5e1;
                border-bottom: 1px dashed #cbd5e1;
              }
              .ceo-plan-content .page-break span {
                font-size: 0.75rem;
                color: #94a3b8;
                text-transform: uppercase;
                letter-spacing: 0.1em;
              }
              .ceo-plan-content section {
                margin-bottom: 2rem;
              }
              @media (max-width: 640px) {
                .ceo-plan-content h1 { font-size: 1.5rem; }
                .ceo-plan-content h2 { font-size: 1.25rem; }
                .ceo-plan-content table { font-size: 0.75rem; }
                .ceo-plan-content th, .ceo-plan-content td { padding: 0.5rem; }
              }
            `}</style>
            <div dangerouslySetInnerHTML={{ __html: planContent }} />
            
            {/* Footer */}
            <div className="mt-12 pt-6 border-t border-slate-200 text-center">
              <p className="text-sm text-slate-400 italic">
                Confidential — Seeksy Board Material
              </p>
            </div>
          </div>
        )}
    </div>
  );
}