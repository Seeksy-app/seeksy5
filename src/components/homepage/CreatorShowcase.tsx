import { motion } from "framer-motion";
import { Instagram, Youtube } from "lucide-react";
import testimonial1 from "@/assets/homepage/testimonial-1.jpg";
import testimonial2 from "@/assets/homepage/testimonial-2.jpg";
import testimonial3 from "@/assets/homepage/testimonial-3.jpg";

const creators = [
  {
    name: "Sarah Chen",
    handle: "@sarahcreates",
    image: testimonial1,
    followers: "125K",
    platform: "instagram",
  },
  {
    name: "Marcus Johnson",
    handle: "@marcusj",
    image: testimonial2,
    followers: "89K",
    platform: "youtube",
  },
  {
    name: "Isabella Rodriguez",
    handle: "@isabellar",
    image: testimonial3,
    followers: "210K",
    platform: "instagram",
  },
  {
    name: "Sarah Chen",
    handle: "@sarahcreates",
    image: testimonial1,
    followers: "125K",
    platform: "instagram",
  },
  {
    name: "Marcus Johnson",
    handle: "@marcusj",
    image: testimonial2,
    followers: "89K",
    platform: "youtube",
  },
  {
    name: "Isabella Rodriguez",
    handle: "@isabellar",
    image: testimonial3,
    followers: "210K",
    platform: "instagram",
  },
];

export function CreatorShowcase() {
  return (
    <section className="py-16 overflow-hidden bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            Powered by Amazing Creators
          </h2>
          <p className="text-muted-foreground">
            Join the growing Seeksy community
          </p>
        </motion.div>
      </div>

      {/* Horizontal Scroll Strip */}
      <div className="relative">
        <div className="flex gap-6 animate-scroll">
          {[...creators, ...creators].map((creator, index) => (
            <div
              key={index}
              className="flex-shrink-0 flex items-center gap-4 bg-card border border-border rounded-full py-3 px-5 shadow-sm"
            >
              <img
                src={creator.image}
                alt={creator.name}
                className="w-12 h-12 rounded-full object-cover"
                loading="lazy"
              />
              <div className="pr-2">
                <p className="font-semibold text-foreground whitespace-nowrap">{creator.name}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {creator.platform === "instagram" ? (
                    <Instagram className="h-3.5 w-3.5" />
                  ) : (
                    <Youtube className="h-3.5 w-3.5" />
                  )}
                  <span>{creator.followers}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}
