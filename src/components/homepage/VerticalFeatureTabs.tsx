import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Video, Mic, Scissors, Calendar, Mail, Users, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const features = [
  {
    id: "studio",
    label: "Media Studio",
    title: "AI-Powered Recording & Editing",
    description:
      "Record high-quality podcasts and videos with remote guests. AI handles noise cleanup, filler word removal, and auto-generates transcripts, chapters, and clips. Stream live or post polished content—all from your browser.",
    icon: Video,
    color: "bg-rose-100 dark:bg-rose-900/30",
    textColor: "text-rose-700 dark:text-rose-400",
  },
  {
    id: "podcast",
    label: "Podcast Hosting",
    title: "Host & Distribute Everywhere",
    description:
      "Upload episodes, manage RSS feeds, and distribute to Apple Podcasts, Spotify, and every major platform. Analytics show you exactly who's listening and where.",
    icon: Mic,
    color: "bg-blue-100 dark:bg-blue-900/30",
    textColor: "text-blue-700 dark:text-blue-400",
  },
  {
    id: "clips",
    label: "AI Clips",
    title: "Viral Clips in Seconds",
    description:
      "AI identifies your best moments and generates social-ready clips with captions, animations, and optimal aspect ratios for TikTok, Reels, and Shorts. Post directly or schedule for later.",
    icon: Scissors,
    color: "bg-emerald-100 dark:bg-emerald-900/30",
    textColor: "text-emerald-700 dark:text-emerald-400",
  },
  {
    id: "meetings",
    label: "Scheduling",
    title: "Smart Meeting Links",
    description:
      "Share your booking link and let guests pick times that work for both. Automatic reminders, calendar sync, and video conferencing built in. Perfect for guest bookings, coaching calls, and consultations.",
    icon: Calendar,
    color: "bg-amber-100 dark:bg-amber-900/30",
    textColor: "text-amber-700 dark:text-amber-400",
  },
  {
    id: "email",
    label: "Email & Newsletter",
    title: "Professional Email Marketing",
    description:
      "Send beautiful newsletters with drag-and-drop blocks. Manage your inbox, segment subscribers, and track opens and clicks. Monetize with integrated ad placements.",
    icon: Mail,
    color: "bg-violet-100 dark:bg-violet-900/30",
    textColor: "text-violet-700 dark:text-violet-400",
  },
  {
    id: "crm",
    label: "Audience CRM",
    title: "Know Your Community",
    description:
      "Track every contact, subscriber, and customer in one place. See their engagement history, segment by interests, and personalize your outreach at scale.",
    icon: Users,
    color: "bg-cyan-100 dark:bg-cyan-900/30",
    textColor: "text-cyan-700 dark:text-cyan-400",
  },
  {
    id: "monetize",
    label: "Monetization",
    title: "Earn From Your Influence",
    description:
      "Sell tickets, accept payments, manage sponsorships, and track ad revenue. Verify your voice identity to unlock premium brand deals and higher CPMs.",
    icon: DollarSign,
    color: "bg-orange-100 dark:bg-orange-900/30",
    textColor: "text-orange-700 dark:text-orange-400",
  },
];

export function VerticalFeatureTabs() {
  const [activeFeature, setActiveFeature] = useState(features[0].id);

  const active = features.find((f) => f.id === activeFeature) || features[0];
  const ActiveIcon = active.icon;

  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            Everything creators need,{" "}
            <span className="text-primary">all in one place</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Pick the modules you need. Skip the ones you don't.
          </p>
        </motion.div>

        {/* Tabs Layout */}
        <div className="flex flex-col lg:flex-row gap-0 rounded-2xl overflow-hidden border border-border bg-card shadow-xl">
          {/* Vertical Tab Labels */}
          <div className="lg:w-auto flex lg:flex-col overflow-x-auto lg:overflow-visible border-b lg:border-b-0 lg:border-r border-border">
            {features.map((feature) => {
              const Icon = feature.icon;
              const isActive = activeFeature === feature.id;
              return (
                <button
                  key={feature.id}
                  onClick={() => setActiveFeature(feature.id)}
                  className={`flex items-center gap-2 px-4 lg:px-6 py-4 lg:py-5 text-left whitespace-nowrap transition-all border-b-2 lg:border-b-0 lg:border-l-4 ${
                    isActive
                      ? `${feature.color} border-primary font-semibold`
                      : "border-transparent hover:bg-muted/50"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? feature.textColor : "text-muted-foreground"}`} />
                  <span className={`text-sm ${isActive ? feature.textColor : "text-muted-foreground"}`}>
                    {feature.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Content Area */}
          <div className="flex-1 p-6 md:p-10 lg:p-12 min-h-[350px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col lg:flex-row gap-8 items-start"
              >
                <div className="flex-1">
                  {/* Icon Badge */}
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${active.color} mb-6`}>
                    <ActiveIcon className={`h-7 w-7 ${active.textColor}`} />
                  </div>

                  <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                    {active.title}
                  </h3>

                  <p className="text-muted-foreground leading-relaxed mb-6 max-w-xl">
                    {active.description}
                  </p>

                  <Button asChild variant="outline" className="group">
                    <Link to="/apps?view=modules">
                      Learn more
                      <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>

                {/* Placeholder for future image/illustration */}
                <div className={`hidden lg:block w-64 h-64 rounded-2xl ${active.color} opacity-50`} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
