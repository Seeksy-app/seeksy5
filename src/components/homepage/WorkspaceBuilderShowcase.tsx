import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight, Podcast, Video, Calendar, Mail, Users, BarChart3, MessageSquare, FileText, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";

const modules = [
  { key: "podcast", label: "Podcast Studio", icon: Podcast, color: "bg-orange-600" },
  { key: "video", label: "Video Recording", icon: Video, color: "bg-rose-600" },
  { key: "meetings", label: "Meetings", icon: Calendar, color: "bg-blue-600" },
  { key: "email", label: "Email & Newsletter", icon: Mail, color: "bg-emerald-600" },
  { key: "crm", label: "CRM & Contacts", icon: Users, color: "bg-amber-600" },
  { key: "analytics", label: "Analytics", icon: BarChart3, color: "bg-cyan-600" },
  { key: "sms", label: "SMS Marketing", icon: MessageSquare, color: "bg-violet-600" },
  { key: "blog", label: "Blog", icon: FileText, color: "bg-teal-600" },
  { key: "monetization", label: "Monetization", icon: DollarSign, color: "bg-pink-600" },
];

const workspaceTemplates = [
  {
    name: "Podcaster",
    activeModules: ["podcast", "email", "crm", "analytics"],
    description: "Perfect for podcast creators"
  },
  {
    name: "Creator",
    activeModules: ["video", "blog", "monetization", "analytics"],
    description: "Built for content creators"
  },
  {
    name: "Agency",
    activeModules: ["crm", "email", "sms", "meetings", "analytics"],
    description: "Designed for agencies"
  },
  {
    name: "Solo Creator",
    activeModules: ["podcast", "video", "blog", "email"],
    description: "All-in-one for solo creators"
  },
];

const features = [
  { title: "Modular by Design", description: "Add or remove tools anytime as your needs evolve" },
  { title: "Pre-built Templates", description: "Start with Podcaster, Creator, or Agency templates" },
  { title: "Seamless Integration", description: "All modules work together, sharing data automatically" },
];

export default function WorkspaceBuilderShowcase() {
  const [currentTemplateIndex, setCurrentTemplateIndex] = useState(0);
  const currentTemplate = workspaceTemplates[currentTemplateIndex];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTemplateIndex((prev) => (prev + 1) % workspaceTemplates.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const activeModules = modules.filter((m) => currentTemplate.activeModules.includes(m.key));

  return (
    <section className="py-24 px-4 bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Text Block */}
          <div className="space-y-8">
            <div>
              <span className="text-sm font-semibold tracking-wider text-primary uppercase">
                Customizable Workspace
              </span>
              <h2 className="mt-4 text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.05] text-foreground">
                Build Your Own{" "}
                <span className="text-primary">Workspace</span>
              </h2>
            </div>

            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
              Choose only the tools you need. Start with a template or build from scratch. 
              Your workspace adapts to how you work, not the other way around.
            </p>

            <div className="space-y-5">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{feature.title}</p>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button size="lg" className="rounded-full px-6 gap-2 group">
              Start Building
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>

          {/* Right Interactive Panel */}
          <div className="relative">
            <div className="bg-card rounded-3xl shadow-2xl border border-border/50 p-6 md:p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentTemplate.name}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h3 className="text-xl font-bold text-foreground">
                        {currentTemplate.name} Workspace
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {activeModules.length} modules active
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>
                <button className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors">
                  <span className="text-lg">+</span> Add Module
                </button>
              </div>

              {/* Module Grid */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {modules.map((module) => {
                  const isActive = currentTemplate.activeModules.includes(module.key);
                  const Icon = module.icon;
                  
                  return (
                    <motion.div
                      key={module.key}
                      layout
                      className={`relative p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${
                        isActive 
                          ? "bg-card border-primary/30 shadow-md" 
                          : "bg-muted/30 border-border/50 opacity-60"
                      }`}
                    >
                      <AnimatePresence>
                        {isActive && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center"
                          >
                            <Check className="w-3 h-3 text-primary-foreground" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <div className={`w-12 h-12 rounded-xl ${module.color} flex items-center justify-center mb-2 shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                      </div>
                      <p className="text-xs font-medium text-foreground truncate">{module.label}</p>
                    </motion.div>
                  );
                })}
              </div>

              {/* Sidebar Preview */}
              <div className="bg-muted/50 rounded-2xl p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Your Sidebar Preview
                </p>
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {activeModules.map((module) => {
                      const Icon = module.icon;
                      return (
                        <motion.div
                          key={module.key}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.25 }}
                          className="flex items-center gap-3 p-2.5 bg-card rounded-xl"
                        >
                          <div className={`w-10 h-10 rounded-lg ${module.color} flex items-center justify-center shadow-md`}>
                            <Icon className="w-5 h-5 text-white" strokeWidth={2.5} />
                          </div>
                          <span className="text-sm font-medium text-foreground">{module.label}</span>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>

              {/* Template Indicator */}
              <div className="flex justify-center gap-2 mt-6">
                {workspaceTemplates.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentTemplateIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      idx === currentTemplateIndex 
                        ? "bg-primary w-6" 
                        : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
