import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowRight, Sparkles, Users2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const heroScenes = [
  {
    id: 1,
    title: "Podcast Recording",
    image: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&h=500&fit=crop",
    overlay: "Recording in progress...",
    accent: "from-amber-500/20 to-orange-500/20"
  },
  {
    id: 2,
    title: "Video Studio",
    image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&h=500&fit=crop",
    overlay: "AI Enhancement Active",
    accent: "from-blue-500/20 to-purple-500/20"
  },
  {
    id: 3,
    title: "Creator Meeting",
    image: "https://images.unsplash.com/photo-1573164713988-8665fc963095?w=800&h=500&fit=crop",
    overlay: "Guest Connected",
    accent: "from-emerald-500/20 to-teal-500/20"
  }
];

export function HeroSectionPremium() {
  const navigate = useNavigate();
  const [currentScene, setCurrentScene] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentScene((prev) => (prev + 1) % heroScenes.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[#0A0F1A]">
      {/* Animated gradient background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A0F1A] via-[#111827] to-[#0A0F1A]" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-amber-500/8 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-orange-500/8 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-500/5 rounded-full blur-[150px]" />
      </div>

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}
      />

      <div className="container relative z-10 mx-auto px-4 py-20 pt-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 mb-8"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-white/80 font-medium">AI-powered creator tools</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-[1.1] tracking-tight"
            >
              <span className="text-white">The All-in-One Platform for</span>
              <br />
              <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">
                Modern Creators
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-white/60 mb-10 max-w-xl leading-relaxed"
            >
              Host. Grow. Monetize. All from one unified workspace built for podcasters, creators, and the brands that work with them.
            </motion.p>

            {/* Dual CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 mb-6"
            >
              <Button
                size="lg"
                onClick={() => navigate("/auth?mode=signup")}
                className="bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-900 text-lg px-8 py-7 h-auto font-bold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-100 group"
              >
                <Sparkles className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                Get Started (Creators)
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/for-brands")}
                className="bg-white/5 backdrop-blur-sm border-2 border-white/20 text-white hover:bg-white/10 hover:border-white/40 text-lg px-8 py-7 h-auto font-semibold transition-all duration-300 hover:scale-105 active:scale-100 group"
              >
                <Users2 className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Book Creators / For Brands
              </Button>
            </motion.div>

            {/* Schedule Demo Link */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              onClick={() => navigate("/meetings/schedule?type=demo")}
              className="inline-flex items-center gap-2 text-white/50 hover:text-white/80 text-sm transition-colors group"
            >
              <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center group-hover:bg-yellow-500/30 transition-colors">
                <Calendar className="h-3 w-3 text-yellow-400" />
              </div>
              Watch a 2-minute demo
            </motion.button>
          </div>

          {/* Right - Rotating Carousel */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative"
          >
            {/* Browser Frame */}
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-b from-white/5 to-white/[0.02] backdrop-blur-sm shadow-2xl shadow-black/50">
              {/* Browser Header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/5">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="max-w-sm mx-auto px-4 py-1.5 rounded-lg bg-white/10 text-white/40 text-sm text-center">
                    app.seeksy.io/studio
                  </div>
                </div>
              </div>
              
              {/* Carousel Content */}
              <div className="aspect-[4/3] relative overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentScene}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0"
                  >
                    <img
                      src={heroScenes[currentScene].image}
                      alt={heroScenes[currentScene].title}
                      className="w-full h-full object-cover"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t ${heroScenes[currentScene].accent} to-transparent`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F1A] via-transparent to-transparent" />
                    
                    {/* Overlay UI Elements */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center justify-between">
                        <div className="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10">
                          <span className="text-xs text-white/90 font-medium">{heroScenes[currentScene].overlay}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-xs text-white/70">LIVE</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Scene Indicators */}
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2">
                {heroScenes.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentScene(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentScene ? 'bg-amber-400 w-6' : 'bg-white/30 hover:bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Floating Pills */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="absolute -left-4 top-1/4 px-3 py-2 bg-[#0D1117]/90 backdrop-blur-md rounded-lg border border-white/20 text-white text-sm font-medium shadow-xl"
            >
              🎙️ Podcast Studio
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="absolute -right-4 top-1/3 px-3 py-2 bg-[#0D1117]/90 backdrop-blur-md rounded-lg border border-white/20 text-white text-sm font-medium shadow-xl"
            >
              📊 Analytics
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0 }}
              className="absolute left-8 -bottom-4 px-3 py-2 bg-[#0D1117]/90 backdrop-blur-md rounded-lg border border-amber-500/30 text-white text-sm font-medium shadow-xl"
            >
              <span className="text-amber-400">✨</span> AI Clips Ready
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
