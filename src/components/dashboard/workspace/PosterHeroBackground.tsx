import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Poster data with show titles
const posterData = [
  { id: 1, gradient: "from-pink-500 to-rose-600", title: "AI in Creative", category: "Technology" },
  { id: 2, gradient: "from-blue-500 to-cyan-500", title: "Brand Building", category: "Business" },
  { id: 3, gradient: "from-emerald-500 to-teal-500", title: "Mindful Living", category: "Health" },
  { id: 4, gradient: "from-orange-500 to-red-500", title: "Cold Cases", category: "True Crime" },
  { id: 5, gradient: "from-purple-500 to-violet-600", title: "Design Systems", category: "Design" },
  { id: 6, gradient: "from-amber-500 to-yellow-500", title: "Founder Stories", category: "Business" },
  { id: 7, gradient: "from-indigo-500 to-blue-600", title: "Tech Future", category: "Technology" },
  { id: 8, gradient: "from-rose-500 to-pink-600", title: "Creative Lab", category: "Entertainment" },
];

const STORAGE_KEY = "seeksy-poster-images-v1";

export function PosterHeroBackground() {
  const [posterImages, setPosterImages] = useState<Record<number, string>>({});
  const [loadingPosters, setLoadingPosters] = useState<Set<number>>(new Set());

  useEffect(() => {
    // Load cached posters from localStorage
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        setPosterImages(JSON.parse(cached));
      } catch (e) {
        console.error("Failed to parse cached posters");
      }
    }
  }, []);

  const generatePoster = async (poster: typeof posterData[0]) => {
    if (posterImages[poster.id] || loadingPosters.has(poster.id)) return;
    
    setLoadingPosters(prev => new Set(prev).add(poster.id));
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-poster', {
        body: { title: poster.title, category: poster.category }
      });
      
      if (error) throw error;
      
      if (data?.imageUrl) {
        setPosterImages(prev => {
          const updated = { ...prev, [poster.id]: data.imageUrl };
          // Try to cache, but don't fail if quota exceeded
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          } catch (e) {
            console.warn("LocalStorage quota exceeded, skipping cache");
          }
          return updated;
        });
      }
    } catch (error) {
      console.error("Failed to generate poster:", error);
    } finally {
      setLoadingPosters(prev => {
        const next = new Set(prev);
        next.delete(poster.id);
        return next;
      });
    }
  };

  // Generate posters on mount (staggered)
  useEffect(() => {
    posterData.forEach((poster, idx) => {
      if (!posterImages[poster.id]) {
        setTimeout(() => generatePoster(poster), idx * 2000); // Stagger to avoid rate limits
      }
    });
  }, []);

  return (
    <div className="relative w-full h-48 sm:h-56 md:h-64 overflow-hidden rounded-2xl mb-6">
      {/* Dark overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/60 to-background z-10" />
      
      {/* Poster grid container */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className="grid grid-cols-4 gap-2 sm:gap-3 md:gap-4 transform -rotate-6 scale-110"
          style={{ perspective: "1000px", transformStyle: "preserve-3d" }}
        >
          {[0, 2, 4, 6].map((startIdx, colIdx) => (
            <div 
              key={colIdx} 
              className={`flex flex-col gap-2 sm:gap-3 md:gap-4 ${
                colIdx === 0 ? '-translate-y-4' : 
                colIdx === 1 ? 'translate-y-2' : 
                colIdx === 2 ? '-translate-y-6' : 'translate-y-0'
              }`}
            >
              {posterData.slice(startIdx, startIdx + 2).map((poster, idx) => (
                <PosterCard 
                  key={poster.id} 
                  poster={poster} 
                  delay={(startIdx + idx) * 0.1}
                  imageUrl={posterImages[poster.id]}
                  isLoading={loadingPosters.has(poster.id)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      
      {/* Center content overlay */}
      <div className="absolute inset-0 z-20 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2">
            Your Creator <span className="text-primary">Workspace</span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Record. Create. Share. Monetize.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function PosterCard({ 
  poster, 
  delay, 
  imageUrl, 
  isLoading 
}: { 
  poster: typeof posterData[0]; 
  delay: number;
  imageUrl?: string;
  isLoading?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      className={`
        w-16 sm:w-20 md:w-24 h-24 sm:h-28 md:h-32 
        rounded-lg overflow-hidden shadow-lg
        ${!imageUrl ? `bg-gradient-to-br ${poster.gradient}` : ''}
        flex items-end justify-center pb-2
        transform hover:scale-105 transition-transform duration-300
        relative
      `}
    >
      {imageUrl && (
        <img 
          src={imageUrl} 
          alt={poster.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <span className="relative z-10 text-[8px] sm:text-[10px] font-semibold text-white/90 drop-shadow-md px-1 text-center">
        {poster.title}
      </span>
    </motion.div>
  );
}
