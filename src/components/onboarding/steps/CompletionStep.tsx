import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { type AccountType } from '@/hooks/useAccountType';
import { Trophy, CheckCircle, Loader2, Sparkles, Rocket, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CompletionStepProps {
  accountType: AccountType;
  onFinish: () => void;
  isLoading: boolean;
}

const accountTypeLabels: Record<AccountType, string> = {
  creator: 'Content Creator',
  podcaster: 'Podcaster',
  advertiser: 'Advertiser',
  agency: 'Agency Manager',
  event_planner: 'Event Host',
  brand: 'Explorer',
  studio_team: 'Studio Team',
  admin: 'Administrator',
  influencer: 'Influencer',
};

const accountTypeGradients: Record<AccountType, string> = {
  creator: 'from-purple-500 to-pink-500',
  podcaster: 'from-blue-500 to-cyan-500',
  influencer: 'from-amber-500 to-yellow-500',
  advertiser: 'from-orange-500 to-red-500',
  agency: 'from-green-500 to-emerald-500',
  event_planner: 'from-indigo-500 to-purple-500',
  brand: 'from-slate-500 to-gray-500',
  studio_team: 'from-rose-500 to-pink-500',
  admin: 'from-gray-500 to-slate-500',
};

const dashboardDescriptions: Record<AccountType, string> = {
  creator: 'Access your personalized creator dashboard with content tools, analytics, and monetization features.',
  podcaster: 'Start creating episodes, manage your podcast, and grow your audience.',
  advertiser: 'Launch campaigns, discover creators, and track performance.',
  agency: 'Manage your creators, coordinate campaigns, and streamline operations.',
  event_planner: 'Set up events, manage bookings, and engage attendees.',
  brand: 'Explore Seeksy tools and discover what is possible.',
  studio_team: 'Collaborate with your team on productions and content.',
  admin: 'Access admin tools and platform management.',
  influencer: 'Grow your audience, track analytics, and land brand deals.',
};

// Confetti particle component
function ConfettiParticle({ delay, x }: { delay: number; x: number }) {
  const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#A855F7', '#3B82F6', '#F472B6', '#34D399'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const shapes = ['rounded-full', 'rounded-sm', 'rounded-none'];
  const shape = shapes[Math.floor(Math.random() * shapes.length)];
  
  return (
    <motion.div
      className={cn("absolute w-3 h-3", shape)}
      style={{ backgroundColor: color, left: `${x}%` }}
      initial={{ top: '0%', opacity: 1, scale: 1 }}
      animate={{ 
        top: '100%', 
        opacity: 0, 
        scale: 0,
        x: Math.random() * 150 - 75,
        rotate: Math.random() * 720
      }}
      transition={{ 
        duration: 2.5, 
        delay, 
        ease: 'easeOut' 
      }}
    />
  );
}

export function CompletionStep({ accountType, onFinish, isLoading }: CompletionStepProps) {
  const [showConfetti, setShowConfetti] = useState(true);
  const gradient = accountTypeGradients[accountType];

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Card className="p-8 sm:p-10 shadow-xl border-border/50 bg-gradient-to-br from-card via-card to-muted/30 overflow-hidden relative rounded-2xl">
      {/* Confetti */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 30 }).map((_, i) => (
            <ConfettiParticle key={i} delay={i * 0.08} x={Math.random() * 100} />
          ))}
        </div>
      )}

      <div className="text-center space-y-8 relative z-10">
        {/* Trophy with gradient glow */}
        <motion.div 
          className="flex justify-center"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.8 }}
        >
          <div className="relative">
            <div className={cn(
              "absolute inset-0 bg-gradient-to-br blur-3xl opacity-50 rounded-full scale-[1.8]",
              gradient
            )} />
            <div className={cn(
              "relative p-8 rounded-full bg-gradient-to-br shadow-2xl",
              gradient
            )}>
              <Trophy className="h-16 w-16 text-white" />
            </div>
            {/* Floating stars */}
            <motion.div
              className="absolute -top-3 -right-3"
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            >
              <Star className="h-7 w-7 text-yellow-400 fill-yellow-400" />
            </motion.div>
            <motion.div
              className="absolute -bottom-2 -left-4"
              animate={{ rotate: -360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="h-6 w-6 text-pink-400" />
            </motion.div>
            <motion.div
              className="absolute top-1/2 -right-6"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Star className="h-5 w-5 text-cyan-400 fill-cyan-400" />
            </motion.div>
          </div>
        </motion.div>

        <motion.div 
          className="space-y-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">You're all set!</h2>
          <p className="text-lg sm:text-xl text-muted-foreground">
            Welcome to Seeksy as a <span className={cn("font-bold bg-gradient-to-r bg-clip-text text-transparent", gradient)}>{accountTypeLabels[accountType]}</span>
          </p>
        </motion.div>

        <motion.div 
          className="bg-muted/30 rounded-2xl p-6 sm:p-8 text-left space-y-4 border border-border/50 max-w-lg mx-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {[
            { title: 'Account configured', desc: 'Your account is ready with the right tools' },
            { title: 'Personalized dashboard', desc: dashboardDescriptions[accountType] },
            { title: 'Ready to grow', desc: 'All features unlocked and ready to explore' },
          ].map((item, index) => (
            <motion.div 
              key={item.title}
              className="flex items-start gap-4"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
            >
              <div className={cn("p-1.5 rounded-full bg-gradient-to-br shrink-0", gradient)}>
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-base">{item.title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="pt-2"
        >
          <Button 
            size="lg" 
            className={cn(
              "w-full max-w-md h-14 text-lg font-bold shadow-xl",
              "bg-gradient-to-r text-white",
              gradient
            )}
            onClick={onFinish}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Setting up...
              </>
            ) : (
              <>
                <Rocket className="h-5 w-5 mr-2" />
                Go to Dashboard
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </Card>
  );
}
