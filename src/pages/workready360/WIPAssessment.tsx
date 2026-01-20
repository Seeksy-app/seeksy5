import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WIPRankingCard } from '@/components/wip/WIPRankingCard';
import { WIPProgressRing } from '@/components/wip/WIPProgressRing';
import { WIPMicroCelebration } from '@/components/wip/WIPMicroCelebration';
import { useWIPAssessment } from '@/hooks/useWIPAssessment';

export default function WIPAssessment() {
  const navigate = useNavigate();
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMilestone, setCelebrationMilestone] = useState(0);
  const hasStartedRef = useRef(false);
  const shownMilestonesRef = useRef<Set<number>>(new Set());
  const previousRoundRef = useRef<number>(1);

  const {
    values,
    needs,
    rounds,
    assessmentId,
    currentRoundIndex,
    totalRounds,
    progress,
    isComplete,
    isLoading,
    startAssessment,
    submitRound,
    goBack,
    goForward,
    completeAssessment,
    getCurrentRound,
    getLiveScores,
    getResponseForRound,
    hasCompletedCurrentRound,
    isStarting,
    isSaving,
    isCompleting,
  } = useWIPAssessment('civilian');

  // Start assessment on mount - only once
  useEffect(() => {
    if (!hasStartedRef.current && !assessmentId && !isLoading && needs.length > 0 && rounds.length > 0) {
      hasStartedRef.current = true;
      startAssessment();
    }
  }, [assessmentId, isLoading, needs.length, rounds.length]);

  // Check for milestones - only trigger when moving FORWARD and milestone not already shown
  useEffect(() => {
    const completedRound = currentRoundIndex - 1;
    const isMovingForward = currentRoundIndex > previousRoundRef.current;
    
    // Only trigger milestone celebrations at exactly rounds 7, 14 (not 21 - that's handled by handleComplete)
    const milestoneRounds = [7, 14];
    if (isMovingForward && milestoneRounds.includes(completedRound) && !shownMilestonesRef.current.has(completedRound)) {
      shownMilestonesRef.current.add(completedRound);
      setCelebrationMilestone(completedRound);
      setShowCelebration(true);
    }
    
    previousRoundRef.current = currentRoundIndex;
  }, [currentRoundIndex]);

  const handleRoundComplete = async (rankedNeedIds: string[]) => {
    await submitRound(rankedNeedIds);
  };

  const handleComplete = async () => {
    setCelebrationMilestone(21);
    setShowCelebration(true);
    await completeAssessment();
    // Navigate to results after brief celebration - capture assessmentId in closure
    const currentAssessmentId = assessmentId;
    setTimeout(() => {
      if (currentAssessmentId) {
        navigate(`/workready360/wip/results/${currentAssessmentId}`);
      }
    }, 2000);
  };

  const currentRound = getCurrentRound();

  if (isLoading || isStarting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle>Assessment Complete!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-center text-muted-foreground">
              You've completed all {totalRounds} rounds. Let's calculate your work values profile.
            </p>
            <Button
              onClick={handleComplete}
              disabled={isCompleting}
              className="w-full"
              size="lg"
            >
              {isCompleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Calculating Results...
                </>
              ) : (
                'View My Results'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Micro Celebration Overlay */}
      <WIPMicroCelebration
        show={showCelebration}
        milestone={celebrationMilestone}
        onComplete={() => setShowCelebration(false)}
      />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Exit
          </Button>

          <div className="flex items-center gap-4">
            <WIPProgressRing
              current={currentRoundIndex}
              total={totalRounds}
              size={60}
              strokeWidth={4}
            />
            <div className="hidden sm:block text-sm">
              <div className="font-medium">Round {currentRoundIndex}</div>
              <div className="text-muted-foreground">{Math.round(progress)}% complete</div>
            </div>
          </div>

          <Button variant="ghost" size="icon">
            <Info className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentRoundIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <p className="text-sm text-muted-foreground italic mb-3">
                  There are no right or wrong answers — choose what matters most to you.
                </p>
                <CardTitle className="text-lg">
                  On my ideal job it is important that...
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Drag to rank from most to least important.
                </p>
              </CardHeader>
              <CardContent>
                {currentRound && (
                  <WIPRankingCard
                    needs={currentRound.needs}
                    onComplete={handleRoundComplete}
                    isSubmitting={isSaving}
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-4">
          <Button
            variant="ghost"
            onClick={goBack}
            disabled={currentRoundIndex <= 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          <div className="text-sm text-muted-foreground">
            {totalRounds - currentRoundIndex + 1} rounds remaining
          </div>
          {/* Show Next button if current round is already completed (user went back) */}
          {hasCompletedCurrentRound() && currentRoundIndex < totalRounds && (
            <Button
              variant="ghost"
              onClick={goForward}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
