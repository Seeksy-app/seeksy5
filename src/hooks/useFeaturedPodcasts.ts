import { useState, useEffect } from "react";

export interface FeaturedPodcast {
  id: string;
  title: string;
  author: string;
  rssUrl: string;
  websiteUrl: string;
  description: string;
  imageUrl: string;
}

export function useFeaturedPodcasts(limit: number = 6) {
  const [podcasts, setPodcasts] = useState<FeaturedPodcast[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPodcasts() {
      try {
        const response = await fetch("/data/podcasts.csv");
        const text = await response.text();
        
        // Parse CSV
        const lines = text.split("\n");
        const headers = parseCSVLine(lines[0]);
        
        const parsed: FeaturedPodcast[] = [];
        
        for (let i = 1; i < Math.min(lines.length, limit + 1); i++) {
          const line = lines[i];
          if (!line.trim()) continue;
          
          const values = parseCSVLine(line);
          const row: Record<string, string> = {};
          headers.forEach((h, idx) => {
            row[h] = values[idx] || "";
          });
          
          if (row["Title"] && row["Image URL"]) {
            parsed.push({
              id: `podcast-${i}`,
              title: row["Title"],
              author: row["Author"],
              rssUrl: row["RSS URL"],
              websiteUrl: row["Website URL"],
              description: row["Description"],
              imageUrl: row["Image URL"],
            });
          }
        }
        
        setPodcasts(parsed);
      } catch (err) {
        setError("Failed to load podcasts");
        console.error("Error loading podcasts:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadPodcasts();
  }, [limit]);

  return { podcasts, isLoading, error };
}

// Helper to parse CSV line handling quoted values
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}
