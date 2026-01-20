import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';

interface WelcomeBackToastProps {
  firstName?: string;
  onDismiss?: () => void;
}

export function WelcomeBackToast({ firstName, onDismiss }: WelcomeBackToastProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex items-center gap-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-4 pr-6 shadow-lg backdrop-blur-sm min-w-[320px]"
    >
      <motion.div 
        initial={{ rotate: -10, scale: 0.8 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md"
      >
        <Sparkles className="w-6 h-6 text-primary-foreground" />
      </motion.div>
      
      <div className="flex-1 min-w-0">
        <motion.p 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="text-base font-semibold text-foreground"
        >
          Welcome back{firstName ? `, ${firstName}` : ''}! 👋
        </motion.p>
        <motion.p 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-muted-foreground"
        >
          Ready to create something amazing
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, x: -5 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.25 }}
      >
        <ArrowRight className="w-5 h-5 text-primary" />
      </motion.div>
    </motion.div>
  );
}
