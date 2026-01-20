import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Plus, ArrowRight } from "lucide-react";

interface MyDayEmptyStateProps {
  onAddSeeksy: () => void;
}

/**
 * Empty state shown when a workspace has no modules installed.
 * Prompts user to add their first Seeksy from the App Store.
 */
export function MyDayEmptyState({ onAddSeeksy }: MyDayEmptyStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <Card className="max-w-md w-full border-dashed border-2 bg-card/50">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          {/* Icon */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">
              Welcome to My Day
            </h2>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Your personalized dashboard is ready. Add your first Seeksy to see widgets and tools tailored to your workflow.
            </p>
          </div>

          {/* CTA Button */}
          <Button 
            size="lg" 
            onClick={onAddSeeksy}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add your first Seeksy
            <ArrowRight className="h-4 w-4" />
          </Button>

          {/* Helper text */}
          <p className="text-xs text-muted-foreground">
            Seekies are modular tools like Studio, Podcasts, Meetings, and more.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
