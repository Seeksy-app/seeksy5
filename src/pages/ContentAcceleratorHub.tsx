import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Sparkles, Download, ArrowRight, Users, BarChart3, Video, FileText, CheckCircle, Zap } from "lucide-react";
import { toast } from "sonner";

const categories = [
  {
    icon: "🎤",
    title: "Creators & Influencers",
    description: "Guides and templates to grow your audience, repurpose content, and monetize your creative work.",
  },
  {
    icon: "📊",
    title: "Brands & Agencies",
    description: "Frameworks to scale UGC, measure ROI, and streamline influencer content workflows.",
  },
  {
    icon: "🎥",
    title: "Events & Speakers",
    description: "Turn sessions, talks, and presentations into evergreen, monetizable content.",
  },
];

const featuredResources = [
  {
    title: "The 2025 Creator Growth Blueprint",
    tag: "Popular",
    tagColor: "bg-pink-500",
    description: "Turn one long-form video into over 40 pieces of high-performing content using AI workflows.",
    buttonText: "Download Blueprint",
  },
  {
    title: "Influencer Content ROI Playbook",
    tag: "Business",
    tagColor: "bg-blue-500",
    description: "A proven framework for generating measurable ROI from creators, UGC, and influencer-driven media.",
    buttonText: "Download Playbook",
  },
  {
    title: "The Event Content Vault System",
    tag: "Events",
    tagColor: "bg-purple-500",
    description: "How to transform speaker sessions and event content into evergreen assets, sponsorship value, and new revenue.",
    buttonText: "Download System",
  },
];

const templates = [
  { title: "AI Clip Planning Checklist", icon: CheckCircle },
  { title: "Post-Production Workflow Template", icon: FileText },
  { title: "Event Session Clip Map", icon: Video },
];

export default function ContentAcceleratorHub() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) {
      toast.error("Please fill in all fields");
      return;
    }
    toast.success("Welcome to the Seeksy Creator Community!");
    setFullName("");
    setEmail("");
  };

  const handleDownload = (resourceTitle: string) => {
    toast.success(`Downloading: ${resourceTitle}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* SECTION 1 — HERO */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#053877] to-[#2C6BED] py-20 md:py-28">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-white mb-4 tracking-tight">
              Seeksy Content Accelerator Hub
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-6 font-medium">
              Where Content Becomes Opportunity.
            </p>
            <p className="text-lg text-white/80 mb-10 max-w-3xl mx-auto leading-relaxed">
              Unlock high-impact guides, templates, workflows, and AI-powered systems designed to help creators, brands, and events grow faster with Seeksy.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-[#053877] hover:bg-white/90 font-semibold px-8 py-6 text-lg rounded-xl shadow-lg"
                onClick={() => document.getElementById('featured-resources')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Discover Resources
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 font-semibold px-8 py-6 text-lg rounded-xl"
                onClick={() => navigate('/auth')}
              >
                Create Your Free Seeksy Account
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 2 — CATEGORY FILTERS */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-4">
              Explore by Category
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {categories.map((category, index) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full border-0 shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)] transition-all duration-300 rounded-2xl bg-card cursor-pointer group">
                  <CardContent className="p-8 text-center">
                    <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                      {category.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">
                      {category.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {category.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3 — FEATURED RESOURCES GRID */}
      <section id="featured-resources" className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-4">
              Featured Downloads
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {featuredResources.map((resource, index) => (
              <motion.div
                key={resource.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full border-0 shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)] transition-all duration-300 rounded-2xl overflow-hidden group">
                  <div className="h-2 bg-gradient-to-r from-[#053877] to-[#2C6BED]" />
                  <CardContent className="p-6">
                    <Badge className={`${resource.tagColor} text-white mb-4`}>
                      {resource.tag}
                    </Badge>
                    <h3 className="text-xl font-semibold text-foreground mb-3">
                      {resource.title}
                    </h3>
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                      {resource.description}
                    </p>
                    <Button
                      className="w-full bg-gradient-to-r from-[#053877] to-[#2C6BED] hover:opacity-90 text-white rounded-xl"
                      onClick={() => handleDownload(resource.title)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {resource.buttonText}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4 — MOST DOWNLOADED THIS WEEK */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="bg-gradient-to-r from-purple-100 via-pink-50 to-blue-100 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-blue-900/20 rounded-2xl p-8 md:p-10 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-r from-[#053877] to-[#2C6BED] rounded-2xl flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <p className="text-sm font-semibold text-[#2C6BED] uppercase tracking-wide mb-1">
                    Most Downloaded This Week
                  </p>
                  <h3 className="text-2xl md:text-3xl font-semibold text-foreground mb-2">
                    The 2025 Creator Growth Blueprint
                  </h3>
                  <p className="text-muted-foreground">
                    Creators love this step-by-step plan for turning content into growth.
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-[#053877] to-[#2C6BED] hover:opacity-90 text-white rounded-xl px-8"
                    onClick={() => handleDownload("The 2025 Creator Growth Blueprint")}
                  >
                    <Download className="mr-2 h-5 w-5" />
                    Download Now
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 5 — TEMPLATES & TOOLKITS */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-3">
              Templates & Toolkits
            </h2>
            <p className="text-lg text-muted-foreground">
              Instantly usable resources created by Seeksy AI.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {templates.map((template, index) => (
              <motion.div
                key={template.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full border-0 shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)] transition-all duration-300 rounded-2xl cursor-pointer group hover:border-[#2C6BED]/20">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-[#053877]/10 to-[#2C6BED]/10 rounded-xl flex items-center justify-center group-hover:from-[#053877]/20 group-hover:to-[#2C6BED]/20 transition-colors">
                      <template.icon className="h-6 w-6 text-[#2C6BED]" />
                    </div>
                    <span className="font-semibold text-foreground group-hover:text-[#2C6BED] transition-colors">
                      {template.title}
                    </span>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6 — EMAIL OPT-IN */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-xl mx-auto"
          >
            <Card className="border-0 shadow-[0_8px_30px_rgba(0,0,0,0.08)] rounded-2xl overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-[#053877] to-[#2C6BED]" />
              <CardContent className="p-8 md:p-10">
                <div className="text-center mb-8">
                  <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-3">
                    Join the Seeksy Creator Community
                  </h2>
                  <p className="text-muted-foreground">
                    Over 25,000 creators trust Seeksy to power their content.
                  </p>
                </div>
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <Input
                    type="text"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-12 rounded-xl border-border"
                  />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 rounded-xl border-border"
                  />
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-[#053877] to-[#2C6BED] hover:opacity-90 text-white font-semibold rounded-xl"
                  >
                    <Zap className="mr-2 h-5 w-5" />
                    Get Instant Access
                  </Button>
                </form>
                <p className="text-center text-sm text-muted-foreground mt-6">
                  We respect your inbox. Unsubscribe anytime.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* SECTION 7 — FOOTER CTA */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-[#053877] to-[#2C6BED]">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
              Start Creating With Seeksy
            </h2>
            <p className="text-lg text-white/80 mb-10">
              Level up your content with AI-powered tools for creators, teams, and events.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-[#053877] hover:bg-white/90 font-semibold px-8 py-6 text-lg rounded-xl shadow-lg"
                onClick={() => navigate('/auth')}
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 font-semibold px-8 py-6 text-lg rounded-xl"
                onClick={() => window.open('https://calendly.com/seeksy', '_blank')}
              >
                Schedule a Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
