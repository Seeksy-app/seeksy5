import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface AppLoadingProps {
  message?: string;
  variant?: "fullscreen" | "inline" | "minimal";
}

/**
 * Reusable branded loading component with Spark pulse animation.
 * Use this for auth transitions, route loading, and async operations.
 */
export function AppLoading({ 
  message = "Loading...", 
  variant = "fullscreen" 
}: AppLoadingProps) {
  if (variant === "minimal") {
    return (
      <div className="flex items-center justify-center gap-2 p-4">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        >
          <Sparkles className="h-5 w-5 text-primary" />
        </motion.div>
        <span className="text-sm text-muted-foreground">{message}</span>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <motion.div
          className="relative"
          animate={{ 
            scale: [1, 1.1, 1],
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        >
          {/* Gradient glow effect */}
          <motion.div 
            className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/30 via-primary/50 to-primary/30 blur-xl"
            animate={{ 
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.2, 1],
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
        </motion.div>
        <motion.p 
          className="text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {message}
        </motion.p>
      </div>
    );
  }

  // Fullscreen variant (default)
  return (
    <motion.div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <div className="flex flex-col items-center gap-6">
        {/* Spark logo with pulse animation */}
        <motion.div
          className="relative"
          animate={{ 
            scale: [1, 1.05, 1],
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        >
          {/* Outer glow ring */}
          <motion.div 
            className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 blur-2xl"
            animate={{ 
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.3, 1],
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          />
          
          {/* Inner spinning ring */}
          <motion.div 
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary/40"
            animate={{ rotate: 360 }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            style={{ width: 80, height: 80 }}
          />
          
          {/* Center icon container */}
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-background to-muted/30 border border-primary/10">
            <motion.div
              animate={{ 
                rotate: [0, 5, -5, 0],
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            >
              <Sparkles className="h-10 w-10 text-primary" />
            </motion.div>
          </div>
        </motion.div>

        {/* Message with fade in */}
        <motion.div 
          className="flex flex-col items-center gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-lg font-medium text-foreground">{message}</p>
          
          {/* Animated dots */}
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-primary"
                animate={{ 
                  opacity: [0.3, 1, 0.3],
                  scale: [0.8, 1, 0.8],
                }}
                transition={{ 
                  duration: 1, 
                  repeat: Infinity, 
                  delay: i * 0.15,
                  ease: "easeInOut" 
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

/**
 * Wrapper that shows AppLoading while children are loading
 */
export function LoadingBoundary({ 
  isLoading, 
  message,
  variant = "fullscreen",
  children 
}: { 
  isLoading: boolean; 
  message?: string;
  variant?: "fullscreen" | "inline" | "minimal";
  children: React.ReactNode;
}) {
  if (isLoading) {
    return <AppLoading message={message} variant={variant} />;
  }
  return <>{children}</>;
}
