import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Calendar, Link2, Mic, Video } from "lucide-react";
import { motion } from "framer-motion";
import { ScheduleDemoDialog } from "./ScheduleDemoDialog";

// Feature pills
const featurePills = [
  { icon: Link2, label: "Social" },
  { icon: Calendar, label: "Meetings" },
  { icon: Mic, label: "Podcasts" },
  { icon: Video, label: "Content" },
];

// Video thumbnails for bottom section - group/meeting images
import heroConversations from "@/assets/homepage/hero-conversations.jpg";
import heroCommunity from "@/assets/homepage/hero-community.jpg";
import heroContent from "@/assets/homepage/hero-content.jpg";
import heroPeople from "@/assets/homepage/hero-people.jpg";

const videoThumbnails = [heroConversations, heroCommunity, heroContent, heroPeople];

export function HeroSectionNew() {
  const navigate = useNavigate();
  const [showDemoDialog, setShowDemoDialog] = useState(false);

  return (
    <section className="relative min-h-screen flex flex-col items-center overflow-hidden bg-background pt-32 pb-16">
      {/* Content */}
      <div className="container relative z-10 mx-auto px-4 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8"
        >
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm text-primary font-medium">More than just content creation</span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-[1.1] tracking-tight text-foreground"
        >
          Build Meaningful
          <br />
          <span className="bg-gradient-to-r from-primary via-amber-500 to-primary bg-clip-text text-transparent">
            Connections
          </span>{" "}
          With Seeksy
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
        >
          Your workspace for meetings, media creation, social influence, and
          community-driven growth. All in one unified platform.
        </motion.p>

        {/* Feature Pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap justify-center gap-3 mb-10"
        >
          {featurePills.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.label}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border text-foreground text-sm font-medium"
              >
                <Icon className="w-4 h-4 text-muted-foreground" />
                {feature.label}
              </div>
            );
          })}
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6"
        >
          <Button
            size="lg"
            onClick={() => navigate("/auth?mode=signup")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-7 h-auto font-bold shadow-lg transition-all duration-300 hover:scale-105 group min-w-[200px]"
          >
            <Sparkles className="mr-2 h-5 w-5" />
            Get Started Free
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => setShowDemoDialog(true)}
            className="bg-card hover:bg-accent border-2 border-border text-foreground text-lg px-8 py-7 h-auto font-semibold transition-all duration-300 hover:scale-105 group min-w-[200px]"
          >
            <Calendar className="mr-2 h-5 w-5" />
            Schedule a Demo
          </Button>
        </motion.div>

        {/* Footer text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-muted-foreground text-sm mb-16"
        >
          No credit card required • Free plan available • Cancel anytime
        </motion.p>

        {/* Image Grid Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="max-w-5xl mx-auto"
        >
          {/* Image Thumbnails Grid */}
          <div className="grid grid-cols-4 gap-6 mb-12">
            {videoThumbnails.map((thumb, index) => (
              <div
                key={index}
                className="relative aspect-square rounded-2xl overflow-hidden shadow-xl"
              >
                <img
                  src={thumb}
                  alt=""
                  className="w-full h-full object-cover object-center"
                  loading={index < 2 ? "eager" : "lazy"}
                />
              </div>
            ))}
          </div>

          {/* Caption Below Images */}
          <p className="text-2xl md:text-3xl font-bold text-foreground text-center">
            The creator economy is changing quickly.
          </p>
        </motion.div>
      </div>

      <ScheduleDemoDialog open={showDemoDialog} onOpenChange={setShowDemoDialog} />
    </section>
  );
}
