import { motion } from "framer-motion";

interface VideoStudioLoadingScreenProps {
  message?: string;
}

export function VideoStudioLoadingScreen({ 
  message = "Setting the stage for you.." 
}: VideoStudioLoadingScreenProps) {
  return (
    <div className="h-screen bg-[#1a1d21] flex flex-col items-center justify-center">
      {/* Animated Logo */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative mb-8"
      >
        {/* Gradient Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="w-28 h-28 rounded-full p-1"
          style={{
            background: "linear-gradient(135deg, #06b6d4 0%, #8b5cf6 50%, #ec4899 100%)"
          }}
        >
          <div className="w-full h-full rounded-full bg-[#1a1d21] flex items-center justify-center">
            <span className="text-4xl font-bold text-white">S</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Loading Message */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-white/60 text-lg"
      >
        {message}
      </motion.p>

      {/* Loading Dots */}
      <div className="flex gap-1 mt-4">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
            className="w-2 h-2 rounded-full bg-white/40"
          />
        ))}
      </div>
    </div>
  );
}
