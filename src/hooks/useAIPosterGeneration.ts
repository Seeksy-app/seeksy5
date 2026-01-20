import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "seeksy-tv-posters-v1";

interface PosterCache {
  [key: string]: string;
}

export function useAIPosterGeneration() {
  const [posterImages, setPosterImages] = useState<PosterCache>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  });
  const [loadingPosters, setLoadingPosters] = useState<Set<string>>(new Set());
  const [generationQueue, setGenerationQueue] = useState<Array<{ id: string; title: string; category: string }>>([]);

  // Save to localStorage whenever posters change
  useEffect(() => {
    if (Object.keys(posterImages).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(posterImages));
    }
  }, [posterImages]);

  // Process queue with rate limiting
  useEffect(() => {
    if (generationQueue.length === 0) return;

    const processNext = async () => {
      const item = generationQueue[0];
      if (!item || posterImages[item.id] || loadingPosters.has(item.id)) {
        setGenerationQueue(prev => prev.slice(1));
        return;
      }

      setLoadingPosters(prev => new Set(prev).add(item.id));

      try {
        const { data, error } = await supabase.functions.invoke('generate-poster', {
          body: { title: item.title, category: item.category }
        });

        if (!error && data?.imageUrl) {
          setPosterImages(prev => ({ ...prev, [item.id]: data.imageUrl }));
        }
      } catch (err) {
        console.error("Failed to generate poster for", item.title, err);
      } finally {
        setLoadingPosters(prev => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
        setGenerationQueue(prev => prev.slice(1));
      }
    };

    const timer = setTimeout(processNext, 2500); // 2.5s delay between generations
    return () => clearTimeout(timer);
  }, [generationQueue, posterImages, loadingPosters]);

  const requestPoster = useCallback((id: string, title: string, category: string) => {
    if (posterImages[id] || loadingPosters.has(id)) return;
    
    setGenerationQueue(prev => {
      if (prev.some(item => item.id === id)) return prev;
      return [...prev, { id, title, category }];
    });
  }, [posterImages, loadingPosters]);

  const getPosterUrl = useCallback((id: string): string | undefined => {
    return posterImages[id];
  }, [posterImages]);

  const isLoading = useCallback((id: string): boolean => {
    return loadingPosters.has(id);
  }, [loadingPosters]);

  return {
    requestPoster,
    getPosterUrl,
    isLoading,
    posterImages,
  };
}
