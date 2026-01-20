import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { Sparkles, Download, ArrowRight, Upload, Wand2, Scissors, Rocket, Zap, Quote } from "lucide-react";
import { toast } from "sonner";

const features = [
  {
    icon: "🔄",
    title: "AI Repurposing System",
    description: "Step-by-step guide for turning any long-form video into 40+ pieces of content using Seeksy AI.",
  },
  {
    icon: "✂️",
    title: "Clip Generation Framework",
    description: "Learn how to auto-generate hooks, highlights, and multi-format clips for all social platforms.",
  },
  {
    icon: "💰",
    title: "Monetization Playbook",
    description: "Strategies for converting content into brand deals, audience growth, sponsorships, and recurring revenue.",
  },
];

const workflowSteps = [
  {
    step: 1,
    title: "Upload One Video",
    description: "Seeksy imports long-form content from your studio or uploads.",
    icon: Upload,
  },
  {
    step: 2,
    title: "Run AI Post-Production",
    description: "Enhance audio/video, remove filler words, generate transcripts, detect chapters.",
    icon: Wand2,
  },
  {
    step: 3,
    title: "Generate Auto Clips",
    description: "Seeksy identifies hooks, scores segments, and produces multi-platform clips.",
    icon: Scissors,
  },
  {
    step: 4,
    title: "Post Everywhere",
    description: "Repurpose content across Instagram, TikTok, YouTube, podcasts, newsletters, and more.",
    icon: Rocket,
  },
];

const testimonials = [
  {
    quote: "Seeksy cut my production time from 6 hours to 20 minutes.",
    author: "Creator, 100K subscribers",
  },
  {
    quote: "My clips started hitting 50–100K views consistently.",
    author: "Podcast Host",
  },
  {
    quote: "This blueprint changed how I think about content.",
    author: "Influencer, 250K followers",
  },
];

const previewItems = [
  "The 40-Clip Content Engine",
  "The AI Studio workflow",
  "The Hook Detection Formula",
  "The Creator Monetization Flywheel",
  "30-day posting plan",
  "High-performance caption templates",
];

export default function CreatorGrowthBlueprint() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) {
      toast.error("Please fill in all fields");
      return;
    }
    toast.success("Check your inbox! The Blueprint is on its way.");
    setFullName("");
    setEmail("");
  };

  const handleDownload = () => {
    toast.success("Downloading the 2025 Creator Growth Blueprint...");
  };

  return (
    <div className="min-h-screen bg-background print:bg-white">
      {/* SECTION 1 — HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#2C6BED] via-[#7C3AED] to-[#EC4899] py-20 md:py-28 print:py-12 print:bg-gradient-to-r print:from-[#2C6BED] print:to-[#7C3AED]">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-20 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-white rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-300 rounded-full blur-3xl opacity-30" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-white mb-4 tracking-tight leading-tight">
              The 2025 Creator Growth Blueprint
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-6 font-medium">
              Turn one long-form video into 40+ pieces of high-performing content — automatically.
            </p>
            <p className="text-lg text-white/80 mb-10 max-w-3xl mx-auto leading-relaxed">
              This free guide reveals the exact AI-powered workflow top creators are using to explode growth, streamline production, and build repeatable monetization systems.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center print:hidden">
              <Button
                size="lg"
                className="bg-white text-[#7C3AED] hover:bg-white/90 font-semibold px-8 py-6 text-lg rounded-2xl shadow-xl"
                onClick={handleDownload}
              >
                <Download className="mr-2 h-5 w-5" />
                Download the Blueprint
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/50 text-white hover:bg-white/10 font-semibold px-8 py-6 text-lg rounded-2xl backdrop-blur-sm"
                onClick={() => navigate('/auth')}
              >
                Create Your Free Seeksy Account
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 2 — WHAT'S INSIDE */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-background to-muted/30 print:py-10">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-6 w-6 text-[#7C3AED]" />
              <h2 className="text-3xl md:text-4xl font-semibold text-foreground">
                What's Inside
              </h2>
            </div>
            <p className="text-lg text-muted-foreground">
              Your complete system for effortless content repurposing.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full border-0 shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)] transition-all duration-300 rounded-2xl bg-card">
                  <CardContent className="p-8 text-center">
                    <div className="text-5xl mb-4">{feature.icon}</div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3 — PREVIEW */}
      <section className="py-16 md:py-20 bg-background print:py-10">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* PDF Mockup */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#2C6BED]/20 via-[#7C3AED]/20 to-[#EC4899]/20 rounded-3xl blur-2xl" />
                <div className="relative bg-white rounded-2xl shadow-2xl p-8 border border-border/50">
                  <div className="aspect-[3/4] bg-gradient-to-br from-[#2C6BED] via-[#7C3AED] to-[#EC4899] rounded-xl flex items-center justify-center">
                    <div className="text-center text-white p-6">
                      <h3 className="text-2xl font-bold mb-2">2025</h3>
                      <h4 className="text-lg font-semibold mb-4">Creator Growth Blueprint</h4>
                      <div className="w-16 h-1 bg-white/50 mx-auto rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-[#7C3AED]" />
                <h2 className="text-3xl md:text-4xl font-semibold text-foreground">
                  Preview the Blueprint
                </h2>
              </div>
              <p className="text-lg text-muted-foreground mb-6">
                Here's a sneak peek of what you'll get:
              </p>
              <ul className="space-y-3 mb-8">
                {previewItems.map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#2C6BED] to-[#7C3AED] flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-foreground font-medium">{item}</span>
                  </li>
                ))}
              </ul>
              <Button
                size="lg"
                className="bg-gradient-to-r from-[#2C6BED] via-[#7C3AED] to-[#EC4899] hover:opacity-90 text-white font-semibold px-8 py-6 text-lg rounded-2xl shadow-lg print:hidden"
                onClick={handleDownload}
              >
                <Download className="mr-2 h-5 w-5" />
                Download the Blueprint
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — HOW IT WORKS */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-muted/30 to-background print:py-10">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-6 w-6 text-[#7C3AED]" />
              <h2 className="text-3xl md:text-4xl font-semibold text-foreground">
                How the System Works
              </h2>
            </div>
            <p className="text-lg text-muted-foreground">
              A simple, repeatable AI workflow any creator can use.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {workflowSteps.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <Card className="h-full border-0 shadow-[0_4px_20px_rgba(0,0,0,0.06)] rounded-2xl bg-card overflow-hidden">
                  <div className="h-2 bg-gradient-to-r from-[#2C6BED] via-[#7C3AED] to-[#EC4899]" />
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#2C6BED] to-[#7C3AED] flex items-center justify-center mx-auto mb-4">
                      <span className="text-white font-bold text-lg">{step.step}</span>
                    </div>
                    <step.icon className="h-8 w-8 text-[#7C3AED] mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
                {index < workflowSteps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                    <ArrowRight className="h-6 w-6 text-[#7C3AED]/50" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5 — TESTIMONIALS */}
      <section className="py-16 md:py-20 bg-background print:py-10">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-6 w-6 text-[#7C3AED]" />
              <h2 className="text-3xl md:text-4xl font-semibold text-foreground">
                Creators Are Using This to Grow Faster
              </h2>
            </div>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full border-0 shadow-[0_4px_20px_rgba(0,0,0,0.06)] rounded-2xl bg-gradient-to-br from-[#2C6BED]/5 via-[#7C3AED]/5 to-[#EC4899]/5">
                  <CardContent className="p-8">
                    <Quote className="h-8 w-8 text-[#7C3AED]/30 mb-4" />
                    <p className="text-lg font-semibold italic text-foreground mb-4 leading-relaxed">
                      "{testimonial.quote}"
                    </p>
                    <p className="text-sm text-muted-foreground">
                      — {testimonial.author}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6 — EMAIL OPT-IN */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-background to-muted/30 print:py-10">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-xl mx-auto"
          >
            <Card className="border-0 shadow-[0_8px_30px_rgba(0,0,0,0.08)] rounded-2xl overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-[#2C6BED] via-[#7C3AED] to-[#EC4899]" />
              <CardContent className="p-8 md:p-10">
                <div className="text-center mb-8">
                  <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-3">
                    Get the 2025 Creator Growth Blueprint
                  </h2>
                  <p className="text-muted-foreground">
                    Enter your email to receive the downloadable guide instantly.
                  </p>
                </div>
                <form onSubmit={handleEmailSubmit} className="space-y-4 print:hidden">
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
                    className="w-full h-12 bg-gradient-to-r from-[#2C6BED] via-[#7C3AED] to-[#EC4899] hover:opacity-90 text-white font-semibold rounded-xl"
                  >
                    <Zap className="mr-2 h-5 w-5" />
                    Send Me the Blueprint
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

      {/* SECTION 7 — SECONDARY CTA */}
      <section className="py-16 md:py-20 bg-[#2C6BED] print:py-10">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
              Ready to Level Up Your Content?
            </h2>
            <p className="text-lg text-white/80 mb-10">
              The fastest way to turn your ideas into viral content is waiting inside Seeksy.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center print:hidden">
              <Button
                size="lg"
                className="bg-white text-[#2C6BED] hover:bg-white/90 font-semibold px-8 py-6 text-lg rounded-2xl shadow-lg"
                onClick={() => navigate('/auth')}
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/50 text-white hover:bg-white/10 font-semibold px-8 py-6 text-lg rounded-2xl"
                onClick={() => navigate('/studio/clips')}
              >
                Explore the AI Clip Studio
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 8 — PDF FOOTER */}
      <footer className="py-8 bg-muted/30 print:py-6 print:bg-white print:border-t">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Sparkles className="h-4 w-4 text-[#7C3AED]" />
            <span className="text-sm">
              Seeksy — Where Content Becomes Opportunity.
            </span>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-2">
            hello@seeksy.io
          </p>
        </div>
      </footer>
    </div>
  );
}
