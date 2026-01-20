import { useState, forwardRef, useImperativeHandle, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, Video, Scissors, Mic, Rss, Link2, 
  Mail, MessageSquare, Users, Ticket, DollarSign,
  ArrowRight, Sparkles, Smartphone
} from "lucide-react";

const availableModules = [
  { id: "meetings", label: "Meetings & Scheduling", icon: Calendar, category: "Core", description: "Host video calls & schedule bookings" },
  { id: "studio", label: "Media AI Studio", icon: Video, category: "Core", description: "Record and edit videos" },
  { id: "clips", label: "AI Clips Generator", icon: Scissors, category: "AI", badge: "AI", description: "Auto-generate viral clips" },
  { id: "podcast", label: "Podcast Hosting & RSS", icon: Mic, category: "Content", description: "Host your podcast" },
  { id: "rss", label: "RSS Distribution", icon: Rss, category: "Content", description: "Distribute to all platforms" },
  { id: "mypage", label: "My Page (Link-in-bio)", icon: Link2, category: "Social", description: "Your personal landing page" },
  { id: "email", label: "Email Client", icon: Mail, category: "Marketing", description: "Full inbox & email management" },
  { id: "sms", label: "SMS Messaging", icon: MessageSquare, category: "Marketing", description: "Text your audience" },
  { id: "crm", label: "CRM Lite", icon: Users, category: "Business", description: "Manage contacts & leads" },
  { id: "events", label: "Events & Ticketing", icon: Ticket, category: "Business", description: "Create & sell tickets" },
  { id: "monetize", label: "Monetization Tools", icon: DollarSign, category: "Revenue", description: "Earn from your content" },
];

export interface ModuleBuilderHandle {
  scrollIntoView: () => void;
  setModules: (modules: string[]) => void;
}

interface ModuleBuilderProps {
  defaultModules?: string[];
}

export const ModuleBuilder = forwardRef<ModuleBuilderHandle, ModuleBuilderProps>(
  ({ defaultModules = ["studio", "clips", "mypage"] }, ref) => {
    const navigate = useNavigate();
    const [selectedModules, setSelectedModules] = useState<string[]>(defaultModules);
    const containerRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      scrollIntoView: () => {
        containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      },
      setModules: (modules: string[]) => {
        setSelectedModules(modules);
      },
    }));

    const toggleModule = (moduleId: string) => {
      setSelectedModules(prev => 
        prev.includes(moduleId) 
          ? prev.filter(id => id !== moduleId)
          : [...prev, moduleId]
      );
    };

    const selectedModuleData = availableModules.filter(m => selectedModules.includes(m.id));

    return (
      <div ref={containerRef} className="py-20 md:py-24 px-4 scroll-mt-20" style={{ background: "hsl(var(--background))" }}>
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Build Your Own Platform
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the modules you need. Toggle them on or off to create your perfect workspace.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Module Selection */}
            <div className="lg:col-span-3">
              <div className="grid sm:grid-cols-2 gap-3">
                {availableModules.map((module, index) => (
                  <motion.div
                    key={module.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card 
                      className={`cursor-pointer transition-all ${
                        selectedModules.includes(module.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-border/50 hover:border-border'
                      }`}
                      onClick={() => toggleModule(module.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              selectedModules.includes(module.id)
                                ? 'bg-primary/10'
                                : 'bg-muted'
                            }`}>
                              <module.icon className={`h-4 w-4 ${
                                selectedModules.includes(module.id)
                                  ? 'text-primary'
                                  : 'text-muted-foreground'
                              }`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{module.label}</span>
                                {module.badge && (
                                  <Badge variant="secondary" className="text-[9px] px-1.5">
                                    {module.badge}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">{module.description}</p>
                            </div>
                          </div>
                          <Switch 
                            checked={selectedModules.includes(module.id)}
                            onCheckedChange={() => toggleModule(module.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Live Preview */}
            <div className="lg:col-span-2">
              <div className="sticky top-24">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl"
                >
                  {/* Phone Frame Header */}
                  <div className="bg-muted/50 px-4 py-2 flex items-center justify-between border-b border-border">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">Preview</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {selectedModules.length} modules
                    </Badge>
                  </div>

                  {/* Preview Content */}
                  <div className="p-4 min-h-[400px]">
                    <div className="text-center mb-4">
                      <h4 className="font-semibold text-sm">My Custom Workspace</h4>
                      <p className="text-xs text-muted-foreground">Your personalized Seeksy</p>
                    </div>

                    <AnimatePresence mode="popLayout">
                      <div className="grid grid-cols-2 gap-2">
                        {selectedModuleData.map((module) => (
                          <motion.div
                            key={module.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            layout
                            className="p-3 rounded-lg bg-muted/50 text-center"
                          >
                            <module.icon className="h-5 w-5 mx-auto mb-1.5 text-primary" />
                            <p className="text-[10px] font-medium truncate">{module.label}</p>
                          </motion.div>
                        ))}
                      </div>
                    </AnimatePresence>

                    {selectedModules.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <p className="text-sm">Select modules to preview</p>
                      </div>
                    )}
                  </div>

                  {/* CTA */}
                  <div className="p-4 border-t border-border">
                    <Button 
                      className="w-full"
                      onClick={() => navigate("/auth?mode=signup")}
                      disabled={selectedModules.length === 0}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Create My Workspace
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ModuleBuilder.displayName = "ModuleBuilder";
