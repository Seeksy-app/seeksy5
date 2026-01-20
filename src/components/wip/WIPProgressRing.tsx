import { motion } from 'framer-motion';

interface WIPProgressRingProps {
  current: number;
  total: number;
  size?: number;
  strokeWidth?: number;
}

export function WIPProgressRing({
  current,
  total,
  size = 80,
  strokeWidth = 6,
}: WIPProgressRingProps) {
  const progress = (current / total) * 100;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  // Milestone celebrations at every 7 rounds
  const isMilestone = current > 0 && current % 7 === 0;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Background Circle */}
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        {/* Progress Circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>

      {/* Center Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          key={current}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-xl font-bold text-foreground"
        >
          {current}
        </motion.span>
        <span className="text-xs text-muted-foreground">of {total}</span>
      </div>

      {/* Milestone Celebration */}
      {isMilestone && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 0] }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-full h-full rounded-full bg-primary/20" />
        </motion.div>
      )}
    </div>
  );
}
