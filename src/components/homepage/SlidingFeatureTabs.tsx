import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

// Import feature images
import podcastingImg from "@/assets/features/podcasting.jpg";
import meetingsImg from "@/assets/features/meetings.jpg";
import postProductionImg from "@/assets/features/post-production.jpg";
import liveStreamingImg from "@/assets/features/live-streaming.jpg";
import audienceCrmImg from "@/assets/features/audience-crm.jpg";

interface FeatureTab {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  bgColor: string;
  textColor: string;
}

const featureTabs: FeatureTab[] = [
  {
    id: "podcasting",
    title: "Podcast",
    subtitle: "Studio",
    description: "Record, edit, and publish professional podcasts with our browser-based studio. Invite guests remotely, auto-generate transcripts, and distribute to all major platforms with one click.",
    image: podcastingImg,
    bgColor: "bg-[#f5d5c8]", // Peach/salmon
    textColor: "text-[#1a1a1a]",
  },
  {
    id: "meetings",
    title: "Virtual",
    subtitle: "Meetings",
    description: "Schedule and host video meetings with your team, guests, or clients. Integrated calendar, automatic recordings, and AI-powered meeting summaries to keep everyone on the same page.",
    image: meetingsImg,
    bgColor: "bg-[#c8d9c5]", // Sage green
    textColor: "text-[#1a1a1a]",
  },
  {
    id: "post-production",
    title: "AI Post",
    subtitle: "Production",
    description: "Transform raw recordings into polished content with AI-powered editing. Auto-remove filler words, enhance audio quality, add captions, and create clips optimized for every platform.",
    image: postProductionImg,
    bgColor: "bg-[#bdd4e7]", // Light blue
    textColor: "text-[#1a1a1a]",
  },
  {
    id: "live-streaming",
    title: "Live",
    subtitle: "Streaming",
    description: "Go live to multiple platforms simultaneously. Professional overlays, guest management, and real-time engagement tools to build your audience and monetize your content.",
    image: liveStreamingImg,
    bgColor: "bg-[#e8dcc8]", // Cream/beige
    textColor: "text-[#1a1a1a]",
  },
  {
    id: "audience-crm",
    title: "Audience",
    subtitle: "& CRM",
    description: "Grow and understand your audience with powerful analytics and CRM tools. Track subscribers, segment your community, and send targeted newsletters to drive engagement.",
    image: audienceCrmImg,
    bgColor: "bg-[#1a1a1a]", // Black
    textColor: "text-white",
  },
];

export function SlidingFeatureTabs() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section className="py-16 lg:py-24 overflow-hidden">
      <div className="container mx-auto px-4 mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          Everything You Need to <span className="text-primary">Create</span>
        </h2>
        <p className="text-muted-foreground text-center max-w-2xl mx-auto">
          A complete suite of tools designed for modern creators, podcasters, and content professionals.
        </p>
      </div>

      <div className="relative h-[600px] md:h-[700px] lg:h-[750px] flex mx-4 lg:mx-8">
        {featureTabs.map((tab, index) => {
          const isActive = activeTab === index;
          const isPast = index < activeTab;
          
          return (
            <motion.div
              key={tab.id}
              className={`
                relative cursor-pointer transition-all duration-500 ease-out
                ${tab.bgColor}
                ${isActive ? "flex-[4]" : "flex-[0.5]"}
                first:rounded-l-3xl last:rounded-r-3xl
              `}
              onClick={() => setActiveTab(index)}
              initial={false}
              animate={{
                flex: isActive ? 4 : 0.5,
              }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            >
              {/* Tab label (visible when collapsed) */}
              <AnimatePresence>
                {!isActive && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div 
                      className={`
                        writing-mode-vertical transform rotate-180
                        text-lg font-semibold whitespace-nowrap
                        ${tab.textColor}
                      `}
                      style={{ writingMode: "vertical-rl" }}
                    >
                      <span className="font-bold">{tab.title}</span>{" "}
                      <span className="font-normal opacity-70">{tab.subtitle}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Expanded content */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="absolute inset-0 p-8 md:p-12 flex flex-col md:flex-row gap-8"
                  >
                    {/* Text content */}
                    <div className="flex-1 flex flex-col justify-center">
                      <motion.h3
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-4 ${tab.textColor}`}
                      >
                        <span className="font-black">{tab.title}</span>{" "}
                        <span className="font-normal">{tab.subtitle}</span>
                      </motion.h3>
                      
                      <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className={`text-base md:text-lg mb-6 max-w-lg ${tab.textColor} opacity-80`}
                      >
                        {tab.description}
                      </motion.p>

                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        <Button 
                          variant="default" 
                          className="rounded-full px-6 bg-foreground text-background hover:bg-foreground/90"
                        >
                          Learn More
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </motion.div>
                    </div>

                    {/* Image */}
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.3, duration: 0.4 }}
                      className="flex-1 flex items-center justify-center"
                    >
                      <div className="relative w-full max-w-md aspect-square rounded-2xl overflow-hidden shadow-2xl">
                        <img
                          src={tab.image}
                          alt={`${tab.title} ${tab.subtitle}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Tab indicators for mobile */}
      <div className="flex justify-center gap-2 mt-6 md:hidden">
        {featureTabs.map((tab, index) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(index)}
            className={`
              w-2 h-2 rounded-full transition-all duration-300
              ${activeTab === index ? "bg-primary w-6" : "bg-muted-foreground/30"}
            `}
          />
        ))}
      </div>
    </section>
  );
}
