import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { IPScoreResult, RIASEC_TYPES } from '@/types/interestProfiler';
import { RIASEC_CAREER_SUGGESTIONS, COMBINED_CODE_SUGGESTIONS } from '@/data/ipItemBank';
import { Briefcase, TrendingUp, TrendingDown } from 'lucide-react';

interface IPResultsDisplayProps {
  results: IPScoreResult;
  completedAt?: string;
}

export function IPResultsDisplay({ results, completedAt }: IPResultsDisplayProps) {
  const { topCode3, topThree, bottomThree, scores } = results;

  // Get career suggestions
  const topTwoCode = topCode3.slice(0, 2);
  const combinedCareers = COMBINED_CODE_SUGGESTIONS[topTwoCode] || [];
  const primaryCareers = RIASEC_CAREER_SUGGESTIONS[topThree[0].code].slice(0, 5);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Your Interest Profile</h1>
        {completedAt && (
          <p className="text-sm text-muted-foreground">
            Completed: {new Date(completedAt).toLocaleDateString()}
          </p>
        )}
        
        {/* Top 3 Code Badge */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-1 px-6 py-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-full border-2 border-primary/20">
            {topCode3.split('').map((code, index) => {
              const typeInfo = RIASEC_TYPES[code as keyof typeof RIASEC_TYPES];
              return (
                <span
                  key={code}
                  className="text-2xl font-bold px-2"
                  style={{ color: typeInfo.color }}
                >
                  {code}
                </span>
              );
            })}
          </div>
        </div>
        <p className="text-muted-foreground">
          Your top interest themes: <strong>{topThree.map(t => t.name).join(', ')}</strong>
        </p>
      </div>

      {/* Top 3 Scores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Your Top Interests
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {topThree.map((score, index) => {
            const typeInfo = RIASEC_TYPES[score.code];
            return (
              <div key={score.code} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Badge
                      className="text-white font-bold"
                      style={{ backgroundColor: typeInfo.color }}
                    >
                      {score.code}
                    </Badge>
                    <div>
                      <span className="font-semibold">{score.name}</span>
                      <p className="text-xs text-muted-foreground">{typeInfo.tagline}</p>
                    </div>
                  </div>
                  <span className="font-bold text-lg">{score.rawScore}</span>
                </div>
                <Progress 
                  value={score.normalizedScore} 
                  className="h-3"
                  style={{ 
                    ['--progress-background' as any]: typeInfo.color 
                  }}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Career Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Career Paths to Explore
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {combinedCareers.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Based on your {topTwoCode} combination:
              </p>
              <div className="flex flex-wrap gap-2">
                {combinedCareers.map(career => (
                  <Badge key={career} variant="secondary" className="px-3 py-1">
                    {career}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Based on your top interest ({topThree[0].name}):
            </p>
            <div className="flex flex-wrap gap-2">
              {primaryCareers.map(career => (
                <Badge key={career} variant="outline" className="px-3 py-1">
                  {career}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* All 6 Scores */}
      <Card>
        <CardHeader>
          <CardTitle>Complete Score Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {scores
              .sort((a, b) => b.rawScore - a.rawScore)
              .map((score) => {
                const typeInfo = RIASEC_TYPES[score.code];
                const isTop = topThree.some(t => t.code === score.code);
                return (
                  <div 
                    key={score.code} 
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      isTop ? 'bg-primary/5' : 'bg-muted/30'
                    }`}
                  >
                    <Badge
                      className="text-white font-bold w-8 justify-center"
                      style={{ backgroundColor: typeInfo.color }}
                    >
                      {score.code}
                    </Badge>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium">{score.name}</span>
                        <span className="text-sm">{score.rawScore}/40</span>
                      </div>
                      <Progress 
                        value={score.normalizedScore} 
                        className="h-2"
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Lower Scores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <TrendingDown className="h-5 w-5" />
            Lower Interest Areas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            These areas scored lower, which can help you identify work environments 
            or tasks you might want to minimize in your career choices.
          </p>
          <div className="space-y-2">
            {bottomThree.map((score) => {
              const typeInfo = RIASEC_TYPES[score.code];
              return (
                <div key={score.code} className="flex items-center gap-3">
                  <Badge variant="outline" className="font-bold w-8 justify-center">
                    {score.code}
                  </Badge>
                  <span className="flex-1">{score.name}</span>
                  <span className="text-muted-foreground">{score.rawScore}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* What's Next */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle>What's Next?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            Your RIASEC code (<strong>{topCode3}</strong>) represents your primary interest 
            themes. Use this to:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Search for occupations matching your code on O*NET or career exploration sites</li>
            <li>Explore the World of Work map to see related career clusters</li>
            <li>Consider how your interests align with your current or desired career path</li>
            <li>Discuss your results with a career counselor or coach</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
