import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Zap, Download } from "lucide-react";

interface CTASectionProps {
  onGetFreeReport?: () => void;
}

export function CTASection({ onGetFreeReport }: CTASectionProps) {
  const navigate = useNavigate();

  return (
    <section className="relative py-32 overflow-hidden bg-[#0A0F1A]">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-500/10 rounded-full blur-[150px]" />
        <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="container relative z-10 mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 mb-8">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 text-sm font-medium">Start for free, upgrade anytime</span>
          </div>

          <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
            Ready to <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Transform</span><br />Your Creator Journey?
          </h2>

          <p className="text-xl text-white/50 mb-10 max-w-2xl mx-auto">Join thousands of creators using Seeksy to record, grow, and monetize their content.</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/auth?mode=signup")} className="bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 text-lg px-10 py-7 h-auto font-bold shadow-lg shadow-amber-500/25 hover:scale-105 transition-all group">
              <Sparkles className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => window.open("https://calendly.com/seeksy-demo", "_blank")} className="bg-white/5 border-2 border-white/20 text-white hover:bg-white/10 text-lg px-10 py-7 h-auto font-semibold">
              Book a Demo
            </Button>
          </div>

          {onGetFreeReport && (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="mt-8"
            >
              <button
                onClick={onGetFreeReport}
                className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                Or get a free industry report for your role
              </button>
            </motion.div>
          )}

          <p className="mt-8 text-sm text-white/40">No credit card required • Free forever plan available</p>
        </motion.div>
      </div>
    </section>
  );
}
