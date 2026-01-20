import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { RIASEC_TYPES, RIASECCode } from '@/types/interestProfiler';
import { IPLikertScale } from './IPLikertScale';
import { IPProgressBar } from './IPProgressBar';

interface IPQuestionCardProps {
  prompt: string;
  riasecCode: RIASECCode;
  displayOrder: number;
  totalItems: number;
  progress: number;
  currentResponse?: number;
  onResponse: (value: number) => void;
  onNext: () => void;
  onPrev: () => void;
  onComplete: () => void;
  isFirst: boolean;
  isLast: boolean;
  isComplete: boolean;
  isSaving: boolean;
}

export function IPQuestionCard({
  prompt,
  riasecCode,
  displayOrder,
  totalItems,
  progress,
  currentResponse,
  onResponse,
  onNext,
  onPrev,
  onComplete,
  isFirst,
  isLast,
  isComplete,
  isSaving,
}: IPQuestionCardProps) {
  const typeInfo = RIASEC_TYPES[riasecCode];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <IPProgressBar 
        current={displayOrder} 
        total={totalItems} 
        percentage={progress} 
      />

      <Card className="border-2">
        <CardContent className="pt-8 pb-6 px-6 space-y-8">
          {/* Category badge */}
          <div className="flex justify-center">
            <span 
              className="px-3 py-1 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: typeInfo.color }}
            >
              {typeInfo.name}
            </span>
          </div>

          {/* Question prompt */}
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              How much would you enjoy this activity?
            </p>
            <h2 className="text-xl md:text-2xl font-semibold leading-relaxed">
              {prompt}
            </h2>
          </div>

          {/* Rating scale */}
          <IPLikertScale
            value={currentResponse}
            onChange={onResponse}
            disabled={isSaving}
          />

          {/* Navigation */}
          <div className="flex justify-between items-center pt-4">
            <Button
              variant="ghost"
              onClick={onPrev}
              disabled={isFirst}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>

            {isLast && isComplete ? (
              <Button
                onClick={onComplete}
                disabled={!isComplete || isSaving}
                className="gap-2"
                size="lg"
              >
                View Results
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={onNext}
                disabled={currentResponse === undefined || isSaving}
                className="gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick tip */}
      <p className="text-center text-xs text-muted-foreground">
        Answer based on how you'd feel doing this, not whether you're skilled at it
      </p>
    </div>
  );
}
