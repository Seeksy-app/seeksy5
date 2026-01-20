import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useIPAssessment } from '@/hooks/useIPAssessment';
import { IPQuestionCard } from '@/components/interestProfiler/IPQuestionCard';
import { IPResultsDisplay } from '@/components/interestProfiler/IPResultsDisplay';
import { RIASEC_TYPES, IPScoreResult } from '@/types/interestProfiler';
import { ArrowRight, ClipboardList, Clock, Target } from 'lucide-react';
import { Helmet } from 'react-helmet';

type ViewState = 'intro' | 'assessment' | 'results';

export default function IPAssessment() {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewState>('intro');
  const [results, setResults] = useState<IPScoreResult | null>(null);
  
  const {
    assessment,
    currentItem,
    currentResponse,
    currentItemIndex,
    totalItems,
    progress,
    isComplete,
    isLoading,
    isSaving,
    startAssessment,
    saveResponse,
    nextItem,
    prevItem,
    completeAssessment,
  } = useIPAssessment();

  const handleStart = async () => {
    const newAssessment = await startAssessment('standard');
    if (newAssessment) {
      setView('assessment');
    }
  };

  const handleResponse = async (value: number) => {
    if (currentItem) {
      await saveResponse(currentItem.display_order, value);
      // Auto-advance after a brief delay
      setTimeout(() => {
        if (currentItemIndex < totalItems - 1) {
          nextItem();
        }
      }, 300);
    }
  };

  const handleComplete = async () => {
    const scoreResult = await completeAssessment();
    if (scoreResult) {
      setResults(scoreResult);
      setView('results');
    }
  };

  // Intro View
  if (view === 'intro') {
    return (
      <>
        <Helmet>
          <title>Interest Profiler | WorkReady360</title>
          <meta name="description" content="Discover your RIASEC interest profile and find careers that match your natural preferences and passions." />
        </Helmet>
        
        <div className="container max-w-3xl py-12 space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">Interest Profiler</h1>
            <p className="text-xl text-muted-foreground">
              Discover what types of work activities you enjoy most
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>About This Assessment</CardTitle>
              <CardDescription>
                Based on Holland's RIASEC model used by O*NET
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <p>
                Answer questions about different work activities. There are no right or wrong 
                answers—just rate how much you would enjoy each activity.
              </p>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3">
                  <ClipboardList className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">60 Questions</p>
                    <p className="text-sm text-muted-foreground">Quick activity ratings</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">10-15 Minutes</p>
                    <p className="text-sm text-muted-foreground">Auto-saves progress</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Target className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Your Top 3</p>
                    <p className="text-sm text-muted-foreground">Interest themes revealed</p>
                  </div>
                </div>
              </div>

              {/* RIASEC Types Preview */}
              <div className="pt-4">
                <p className="text-sm font-medium mb-3">The 6 Interest Themes:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.values(RIASEC_TYPES).map((type) => (
                    <div
                      key={type.code}
                      className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
                    >
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: type.color }}
                      >
                        {type.code}
                      </span>
                      <span className="text-sm font-medium">{type.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button 
              size="lg" 
              onClick={handleStart}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? 'Starting...' : 'Start Assessment'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </>
    );
  }

  // Assessment View
  if (view === 'assessment' && currentItem) {
    return (
      <>
        <Helmet>
          <title>Interest Profiler - Question {currentItemIndex + 1} | WorkReady360</title>
        </Helmet>
        
        <div className="container py-8">
          <IPQuestionCard
            prompt={currentItem.prompt}
            riasecCode={currentItem.riasec_code}
            displayOrder={currentItem.display_order}
            totalItems={totalItems}
            progress={progress}
            currentResponse={currentResponse}
            onResponse={handleResponse}
            onNext={nextItem}
            onPrev={prevItem}
            onComplete={handleComplete}
            isFirst={currentItemIndex === 0}
            isLast={currentItemIndex === totalItems - 1}
            isComplete={isComplete}
            isSaving={isSaving}
          />
        </div>
      </>
    );
  }

  // Results View
  if (view === 'results' && results) {
    return (
      <>
        <Helmet>
          <title>Your Interest Profile Results | WorkReady360</title>
          <meta name="description" content={`Your RIASEC code: ${results.topCode3}. Discover careers that match your interests.`} />
        </Helmet>
        
        <div className="container py-12">
          <IPResultsDisplay 
            results={results}
            completedAt={assessment?.completed_at || undefined}
          />
          
          <div className="flex justify-center gap-4 mt-8">
            <Button variant="outline" onClick={() => navigate('/workready360')}>
              Back to Dashboard
            </Button>
            <Button onClick={() => window.print()}>
              Print Results
            </Button>
          </div>
        </div>
      </>
    );
  }

  // Loading state
  return (
    <div className="container py-12 text-center">
      <p className="text-muted-foreground">Loading assessment...</p>
    </div>
  );
}
