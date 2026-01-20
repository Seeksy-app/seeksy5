import { motion, AnimatePresence } from "framer-motion";
import "./scroller.css";

interface LowerThird {
  id: string;
  name: string;
  title?: string;
}

interface Ticker {
  id: string;
  text: string;
}

interface StudioCanvasOverlayProps {
  logoUrl?: string;
  logoPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  activeLowerThird?: LowerThird | null;
  activeTicker?: Ticker | null;
  tickerSpeed?: "slow" | "medium" | "fast";
  isTickerRunning?: boolean;
}

const speedDurations = {
  slow: "30s",
  medium: "20s",
  fast: "10s",
};

export function StudioCanvasOverlay({
  logoUrl,
  logoPosition = "top-left",
  activeLowerThird,
  activeTicker,
  tickerSpeed = "medium",
  isTickerRunning = true,
}: StudioCanvasOverlayProps) {
  const logoPositionClasses = {
    "top-left": "top-4 left-4",
    "top-right": "top-4 right-4",
    "bottom-left": "bottom-20 left-4",
    "bottom-right": "bottom-20 right-4",
  };

  return (
    <>
      {/* Logo Overlay */}
      <AnimatePresence>
        {logoUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={`absolute z-20 ${logoPositionClasses[logoPosition]}`}
          >
            <img
              src={logoUrl}
              alt="Logo"
              className="h-16 w-auto max-w-[160px] object-contain drop-shadow-lg"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lower Third */}
      <AnimatePresence>
        {activeLowerThird && (
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ type: "spring", damping: 20 }}
            className="absolute bottom-24 left-6 z-20"
          >
            <div className="bg-gradient-to-r from-primary/95 to-primary/80 backdrop-blur-sm rounded-lg shadow-2xl overflow-hidden">
              <div className="px-6 py-3">
                <h3 className="text-white font-bold text-lg">
                  {activeLowerThird.name}
                </h3>
                {activeLowerThird.title && (
                  <p className="text-white/80 text-sm">
                    {activeLowerThird.title}
                  </p>
                )}
              </div>
              <div className="h-1 bg-gradient-to-r from-accent via-white/50 to-accent" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ticker */}
      <AnimatePresence>
        {activeTicker && isTickerRunning && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-r from-primary via-primary/95 to-primary overflow-hidden"
          >
            <div 
              className="py-2 whitespace-nowrap"
              style={{
                animation: `ticker ${speedDurations[tickerSpeed]} linear infinite`,
              }}
            >
              <span className="text-white font-medium px-4">{activeTicker.text}</span>
              <span className="text-white/50 px-4">•</span>
              <span className="text-white font-medium px-4">{activeTicker.text}</span>
              <span className="text-white/50 px-4">•</span>
              <span className="text-white font-medium px-4">{activeTicker.text}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
