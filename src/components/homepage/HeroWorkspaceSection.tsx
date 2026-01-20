import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { HeroWorkspaceBuilder } from "./HeroWorkspaceBuilder";
import { motion, AnimatePresence } from "framer-motion";

interface PersonaContent {
  bullets: string[];
}

const personas: { key: string; label: string; content: PersonaContent }[] = [
  {
    key: "creators",
    label: "Creators",
    content: {
      bullets: [
        "Create content fast with AI tools",
        "Grow your audience with email + SMS",
        "Monetize with tickets, sponsors, and offers",
      ],
    },
  },
  {
    key: "podcasters",
    label: "Podcasters",
    content: {
      bullets: [
        "Record and publish episodes",
        "Auto transcripts, clips, and captions",
        "Distribute everywhere with one workflow",
      ],
    },
  },
  {
    key: "agencies",
    label: "Agencies",
    content: {
      bullets: [
        "Manage creators and deliverables",
        "Run campaigns and approvals",
        "Track results across clients",
      ],
    },
  },
  {
    key: "brands",
    label: "Brands",
    content: {
      bullets: [
        "Find and activate creators",
        "Centralize content and rights",
        "Measure ROI across campaigns",
      ],
    },
  },
];

export function HeroWorkspaceSection() {
  const navigate = useNavigate();
  const [activePersona, setActivePersona] = useState("creators");

  const currentPersona = personas.find((p) => p.key === activePersona) || personas[0];

  return (
    <section
      className="w-full px-6"
      style={{
        paddingTop: "clamp(96px, 12vh, 160px)",
        paddingBottom: "80px",
        minHeight: "82vh",
        background: "linear-gradient(180deg, hsl(var(--muted)/0.25) 0%, hsl(var(--background)) 100%)",
      }}
    >
      <div className="mx-auto max-w-[1280px]">
        {/* Desktop: Side by side - Decoupled columns */}
        <div
          className="hidden lg:grid items-center"
          style={{
            gridTemplateColumns: "minmax(560px, 1.15fr) minmax(520px, 640px)",
            gap: "48px",
          }}
        >
          {/* Left - Copy (independent sizing) */}
          <div className="text-left">
            <p
              className="font-bold uppercase"
              style={{
                fontSize: "12px",
                letterSpacing: "2px",
                color: "#2C6BED",
                marginBottom: "18px",
              }}
            >
              More than just content creation
            </p>
            <h1
              className="font-black"
              style={{
                fontSize: "72px",
                lineHeight: 1.02,
                letterSpacing: "-2.5px",
                color: "#0B1220",
                maxWidth: "560px",
              }}
            >
              Build your creator{" "}
              <span style={{ color: "#2C6BED" }}>workspace.</span>
            </h1>
            <p
              style={{
                fontSize: "20px",
                lineHeight: 1.55,
                color: "#667085",
                maxWidth: "540px",
                marginTop: "18px",
              }}
            >
              Turn tools on as you need them. Pay only for what you use with credits. No lockouts—your work stays yours.
            </p>

            {/* CTA Row */}
            <div className="flex flex-wrap items-center" style={{ gap: "16px", marginTop: "22px" }}>
              <Button
                size="lg"
                className="rounded-full font-semibold"
                style={{ background: "#2C6BED", height: "52px", paddingLeft: "28px", paddingRight: "28px", fontSize: "16px" }}
                onClick={() => navigate("/auth")}
              >
                Start Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full font-medium bg-transparent"
                style={{ border: "1px solid #E6EAF2", color: "#0B1220", height: "52px", paddingLeft: "24px", paddingRight: "24px", fontSize: "16px" }}
                onClick={() => navigate("/auth")}
              >
                <Play className="mr-2 h-4 w-4" />
                Schedule a Demo
              </Button>
            </div>

            <p className="text-xs" style={{ color: "#6B7280", marginTop: "12px" }}>
              Start free with 100 credits • No credit card required
            </p>

            {/* Persona Switcher Pills */}
            <div className="flex flex-wrap items-center" style={{ gap: "10px", marginTop: "28px" }}>
              {personas.map((persona) => {
                const isActive = persona.key === activePersona;
                return (
                  <button
                    key={persona.key}
                    onClick={() => setActivePersona(persona.key)}
                    className="rounded-full font-medium transition-all duration-200"
                    style={{
                      height: "40px",
                      paddingLeft: "16px",
                      paddingRight: "16px",
                      fontSize: "14px",
                      background: isActive ? "#0B0B0B" : "#FFFFFF",
                      color: isActive ? "#FFFFFF" : "#0B1220",
                      border: isActive ? "1px solid #0B0B0B" : "1px solid #E6EAF2",
                    }}
                  >
                    {persona.label}
                  </button>
                );
              })}
            </div>

            {/* Persona Bullets */}
            <AnimatePresence mode="wait">
              <motion.ul
                key={activePersona}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                style={{ marginTop: "18px" }}
                className="space-y-3"
              >
                {currentPersona.content.bullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: "#E8F0FF" }}
                    >
                      <Check className="w-3 h-3" style={{ color: "#2C6BED" }} />
                    </div>
                    <span style={{ fontSize: "16px", lineHeight: 1.5, color: "#4B5563" }}>
                      {bullet}
                    </span>
                  </li>
                ))}
              </motion.ul>
            </AnimatePresence>
          </div>

          {/* Right - Workspace Builder (wider) */}
          <div className="flex justify-end">
            <HeroWorkspaceBuilder />
          </div>
        </div>

        {/* Mobile: Stacked */}
        <div className="lg:hidden flex flex-col gap-8">
          {/* Left - Copy */}
          <div className="text-left">
            <p
              className="text-xs font-bold uppercase mb-4"
              style={{
                letterSpacing: "0.14em",
                color: "#2C6BED",
              }}
            >
              More than just content creation
            </p>
            <h1
              className="font-black tracking-[-1.5px] mb-5"
              style={{
                fontSize: "40px",
                lineHeight: 1.0,
                color: "#0B1220",
              }}
            >
              Build your creator{" "}
              <span style={{ color: "#2C6BED" }}>workspace.</span>
            </h1>
            <p
              className="text-base mb-5"
              style={{
                lineHeight: "26px",
                color: "#667085",
              }}
            >
              Turn tools on as you need them. Pay only for what you use with credits.
            </p>

            <div className="flex flex-wrap items-center gap-3 mb-3">
              <Button
                size="default"
                className="rounded-full px-5 h-10 text-sm font-semibold"
                style={{ background: "#2C6BED" }}
                onClick={() => navigate("/auth")}
              >
                Start Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="default"
                variant="outline"
                className="rounded-full px-4 h-10 text-sm font-medium bg-transparent"
                style={{ border: "1px solid #E6EAF2" }}
                onClick={() => navigate("/auth")}
              >
                <Play className="mr-2 h-3.5 w-3.5" />
                Demo
              </Button>
            </div>

            <p className="text-xs mb-5" style={{ color: "#6B7280" }}>
              Start free with 100 credits • No credit card
            </p>

            {/* Mobile Persona Pills */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {personas.map((persona) => {
                const isActive = persona.key === activePersona;
                return (
                  <button
                    key={persona.key}
                    onClick={() => setActivePersona(persona.key)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200"
                    style={{
                      background: isActive ? "#0B0B0B" : "#FFFFFF",
                      color: isActive ? "#FFFFFF" : "#0B1220",
                      border: isActive ? "1px solid #0B0B0B" : "1px solid #E6EAF2",
                    }}
                  >
                    {persona.label}
                  </button>
                );
              })}
            </div>

            {/* Mobile Persona Bullets */}
            <AnimatePresence mode="wait">
              <motion.ul
                key={activePersona + "-mobile"}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="space-y-2"
              >
                {currentPersona.content.bullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: "#E8F0FF" }}
                    >
                      <Check className="w-2.5 h-2.5" style={{ color: "#2C6BED" }} />
                    </div>
                    <span className="text-xs" style={{ color: "#4B5563" }}>
                      {bullet}
                    </span>
                  </li>
                ))}
              </motion.ul>
            </AnimatePresence>
          </div>

          {/* Right - Workspace Builder */}
          <div className="w-full">
            <HeroWorkspaceBuilder />
          </div>
        </div>
      </div>
    </section>
  );
}
