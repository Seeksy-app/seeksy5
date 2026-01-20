import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowRight, Users, Mic, Zap, Shield } from "lucide-react";
import { motion } from "framer-motion";
import heroImage from "@/assets/homepage/hero-studio.jpg";

const credentialStats = [
  { value: "10K+", label: "Active Creators", icon: Users },
  { value: "50K+", label: "Episodes Recorded", icon: Mic },
  { value: "1M+", label: "Hours Streamed", icon: Zap },
  { value: "98%", label: "Satisfaction", icon: Shield },
];

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
      {/* Background Image with Enhanced Overlay for Text Contrast */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Creator recording in professional studio"
          className="w-full h-full object-cover"
          loading="eager"
        />
        {/* Primary gradient - stronger for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/70" />
        {/* Secondary gradient for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/60" />
        {/* Subtle color overlay for brand tone */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-gold/5 to-transparent mix-blend-overlay" />
      </div>

      <div className="container relative z-10 mx-auto px-4 py-20">
        <div className="max-w-3xl">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-white/90 font-medium">Now with AI-powered editing</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-[1.1]"
          >
            <span className="text-white">Ready to Grow Your</span>
            <br />
            <span className="bg-gradient-to-r from-brand-gold via-amber-400 to-brand-orange bg-clip-text text-transparent">
              Creator Brand?
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-white/70 mb-10 max-w-xl leading-relaxed"
          >
            Join thousands of creators who use Seeksy to host, grow, collaborate, and monetize their content.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 mb-6"
          >
            <Button
              size="lg"
              onClick={() => navigate("/onboarding")}
              className="bg-gradient-to-r from-brand-gold to-brand-orange hover:from-brand-orange hover:to-brand-gold text-slate-900 text-lg px-8 py-7 h-auto font-bold shadow-lg shadow-brand-gold/30 hover:shadow-brand-gold/50 hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-100"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/demo")}
              className="bg-yellow-500 hover:bg-yellow-400 border-2 border-yellow-500 text-slate-900 text-lg px-8 py-7 h-auto font-bold transition-all duration-300 hover:scale-105 active:scale-100"
            >
              <Calendar className="mr-2 h-5 w-5" />
              Schedule a Demo
            </Button>
          </motion.div>

          {/* Footer line */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-white/50 text-sm"
          >
            No credit card required • Free forever plan available
          </motion.p>
        </div>

        {/* Credential Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl"
        >
          {credentialStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10"
              >
                <div className="p-2 rounded-lg bg-brand-gold/10">
                  <Icon className="h-5 w-5 text-brand-gold" />
                </div>
                <div>
                  <div className="text-xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-white/50">{stat.label}</div>
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
