import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Shuffle, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const rotatingPrompts = [
  "Send my podcast guest an invite and schedule a recording...",
  "Create clips from my latest episode and post to social...",
  "Build a landing page for my upcoming live event...",
  "Track my audience growth and send a newsletter update...",
  "Set up a CRM to manage my brand partnerships...",
];

export function HeroStatic() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  const cyclePrompt = useCallback(() => {
    setIsTyping(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % rotatingPrompts.length);
      setIsTyping(false);
    }, 150);
  }, []);

  useEffect(() => {
    const interval = setInterval(cyclePrompt, 4000);
    return () => clearInterval(interval);
  }, [cyclePrompt]);

  return (
    <section 
      className="w-full px-4 pt-28 pb-16 md:pt-40 md:pb-28"
      style={{ 
        minHeight: "80vh",
        background: "linear-gradient(180deg, hsl(var(--muted)/0.3) 0%, hsl(var(--background)) 100%)",
      }}
    >
      <div className="mx-auto max-w-[1000px] text-center">
        {/* Large Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="font-black tracking-[-2px] mb-16"
          style={{ 
            fontSize: "clamp(40px, 7vw, 72px)",
            lineHeight: 1.05,
            color: "hsl(var(--foreground))",
          }}
        >
          From idea to app in an instant
          <br />
          <span style={{ color: "hsl(var(--foreground)/0.85)" }}>
            Build with AI that means business
          </span>
        </motion.h1>

        {/* Floating Prompt Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="mx-auto max-w-[800px] rounded-3xl p-8 md:p-10"
          style={{
            background: "hsl(var(--card))",
            boxShadow: "0 25px 80px -20px hsl(var(--foreground)/0.12)",
          }}
        >
          {/* Prompt Display */}
          <div 
            className="w-full min-h-[100px] md:min-h-[120px] flex items-center justify-start text-left mb-8"
          >
            <AnimatePresence mode="wait">
              <motion.p
                key={currentIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: isTyping ? 0.5 : 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="text-xl md:text-2xl font-medium leading-relaxed"
                style={{ color: "hsl(var(--foreground))" }}
              >
                {rotatingPrompts[currentIndex]}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Button
              variant="outline"
              size="lg"
              className="rounded-full px-6 h-12 text-base font-medium"
              onClick={cyclePrompt}
            >
              <Shuffle className="mr-2 h-4 w-4" />
              New Suggestion
            </Button>
            <Button
              size="lg"
              className="rounded-full px-8 h-12 text-base font-semibold bg-foreground text-background hover:bg-foreground/90"
              onClick={() => navigate("/auth")}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Try it now
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
