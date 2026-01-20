import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import heroVirtualStudio from "@/assets/hero-virtual-studio.jpg";
import { Sparkles } from "lucide-react";

export const HolidayHeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img 
          src={heroVirtualStudio} 
          alt="Virtual Studio" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/70 to-black/95" />
      </div>
      
      <div className="container relative z-10 mx-auto px-4 py-32 md:py-40">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl md:text-8xl font-black mb-6 leading-tight">
            <span className="text-white">Ho Ho Ho 🎄</span>
            <br />
            <span className="bg-gradient-to-r from-red-500 via-green-500 to-red-500 bg-clip-text text-transparent animate-pulse">
              It's Seeksy Season.
            </span>
          </h1>
          <p className="text-xl md:text-2xl mb-12 text-white/90 max-w-3xl mx-auto font-medium">
            Host live sessions, record your podcast, and turn every event into clips, content, and community — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate("/auth?mode=signup")} 
              className="bg-gradient-to-r from-red-600 to-green-600 hover:opacity-90 text-white text-lg px-10 py-7 h-auto font-black shadow-glow hover:scale-105 transition-all"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Get Started Free
            </Button>
            <Button 
              size="lg" 
              onClick={() => window.open("https://calendly.com/seeksy-demo", "_blank")}
              variant="outline"
              className="bg-black/40 backdrop-blur-sm border-2 border-white/50 text-white hover:bg-white hover:text-black text-lg px-10 py-7 h-auto font-black transition-all"
            >
              Book a Demo with Our Team
            </Button>
          </div>
          
          <div className="flex items-center justify-center gap-8 mt-12 flex-wrap">
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full border border-red-500/50">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-white font-semibold text-sm">🎄 Limited Holiday Access</span>
            </div>
            <div 
              className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full border border-green-500/50 cursor-pointer hover:bg-white/10 transition-all"
              onClick={() => navigate("/voice-certification")}
            >
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-white font-semibold text-sm">✨ Polygon Certified</span>
            </div>
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full border border-red-500/50">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-white font-semibold text-sm">🎁 Creator Gifts Inside</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
