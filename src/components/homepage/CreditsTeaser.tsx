import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Coins } from "lucide-react";
import { useNavigate } from "react-router-dom";

const points = [
  "No subscriptions required",
  "No lockouts when credits run out",
  "Graceful limits per tool, upgrade anytime",
  "Transparent usage and estimates before actions",
];

export function CreditsTeaser() {
  const navigate = useNavigate();

  return (
    <section className="w-full px-4 py-20 md:py-24" style={{ background: "#F7F9FE" }}>
      <div className="mx-auto max-w-[1280px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-[28px] p-10 md:p-14 lg:p-16 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 50%, #E0E7FF 100%)",
            border: "1px solid rgba(99, 102, 241, 0.15)",
          }}
        >
          {/* Subtle decorative circles */}
          <div 
            className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-30"
            style={{ background: "radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%)" }}
          />
          <div 
            className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)" }}
          />

          <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center relative z-10">
            {/* Left: Icon + Text */}
            <div>
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                style={{ background: "rgba(59, 130, 246, 0.1)" }}
              >
                <Coins className="w-8 h-8" style={{ color: "#3B82F6" }} />
              </div>
              
              <h2 
                className="font-extrabold tracking-[-0.5px] mb-4"
                style={{ 
                  fontSize: "clamp(28px, 4vw, 40px)",
                  color: "#0F172A",
                }}
              >
                Pay with credits.
                <br />
                Keep your work forever.
              </h2>
              
              <p 
                className="text-lg mb-8"
                style={{ color: "#64748B" }}
              >
                A flexible model designed for creators who want control over their tools and spending.
              </p>

              <Button
                size="lg"
                className="rounded-full px-8 h-12 text-base font-semibold"
                style={{ background: "#3B82F6" }}
                onClick={() => navigate("/pricing")}
              >
                See Credits & Pricing
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            {/* Right: Points */}
            <div className="space-y-5">
              {points.map((point, index) => (
                <motion.div
                  key={point}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  className="flex items-start gap-4"
                >
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: "#3B82F6" }}
                  >
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                  <p 
                    className="text-lg font-medium"
                    style={{ color: "#1E293B" }}
                  >
                    {point}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
