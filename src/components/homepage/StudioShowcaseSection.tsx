import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Mic, Video, Scissors, Flag, Wand2, Play, ArrowRight,
  Sparkles, MessageSquare, Clock, Radio
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const features = [
  {
    icon: Sparkles,
    title: "Auto-Clipping While You Record",
    description: "Seeksy detects viral moments, great quotes, and emotional spikes in real time.",
    color: "from-violet-500 to-purple-500",
  },
  {
    icon: MessageSquare,
    title: "Host-Read Ad Scripts",
    description: "Automatically delivers scripts before each episode — or generates fresh variations on the fly.",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: Flag,
    title: "Live Markers for Perfect Edits",
    description: "Press 'M' to mark highlights, ad breaks, or transitions.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Video,
    title: "Audio or Video — Your Choice",
    description: "Switch studios with a single click.",
    color: "from-teal-500 to-green-500",
  },
  {
    icon: Wand2,
    title: "AI Post Production",
    description: "Automatically captions, crops, zooms, and formats clips for every platform.",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: Play,
    title: "Creator-First Workflow",
    description: "Record → Clips Ready → Edit → Publish → Earn.",
    color: "from-indigo-500 to-violet-500",
  },
];

export function StudioShowcaseSection() {
  return (
    <section className="relative py-32 overflow-hidden bg-gradient-to-b from-[#0B0F14] via-[#0D1117] to-[#11151C]">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-0 w-[800px] h-[800px] bg-violet-500/5 rounded-full blur-[200px]" />
        <div className="absolute bottom-1/4 right-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[200px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <Badge className="mb-6 bg-violet-500/20 text-violet-400 border-0 px-4 py-1.5">
            <Mic className="w-4 h-4 mr-2" />
            Studio Suite
          </Badge>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            The Most Intelligent
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              Studio Ever Built
            </span>
          </h2>
          <p className="text-xl text-white/50 max-w-3xl mx-auto">
            One workspace for recording, editing, clipping, publishing, and monetizing your content — instantly powered by AI.
          </p>
        </motion.div>

        {/* Browser mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative mb-24"
        >
          <div className="relative max-w-5xl mx-auto">
            {/* Browser frame */}
            <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-violet-500/10">
              {/* Browser header */}
              <div className="h-10 bg-[#1a1f2e] flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 rounded-md bg-white/5 text-xs text-white/40">
                    seeksy.io/studio
                  </div>
                </div>
              </div>
              
              {/* Studio preview */}
              <div className="bg-gradient-to-br from-[#0B0F14] to-[#11151C] aspect-[16/9] relative">
                {/* Simulated studio UI */}
                <div className="absolute inset-0 p-6 flex">
                  {/* Left panel */}
                  <div className="w-64 bg-black/30 rounded-xl p-4 mr-4">
                    <div className="space-y-3">
                      <div className="h-8 bg-white/5 rounded-lg w-3/4" />
                      <div className="space-y-2">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="h-12 bg-white/5 rounded-lg flex items-center px-3 gap-3">
                            <div className="w-8 h-8 rounded-lg bg-violet-500/20" />
                            <div className="flex-1 h-3 bg-white/10 rounded" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Center waveform */}
                  <div className="flex-1 flex flex-col">
                    <div className="flex-1 flex items-center justify-center">
                      <div className="flex items-center gap-0.5 h-32">
                        {[...Array(60)].map((_, i) => (
                          <motion.div
                            key={i}
                            animate={{
                              height: [
                                Math.random() * 30 + 10,
                                Math.random() * 80 + 20,
                                Math.random() * 30 + 10,
                              ],
                            }}
                            transition={{
                              duration: 0.5 + Math.random() * 0.5,
                              repeat: Infinity,
                              repeatType: "reverse",
                            }}
                            className="w-1 rounded-full bg-gradient-to-t from-teal-500 to-cyan-400"
                            style={{ minHeight: "10px" }}
                          />
                        ))}
                      </div>
                    </div>
                    {/* Controls */}
                    <div className="h-20 bg-black/30 rounded-xl flex items-center justify-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-white/10" />
                      <div className="w-16 h-16 rounded-full bg-red-500/80 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-white" />
                      </div>
                      <div className="w-12 h-12 rounded-full bg-white/10" />
                    </div>
                  </div>

                  {/* Right panel */}
                  <div className="w-72 bg-black/30 rounded-xl p-4 ml-4">
                    <div className="h-8 bg-white/5 rounded-lg mb-4" />
                    <div className="space-y-3">
                      {[1, 2].map((i) => (
                        <div key={i} className="p-3 bg-white/5 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-4 w-16 bg-blue-500/30 rounded" />
                            <div className="h-3 w-8 bg-white/10 rounded" />
                          </div>
                          <div className="h-2 bg-white/10 rounded w-full mb-1" />
                          <div className="h-2 bg-white/10 rounded w-3/4" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Floating notification */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1, duration: 0.5 }}
                  className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600/90 to-purple-600/90 backdrop-blur-xl shadow-lg"
                >
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  <span className="text-white font-medium text-sm">✨ Clip Candidate Detected — Saved for Post Production</span>
                </motion.div>
              </div>
            </div>

            {/* Glow effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-3xl blur-3xl -z-10" />
          </div>
        </motion.div>

        {/* Feature grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 hover:bg-white/[0.05] transition-all"
            >
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                "bg-gradient-to-br",
                feature.color
              )}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Button 
            size="lg"
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-lg px-8 py-6 h-auto"
          >
            Try the Studio Free
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <p className="text-white/40 text-sm mt-4">No credit card required</p>
        </motion.div>
      </div>
    </section>
  );
}
