import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mic, Rss, Users, Scissors, BarChart3, FileText, Megaphone, DollarSign } from "lucide-react";
import { motion } from "framer-motion";

export function AudienceCards() {
  const navigate = useNavigate();

  return (
    <section className="relative py-24 overflow-hidden bg-gradient-to-b from-[#0A0F1A] to-[#0D1117]">
      <div className="container relative z-10 mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 text-sm font-medium mb-4">Built for Every Creator</span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            One Platform, <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Endless Possibilities</span>
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {/* Podcasters Card */}
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="group">
            <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-amber-500/5 to-orange-500/5 h-full">
              <div className="relative h-64 overflow-hidden">
                <img src="https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&h=400&fit=crop" alt="Podcaster" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0D1117] via-[#0D1117]/50 to-transparent" />
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-amber-500/20 backdrop-blur-sm border border-amber-500/30">
                  <span className="text-amber-400 text-sm font-medium">For Podcasters</span>
                </div>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-white mb-4">Podcasters & Audio Creators</h3>
                <p className="text-white/60 mb-6">Professional studio, RSS hosting, guest booking, and instant clip creation.</p>
                <div className="grid grid-cols-2 gap-3 mb-8">
                  {[{ icon: Mic, label: "Professional Studio" }, { icon: Rss, label: "RSS Hosting" }, { icon: Users, label: "Guest Booking" }, { icon: Scissors, label: "Auto Clips" }].map((f) => (
                    <div key={f.label} className="flex items-center gap-2 text-white/70"><f.icon className="h-4 w-4 text-amber-400" /><span className="text-sm">{f.label}</span></div>
                  ))}
                </div>
                <Button onClick={() => navigate("/auth?mode=signup")} className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-semibold hover:opacity-90">
                  Start Podcasting <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Creators Card */}
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="group">
            <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-purple-500/5 to-blue-500/5 h-full">
              <div className="relative h-64 overflow-hidden">
                <img src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=400&fit=crop" alt="Creator" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0D1117] via-[#0D1117]/50 to-transparent" />
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-purple-500/20 backdrop-blur-sm border border-purple-500/30">
                  <span className="text-purple-400 text-sm font-medium">For Creators</span>
                </div>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-white mb-4">Creators & Influencers</h3>
                <p className="text-white/60 mb-6">Social analytics, media kit generation, brand campaigns, and creator valuation.</p>
                <div className="grid grid-cols-2 gap-3 mb-8">
                  {[{ icon: BarChart3, label: "Social Analytics" }, { icon: FileText, label: "Auto Media Kit" }, { icon: Megaphone, label: "Brand Campaigns" }, { icon: DollarSign, label: "Valuation" }].map((f) => (
                    <div key={f.label} className="flex items-center gap-2 text-white/70"><f.icon className="h-4 w-4 text-purple-400" /><span className="text-sm">{f.label}</span></div>
                  ))}
                </div>
                <Button onClick={() => navigate("/auth?mode=signup")} className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold hover:opacity-90">
                  Start Creating <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
