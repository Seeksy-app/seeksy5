import { Mic, TrendingUp, Users, DollarSign } from "lucide-react";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

const values = [
  {
    icon: Mic,
    title: "Host",
    description: "Record, edit, and publish podcasts with our professional studio and AI-powered tools.",
    gradient: "from-red-500/20 to-orange-500/20",
    iconColor: "text-red-500",
    borderColor: "border-red-500/30 hover:border-red-500/60",
  },
  {
    icon: TrendingUp,
    title: "Grow",
    description: "Track analytics across all platforms, understand your audience, and optimize your content.",
    gradient: "from-blue-500/20 to-cyan-500/20",
    iconColor: "text-blue-500",
    borderColor: "border-blue-500/30 hover:border-blue-500/60",
  },
  {
    icon: Users,
    title: "Collaborate",
    description: "Book guests, schedule meetings, and manage your creator network in one place.",
    gradient: "from-purple-500/20 to-pink-500/20",
    iconColor: "text-purple-500",
    borderColor: "border-purple-500/30 hover:border-purple-500/60",
  },
  {
    icon: DollarSign,
    title: "Monetize",
    description: "Generate your media kit, know your worth, and connect with brands ready to pay.",
    gradient: "from-green-500/20 to-emerald-500/20",
    iconColor: "text-green-500",
    borderColor: "border-green-500/30 hover:border-green-500/60",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function ValuePropositionGrid() {
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
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            Everything You Need to{" "}
            <span className="bg-gradient-to-r from-brand-gold to-brand-orange bg-clip-text text-transparent">
              Succeed
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            One platform that handles your entire creator workflow
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto"
        >
          {values.map((value) => {
            const Icon = value.icon;
            return (
              <motion.div key={value.title} variants={itemVariants}>
                <Card
                  className={`relative overflow-hidden p-8 h-full bg-gradient-to-br ${value.gradient} border-2 ${value.borderColor} transition-all duration-300 hover:scale-105 hover:shadow-xl group`}
                >
                  <div className="relative z-10">
                    <div className={`inline-flex p-3 rounded-xl bg-background/80 backdrop-blur-sm mb-6 group-hover:scale-110 transition-transform`}>
                      <Icon className={`h-8 w-8 ${value.iconColor}`} />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">{value.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{value.description}</p>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
