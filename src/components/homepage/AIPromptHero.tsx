import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Shuffle, Sparkles, ArrowRight, Coins,
  Bot, Cpu, Mic, Video, Calendar, Mail, 
  Podcast, Users, BarChart3, Zap, Globe, 
  MessageSquare, Camera, Headphones, Radio
} from "lucide-react";

// Floating background icons configuration
const floatingIcons = [
  { Icon: Bot, size: 24, x: 8, y: 15, delay: 0 },
  { Icon: Cpu, size: 20, x: 85, y: 20, delay: 0.5 },
  { Icon: Mic, size: 22, x: 12, y: 75, delay: 1 },
  { Icon: Video, size: 18, x: 92, y: 65, delay: 1.5 },
  { Icon: Calendar, size: 20, x: 5, y: 45, delay: 2 },
  { Icon: Mail, size: 16, x: 95, y: 40, delay: 2.5 },
  { Icon: Podcast, size: 26, x: 88, y: 85, delay: 0.3 },
  { Icon: Users, size: 18, x: 15, y: 90, delay: 0.8 },
  { Icon: BarChart3, size: 20, x: 78, y: 10, delay: 1.3 },
  { Icon: Zap, size: 16, x: 3, y: 30, delay: 1.8 },
  { Icon: Globe, size: 22, x: 90, y: 50, delay: 2.3 },
  { Icon: MessageSquare, size: 18, x: 82, y: 75, delay: 0.6 },
  { Icon: Camera, size: 20, x: 6, y: 60, delay: 1.1 },
  { Icon: Headphones, size: 24, x: 94, y: 30, delay: 1.6 },
  { Icon: Radio, size: 18, x: 10, y: 5, delay: 2.1 },
];

// The 4 main rotating statements
const rotatingStatements = [
  "Send my podcast guest an invite and schedule a recording...",
  "Create clips from my latest episode and post to social...",
  "Build a landing page for my upcoming live event...",
  "Track my audience growth and send a newsletter update...",
];

const modulePrompts: Record<string, string[]> = {
  meetings: [
    "Schedule a discovery call with a potential sponsor...",
    "Set up recurring weekly team meetings...",
    "Create a booking page for coaching sessions...",
  ],
  studio: [
    "Record a solo episode with AI teleprompter...",
    "Start a live recording session with 3 guests...",
    "Edit my raw footage with AI noise reduction...",
  ],
  email: [
    "Send a welcome sequence to new subscribers...",
    "Draft a newsletter announcing my new course...",
    "Reply to sponsor inquiries in my inbox...",
  ],
  clips: [
    "Generate 5 vertical clips from my latest podcast...",
    "Add captions and animations to my best moment...",
    "Schedule clips to post across all platforms...",
  ],
  mypage: [
    "Update my link-in-bio with new offerings...",
    "Add a featured video to my creator page...",
    "Customize my page theme and branding...",
  ],
  newsletter: [
    "Create a weekly digest for my audience...",
    "Set up automated welcome emails...",
    "Design a premium newsletter template...",
  ],
  crm: [
    "Import my email list and segment by interest...",
    "Tag contacts who attended my last event...",
    "Find my most engaged subscribers...",
  ],
  monetize: [
    "Set up tipping for my live streams...",
    "Create a paid membership tier...",
    "Track my ad revenue this month...",
  ],
  podcast: [
    "Upload my latest episode and generate show notes...",
    "Submit my podcast to Apple and Spotify...",
    "Check my download analytics by episode...",
  ],
  events: [
    "Create a virtual workshop with ticket sales...",
    "Send reminders to registered attendees...",
    "Set up a hybrid in-person and streaming event...",
  ],
  sms: [
    "Text my VIP list about an exclusive drop...",
    "Send event reminders via SMS...",
    "Create an SMS welcome message for new contacts...",
  ],
};

const promptToModules: Record<string, string[]> = {
  "Send my podcast guest an invite and schedule a recording...": ["meetings", "studio", "email"],
  "Create clips from my latest episode and post to social...": ["clips", "studio", "mypage"],
  "Track my audience growth and send a newsletter update...": ["crm", "email", "newsletter"],
  "Build a landing page for my upcoming live event...": ["mypage", "events", "email"],
};

export function AIPromptHero() {
  const navigate = useNavigate();
  const [currentPrompt, setCurrentPrompt] = useState(rotatingStatements[0]);
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [statementIndex, setStatementIndex] = useState(0);
  const [isAutoRotating, setIsAutoRotating] = useState(true);

  const goToNextStatement = useCallback(() => {
    const nextIndex = (statementIndex + 1) % rotatingStatements.length;
    setStatementIndex(nextIndex);
    setCurrentPrompt(rotatingStatements[nextIndex]);
    setDisplayText("");
    setIsTyping(true);
  }, [statementIndex]);

  // Typewriter effect + auto-rotate
  useEffect(() => {
    if (isTyping) {
      if (displayText.length < currentPrompt.length) {
        const timeout = setTimeout(() => {
          setDisplayText(currentPrompt.slice(0, displayText.length + 1));
        }, 35);
        return () => clearTimeout(timeout);
      } else {
        // Pause at end, then go to next if auto-rotating
        const timeout = setTimeout(() => {
          setIsTyping(false);
          if (isAutoRotating) {
            goToNextStatement();
          }
        }, 2500);
        return () => clearTimeout(timeout);
      }
    }
  }, [displayText, currentPrompt, isTyping, isAutoRotating, goToNextStatement]);

  const shufflePrompt = () => {
    setIsAutoRotating(false); // Stop auto-rotation when user interacts
    const nextIndex = (statementIndex + 1) % rotatingStatements.length;
    setStatementIndex(nextIndex);
    setCurrentPrompt(rotatingStatements[nextIndex]);
    setDisplayText("");
    setIsTyping(true);
  };

  const handleModuleClick = (moduleId: string) => {
    const prompts = modulePrompts[moduleId];
    if (prompts && prompts.length > 0) {
      const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
      setCurrentPrompt(randomPrompt);
      setDisplayText("");
      setIsTyping(true);
    }
  };

  const handleTryNow = () => {
    navigate("/auth?mode=signup");
  };

  const suggestedModules = promptToModules[currentPrompt] || 
    Object.keys(modulePrompts).filter(m => 
      currentPrompt.toLowerCase().includes(m) || 
      (m === "studio" && currentPrompt.toLowerCase().includes("record")) ||
      (m === "clips" && currentPrompt.toLowerCase().includes("clip")) ||
      (m === "email" && (currentPrompt.toLowerCase().includes("email") || currentPrompt.toLowerCase().includes("newsletter"))) ||
      (m === "meetings" && (currentPrompt.toLowerCase().includes("meeting") || currentPrompt.toLowerCase().includes("schedule") || currentPrompt.toLowerCase().includes("call"))) ||
      (m === "sms" && currentPrompt.toLowerCase().includes("text")) ||
      (m === "events" && (currentPrompt.toLowerCase().includes("event") || currentPrompt.toLowerCase().includes("workshop"))) ||
      (m === "mypage" && (currentPrompt.toLowerCase().includes("page") || currentPrompt.toLowerCase().includes("link"))) ||
      (m === "crm" && (currentPrompt.toLowerCase().includes("contact") || currentPrompt.toLowerCase().includes("subscriber"))) ||
      (m === "monetize" && (currentPrompt.toLowerCase().includes("revenue") || currentPrompt.toLowerCase().includes("tip") || currentPrompt.toLowerCase().includes("paid"))) ||
      (m === "podcast" && (currentPrompt.toLowerCase().includes("podcast") || currentPrompt.toLowerCase().includes("episode")))
    ).slice(0, 3);

  const moduleLabels: Record<string, string> = {
    meetings: "Meetings",
    studio: "Studio",
    email: "Email",
    clips: "AI Clips",
    mypage: "My Page",
    newsletter: "Newsletter",
    crm: "CRM",
    monetize: "Monetize",
    podcast: "Podcast",
    events: "Events",
    sms: "SMS",
  };

  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-muted/30 to-background pt-24 pb-16">
      <div className="container relative z-10 mx-auto px-4 text-center">
        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 leading-[1.1] tracking-tight text-foreground"
        >
          From idea to workflow
          <br />
          <span className="bg-gradient-to-r from-primary via-amber-500 to-primary bg-clip-text text-transparent">
            in an instant
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
        >
          Build with AI that understands creators
        </motion.p>

        {/* AI Prompt Box */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
            {/* Prompt Display Area */}
            <div className="p-6 md:p-8 min-h-[140px] flex items-start">
              <p className="text-xl md:text-2xl text-left text-foreground font-medium leading-relaxed">
                {displayText}
                <span className="inline-block w-0.5 h-6 bg-primary ml-1 animate-pulse" />
              </p>
            </div>

            {/* Suggested Modules Pills - Clickable */}
            <AnimatePresence mode="wait">
              {suggestedModules.length > 0 && (
                <motion.div
                  key={currentPrompt}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="px-6 md:px-8 pb-4"
                >
                  <p className="text-xs text-muted-foreground mb-2">Click a module for more ideas:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedModules.map((moduleId) => (
                      <button
                        key={moduleId}
                        onClick={() => handleModuleClick(moduleId)}
                        className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20 hover:bg-primary/20 hover:scale-105 transition-all cursor-pointer"
                      >
                        {moduleLabels[moduleId] || moduleId.charAt(0).toUpperCase() + moduleId.slice(1)}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Bar */}
            <div className="flex items-center justify-between px-6 md:px-8 py-4 border-t border-border bg-muted/30">
              <Button
                variant="ghost"
                size="sm"
                onClick={shufflePrompt}
                className="text-muted-foreground hover:text-foreground"
              >
                <Shuffle className="h-4 w-4 mr-2" />
                New Suggestion
              </Button>

              <Button
                onClick={handleTryNow}
                className="bg-foreground hover:bg-foreground/90 text-background font-semibold px-6"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Try it now
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Credits Mention */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-8 flex items-center justify-center gap-2 text-muted-foreground"
        >
          <Coins className="h-4 w-4" />
          <span className="text-sm">Pay only for what you use • Start free with 100 credits</span>
        </motion.div>
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {floatingIcons.map(({ Icon, size, x, y, delay }, i) => (
          <motion.div
            key={i}
            className="absolute text-primary/60"
            style={{
              left: `${x}%`,
              top: `${y}%`,
            }}
            animate={{
              y: [0, -20, 0],
              x: [0, 8, 0],
              rotate: [0, 15, 0],
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{
              duration: 5 + (i % 3),
              delay: delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Icon size={size * 1.6} strokeWidth={1.5} />
          </motion.div>
        ))}
      </div>

      {/* Decorative dots */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-primary/20"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{
              y: [0, -10, 0],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3,
              delay: i * 0.3,
              repeat: Infinity,
            }}
          />
        ))}
      </div>
    </section>
  );
}
