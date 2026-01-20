import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Podcast, Video, Calendar, Mail, Users, 
  BarChart3, MessageSquare, Newspaper, ShoppingBag,
  Plus, Check, ArrowRight
} from "lucide-react";

const availableModules = [
  { icon: Podcast, name: "Podcast Studio", color: "bg-orange-500" },
  { icon: Video, name: "Video Recording", color: "bg-red-500" },
  { icon: Calendar, name: "Meetings", color: "bg-blue-500" },
  { icon: Mail, name: "Email & Newsletter", color: "bg-green-500" },
  { icon: Users, name: "CRM & Contacts", color: "bg-purple-500" },
  { icon: BarChart3, name: "Analytics", color: "bg-cyan-500" },
  { icon: MessageSquare, name: "SMS Marketing", color: "bg-pink-500" },
  { icon: Newspaper, name: "Blog", color: "bg-amber-500" },
  { icon: ShoppingBag, name: "Monetization", color: "bg-emerald-500" },
];

const selectedModules = [0, 2, 3, 4]; // Pre-selected for demo

export function BuildWorkspaceSection() {
  return (
    <section className="py-20 lg:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left side - Text content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-primary font-semibold text-sm uppercase tracking-wider mb-4 block">
              Customizable Workspace
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              Build Your Own{" "}
              <span className="text-primary">Workspace</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-lg">
              Choose only the tools you need. Start with a template or build from scratch. 
              Your workspace adapts to how you work, not the other way around.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">Modular by Design</h4>
                  <p className="text-muted-foreground text-sm">Add or remove tools anytime as your needs evolve</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">Pre-built Templates</h4>
                  <p className="text-muted-foreground text-sm">Start with Podcaster, Creator, or Agency templates</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">Seamless Integration</h4>
                  <p className="text-muted-foreground text-sm">All modules work together, sharing data automatically</p>
                </div>
              </div>
            </div>

            <Button size="lg" className="rounded-full px-8">
              Start Building
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>

          {/* Right side - Visual workspace builder */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative"
          >
            {/* Workspace container */}
            <div className="bg-background rounded-3xl shadow-2xl border border-border/50 p-6 md:p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-semibold text-lg">My Workspace</h3>
                  <p className="text-muted-foreground text-sm">4 modules active</p>
                </div>
                <Button variant="outline" size="sm" className="rounded-full">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Module
                </Button>
              </div>

              {/* Module grid */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {availableModules.map((module, index) => {
                  const isSelected = selectedModules.includes(index);
                  const Icon = module.icon;
                  
                  return (
                    <motion.div
                      key={module.name}
                      initial={{ scale: 0.8, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 * index, duration: 0.3 }}
                      className={`
                        relative p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer
                        ${isSelected 
                          ? "border-primary bg-primary/5 shadow-md" 
                          : "border-border/50 bg-muted/30 hover:border-border"
                        }
                      `}
                    >
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </div>
                      )}
                      <div className={`w-10 h-10 ${module.color} rounded-lg flex items-center justify-center mb-2`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <p className={`text-xs font-medium ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
                        {module.name}
                      </p>
                    </motion.div>
                  );
                })}
              </div>

              {/* Active workspace preview */}
              <div className="bg-muted/50 rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider font-medium">
                  Your Sidebar Preview
                </p>
                <div className="space-y-2">
                  {selectedModules.map((moduleIndex) => {
                    const module = availableModules[moduleIndex];
                    const Icon = module.icon;
                    return (
                      <motion.div
                        key={module.name}
                        initial={{ x: -10, opacity: 0 }}
                        whileInView={{ x: 0, opacity: 1 }}
                        viewport={{ once: true }}
                        className="flex items-center gap-3 p-2 rounded-lg bg-background/50"
                      >
                        <div className={`w-8 h-8 ${module.color} rounded-lg flex items-center justify-center`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-medium">{module.name}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -z-10 -top-4 -right-4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute -z-10 -bottom-4 -left-4 w-48 h-48 bg-secondary/20 rounded-full blur-2xl" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
