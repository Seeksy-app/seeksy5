import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Play, Sparkles, ShieldCheck, Scale } from "lucide-react";

// Import political images
import rallyImg from "@/assets/campaign/political-rally.jpg";
import rallySpeakerImg from "@/assets/campaign/rally-speaker.jpg";
import debateImg from "@/assets/campaign/political-debate.jpg";
import volunteersImg from "@/assets/campaign/campaign-volunteers.jpg";
import townHallImg from "@/assets/campaign/town-hall.jpg";
import strategyImg from "@/assets/campaign/strategy-meeting.jpg";
import voterOutreachImg from "@/assets/campaign/voter-outreach.jpg";
import victoryImg from "@/assets/campaign/victory-celebration.jpg";
import canvassingImg from "@/assets/campaign/door-canvassing.jpg";

const colors = {
  primary: "#0031A2",
  primaryDark: "#001B5C",
  accent: "#FFCC33",
  textOnDark: "#FFFFFF",
};

// Grid images for Netflix-style background
const gridImages = [
  { src: rallyImg, alt: "Political rally" },
  { src: rallySpeakerImg, alt: "Rally speaker" },
  { src: debateImg, alt: "Political debate" },
  { src: volunteersImg, alt: "Campaign volunteers" },
  { src: townHallImg, alt: "Town hall meeting" },
  { src: strategyImg, alt: "Strategy meeting" },
  { src: voterOutreachImg, alt: "Voter outreach" },
  { src: victoryImg, alt: "Victory celebration" },
  { src: canvassingImg, alt: "Door canvassing" },
];

interface CampaignHeroNetflixProps {
  onGetStarted: (raceInput: string) => void;
}

export function CampaignHeroNetflix({ onGetStarted }: CampaignHeroNetflixProps) {
  const [raceInput, setRaceInput] = useState("");

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Netflix-style image grid background */}
      <div className="absolute inset-0">
        <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-3 h-full w-full">
          {/* Top row */}
          <div className="relative overflow-hidden">
            <img 
              src={gridImages[0].src} 
              alt={gridImages[0].alt}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative overflow-hidden">
            <img 
              src={gridImages[1].src} 
              alt={gridImages[1].alt}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative overflow-hidden">
            <img 
              src={gridImages[2].src} 
              alt={gridImages[2].alt}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Middle row */}
          <div className="relative overflow-hidden">
            <img 
              src={gridImages[3].src} 
              alt={gridImages[3].alt}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative overflow-hidden">
            <img 
              src={gridImages[4].src} 
              alt={gridImages[4].alt}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative overflow-hidden">
            <img 
              src={gridImages[5].src} 
              alt={gridImages[5].alt}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Bottom row */}
          <div className="relative overflow-hidden">
            <img 
              src={gridImages[6].src} 
              alt={gridImages[6].alt}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative overflow-hidden">
            <img 
              src={gridImages[7].src} 
              alt={gridImages[7].alt}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative overflow-hidden">
            <img 
              src={gridImages[8].src} 
              alt={gridImages[8].alt}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        
        {/* Dark overlay gradient - lighter for better image visibility */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 50% 50%, rgba(0, 0, 0, 0.77) 0%, rgba(0, 0, 0, 0.52) 50%, rgba(0, 0, 0, 0.32) 100%),
              linear-gradient(to bottom, rgba(0, 0, 0, 0.22) 0%, rgba(0, 0, 0, 0.62) 100%)
            `
          }}
        />
        
        {/* Top fade */}
        <div 
          className="absolute top-0 left-0 right-0 h-40"
          style={{
            background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.8) 0%, transparent 100%)'
          }}
        />
        
        {/* Bottom fade */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-40"
          style={{
            background: 'linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, transparent 100%)'
          }}
        />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 text-center relative z-10 py-20">
        <h1 
          className="text-5xl md:text-7xl font-bold mb-6 tracking-tight"
          style={{ color: colors.textOnDark }}
        >
          CampaignStaff.ai
        </h1>
        <p 
          className="text-xl md:text-2xl mb-4 max-w-3xl mx-auto font-medium"
          style={{ color: "rgba(255,255,255,0.95)" }}
        >
          Your AI-powered campaign team for local, state, and federal races.
        </p>
        <p 
          className="text-base md:text-lg mb-10 max-w-2xl mx-auto"
          style={{ color: "rgba(255,255,255,0.7)" }}
        >
          Most candidates can't afford big consulting firms or full-time staff. CampaignStaff.ai gives every campaign a virtual manager, digital director, speechwriter, and field team—on day one.
        </p>

        {/* Input + CTA */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-lg mx-auto mb-8">
          <Input
            placeholder="Enter your race or office"
            value={raceInput}
            onChange={(e) => setRaceInput(e.target.value)}
            className="h-14 text-base bg-white/10 border-white/30 text-white placeholder:text-white/50 backdrop-blur-sm"
          />
          <Button 
            onClick={() => onGetStarted(raceInput)}
            className="h-14 px-8 font-semibold text-lg"
            style={{ backgroundColor: colors.accent, color: colors.primaryDark }}
          >
            Get Started <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        {/* Secondary CTA */}
        <button 
          className="inline-flex items-center gap-2 text-base font-medium hover:opacity-80 transition-opacity"
          style={{ color: "rgba(255,255,255,0.8)" }}
        >
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
          >
            <Play className="h-4 w-4 ml-0.5" fill="currentColor" />
          </div>
          Watch a 2-minute demo
        </button>

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-4 mt-16">
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-sm">
            <Sparkles className="h-4 w-4" style={{ color: colors.accent }} />
            <span className="text-sm text-white/90">Powered by Seeksy</span>
          </div>
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-sm">
            <ShieldCheck className="h-4 w-4" style={{ color: colors.accent }} />
            <span className="text-sm text-white/90">AI-assisted, you stay in control</span>
          </div>
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-sm">
            <Scale className="h-4 w-4" style={{ color: colors.accent }} />
            <span className="text-sm text-white/90">Built for compliance-friendly workflows</span>
          </div>
        </div>
      </div>
    </section>
  );
}
