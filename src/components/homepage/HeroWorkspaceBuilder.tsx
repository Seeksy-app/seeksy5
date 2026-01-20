import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Podcast,
  Video,
  Calendar,
  Mail,
  Users,
  BarChart3,
  MessageSquare,
  FileText,
  DollarSign,
  GripVertical,
  ChevronRight,
} from "lucide-react";
import { LucideIcon } from "lucide-react";

interface SeekieModule {
  key: string;
  label: string;
  icon: LucideIcon;
  tint: string;
  iconColor: string;
}

const modules: SeekieModule[] = [
  { key: "podcast", label: "Podcast", icon: Podcast, tint: "#FCE7DF", iconColor: "#E06B2D" },
  { key: "video", label: "Video", icon: Video, tint: "#FDE2E7", iconColor: "#D6456A" },
  { key: "meetings", label: "Meetings", icon: Calendar, tint: "#E0E7FF", iconColor: "#3B82F6" },
  { key: "email", label: "Email", icon: Mail, tint: "#E6F7EF", iconColor: "#1F9D67" },
  { key: "crm", label: "CRM", icon: Users, tint: "#FCEBD6", iconColor: "#D97706" },
  { key: "analytics", label: "Analytics", icon: BarChart3, tint: "#E6F1FA", iconColor: "#0EA5E9" },
  { key: "sms", label: "SMS", icon: MessageSquare, tint: "#EEE7FF", iconColor: "#7C3AED" },
  { key: "blog", label: "Blog", icon: FileText, tint: "#E6F7F5", iconColor: "#0F766E" },
  { key: "monetize", label: "Monetize", icon: DollarSign, tint: "#FDE2F2", iconColor: "#DB2777" },
];

const workspaceTemplates = [
  { name: "Podcaster", activeModules: ["podcast", "email", "crm", "analytics"] },
  { name: "Creator", activeModules: ["video", "blog", "monetize", "analytics"] },
  { name: "Agency", activeModules: ["crm", "email", "sms", "meetings"] },
  { name: "Solo", activeModules: ["podcast", "video", "blog", "email"] },
];

export function HeroWorkspaceBuilder() {
  const [currentTemplateIndex, setCurrentTemplateIndex] = useState(0);
  const [workspaceModules, setWorkspaceModules] = useState<string[]>([]);
  const [animatingModule, setAnimatingModule] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const currentTemplate = workspaceTemplates[currentTemplateIndex];

  // Auto-cycle templates
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isAnimating) {
        setCurrentTemplateIndex((prev) => (prev + 1) % workspaceTemplates.length);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [isAnimating]);

  // Animate modules being added when template changes
  useEffect(() => {
    const newActiveModules = currentTemplate.activeModules;

    // Clear workspace first
    setWorkspaceModules([]);
    setIsAnimating(true);

    // Animate each module one by one
    const animateModules = async () => {
      for (let i = 0; i < newActiveModules.length; i++) {
        const moduleKey = newActiveModules[i];

        // Start flying animation
        setAnimatingModule(moduleKey);

        // Wait for fly animation
        await new Promise((resolve) => setTimeout(resolve, 350));

        // Add to workspace
        setWorkspaceModules((prev) => [...prev, moduleKey]);

        // Small delay before next module
        await new Promise((resolve) => setTimeout(resolve, 100));

        setAnimatingModule(null);
      }
      setIsAnimating(false);
    };

    animateModules();
  }, [currentTemplate]);

  const workspaceItems = workspaceModules
    .map((key) => modules.find((m) => m.key === key))
    .filter((m): m is SeekieModule => Boolean(m));

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #EEF2F7",
        boxShadow: "0 20px 60px rgba(15,23,42,0.12)",
        borderRadius: "24px",
        padding: "18px",
        width: "660px",
        minHeight: "520px",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTemplate.name}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="text-lg font-bold" style={{ color: "#0B1220" }}>
              {currentTemplate.name} Workspace
            </h3>
            <p className="text-xs" style={{ color: "#6B7280" }}>
              {workspaceModules.length} modules active
            </p>
          </motion.div>
        </AnimatePresence>
        <button
          className="text-sm font-bold flex items-center gap-1"
          style={{ color: "#2C6BED" }}
        >
          + Add
        </button>
      </div>

      {/* Two-column layout: Seekies Store | My Workplace */}
      <div style={{ display: "grid", gridTemplateColumns: "52% 48%", gap: "14px" }}>
        {/* LEFT: Seekies Store */}
        <div
          className="rounded-2xl"
          style={{ background: "#F8FAFC", border: "1px solid #EEF2F7", padding: "16px" }}
        >
          <div className="flex items-center justify-between mb-3">
            <p
              className="font-bold uppercase"
              style={{ fontSize: "11px", letterSpacing: "0.08em", color: "#9CA3AF" }}
            >
              Seekies Store
            </p>
          </div>
          <p style={{ fontSize: "10px", color: "#9CA3AF", marginBottom: "12px" }}>
            Pick what you need
          </p>

          <div className="grid grid-cols-3 gap-2 relative">
            {modules.map((module) => {
              const isAdded = workspaceModules.includes(module.key);
              const isFlying = animatingModule === module.key;
              const Icon = module.icon;

              return (
                <motion.div
                  key={module.key}
                  className="relative cursor-pointer flex flex-col items-center"
                  style={{
                    background: isAdded ? "rgba(44,107,237,0.04)" : "#FFFFFF",
                    border: isAdded ? "2px solid rgba(44,107,237,0.60)" : "1px solid rgba(15,23,42,0.10)",
                    borderRadius: "14px",
                    padding: "10px",
                    width: "106px",
                    opacity: isFlying ? 0.5 : 1,
                    transform: isFlying ? "scale(0.95)" : "scale(1)",
                    transition: "all 0.2s ease",
                  }}
                  whileHover={
                    !isAdded
                      ? {
                          borderColor: "rgba(44,107,237,0.35)",
                          boxShadow: "0 10px 24px rgba(15,23,42,0.10)",
                        }
                      : {}
                  }
                >
                  {/* Added badge */}
                  {isAdded && (
                    <div
                      className="absolute flex items-center justify-center"
                      style={{
                        top: "-6px",
                        right: "-6px",
                        width: "18px",
                        height: "18px",
                        borderRadius: "999px",
                        background: "#2C6BED",
                      }}
                    >
                      <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                    </div>
                  )}

                  {/* Icon bubble */}
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      background: module.tint,
                      marginBottom: "6px",
                    }}
                  >
                    <Icon className="w-5 h-5" color={module.iconColor} strokeWidth={2} />
                  </div>
                  <p
                    className="font-medium text-center"
                    style={{ fontSize: "13px", color: "#374151" }}
                  >
                    {module.label}
                  </p>
                </motion.div>
              );
            })}

            {/* Flying module animation */}
            <AnimatePresence>
              {animatingModule &&
                (() => {
                  const module = modules.find((m) => m.key === animatingModule);
                  if (!module) return null;
                  const Icon = module.icon;
                  const moduleIndex = modules.findIndex((m) => m.key === animatingModule);
                  const col = moduleIndex % 3;
                  const row = Math.floor(moduleIndex / 3);

                  return (
                    <motion.div
                      key={`flying-${animatingModule}`}
                      initial={{
                        opacity: 1,
                        scale: 1,
                        x: 0,
                        y: 0,
                      }}
                      animate={{
                        opacity: 0.9,
                        scale: 0.6,
                        x: 200,
                        y: row * 10 + 60,
                      }}
                      exit={{ opacity: 0 }}
                      transition={{
                        duration: 0.35,
                        ease: [0.25, 0.46, 0.45, 0.94],
                      }}
                      className="absolute z-50 pointer-events-none"
                      style={{
                        left: `${col * 33.33 + 5}%`,
                        top: `${row * 80 + 8}px`,
                      }}
                    >
                      <div
                        className="rounded-xl shadow-xl"
                        style={{
                          background: "#FFFFFF",
                          border: "2px solid #2C6BED",
                          padding: "8px",
                        }}
                      >
                        <div
                          className="flex items-center justify-center"
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "10px",
                            background: module.tint,
                          }}
                        >
                          <Icon className="w-4 h-4" color={module.iconColor} strokeWidth={2} />
                        </div>
                      </div>
                    </motion.div>
                  );
                })()}
            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT: My Workplace */}
        <div
          className="rounded-2xl"
          style={{ background: "#F0F4F8", border: "1px solid #E2E8F0", padding: "16px" }}
        >
          <div className="flex items-center justify-between mb-3">
            <p
              className="font-bold uppercase"
              style={{ fontSize: "11px", letterSpacing: "0.08em", color: "#9CA3AF" }}
            >
              My Workplace
            </p>
            <div className="flex items-center gap-1">
              <ChevronRight className="w-3 h-3" style={{ color: "#2C6BED" }} />
            </div>
          </div>
          <p style={{ fontSize: "10px", color: "#9CA3AF", marginBottom: "12px" }}>
            ↕ Drag to reorder
          </p>

          <div className="space-y-3" style={{ minHeight: "220px" }}>
            <AnimatePresence mode="popLayout">
              {workspaceItems.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>
                    Your workspace is empty
                  </p>
                  <p style={{ fontSize: "10px", color: "#D1D5DB" }}>
                    Add Seekies from the store
                  </p>
                </motion.div>
              ) : (
                workspaceItems.map((module) => {
                  const Icon = module.icon;
                  return (
                    <motion.div
                      key={module.key}
                      initial={{ opacity: 0, x: 20, scale: 0.9 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -20, scale: 0.9 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 25,
                      }}
                      className="flex items-center gap-3"
                      style={{
                        background: "#FFFFFF",
                        border: "1px solid #EEF2F7",
                        boxShadow: "0 4px 12px rgba(15,23,42,0.05)",
                        borderRadius: "14px",
                        height: "54px",
                        padding: "0 12px",
                      }}
                    >
                      <GripVertical
                        className="w-3.5 h-3.5 cursor-grab"
                        style={{ color: "#D1D5DB" }}
                      />
                      <div
                        className="flex items-center justify-center rounded-full"
                        style={{ width: "32px", height: "32px", background: module.tint }}
                      >
                        <Icon className="w-4 h-4" color={module.iconColor} strokeWidth={2.5} />
                      </div>
                      <span
                        className="font-bold flex-1"
                        style={{ fontSize: "13px", color: "#0B1220" }}
                      >
                        {module.label}
                      </span>
                      <div
                        style={{ width: "8px", height: "8px", borderRadius: "999px", background: "#2C6BED" }}
                        title="Active"
                      />
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>

          {/* Capacity bar */}
          {workspaceItems.length > 0 && (
            <div className="mt-3 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between" style={{ fontSize: "10px" }}>
                <span style={{ color: "#6B7280" }}>
                  {workspaceItems.length} active • {modules.length - workspaceItems.length}{" "}
                  available
                </span>
                <span className="font-medium" style={{ color: "#2C6BED" }}>
                  Start with 3 free
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Template Indicator */}
      <div className="flex justify-center gap-1.5 mt-4">
        {workspaceTemplates.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentTemplateIndex(idx)}
            className="transition-all duration-300"
            style={{
              height: "6px",
              borderRadius: "999px",
              width: idx === currentTemplateIndex ? "20px" : "6px",
              background: idx === currentTemplateIndex ? "#2C6BED" : "#E5E7EB",
            }}
          />
        ))}
      </div>
    </div>
  );
}
