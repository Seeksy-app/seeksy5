import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";

// Import hero images
import heroConversations from "@/assets/homepage/hero-conversations.jpg";
import heroCommunity from "@/assets/homepage/hero-community.jpg";
import heroContent from "@/assets/homepage/hero-content.jpg";
import heroPeople from "@/assets/homepage/hero-people.jpg";

interface FeatureData {
  id: string;
  label: string;
  headline: string;
  body: string;
  imageUrl: string;
  ctaLink: string;
}

const features: FeatureData[] = [
  {
    id: "podcast",
    label: "Podcast Studio",
    headline: "Podcast Studio",
    body: "Record, edit, and publish professional podcasts. Invite remote guests, auto-generate transcripts, and distribute to major platforms.",
    imageUrl: heroConversations,
    ctaLink: "/features/podcast-studio",
  },
  {
    id: "meetings",
    label: "Virtual Meetings",
    headline: "Virtual Meetings",
    body: "Create meeting types, share booking links, and automate confirmations and reminders across your calendar.",
    imageUrl: heroCommunity,
    ctaLink: "/features/meetings",
  },
  {
    id: "ai_post",
    label: "AI Post Production",
    headline: "AI Post Production",
    body: "Turn raw recordings into polished content with transcripts, captions, highlights, and fast edits—without the complexity.",
    imageUrl: heroContent,
    ctaLink: "/features/ai-post-production",
  },
  {
    id: "live",
    label: "Live Streaming",
    headline: "Live Streaming",
    body: "Go live, record sessions, and repurpose content for clips and distribution with a streamlined creator workflow.",
    imageUrl: heroPeople,
    ctaLink: "/features/live-streaming",
  },
  {
    id: "audience",
    label: "Audience & CRM",
    headline: "Audience & CRM",
    body: "Manage contacts, send email + SMS, and track engagement—everything you need to grow and connect.",
    imageUrl: heroConversations,
    ctaLink: "/features/audience-crm",
  },
];

export function ModuleHeroShowcase() {
  const [activeId, setActiveId] = useState<string>("podcast");

  const activeFeature = features.find((f) => f.id === activeId) || features[0];

  return (
    <section
      className="w-full px-4"
      style={{ paddingTop: "72px", paddingBottom: "72px" }}
    >
      <div className="mx-auto max-w-[1200px]">
        {/* Main Card */}
        <div
          className="rounded-[28px]"
          style={{
            background: "#E7DAD1",
            padding: "48px",
          }}
        >
          {/* Desktop: Two columns */}
          <div
            className="hidden md:grid"
            style={{
              gridTemplateColumns: "5fr 7fr",
              gap: "40px",
              alignItems: "center",
            }}
          >
            {/* LEFT: Copy */}
            <div className="flex flex-col">
              <p
                className="font-bold uppercase"
                style={{
                  fontSize: "12px",
                  letterSpacing: "0.18em",
                  color: "#5570F6",
                  marginBottom: "16px",
                }}
              >
                Explore Features
              </p>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                >
                  <h2
                    className="font-extrabold"
                    style={{
                      fontSize: "56px",
                      lineHeight: 1.05,
                      color: "#0B1220",
                      marginBottom: "16px",
                    }}
                  >
                    {activeFeature.headline}
                  </h2>
                  <p
                    style={{
                      fontSize: "16px",
                      lineHeight: 1.6,
                      color: "#3E4A5E",
                      maxWidth: "420px",
                      marginBottom: "28px",
                    }}
                  >
                    {activeFeature.body}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* CTA Row */}
              <div className="flex items-center gap-3.5">
                <button
                  className="group flex items-center gap-2 rounded-full font-bold transition-all duration-200"
                  style={{
                    height: "44px",
                    paddingLeft: "18px",
                    paddingRight: "18px",
                    background: "#0B1220",
                    color: "#FFFFFF",
                    fontSize: "14px",
                  }}
                >
                  Learn more
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </button>
                <span style={{ fontSize: "13px", color: "#6B7280" }}>
                  Click a feature below to preview.
                </span>
              </div>
            </div>

            {/* RIGHT: Preview Card */}
            <div
              className="rounded-[24px] p-3"
              style={{
                background: "rgba(0,0,0,0.06)",
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeId + "-image"}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                  className="relative rounded-[18px] overflow-hidden"
                  style={{ aspectRatio: "4/3" }}
                >
                  <img
                    src={activeFeature.imageUrl}
                    alt={activeFeature.headline}
                    className="w-full h-full object-cover"
                  />
                  <div
                    className="absolute bottom-4 left-4 px-3 py-1.5 rounded-full font-bold"
                    style={{
                      background: "rgba(255,255,255,0.85)",
                      color: "#0B1220",
                      fontSize: "13px",
                    }}
                  >
                    @seeksy
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Mobile: Stacked */}
          <div className="md:hidden flex flex-col">
            <p
              className="font-bold uppercase"
              style={{
                fontSize: "11px",
                letterSpacing: "0.15em",
                color: "#5570F6",
                marginBottom: "12px",
              }}
            >
              Explore Features
            </p>

            {/* Preview Image */}
            <div
              className="rounded-[16px] p-2 mb-5"
              style={{ background: "rgba(0,0,0,0.06)" }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeId + "-mobile-image"}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="relative rounded-[12px] overflow-hidden"
                  style={{ aspectRatio: "4/3" }}
                >
                  <img
                    src={activeFeature.imageUrl}
                    alt={activeFeature.headline}
                    className="w-full h-full object-cover"
                  />
                  <div
                    className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full font-bold text-xs"
                    style={{
                      background: "rgba(255,255,255,0.9)",
                      color: "#0B1220",
                    }}
                  >
                    @seeksy
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Copy */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeId + "-mobile-copy"}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <h2
                  className="font-extrabold"
                  style={{
                    fontSize: "32px",
                    lineHeight: 1.1,
                    color: "#0B1220",
                    marginBottom: "10px",
                  }}
                >
                  {activeFeature.headline}
                </h2>
                <p
                  style={{
                    fontSize: "15px",
                    lineHeight: 1.6,
                    color: "#3E4A5E",
                    marginBottom: "20px",
                  }}
                >
                  {activeFeature.body}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* CTA */}
            <button
              className="w-full flex items-center justify-center gap-2 rounded-full font-bold mb-5"
              style={{
                height: "44px",
                background: "#0B1220",
                color: "#FFFFFF",
                fontSize: "14px",
              }}
            >
              Learn more
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Feature Rail - Horizontal Tabs */}
          <div
            className="flex flex-wrap items-center"
            style={{ marginTop: "28px", gap: "10px" }}
          >
            {features.map((feature) => {
              const isActive = feature.id === activeId;
              return (
                <button
                  key={feature.id}
                  onClick={() => setActiveId(feature.id)}
                  className="font-bold transition-all duration-200"
                  style={{
                    height: "42px",
                    paddingLeft: "14px",
                    paddingRight: "14px",
                    borderRadius: "999px",
                    fontSize: "14px",
                    background: isActive ? "#0B1220" : "rgba(255,255,255,0.55)",
                    color: isActive ? "#FFFFFF" : "#0B1220",
                    border: isActive ? "none" : "1px solid rgba(0,0,0,0.08)",
                  }}
                >
                  {feature.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
