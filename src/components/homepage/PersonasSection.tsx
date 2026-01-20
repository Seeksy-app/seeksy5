import { PersonaGrid } from "@/components/personas/PersonaGrid";

export function PersonasSection() {
  return (
    <section className="w-full px-4 py-20 md:py-24"
      style={{ background: "#F7F9FE" }}
    >
      <div className="mx-auto max-w-[1280px]">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 
            className="font-extrabold tracking-[-0.5px] mb-4"
            style={{ 
              fontSize: "clamp(28px, 4vw, 42px)",
              color: "hsl(var(--foreground))",
            }}
          >
            Meet your AI team
          </h2>
          <p 
            className="text-lg"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            Each persona specializes in a different part of your workflow.
          </p>
        </div>

        {/* AI Personas Grid with hover cursor-following pill and video cards */}
        <PersonaGrid />
      </div>
    </section>
  );
}
