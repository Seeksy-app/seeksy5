import { Progress } from '@/components/ui/progress';

interface IPProgressBarProps {
  current: number;
  total: number;
  percentage: number;
}

export function IPProgressBar({ current, total, percentage }: IPProgressBarProps) {
  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">
          Question {current} of {total}
        </span>
        <span className="font-medium text-primary">
          {Math.round(percentage)}% complete
        </span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
}
