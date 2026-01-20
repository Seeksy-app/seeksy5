/**
 * Unified SparkIcon Component
 * Central component for all Spark mascot usage throughout the platform
 */

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getSparkAsset, preloadSparkAssets, type SparkPose, type SparkSize } from "@/lib/spark/sparkAssets";
import { useHolidaySettings } from "@/hooks/useHolidaySettings";

export type SparkVariant = "default" | "holiday";
export type SparkIconSize = "sm" | "md" | "lg" | "xl" | number;

interface SparkIconProps {
  variant?: SparkVariant;
  size?: SparkIconSize;
  animated?: boolean;
  pose?: SparkPose;
  className?: string;
  onClick?: () => void;
}

const SIZE_MAP: Record<string, number> = {
  sm: 32,
  md: 48,
  lg: 72,
  xl: 96,
};

export const SparkIcon = ({
  variant = "default",
  size = "md",
  animated = false,
  pose = "idle",
  className,
  onClick,
}: SparkIconProps) => {
  const [assetPath, setAssetPath] = useState<string>("");
  const [isHovering, setIsHovering] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const { data: holidaySettings } = useHolidaySettings();

  // Determine pixel size
  const pixelSize = typeof size === "number" ? size : SIZE_MAP[size];

  // Update asset when variant, pose, or holiday settings change
  useEffect(() => {
    preloadSparkAssets();
    
    // Use holiday variant if variant is "holiday" OR if global holiday mode is enabled
    const useHoliday = variant === "holiday" || holidaySettings?.holidayMode;
    
    setAssetPath(getSparkAsset(pose, "full", undefined, useHoliday));
  }, [pose, variant, holidaySettings]);

  // Entrance animation on mount (only if animated prop is true)
  useEffect(() => {
    if (animated) {
      setShouldAnimate(true);
      const timer = setTimeout(() => setShouldAnimate(false), 700);
      return () => clearTimeout(timer);
    }
  }, [animated]);

  return (
    <div 
      className={cn("relative inline-block", className)}
      onClick={onClick}
      onMouseEnter={() => animated && setIsHovering(true)}
      onMouseLeave={() => animated && setIsHovering(false)}
    >
      <img
        src={assetPath}
        alt="Seeksy Spark"
        className={cn(
          "object-contain select-none",
          shouldAnimate && "animate-bounce-once",
          animated && "transition-all duration-500 ease-in-out",
          animated && isHovering && "scale-110 brightness-110",
          animated && !isHovering && "animate-[wave_2s_ease-in-out_infinite]",
          onClick && "cursor-pointer"
        )}
        style={{ 
          width: `${pixelSize}px`, 
          height: `${pixelSize}px`,
          animation: animated && !isHovering ? 'wave 2s ease-in-out infinite' : undefined,
        }}
        draggable={false}
      />
      
      {/* Subtle glow animation for larger sizes */}
      {animated && pixelSize >= 64 && (
        <div 
          className={cn(
            "absolute inset-0 rounded-full blur-xl opacity-40 animate-pulse pointer-events-none",
            "bg-yellow-400/30"
          )}
        />
      )}
      
      <style>{`
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          10%, 30% { transform: rotate(-3deg); }
          20%, 40% { transform: rotate(3deg); }
        }
      `}</style>
    </div>
  );
};
