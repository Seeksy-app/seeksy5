import { cn } from "@/lib/utils";
import { useHolidaySettings } from "@/hooks/useHolidaySettings";

interface SparkMascotProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  animate?: boolean;
}

export function SparkMascot({ className, size = "md", animate = true }: SparkMascotProps) {
  const { data: holidaySettings } = useHolidaySettings();
  const isHoliday = holidaySettings?.holidayMode;
  
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  };

  return (
    <div
      className={cn(
        sizeClasses[size],
        "relative flex items-center justify-center",
        animate && "group",
        className
      )}
    >
      {/* Glow effect on hover */}
      <div 
        className={cn(
          "absolute inset-0 rounded-full bg-gradient-to-br from-amber-400/50 to-orange-500/50 blur-md opacity-0 transition-opacity duration-300",
          animate && "group-hover:opacity-100"
        )}
      />
      
      {/* Main mascot SVG */}
      <svg
        viewBox="0 0 48 52"
        fill="none"
        className={cn(
          "relative z-10 w-full h-full transition-transform duration-300",
          animate && "group-hover:scale-110 group-hover:rotate-3"
        )}
      >
        {/* Holiday Santa Hat */}
        {isHoliday && (
          <>
            <path
              d="M18 4L24 -2L38 8L32 14L18 4Z"
              fill="#DC2626"
              stroke="#B91C1C"
              strokeWidth="0.5"
            />
            <circle cx="38" cy="8" r="3" fill="white" />
            <path
              d="M16 6C16 6 18 4 24 4C30 4 32 6 32 6L30 10C30 10 28 8 24 8C20 8 18 10 18 10L16 6Z"
              fill="white"
            />
          </>
        )}
        
        {/* Body - Friendly rounded star shape */}
        <path
          d="M24 8L28.5 20.5L42 22L31.5 31L34 44L24 37L14 44L16.5 31L6 22L19.5 20.5L24 8Z"
          fill="url(#sparkGradient)"
          stroke="#F59E0B"
          strokeWidth="1.5"
          className={cn(
            animate && "group-hover:stroke-amber-400"
          )}
        />
        
        {/* Face - Eyes */}
        <circle cx="19" cy="26" r="2.5" fill="#1E293B" />
        <circle cx="29" cy="26" r="2.5" fill="#1E293B" />
        
        {/* Eye shine */}
        <circle cx="18" cy="25" r="1" fill="white" />
        <circle cx="28" cy="25" r="1" fill="white" />
        
        {/* Smile */}
        <path
          d="M20 32C20 32 22 35 24 35C26 35 28 32 28 32"
          stroke="#1E293B"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Rosy cheeks */}
        <circle cx="16" cy="30" r="2" fill="#FCA5A5" opacity="0.6" />
        <circle cx="32" cy="30" r="2" fill="#FCA5A5" opacity="0.6" />
        
        {/* Sparkle accents */}
        <path d="M8 12L9 15L12 16L9 17L8 20L7 17L4 16L7 15L8 12Z" fill="#FBBF24" />
        <path d="M40 10L41 12L43 13L41 14L40 16L39 14L37 13L39 12L40 10Z" fill="#FBBF24" />
        <path d="M44 32L45 34L47 35L45 36L44 38L43 36L41 35L43 34L44 32Z" fill="#FBBF24" opacity="0.7" />
        
        <defs>
          <linearGradient id="sparkGradient" x1="24" y1="8" x2="24" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FDE047" />
            <stop offset="1" stopColor="#F59E0B" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
