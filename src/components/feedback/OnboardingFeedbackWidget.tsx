import { useState, useEffect } from "react";
import { ThumbsUp, ThumbsDown, X, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

export function OnboardingFeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [sentiment, setSentiment] = useState<"positive" | "negative" | null>(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const location = useLocation();

  // Reset when page changes
  useEffect(() => {
    setHasSubmitted(false);
    setSentiment(null);
    setComment("");
    setIsOpen(false);
  }, [location.pathname]);

  const handleSubmit = async () => {
    if (!sentiment) return;
    
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("onboarding_feedback")
        .insert({
          user_id: user?.id || null,
          page_path: location.pathname,
          sentiment,
          comment: comment.trim() || null,
          session_id: sessionId,
        });

      if (error) throw error;

      setHasSubmitted(true);
      setIsOpen(false);
      toast.success("Thanks for your feedback!");
    } catch (error) {
      console.error("Feedback error:", error);
      toast.error("Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSentimentClick = (newSentiment: "positive" | "negative") => {
    setSentiment(newSentiment);
    setIsOpen(true);
  };

  if (hasSubmitted) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="bg-background border border-border rounded-xl shadow-lg p-4 w-80"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-foreground">
                {sentiment === "positive" ? "What's going well?" : "What could be better?"}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex gap-2 mb-3">
              <Button
                variant={sentiment === "positive" ? "default" : "outline"}
                size="sm"
                onClick={() => setSentiment("positive")}
                className="flex-1"
              >
                <ThumbsUp className="h-4 w-4 mr-1" />
                Good
              </Button>
              <Button
                variant={sentiment === "negative" ? "destructive" : "outline"}
                size="sm"
                onClick={() => setSentiment("negative")}
                className="flex-1"
              >
                <ThumbsDown className="h-4 w-4 mr-1" />
                Needs work
              </Button>
            </div>

            <Textarea
              placeholder="Tell us more (optional)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[80px] text-sm mb-3"
              maxLength={500}
            />

            <Button
              onClick={handleSubmit}
              disabled={!sentiment || isSubmitting}
              className="w-full"
              size="sm"
            >
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? "Sending..." : "Send Feedback"}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 bg-background border border-border rounded-full shadow-lg px-3 py-2"
          >
            <span className="text-xs text-muted-foreground hidden sm:inline">How's it going?</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-green-100 hover:text-green-600"
              onClick={() => handleSentimentClick("positive")}
            >
              <ThumbsUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-red-100 hover:text-red-600"
              onClick={() => handleSentimentClick("negative")}
            >
              <ThumbsDown className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
