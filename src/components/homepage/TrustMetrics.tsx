import { motion } from "framer-motion";

const metrics = [
  { value: "10K+", label: "Active Creators" },
  { value: "50K+", label: "Episodes Recorded" },
  { value: "1M+", label: "Hours Streamed" },
  { value: "98%", label: "Satisfaction Rate" },
];

export function TrustMetrics() {
  return (
    <section className="py-16 bg-muted/30 border-y border-border/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Trusted by creators worldwide
          </p>
        </motion.div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="text-3xl md:text-4xl font-black text-foreground mb-1">
                {metric.value}
              </div>
              <div className="text-sm text-muted-foreground">
                {metric.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
