import { TopNavigation } from "@/components/homepage/TopNavigation";
import { FooterSection } from "@/components/homepage/FooterSection";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Target, Sparkles, Heart, Globe, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

// Animated counter hook
function useCountUp(end: number, duration: number = 2000, startOnView: boolean = true) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!startOnView) {
      animateCount();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasStarted) {
          setHasStarted(true);
          animateCount();
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [end, duration, hasStarted, startOnView]);

  const animateCount = () => {
    const startTime = Date.now();
    const startValue = 0;

    const updateCount = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.floor(startValue + (end - startValue) * easeOutQuart);
      
      setCount(currentValue);

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      }
    };

    requestAnimationFrame(updateCount);
  };

  return { count, ref };
}

function AnimatedStat({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const { count, ref } = useCountUp(value, 2000);
  
  return (
    <div ref={ref}>
      <div className="text-4xl md:text-5xl font-black text-amber-400 mb-2">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-white/60">{label}</div>
    </div>
  );
}

export default function About() {
  const navigate = useNavigate();

  const values = [
    {
      icon: Heart,
      title: "Creator-First",
      description: "Every feature we build starts with creators in mind. Your success is our success."
    },
    {
      icon: Target,
      title: "Simplicity",
      description: "Powerful tools shouldn't be complicated. We make complex workflows feel effortless."
    },
    {
      icon: Globe,
      title: "Accessibility",
      description: "Professional-grade tools available to everyone, regardless of budget or technical skill."
    },
    {
      icon: Award,
      title: "Authenticity",
      description: "We champion real voices and original content through blockchain-backed verification."
    }
  ];

  // Current industry statistics (2024 data)
  const stats = [
    { value: 250, suffix: "B+", label: "Creator Economy Size" },
    { value: 5, suffix: "M+", label: "Active Podcasts Worldwide" },
    { value: 464, suffix: "M", label: "Global Podcast Listeners" },
    { value: 95, suffix: "B", label: "Projected Podcast Market by 2028" },
  ];

  return (
    <div className="min-h-screen bg-[#0A0F1A] text-white">
      <TopNavigation />
      
      <main className="pt-24">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 text-center">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-8 text-white/60 hover:text-white hover:bg-white/5"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Homepage
          </Button>
          
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Sparkles className="w-8 h-8 text-amber-400" />
              <span className="text-amber-400 font-semibold">About Seeksy</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black mb-6 bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
              Empowering Creators to Build, Connect & Monetize
            </h1>
            
            <p className="text-xl text-white/70 mb-8">
              Seeksy is the all-in-one platform designed for modern creators, podcasters, 
              influencers, and brands. We provide the tools you need to create professional 
              content, grow your audience, and turn your passion into a sustainable business.
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-3xl p-8 md:p-12 border border-white/10">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">Our Mission</h2>
            <p className="text-lg text-white/80 text-center leading-relaxed">
              We believe every creator deserves access to professional-grade tools without 
              the complexity or cost. Our mission is to democratize content creation by 
              providing an integrated suite of AI-powered tools that handle the technical 
              heavy lifting — so creators can focus on what they do best: creating.
            </p>
          </div>
        </section>

        {/* Values Section */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-12 text-center">Our Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {values.map((value) => (
              <div 
                key={value.title}
                className="bg-slate-800/30 rounded-2xl p-6 border border-white/5 hover:border-amber-400/30 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-400/10 flex items-center justify-center mb-4">
                  <value.icon className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                <p className="text-white/60 text-sm">{value.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Stats Section with Animated Counters */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-12 text-center">The Creator Economy by the Numbers</h2>
          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto text-center">
            {stats.map((stat) => (
              <AnimatedStat 
                key={stat.label}
                value={stat.value}
                suffix={stat.suffix}
                label={stat.label}
              />
            ))}
          </div>
          <p className="text-center text-white/40 text-sm mt-8">
            Source: Industry reports 2024 — Goldman Sachs, Edison Research, Statista
          </p>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-16 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Join Us?</h2>
            <p className="text-white/60 mb-8">
              Start creating with Seeksy today — free forever for basic features.
            </p>
            <Button
              onClick={() => navigate("/auth?mode=signup")}
              size="lg"
              className="bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-semibold hover:opacity-90"
            >
              Get Started Free
            </Button>
          </div>
        </section>
      </main>

      <FooterSection />
    </div>
  );
}
