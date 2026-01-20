import { motion } from "framer-motion";

const audiences = [
  { label: "Creators", emoji: "🎨" },
  { label: "Podcasters", emoji: "🎙️" },
  { label: "Agencies", emoji: "🏢" },
  { label: "Brands", emoji: "✨" },
  { label: "Studios", emoji: "🎬" },
  { label: "Event Hosts", emoji: "🎪" },
];

export function LogoBar() {
  return (
    <section className="w-full px-4 py-12 md:py-16">
      <div className="mx-auto max-w-[1280px]">
        <p 
          className="text-center text-sm font-medium mb-8"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          Built for creators, agencies, and brands
        </p>
        
        <div className="flex flex-wrap justify-center gap-3 md:gap-4">
          {audiences.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              className="px-5 py-2.5 rounded-full text-sm font-medium"
              style={{
                background: "hsl(var(--secondary))",
                color: "hsl(var(--secondary-foreground))",
              }}
            >
              <span className="mr-2">{item.emoji}</span>
              {item.label}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
