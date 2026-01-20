import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Printer, Code, Database, Cloud, Lock, Zap, Cpu } from "lucide-react";
import { exportTechStackPDF } from "@/lib/utils/exportSecurityPDF";

export default function TechStack() {
  const handlePrint = () => {
    window.print();
  };

  const techCategories = [
    {
      title: "Frontend Framework",
      icon: Code,
      technologies: [
        { name: "React 18", description: "Modern UI library with hooks and concurrent features" },
        { name: "TypeScript", description: "Type-safe JavaScript for robust code" },
        { name: "Vite", description: "Next-generation frontend tooling" },
        { name: "Tailwind CSS", description: "Utility-first CSS framework" },
      ]
    },
    {
      title: "Backend & Database",
      icon: Database,
      technologies: [
        { name: "Supabase", description: "PostgreSQL database with real-time capabilities" },
        { name: "Edge Functions", description: "Serverless TypeScript functions" },
        { name: "Row Level Security", description: "Database-level security policies" },
      ]
    },
    {
      title: "Cloud Infrastructure",
      icon: Cloud,
      technologies: [
        { name: "Cloudflare R2", description: "Object storage for media files" },
        { name: "Cloudflare Stream", description: "Video hosting and streaming" },
        { name: "Daily.co", description: "Real-time video/audio infrastructure" },
      ]
    },
    {
      title: "AI & Audio Processing",
      icon: Cpu,
      technologies: [
        { name: "ElevenLabs", description: "AI voice generation and transcription" },
        { name: "OpenAI GPT", description: "Content generation and analysis" },
        { name: "Lovable AI", description: "Integrated AI capabilities" },
      ]
    },
    {
      title: "Authentication & Security",
      icon: Lock,
      technologies: [
        { name: "Supabase Auth", description: "Email, OAuth, and MFA support" },
        { name: "JWT Tokens", description: "Secure session management" },
        { name: "RLS Policies", description: "Row-level data access control" },
      ]
    },
    {
      title: "Performance & Optimization",
      icon: Zap,
      technologies: [
        { name: "React Query", description: "Data fetching and caching" },
        { name: "Lazy Loading", description: "Code splitting for faster loads" },
        { name: "CDN Distribution", description: "Global content delivery" },
      ]
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header with Actions */}
        <div className="flex items-center justify-between mb-8 print:mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">Tech Stack</h1>
            <p className="text-muted-foreground">
              Modern, scalable technologies powering Seeksy platform
            </p>
          </div>
          <div className="flex gap-2 print:hidden">
            <Button onClick={handlePrint} variant="outline" size="sm">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button onClick={exportTechStackPDF} size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>

        {/* Tech Stack Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {techCategories.map((category) => {
            const IconComponent = category.icon;
            return (
              <Card key={category.title} className="print:break-inside-avoid">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconComponent className="h-5 w-5 text-primary" />
                    {category.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {category.technologies.map((tech) => (
                      <div key={tech.name} className="border-l-2 border-primary/20 pl-4">
                        <h3 className="font-semibold text-sm mb-1">{tech.name}</h3>
                        <p className="text-sm text-muted-foreground">{tech.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Additional Info */}
        <Card className="mt-6 print:break-inside-avoid">
          <CardHeader>
            <CardTitle>Integration Ecosystem</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Social Media</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Meta (Facebook/Instagram)</li>
                  <li>• YouTube</li>
                  <li>• Spotify</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Calendar & Meetings</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Google Calendar</li>
                  <li>• Microsoft Teams</li>
                  <li>• Zoom</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Payment & Commerce</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Stripe Connect</li>
                  <li>• Automated payouts</li>
                  <li>• Invoice generation</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            margin: 1cm;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:break-inside-avoid {
            break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
