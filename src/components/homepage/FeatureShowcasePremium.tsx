import { motion } from "framer-motion";
import { Mic, Calendar, BarChart3, FileText, Shield, TrendingUp, Users, Sparkles, Clock, Video, CheckCircle, Bell, Star, Link } from "lucide-react";
import creatorStudioImg from "@/assets/homepage/creator-podcast-studio.jpg";
import analyticsDashboardImg from "@/assets/homepage/analytics-dashboard.jpg";
import influencerCreatingImg from "@/assets/homepage/influencer-creating.jpg";
import bookingSchedulingImg from "@/assets/homepage/booking-scheduling.jpg";
import identityProtectionImg from "@/assets/homepage/identity-protection.jpg";

interface Feature {
  title: string;
  description: string;
  icon: React.ElementType;
  mockType: "studio" | "booking" | "analytics" | "mediakit" | "identity";
  gradient: string;
  image?: string;
}

const features: Feature[] = [
  {
    title: "Professional Podcast Studio",
    description: "Record, edit, and publish studio-quality podcasts with AI-powered noise reduction and automatic transcription.",
    icon: Mic,
    mockType: "studio",
    gradient: "from-rose-500 to-brand-orange",
    image: creatorStudioImg
  },
  {
    title: "Smart Booking & Scheduling",
    description: "Let brands and collaborators book time with you. Integrated calendar, automatic reminders, and seamless payments.",
    icon: Calendar,
    mockType: "booking",
    gradient: "from-brand-gold to-amber-500",
    image: bookingSchedulingImg
  },
  {
    title: "Powerful Analytics Dashboard",
    description: "Track your growth across all platforms. Understand your audience, engagement rates, and monetization potential.",
    icon: BarChart3,
    mockType: "analytics",
    gradient: "from-blue-500 to-cyan-500",
    image: analyticsDashboardImg
  },
  {
    title: "Media Kit & Creator Valuation",
    description: "Generate professional media kits instantly. Know your worth with AI-powered creator valuation based on real data.",
    icon: FileText,
    mockType: "mediakit",
    gradient: "from-purple-500 to-pink-500",
    image: influencerCreatingImg
  },
  {
    title: "Identity & Rights Protection",
    description: "Blockchain-verified identity. Protect your voice, face, and content with on-chain certification and rights management.",
    icon: Shield,
    mockType: "identity",
    gradient: "from-emerald-500 to-teal-500",
    image: identityProtectionImg
  },
];

function MockUI({ type, image }: { type: Feature["mockType"]; image?: string }) {
  const mockContent = {
    studio: (
      <div className="relative">
        {image && (
          <div className="absolute inset-0 opacity-20 rounded-xl overflow-hidden">
            <img src={image} alt="" className="w-full h-full object-cover" loading="lazy" />
          </div>
        )}
        <div className="relative p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-rose-500 to-brand-orange flex items-center justify-center shadow-lg shadow-rose-500/30">
              <Mic className="h-8 w-8 text-white" />
            </div>
            <div>
              <div className="h-5 w-32 bg-white/20 rounded" />
              <div className="h-3 w-24 bg-white/10 rounded mt-2" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/50">
                <div className="w-4 h-4 bg-white rounded-full" />
              </div>
            </div>
          </div>
          <div className="h-28 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center gap-1 overflow-hidden backdrop-blur-sm">
            {/* Reduced to 20 static bars for performance */}
            {Array.from({ length: 20 }).map((_, i) => (
              <div 
                key={i} 
                className="w-1.5 bg-gradient-to-t from-brand-gold to-brand-orange rounded-full"
                style={{ height: `${25 + (i % 5) * 15}%` }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <div className="flex-1 h-10 bg-white/5 rounded-lg backdrop-blur-sm border border-white/10 flex items-center px-3">
              <span className="text-xs text-white/40">00:03:24</span>
            </div>
            <div className="w-28 h-10 bg-gradient-to-r from-brand-gold to-brand-orange rounded-lg flex items-center justify-center text-sm font-medium text-slate-900 shadow-lg shadow-brand-gold/30">
              <Sparkles className="w-4 h-4 mr-1" /> AI Edit
            </div>
          </div>
        </div>
      </div>
    ),
    booking: (
      <div className="relative">
        {image && (
          <div className="absolute inset-0 opacity-30 rounded-xl overflow-hidden">
            <img src={image} alt="" className="w-full h-full object-cover" loading="lazy" />
          </div>
        )}
        <div className="relative p-6 space-y-4">
          {/* Header with avatar and meeting types */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-gold to-amber-500 flex items-center justify-center shadow-lg shadow-brand-gold/30">
              <Video className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-white font-semibold">Book with Creator</div>
              <div className="text-xs text-white/60">Choose a time that works</div>
            </div>
          </div>

          {/* Meeting type cards */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {[
              { name: "30 min Call", price: "Free", icon: Clock, popular: true },
              { name: "Brand Collab", price: "$150", icon: Star, popular: false },
            ].map((meeting, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.02 }}
                className={`p-3 rounded-xl cursor-pointer transition-all backdrop-blur-sm ${
                  meeting.popular 
                    ? 'bg-brand-gold/20 border-2 border-brand-gold/40' 
                    : 'bg-white/10 border border-white/20'
                }`}
              >
                <meeting.icon className={`h-5 w-5 mb-2 ${meeting.popular ? 'text-brand-gold' : 'text-white/60'}`} />
                <div className="text-sm text-white font-medium">{meeting.name}</div>
                <div className={`text-xs ${meeting.popular ? 'text-brand-gold' : 'text-white/40'}`}>{meeting.price}</div>
                {meeting.popular && (
                  <span className="inline-block mt-2 text-[10px] px-2 py-0.5 bg-brand-gold/30 rounded-full text-brand-gold">
                    Popular
                  </span>
                )}
              </motion.div>
            ))}
          </div>

          {/* Calendar mini preview */}
          <div className="bg-white/10 rounded-xl border border-white/20 p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-white font-medium">December 2025</div>
              <div className="flex gap-1">
                <div className="h-6 w-6 bg-white/10 rounded flex items-center justify-center text-white/60 text-xs cursor-pointer hover:bg-white/20">‹</div>
                <div className="h-6 w-6 bg-white/10 rounded flex items-center justify-center text-white/60 text-xs cursor-pointer hover:bg-white/20">›</div>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i} className="text-center text-[10px] text-white/40 py-1">{day}</div>
              ))}
              {Array.from({ length: 28 }).map((_, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ scale: 1.15 }}
                  className={`aspect-square rounded flex items-center justify-center text-[10px] cursor-pointer transition-all ${
                    i === 15 ? 'bg-brand-gold text-slate-900 font-bold shadow-lg shadow-brand-gold/30' : 
                    [8, 12, 20].includes(i) ? 'bg-brand-gold/20 text-brand-gold hover:bg-brand-gold/30' : 
                    'bg-white/5 text-white/30 hover:bg-white/10'
                  }`}
                >
                  {i + 1}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Time slots */}
          <div className="flex gap-2">
            {['9:00 AM', '10:30 AM', '2:00 PM'].map((time, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05 }}
                className={`flex-1 py-2 rounded-lg text-center text-xs font-medium cursor-pointer transition-all ${
                  i === 1 ? 'bg-brand-gold text-slate-900 shadow-lg shadow-brand-gold/30' : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {time}
              </motion.div>
            ))}
          </div>

          {/* Confirm button */}
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 bg-gradient-to-r from-brand-gold to-amber-500 rounded-xl text-sm font-semibold text-slate-900 shadow-lg shadow-brand-gold/30 flex items-center justify-center gap-2"
          >
            <Bell className="w-4 h-4" />
            Confirm Booking
          </motion.button>
        </div>
      </div>
    ),
    analytics: (
      <div className="relative">
        {image && (
          <div className="absolute inset-0 opacity-30 rounded-xl overflow-hidden">
            <img src={image} alt="" className="w-full h-full object-cover" loading="lazy" />
          </div>
        )}
        <div className="relative p-6 space-y-4 backdrop-blur-sm">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Followers', value: '125.4K', change: '+12.3%', icon: Users },
              { label: 'Reach', value: '1.2M', change: '+8.7%', icon: TrendingUp },
              { label: 'Engagement', value: '4.8%', change: '+2.1%', icon: Sparkles },
            ].map((stat) => (
              <motion.div 
                key={stat.label} 
                whileHover={{ scale: 1.05 }}
                className="p-3 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm cursor-pointer"
              >
                <stat.icon className="w-4 h-4 text-white/60 mb-1" />
                <div className="text-xs text-white/50">{stat.label}</div>
                <div className="text-lg font-bold text-white">{stat.value}</div>
                <div className="text-xs text-emerald-400 font-medium">{stat.change}</div>
              </motion.div>
            ))}
          </div>
          <div className="h-36 bg-white/10 rounded-xl border border-white/20 p-4 flex items-end gap-1 backdrop-blur-sm">
            {/* Static bars for performance */}
            {Array.from({ length: 12 }).map((_, i) => (
              <div 
                key={i}
                className="flex-1 bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t"
                style={{ height: `${35 + (i % 4) * 18}%` }}
              />
            ))}
          </div>
          <div className="flex items-center justify-between text-xs text-white/40">
            <span>Jan</span>
            <span>Mar</span>
            <span>Jun</span>
            <span>Sep</span>
            <span>Dec</span>
          </div>
        </div>
      </div>
    ),
    mediakit: (
      <div className="relative">
        {image && (
          <div className="absolute inset-0 opacity-20 rounded-xl overflow-hidden">
            <img src={image} alt="" className="w-full h-full object-cover" loading="lazy" />
          </div>
        )}
        <div className="relative p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30 ring-4 ring-white/10" />
            <div>
              <div className="text-white font-semibold">@CreatorName</div>
              <div className="text-sm text-white/60">Content Creator</div>
              <div className="flex gap-1 mt-2">
                <span className="px-2 py-0.5 bg-purple-500/20 rounded text-xs text-purple-300">Creator</span>
                <span className="px-2 py-0.5 bg-brand-gold/20 rounded text-xs text-brand-gold flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Verified
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="p-3 bg-white/10 rounded-xl border border-white/20 cursor-pointer"
            >
              <div className="text-xs text-white/40">Estimated Value</div>
              <div className="text-2xl font-bold text-white">$2,500</div>
              <div className="text-xs text-emerald-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> per sponsored post
              </div>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="p-3 bg-white/10 rounded-xl border border-white/20 cursor-pointer"
            >
              <div className="text-xs text-white/40">Total Reach</div>
              <div className="text-2xl font-bold text-white">450K</div>
              <div className="text-xs text-white/40">across platforms</div>
            </motion.div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-sm font-medium text-white shadow-lg shadow-purple-500/30"
          >
            <FileText className="w-4 h-4 mr-2" />
            Download Media Kit
          </motion.button>
        </div>
      </div>
    ),
    identity: (
      <div className="relative">
        {image && (
          <div className="absolute inset-0 opacity-25 rounded-xl overflow-hidden">
            <img src={image} alt="" className="w-full h-full object-cover" loading="lazy" />
          </div>
        )}
        <div className="relative p-6 space-y-4">
          {/* Header with verification status */}
          <div className="flex items-center gap-4 mb-2">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            </div>
            <div>
              <div className="text-white font-semibold">Verified Creator</div>
              <div className="text-xs text-emerald-400">Identity protected on-chain</div>
            </div>
          </div>

          {/* Main verification card */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="p-4 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 rounded-xl border border-emerald-500/30 cursor-pointer backdrop-blur-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/30 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-emerald-400" />
                </div>
                <span className="text-white font-medium">Identity Verified</span>
              </div>
              <span className="px-3 py-1 bg-emerald-500/30 rounded-full text-xs text-emerald-400 font-medium">
                ✓ Active
              </span>
            </div>
            <p className="text-xs text-white/60">Voice & Face certified and protected</p>
          </motion.div>

          {/* Verification items */}
          <div className="space-y-2">
            {[
              { label: 'Voice Fingerprint', status: 'Verified', icon: Mic, color: 'emerald' },
              { label: 'Face Recognition', status: 'Verified', icon: Users, color: 'emerald' },
              { label: 'Content Rights', status: 'Protected', icon: Link, color: 'cyan' },
            ].map((item) => (
              <motion.div 
                key={item.label}
                whileHover={{ scale: 1.01, x: 4 }}
                className="flex items-center justify-between p-3 bg-white/10 rounded-xl border border-white/20 cursor-pointer hover:bg-white/15 transition-all backdrop-blur-sm"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg bg-${item.color}-500/20 flex items-center justify-center`}>
                    <item.icon className={`w-4 h-4 text-${item.color}-400`} />
                  </div>
                  <span className="text-sm text-white/80">{item.label}</span>
                </div>
                <span className={`px-3 py-1 bg-${item.color}-500/20 rounded-full text-xs text-${item.color}-400 font-medium`}>
                  {item.status}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Blockchain badge */}
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-500/15 to-indigo-500/15 rounded-xl border border-blue-500/30 backdrop-blur-sm">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <span className="text-blue-400 font-bold text-sm">◆</span>
            </div>
            <div>
              <span className="text-xs text-white/70">Secured on</span>
              <span className="text-xs text-blue-400 font-medium ml-1">Polygon Network</span>
            </div>
            <div className="ml-auto text-[10px] text-white/40">Block #18,234,567</div>
          </div>
        </div>
      </div>
    ),
  };

  return (
    <div className="rounded-2xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/10 overflow-hidden shadow-2xl">
      {/* Browser dots */}
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/10 bg-white/5">
        <div className="w-3 h-3 rounded-full bg-red-500/80" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
        <div className="w-3 h-3 rounded-full bg-green-500/80" />
        <div className="ml-4 flex-1 h-6 bg-white/5 rounded-full max-w-xs" />
      </div>
      {mockContent[type]}
    </div>
  );
}

export function FeatureShowcasePremium() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-3">
            Everything You Need
          </p>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Built for modern creators & influencers
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From recording to monetization, we've got every tool you need to succeed.
          </p>
        </motion.div>

        <div className="space-y-32">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isReversed = index % 2 === 1;
            
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className={`flex flex-col ${isReversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-16`}
              >
                {/* Content */}
                <div className="flex-1 max-w-xl">
                  <motion.div 
                    whileHover={{ scale: 1.1 }}
                    className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${feature.gradient} mb-6 shadow-lg`}
                    style={{ boxShadow: `0 20px 40px -15px ${feature.gradient.includes('rose') ? 'rgba(244, 63, 94, 0.4)' : feature.gradient.includes('gold') ? 'rgba(245, 158, 11, 0.4)' : feature.gradient.includes('blue') ? 'rgba(59, 130, 246, 0.4)' : feature.gradient.includes('purple') ? 'rgba(168, 85, 247, 0.4)' : 'rgba(16, 185, 129, 0.4)'}` }}
                  >
                    <Icon className="h-7 w-7 text-white" />
                  </motion.div>
                  <h3 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                    {feature.description}
                  </p>
                  <motion.button 
                    whileHover={{ x: 5 }}
                    className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-semibold transition-colors group text-lg"
                  >
                    Learn more
                    <span className="group-hover:translate-x-1 transition-transform text-xl">→</span>
                  </motion.button>
                </div>

                {/* Mock UI with optional image */}
                <div className="flex-1 w-full max-w-xl">
                  <div className="relative">
                    {/* Glow effect */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-20 blur-3xl scale-110`} />
                    
                    {/* Mock UI */}
                    <div className="relative">
                      <MockUI type={feature.mockType} image={feature.image} />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
