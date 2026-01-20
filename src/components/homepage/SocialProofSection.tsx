import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Quote } from "lucide-react";
import { motion } from "framer-motion";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Podcast Host",
    avatar: "SC",
    quote: "Seeksy transformed how I manage my podcast. The AI tools save me hours every week, and my media kit helped me land my first brand deal!",
    rating: 5,
  },
  {
    name: "Marcus Johnson",
    role: "Content Creator",
    avatar: "MJ",
    quote: "Finally, one platform that actually understands what creators need. The social analytics alone are worth it.",
    rating: 5,
  },
  {
    name: "Emily Rivera",
    role: "Speaker & Coach",
    avatar: "ER",
    quote: "The booking system is a game-changer. My clients can book directly, and I never miss an opportunity anymore.",
    rating: 5,
  },
];

const stats = [
  { value: "10K+", label: "Active Creators" },
  { value: "50K+", label: "Episodes Recorded" },
  { value: "1M+", label: "Hours Streamed" },
  { value: "98%", label: "Customer Satisfaction" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function SocialProofSection() {
  return (
    <section className="py-24 bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4">
        {/* Stats */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto mb-20"
        >
          {stats.map((stat) => (
            <motion.div key={stat.label} variants={itemVariants} className="text-center">
              <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-brand-gold to-brand-orange bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <p className="text-muted-foreground font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            Loved by{" "}
            <span className="bg-gradient-to-r from-brand-gold to-brand-orange bg-clip-text text-transparent">
              Creators
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join thousands of creators who trust Seeksy to grow their brand
          </p>
        </motion.div>

        {/* Testimonials */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto"
        >
          {testimonials.map((testimonial) => (
            <motion.div key={testimonial.name} variants={itemVariants}>
              <Card className="p-8 h-full bg-card border-2 border-border/50 hover:border-brand-gold/30 transition-all duration-300 hover:shadow-xl relative overflow-hidden group">
                <Quote className="absolute top-4 right-4 h-12 w-12 text-brand-gold/10 group-hover:text-brand-gold/20 transition-colors" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-brand-gold text-brand-gold" />
                    ))}
                  </div>
                  
                  <p className="text-foreground/90 mb-6 leading-relaxed italic">
                    "{testimonial.quote}"
                  </p>
                  
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border-2 border-brand-gold/30">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-gradient-to-br from-brand-gold to-brand-orange text-white font-bold">
                        {testimonial.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
