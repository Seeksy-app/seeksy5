import { Badge } from "@/components/ui/badge";
import { Users, Play } from "lucide-react";

interface TVCreatorCardProps {
  id: string;
  name: string;
  slug?: string;
  avatar_url?: string | null;
  category?: string;
  follower_count?: number;
  total_views?: number;
  onClick: () => void;
  rank?: number;
  variant?: "default" | "compact" | "featured";
}

const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

export function TVCreatorCard({
  name,
  avatar_url,
  category,
  follower_count = 0,
  total_views = 0,
  onClick,
  rank,
  variant = "default"
}: TVCreatorCardProps) {
  if (variant === "compact") {
    return (
      <div
        onClick={onClick}
        className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer group border border-transparent hover:border-amber-500/30"
      >
        {rank !== undefined && (
          <span className="text-4xl font-black text-amber-500/30 group-hover:text-amber-500/50 transition-colors w-12">
            #{rank}
          </span>
        )}
        <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 ring-2 ring-transparent group-hover:ring-amber-500/50 transition-all bg-gradient-to-br from-primary/20 to-primary/40">
          {avatar_url ? (
            <img src={avatar_url} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xl font-bold text-white/60">
              {name.charAt(0)}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white group-hover:text-amber-400 transition-colors truncate">
            {name}
          </h3>
          <p className="text-sm text-gray-400">{category}</p>
        </div>
        <Badge className="bg-amber-500/20 text-amber-400 border-0">
          {formatNumber(total_views)} views
        </Badge>
      </div>
    );
  }

  if (variant === "featured") {
    return (
      <div
        onClick={onClick}
        className="relative shrink-0 w-56 group cursor-pointer"
      >
        <div className="relative w-56 h-56 rounded-2xl overflow-hidden ring-4 ring-transparent group-hover:ring-amber-500/50 transition-all shadow-xl">
          {avatar_url ? (
            <img 
              src={avatar_url} 
              alt={name} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-white/60 bg-gradient-to-br from-primary/20 to-primary/40">
              {name.charAt(0)}
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          {/* Play button on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-16 h-16 rounded-full bg-amber-500/90 flex items-center justify-center shadow-lg">
              <Play className="h-7 w-7 text-white fill-current ml-1" />
            </div>
          </div>
          
          {/* Info at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="font-bold text-lg text-white group-hover:text-amber-400 transition-colors truncate">
              {name}
            </h3>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm text-gray-300">{category}</span>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Users className="h-3 w-3" />
                <span>{formatNumber(follower_count)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div
      onClick={onClick}
      className="shrink-0 w-48 group cursor-pointer"
    >
      <div className="relative w-48 h-48 rounded-xl overflow-hidden mb-3 bg-gradient-to-br from-primary/20 to-primary/40 ring-2 ring-transparent group-hover:ring-amber-500/50 transition-all">
        {avatar_url ? (
          <img 
            src={avatar_url} 
            alt={name} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white/60">
            {name.charAt(0)}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-amber-500/90 flex items-center justify-center">
            <Play className="h-5 w-5 text-white fill-current ml-0.5" />
          </div>
        </div>
      </div>
      <h3 className="font-semibold group-hover:text-amber-400 transition-colors truncate">
        {name}
      </h3>
      <p className="text-sm text-gray-400">{formatNumber(follower_count)} followers</p>
      {category && (
        <Badge variant="outline" className="mt-2 text-xs border-gray-600 text-gray-400">
          {category}
        </Badge>
      )}
    </div>
  );
}
