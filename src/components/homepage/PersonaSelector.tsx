import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Mic, Video, Calendar, Users, Megaphone, Building2,
  ArrowRight, Sparkles, Check
} from "lucide-react";

const personas = [
  { 
    id: "creator", 
    label: "Creator / Influencer", 
    icon: Video, 
    color: "from-pink-500 to-rose-500",
    description: "Content creators, YouTubers, social media influencers",
    modules: ["Media Hub", "AI Clips", "Social Analytics", "My Page", "Monetization"]
  },
  { 
    id: "podcaster", 
    label: "Podcaster", 
    icon: Mic, 
    color: "from-amber-500 to-orange-500",
    description: "Podcast hosts, audio creators, interview shows",
    modules: ["Podcast Studio", "RSS Hosting", "AI Clips", "Distribution", "Analytics"]
  },
  { 
    id: "speaker", 
    label: "Event Host / Speaker", 
    icon: Calendar, 
    color: "from-blue-500 to-cyan-500",
    description: "Conference speakers, workshop hosts, educators",
    modules: ["Meetings", "Events", "Recording Studio", "My Page", "Bookings"]
  },
  { 
    id: "business", 
    label: "Business Professional", 
    icon: Building2, 
    color: "from-emerald-500 to-teal-500",
    description: "Entrepreneurs, consultants, coaches",
    modules: ["CRM Lite", "Meetings", "Email & SMS", "Automations", "Events"]
  },
  { 
    id: "community", 
    label: "Community Leader", 
    icon: Users, 
    color: "from-purple-500 to-violet-500",
    description: "Community managers, group organizers, club leaders",
    modules: ["Contacts", "Communications", "Events", "Polls", "My Page"]
  },
  { 
    id: "agency", 
    label: "Agency / Consultant", 
    icon: Megaphone, 
    color: "from-indigo-500 to-blue-500",
    description: "Marketing agencies, talent managers, consultants",
    modules: ["Team Management", "Client Portal", "Analytics", "Proposals", "Automations"]
  },
];

interface PersonaSelectorProps {
  onSelect?: (personaId: string) => void;
  compact?: boolean;
}

export function PersonaSelector({ onSelect, compact = false }: PersonaSelectorProps) {
  const navigate = useNavigate();
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const [hoveredPersona, setHoveredPersona] = useState<string | null>(null);

  const activePersona = personas.find(p => p.id === (hoveredPersona || selectedPersona));

  const handleSelect = (personaId: string) => {
    setSelectedPersona(personaId);
    if (onSelect) {
      onSelect(personaId);
    }
  };

  const handleGetStarted = () => {
    navigate(`/auth?mode=signup&persona=${selectedPersona}`);
  };

  if (compact) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {personas.map((persona) => (
          <motion.button
            key={persona.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelect(persona.id)}
            className={`relative p-4 rounded-xl border transition-all text-left
              ${selectedPersona === persona.id 
                ? 'border-primary bg-primary/5' 
                : 'border-border/50 hover:border-border bg-card/50 hover:bg-card'
              }`}
          >
            <div className={`p-2 rounded-lg bg-gradient-to-br ${persona.color} bg-opacity-10 w-fit mb-2`}>
              <persona.icon className="h-5 w-5 text-foreground" />
            </div>
            <p className="font-medium text-sm">{persona.label}</p>
            {selectedPersona === persona.id && (
              <motion.div 
                layoutId="checkmark"
                className="absolute top-2 right-2"
              >
                <Check className="h-4 w-4 text-primary" />
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
    );
  }

  return (
    <div className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Personalized for you</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Who are you?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose your role and we'll customize your workspace with the perfect tools
          </p>
        </motion.div>

        {/* Persona Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {personas.map((persona, index) => (
            <motion.button
              key={persona.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelect(persona.id)}
              onMouseEnter={() => setHoveredPersona(persona.id)}
              onMouseLeave={() => setHoveredPersona(null)}
              className={`relative p-6 rounded-2xl border text-left transition-all group
                ${selectedPersona === persona.id 
                  ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10' 
                  : 'border-border/50 hover:border-border bg-card/50 hover:bg-card'
                }`}
            >
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${persona.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
              
              <div className="relative">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${persona.color} bg-opacity-10`}>
                    <persona.icon className="h-6 w-6 text-foreground" />
                  </div>
                  {selectedPersona === persona.id && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="p-1 rounded-full bg-primary"
                    >
                      <Check className="h-4 w-4 text-primary-foreground" />
                    </motion.div>
                  )}
                </div>
                <h3 className="font-semibold text-lg mb-1">{persona.label}</h3>
                <p className="text-sm text-muted-foreground mb-4">{persona.description}</p>
                
                <div className="flex flex-wrap gap-1.5">
                  {persona.modules.slice(0, 3).map((module) => (
                    <span 
                      key={module}
                      className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-muted text-muted-foreground"
                    >
                      {module}
                    </span>
                  ))}
                  {persona.modules.length > 3 && (
                    <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-muted text-muted-foreground">
                      +{persona.modules.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Selected Persona Preview */}
        <AnimatePresence mode="wait">
          {activePersona && (
            <motion.div
              key={activePersona.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center"
            >
              <p className="text-sm text-muted-foreground mb-4">
                <span className="font-medium text-foreground">{activePersona.label}</span> workspace includes:
                {' '}
                {activePersona.modules.join(' • ')}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA */}
        {selectedPersona && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mt-8"
          >
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Start Your Workspace
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
