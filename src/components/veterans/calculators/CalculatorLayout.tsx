import { ReactNode, useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Save, LogIn, Clock, Trash2, ChevronDown, ChevronUp, AlertCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useVeteranCalculatorResults } from "@/hooks/useVeteranCalculatorResults";
import { format } from "date-fns";
import * as LucideIcons from "lucide-react";

interface CalculatorLayoutProps {
  calculatorId: string;
  title: string;
  description: string;
  icon: string;
  iconColor?: string;
  category: string;
  children: ReactNode;
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
  resultSummary?: string;
  hasResults?: boolean;
  onReset?: () => void;
  onLoadSaved?: (inputs: Record<string, any>, outputs: Record<string, any>) => void;
}

export function CalculatorLayout({
  calculatorId,
  title,
  description,
  icon,
  iconColor = "text-primary",
  category,
  children,
  inputs,
  outputs,
  resultSummary,
  hasResults,
  onReset,
  onLoadSaved,
}: CalculatorLayoutProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { results, loading, save, deleteResult, isLoggedIn, loadSavedResult } = useVeteranCalculatorResults(calculatorId);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showSavedResults, setShowSavedResults] = useState(false);
  const [saving, setSaving] = useState(false);

  // Get icon component dynamically
  const IconComponent = (LucideIcons as any)[icon] || LucideIcons.Calculator;

  // Handle loading saved result from URL
  useEffect(() => {
    const savedId = searchParams.get('saved');
    if (savedId && onLoadSaved && results.length > 0) {
      const savedResult = loadSavedResult(savedId);
      if (savedResult) {
        onLoadSaved(savedResult.input_json, savedResult.output_json);
        // Clear the URL param after loading
        setSearchParams({});
      }
    }
  }, [searchParams, results, onLoadSaved, loadSavedResult, setSearchParams]);

  const handleSave = async () => {
    if (!inputs || !outputs) return;
    
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }

    setSaving(true);
    await save(inputs, outputs, resultSummary);
    setSaving(false);
  };

  const handleSaveAnyway = async () => {
    if (!inputs || !outputs) return;
    setSaving(true);
    await save(inputs, outputs, resultSummary);
    setSaving(false);
    setShowLoginPrompt(false);
  };

  const handleLoadResult = (result: typeof results[0]) => {
    if (onLoadSaved) {
      onLoadSaved(result.input_json, result.output_json);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <Link to="/yourbenefits" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Benefits Hub
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="text-center mb-8 lg:text-left">
              <div className={`inline-flex items-center gap-2 ${iconColor.replace('text-', 'bg-').replace('-500', '-500/10')} ${iconColor} px-4 py-2 rounded-full mb-4`}>
                <IconComponent className="w-4 h-4" />
                <span className="text-sm font-medium">{category}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-3">{title}</h1>
              <p className="text-muted-foreground text-balance">{description}</p>
            </div>

            {children}

            {/* Save Button & Signup Prompt */}
            {hasResults && (
              <div className="mt-6 space-y-4">
                <div className="flex gap-3">
                  <Button 
                    onClick={handleSave} 
                    disabled={saving}
                    className="flex-1"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "Saving..." : "Save Results"}
                  </Button>
                  {onReset && (
                    <Button variant="outline" onClick={onReset}>
                      Calculate Again
                    </Button>
                  )}
                </div>
                
                {/* Post-calculation signup/save reminder */}
                {!isLoggedIn ? (
                  <Card className="border-primary/30 bg-primary/5">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <LogIn className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">Create a free account to save your results</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Access your calculations from any device and track your benefit estimates over time.
                          </p>
                          <Button asChild size="sm" className="mt-3">
                            <Link to="/yourbenefits/auth">Sign Up Free</Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <Save className="w-4 h-4 text-green-600" />
                    <p className="text-sm text-green-700">
                      Don't forget to <strong>Save</strong> your results to access them later!
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Disclaimer */}
            <div className="mt-6 p-4 bg-muted/50 rounded-lg border">
              <div className="flex gap-2 text-sm text-muted-foreground">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  This tool is for planning only and doesn't replace official VA or federal guidance. 
                  Always verify with official sources before making decisions.
                </p>
              </div>
            </div>
          </div>

          {/* Saved Results Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Saved Results
                  </span>
                  {results.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowSavedResults(!showSavedResults)}
                      className="lg:hidden"
                    >
                      {showSavedResults ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className={`${!showSavedResults ? 'hidden lg:block' : ''}`}>
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : results.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">No saved results yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {results.map((result) => (
                      <button 
                        key={result.id} 
                        onClick={() => handleLoadResult(result)}
                        className="w-full text-left p-3 bg-muted/50 rounded-lg text-sm group relative hover:bg-muted transition-colors cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(result.created_at), "MMM d, yyyy 'at' h:mm a")}
                            </p>
                            {result.summary && (
                              <p className="font-medium mt-1 truncate">{result.summary}</p>
                            )}
                            <div className="flex items-center gap-1 mt-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                              <ExternalLink className="w-3 h-3" />
                              <span>Load this result</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteResult(result.id);
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Login Prompt Dialog */}
      <Dialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a free account to save your results</DialogTitle>
            <DialogDescription className="pt-2 space-y-2">
              <p>With an account, you can:</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Come back later and see your past calculations</li>
                <li>Access your results from any device</li>
                <li>Share a summary with a claims professional</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleSaveAnyway}>
              Save to browser only
            </Button>
            <Button asChild>
              <Link to="/yourbenefits/auth">
                <LogIn className="w-4 h-4 mr-2" />
                Create Account
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
