import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Shuffle, Sparkles, ArrowRight, Coins } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Each statement has associated module chips that match its topic
const promptData = [
  {
    text: "Send my podcast guest an invite and schedule a recording...",
    chips: ["Podcast", "Studio", "Meetings"],
    modulePrompts: {
      Podcast: "Upload my latest episode and generate show notes...",
      Studio: "Record a solo episode with AI teleprompter...",
      Meetings: "Schedule a discovery call with a potential sponsor...",
    },
  },
  {
    text: "Create clips from my latest episode and post to social...",
    chips: ["Clips", "Studio", "Social"],
    modulePrompts: {
      Clips: "Generate 5 vertical clips from my latest podcast...",
      Studio: "Edit my raw footage with AI noise reduction...",
      Social: "Schedule clips to post across all platforms...",
    },
  },
  {
    text: "Build a landing page for my upcoming live event...",
    chips: ["Events", "My Page", "Email"],
    modulePrompts: {
      Events: "Create a virtual workshop with ticket sales...",
      "My Page": "Update my link-in-bio with new offerings...",
      Email: "Send event reminders to registered attendees...",
    },
  },
  {
    text: "Track my audience growth and send a newsletter update...",
    chips: ["Analytics", "Newsletter", "Email"],
    modulePrompts: {
      Analytics: "Check my download analytics by episode...",
      Newsletter: "Create a weekly digest for my audience...",
      Email: "Draft a newsletter announcing my new course...",
    },
  },
  {
    text: "Set up a CRM to manage my brand partnerships...",
    chips: ["CRM", "Email", "Monetize"],
    modulePrompts: {
      CRM: "Import my email list and segment by interest...",
      Email: "Reply to sponsor inquiries in my inbox...",
      Monetize: "Track my ad revenue this month...",
    },
  },
];

export function InteractiveDemo() {
  const navigate = useNavigate();
  const [displayText, setDisplayText] = useState("");
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const currentData = promptData[currentPromptIndex];
  const currentPrompt = currentData.text;
  const currentChips = currentData.chips;

  // Typewriter effect
  useEffect(() => {
    if (isPaused) return;

    if (isTyping) {
      if (displayText.length < currentPrompt.length) {
        const timeout = setTimeout(() => {
          setDisplayText(currentPrompt.slice(0, displayText.length + 1));
        }, 30);
        return () => clearTimeout(timeout);
      } else {
        const timeout = setTimeout(() => {
          setIsTyping(false);
        }, 2000);
        return () => clearTimeout(timeout);
      }
    } else {
      const nextIndex = (currentPromptIndex + 1) % promptData.length;
      setCurrentPromptIndex(nextIndex);
      setDisplayText("");
      setIsTyping(true);
    }
  }, [displayText, currentPrompt, isTyping, currentPromptIndex, isPaused]);

  const handleModuleClick = (chipLabel: string) => {
    const prompt = currentData.modulePrompts[chipLabel];
    if (prompt) {
      setIsPaused(true);
      setDisplayText("");
      
      let i = 0;
      const typeInterval = setInterval(() => {
        if (i < prompt.length) {
          setDisplayText(prompt.slice(0, i + 1));
          i++;
        } else {
          clearInterval(typeInterval);
          setTimeout(() => {
            setIsPaused(false);
            setDisplayText("");
            setIsTyping(true);
          }, 4000);
        }
      }, 30);
    }
  };

  const handleNewSuggestion = () => {
    setIsPaused(false);
    const nextIndex = (currentPromptIndex + 1) % promptData.length;
    setCurrentPromptIndex(nextIndex);
    setDisplayText("");
    setIsTyping(true);
  };

  return (
    <section
      className="w-full px-4 relative"
      style={{
        background: "#F7F9FE",
        paddingTop: "80px",
        paddingBottom: "80px",
      }}
    >
      {/* Subtle top divider */}
      <div
        className="absolute top-0 left-0 right-0"
        style={{ height: "1px", background: "rgba(15,23,42,0.06)" }}
      />

      <div className="mx-auto max-w-[900px]">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-center mb-10"
        >
          <p
            className="font-bold uppercase mb-3"
            style={{ fontSize: "12px", letterSpacing: "2px", color: "#2C6BED" }}
          >
            How it works
          </p>
          <h2
            className="font-extrabold"
            style={{ fontSize: "44px", lineHeight: 1.1, color: "#0B1220", marginBottom: "12px" }}
          >
            Pick your Seekies. Build your workspace.
          </h2>
          <p style={{ fontSize: "18px", lineHeight: 1.6, color: "#667085", maxWidth: "600px", margin: "0 auto" }}>
            Turn tools on when you need them. Pay with credits. No lockouts.
          </p>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-[24px] p-8 md:p-10"
          style={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            boxShadow: "0 20px 60px -15px hsl(var(--foreground)/0.06)",
          }}
        >
          {/* Typewriter Prompt Display */}
          <div className="min-h-[90px] md:min-h-[110px] mb-8">
            <p
              className="text-2xl md:text-3xl font-medium leading-relaxed"
              style={{ color: "hsl(var(--foreground))" }}
            >
              {displayText}
              <span
                className="inline-block w-[2px] h-[1em] ml-1 align-middle animate-pulse"
                style={{ background: "hsl(var(--primary))" }}
              />
            </p>
          </div>

          {/* Module Chips Row - Dynamic based on current prompt */}
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <span
              className="text-sm"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              Click a module for more ideas:
            </span>
            {currentChips.map((chipLabel) => (
              <button
                key={chipLabel}
                onClick={() => handleModuleClick(chipLabel)}
                className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:shadow-md"
                style={{
                  background: "transparent",
                  border: "1.5px solid hsl(var(--primary))",
                  color: "hsl(var(--primary))",
                }}
              >
                {chipLabel}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div
            className="w-full h-px mb-6"
            style={{ background: "hsl(var(--border))" }}
          />

          {/* Bottom Row - CTAs */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              className="rounded-full px-4 h-9 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors flex items-center gap-1.5"
              onClick={handleNewSuggestion}
            >
              <Shuffle className="h-3.5 w-3.5" />
              New Suggestion
            </button>
            <Button
              size="lg"
              className="rounded-full px-8 h-12 text-base font-semibold shadow-lg"
              style={{ background: "#2C6BED" }}
              onClick={() => navigate("/auth")}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Try it now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </motion.div>

        {/* Credits Text */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <Coins className="h-4 w-4" style={{ color: "hsl(var(--muted-foreground))" }} />
          <p
            className="text-sm"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            Pay only for what you use • Start free with 100 credits
          </p>
        </div>
      </div>
    </section>
  );
}
