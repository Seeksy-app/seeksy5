import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Mic, Calendar, BarChart3, FileText, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { BrowserFrame } from "./BrowserFrame";

const features = [
  {
    id: "studio",
    icon: Mic,
    title: "Studio",
    headline: "Professional Studio in Your Browser",
    description: "Record, edit, and produce professional-quality content without expensive software.",
    benefits: [
      "HD browser-based recording",
      "AI filler-word removal",
      "Automatic transcription",
      "One-click clip generation",
    ],
    gradient: "from-rose-500 to-orange-500",
    bgGradient: "from-rose-500/10 to-orange-500/10",
    cta: "Open Studio",
    url: "seeksy.io/studio",
    type: "studio" as const,
    reverse: false,
  },
  {
    id: "booking",
    icon: Calendar,
    title: "Booking & Scheduling",
    headline: "Never Miss a Guest or Opportunity",
    description: "Streamline your booking process with custom pages and calendar sync.",
    benefits: [
      "Custom booking pages",
      "Google & Outlook sync",
      "Automatic reminders",
      "Guest management tools",
    ],
    gradient: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-500/10 to-cyan-500/10",
    cta: "Start Booking",
    url: "seeksy.io/booking",
    type: "booking" as const,
    reverse: true,
  },
  {
    id: "analytics",
    icon: BarChart3,
    title: "Social Analytics",
    headline: "Understand Your Audience Like Never Before",
    description: "Deep insights across all your social platforms in one dashboard.",
    benefits: [
      "Real-time engagement tracking",
      "Cross-platform comparison",
      "Audience demographics",
      "Growth trends & insights",
    ],
    gradient: "from-violet-500 to-purple-500",
    bgGradient: "from-violet-500/10 to-purple-500/10",
    cta: "Connect Accounts",
    url: "seeksy.io/analytics",
    type: "analytics" as const,
    reverse: false,
  },
  {
    id: "mediakit",
    icon: FileText,
    title: "Media Kit + Valuation",
    headline: "Know Your Worth. Show Your Value.",
    description: "Generate professional media kits and calculate your creator value instantly.",
    benefits: [
      "Auto-generated media kit",
      "Creator valuation calculator",
      "Shareable PDF export",
      "Brand-ready presentation",
    ],
    gradient: "from-amber-500 to-yellow-500",
    bgGradient: "from-amber-500/10 to-yellow-500/10",
    cta: "Generate My Media Kit",
    url: "seeksy.io/mediakit",
    type: "mediakit" as const,
    reverse: true,
  },
  {
    id: "identity",
    icon: Shield,
    title: "Identity Verification",
    headline: "Protect Your Voice. Verify Your Identity.",
    description: "Blockchain-backed verification to protect your content and prove authenticity.",
    benefits: [
      "Voice fingerprinting",
      "Face verification badge",
      "On-chain authenticity",
      "Creator identity protection",
    ],
    gradient: "from-emerald-500 to-teal-500",
    bgGradient: "from-emerald-500/10 to-teal-500/10",
    cta: "Get Verified",
    url: "seeksy.io/identity",
    type: "identity" as const,
    reverse: false,
  },
];

export function FeatureSections() {
  const navigate = useNavigate();

  return (
    <section id="features" className="py-8">
      {features.map((feature, index) => {
        const Icon = feature.icon;
        return (
          <div
            key={feature.id}
            id={feature.id}
            className={`py-24 ${index % 2 === 0 ? "bg-muted/30" : "bg-background"}`}
          >
            <div className="container mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
                className={`flex flex-col ${feature.reverse ? "lg:flex-row-reverse" : "lg:flex-row"} items-center gap-12 lg:gap-20 max-w-7xl mx-auto`}
              >
                {/* Content Side */}
                <div className="flex-1 text-center lg:text-left">
                  {/* Tag */}
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${feature.bgGradient} border border-current/10 mb-6`}>
                    <Icon className={`h-4 w-4 bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent`} style={{ color: 'currentColor' }} />
                    <span className={`text-sm font-semibold bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent`}>
                      {feature.title}
                    </span>
                  </div>
                  
                  <h3 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4 tracking-tight">
                    {feature.headline}
                  </h3>
                  
                  <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto lg:mx-0">
                    {feature.description}
                  </p>
                  
                  <ul className="space-y-4 mb-10 max-w-md mx-auto lg:mx-0">
                    {feature.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-center gap-3 justify-center lg:justify-start">
                        <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r ${feature.gradient} text-white flex-shrink-0`}>
                          <Check className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-foreground">{benefit}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => navigate("/auth?mode=signup")}
                    size="lg"
                    className={`bg-gradient-to-r ${feature.gradient} hover:opacity-90 text-white font-bold px-8 py-6 h-auto shadow-lg transition-all hover:scale-[1.02]`}
                  >
                    {feature.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>

                {/* Visual Side - Browser Frame */}
                <div className="flex-1 w-full max-w-xl">
                  <BrowserFrame
                    title={feature.title}
                    url={feature.url}
                    icon={Icon}
                    gradient={feature.gradient}
                    type={feature.type}
                  />
                </div>
              </motion.div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
