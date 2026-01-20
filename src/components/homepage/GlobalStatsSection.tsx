import { motion } from "framer-motion";
import { Mic, Users, DollarSign, TrendingUp } from "lucide-react";

const industryStats = [
  { value: "3M+", label: "Active Podcasts Worldwide", icon: Mic, gradient: "from-amber-400 to-orange-500" },
  { value: "50M+", label: "Creators Earning Online", icon: Users, gradient: "from-blue-400 to-cyan-500" },
  { value: "$250B+", label: "Creator Economy Market Size", icon: DollarSign, gradient: "from-emerald-400 to-teal-500" },
  { value: "93%", label: "Consumers Trust Creators Over Ads", icon: TrendingUp, gradient: "from-purple-400 to-pink-500" },
];

export function GlobalStatsSection() {
  return (
    <section className="relative py-24 overflow-hidden bg-[#0A0F1A]">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/[0.02] to-transparent" />
      <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[100px]" />

      <div className="container relative z-10 mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium mb-4">The Opportunity</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            The Creator Economy is <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Booming</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {industryStats.map((stat, index) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.1 }}>
              <div className="relative group h-full p-6 md:p-8 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 overflow-hidden hover:bg-white/[0.06] hover:border-white/20 transition-all duration-500">
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-[0.08] transition-opacity duration-500`} />
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${stat.gradient} mb-4 shadow-lg`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className={`text-3xl md:text-4xl font-black bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent mb-2`}>{stat.value}</div>
                <p className="text-sm md:text-base text-white/50 leading-tight">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
