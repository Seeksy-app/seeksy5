import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { RequireAdmin } from "@/components/auth/RequireAdmin";
import { GBPLayout } from "@/components/admin/gbp/GBPLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  MessageSquare, 
  Search, 
  Star,
  ChevronLeft,
  Reply,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";

type TonePreset = "friendly" | "professional" | "concise";

function GBPReviewsContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [replyFilter, setReplyFilter] = useState("unreplied");
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [selectedTone, setSelectedTone] = useState<TonePreset>("friendly");
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);

  // Fetch connection
  const { data: connection } = useQuery({
    queryKey: ['gbp-connection'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gbp_connections')
        .select('*')
        .eq('status', 'connected')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  });

  // Fetch write mode status
  const { data: settings } = useQuery({
    queryKey: ['gbp-admin-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gbp_admin_settings')
        .select('*')
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  // Fetch locations for filter
  const { data: locations } = useQuery({
    queryKey: ['gbp-locations-list', connection?.id],
    queryFn: async () => {
      if (!connection?.id) return [];
      const { data, error } = await supabase
        .from('gbp_locations')
        .select('id, title')
        .eq('connection_id', connection.id);
      if (error) throw error;
      return data;
    },
    enabled: !!connection?.id,
  });

  // Fetch reviews
  const { data: reviews, isLoading } = useQuery({
    queryKey: ['gbp-reviews', connection?.id, ratingFilter, replyFilter, search],
    queryFn: async () => {
      if (!connection?.id) return [];
      
      let query = supabase
        .from('gbp_reviews')
        .select('*, gbp_locations(title)')
        .eq('connection_id', connection.id)
        .order('create_time', { ascending: false });

      if (ratingFilter !== 'all') {
        query = query.eq('star_rating', parseInt(ratingFilter));
      }

      if (replyFilter === 'unreplied') {
        query = query.eq('has_reply', false);
      } else if (replyFilter === 'replied') {
        query = query.eq('has_reply', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!connection?.id,
  });

  // Reply mutation
  const replyMutation = useMutation({
    mutationFn: async ({ reviewName, replyText }: { reviewName: string; replyText: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.functions.invoke('gbp-write', {
        body: {
          action_type: 'REPLY_REVIEW',
          connection_id: connection?.id,
          location_id: selectedReview?.location_id,
          payload: {
            review_name: reviewName,
            reply_text: replyText
          },
          actor_user_id: user?.id
        }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success("Reply posted successfully");
      // Update local state immediately
      queryClient.invalidateQueries({ queryKey: ['gbp-reviews'] });
      setSelectedReview(null);
      setReplyText("");
      setShowPreview(false);
    },
    onError: (error: any) => {
      // Keep draft in textarea - don't clear replyText
      toast.error(error.message || "Failed to post reply. Your draft has been preserved.");
    }
  });

  const writeModeEnabled = settings?.write_mode_enabled;

  const handleOpenReply = (review: any) => {
    setSelectedReview(review);
    setReplyText(review.reply_comment || "");
    setShowPreview(false);
    setSelectedTone("friendly");
  };

  const handlePreviewReply = () => {
    if (!replyText.trim()) {
      toast.error("Please enter a reply");
      return;
    }
    setShowPreview(true);
  };

  const handleSubmitReply = () => {
    replyMutation.mutate({
      reviewName: selectedReview.google_review_name,
      replyText: replyText.trim()
    });
  };

  const handleCloseDrawer = () => {
    setSelectedReview(null);
    setReplyText("");
    setShowPreview(false);
    setSelectedTone("friendly");
  };

  const handleGenerateAIDraft = async () => {
    if (!selectedReview || !connection?.id) return;
    
    setIsGeneratingDraft(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get location info for business name
      const locationTitle = (selectedReview as any).gbp_locations?.title || "Our business";
      
      const { data, error } = await supabase.functions.invoke('gbp-ai-draft-reply', {
        body: {
          review_comment: selectedReview.comment,
          reviewer_name: selectedReview.reviewer_display_name,
          star_rating: selectedReview.star_rating,
          business_name: locationTitle,
          tone: selectedTone,
          use_pro_model: false, // Default to gpt-5-mini
          connection_id: connection.id,
          review_id: selectedReview.id,
          actor_user_id: user?.id
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setReplyText(data.draft);
      toast.success(`AI draft generated (${selectedTone} tone)`);
    } catch (error: any) {
      console.error("AI draft error:", error);
      toast.error(error.message || "Failed to generate AI draft");
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div className="container max-w-5xl py-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/gbp')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Reviews
              </h1>
              <p className="text-sm text-muted-foreground">
                {reviews?.length || 0} reviews
              </p>
            </div>
          </div>
        </div>

        {/* Write Mode Banner */}
        {!writeModeEnabled && (
          <div className="bg-muted/50 border rounded-lg p-3 text-sm text-muted-foreground flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Write mode is disabled. Enable it in GBP settings to reply to reviews.
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-48 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search reviews..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={ratingFilter} onValueChange={setRatingFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="All Ratings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="5">5 Stars</SelectItem>
              <SelectItem value="4">4 Stars</SelectItem>
              <SelectItem value="3">3 Stars</SelectItem>
              <SelectItem value="2">2 Stars</SelectItem>
              <SelectItem value="1">1 Star</SelectItem>
            </SelectContent>
          </Select>
          <Select value={replyFilter} onValueChange={setReplyFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Reply Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unreplied">Unreplied</SelectItem>
              <SelectItem value="replied">Replied</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reviews List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !reviews?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No reviews found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {reviews.map((review) => (
              <Card key={review.id} className="p-3">
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={review.reviewer_profile_photo_url} />
                    <AvatarFallback>{review.reviewer_display_name?.charAt(0) || '?'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{review.reviewer_display_name || 'Anonymous'}</span>
                        {renderStars(review.star_rating)}
                        {review.has_reply && (
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Replied
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {review.create_time 
                          ? formatDistanceToNow(new Date(review.create_time), { addSuffix: true })
                          : '—'}
                      </span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {review.comment || '(No comment)'}
                    </p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        {(review as any).gbp_locations?.title || 'Unknown location'}
                      </span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenReply(review)}
                            disabled={!writeModeEnabled}
                            className="h-7 text-xs"
                          >
                            <Reply className="h-3 w-3 mr-1" />
                            {review.has_reply ? 'Edit Reply' : 'Reply'}
                          </Button>
                        </TooltipTrigger>
                        {!writeModeEnabled && (
                          <TooltipContent>Enable write mode to reply</TooltipContent>
                        )}
                      </Tooltip>
                    </div>

                    {review.has_reply && review.reply_comment && (
                      <div className="mt-2 p-2 bg-muted rounded-md text-sm">
                        <p className="text-xs text-muted-foreground mb-1">Your reply:</p>
                        <p className="text-sm">{review.reply_comment}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Reply Drawer */}
        <Sheet open={!!selectedReview} onOpenChange={(open) => !open && handleCloseDrawer()}>
          <SheetContent className="sm:max-w-md">
            <SheetHeader>
              <SheetTitle>{showPreview ? 'Preview Reply' : 'Reply to Review'}</SheetTitle>
              <SheetDescription>
                {showPreview 
                  ? 'Review your reply before publishing to Google'
                  : 'Your reply will be visible publicly on Google'}
              </SheetDescription>
            </SheetHeader>
            
            {selectedReview && (
              <div className="mt-4 space-y-4">
                {/* Original Review */}
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-sm">{selectedReview.reviewer_display_name}</span>
                    {renderStars(selectedReview.star_rating)}
                  </div>
                  <p className="text-sm">{selectedReview.comment || '(No comment)'}</p>
                </div>

                {showPreview ? (
                  /* Preview Mode */
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Your reply (preview):</p>
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                        {replyText}
                      </div>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                      <AlertTriangle className="h-4 w-4 inline mr-2" />
                      This reply will be published publicly on Google Business Profile.
                    </div>
                  </div>
                ) : (
                  /* Edit Mode */
                  <div className="space-y-3">
                    {/* AI Draft Section */}
                    <div className="p-3 bg-muted/50 border border-dashed rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-primary" />
                          Draft with AI
                        </span>
                        <Select value={selectedTone} onValueChange={(v) => setSelectedTone(v as TonePreset)}>
                          <SelectTrigger className="h-7 w-28 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="friendly">Friendly</SelectItem>
                            <SelectItem value="professional">Professional</SelectItem>
                            <SelectItem value="concise">Concise</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full"
                        onClick={handleGenerateAIDraft}
                        disabled={isGeneratingDraft}
                      >
                        {isGeneratingDraft ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3 w-3 mr-1.5" />
                            Generate Draft
                          </>
                        )}
                      </Button>
                    </div>
                    
                    <Textarea
                      placeholder="Write your reply or use AI to draft..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={5}
                    />
                    <p className="text-xs text-muted-foreground">
                      {replyText.length} characters
                    </p>
                  </div>
                )}
              </div>
            )}

            <SheetFooter className="mt-4">
              {showPreview ? (
                <>
                  <Button variant="outline" onClick={() => setShowPreview(false)}>
                    Edit
                  </Button>
                  <Button 
                    onClick={handleSubmitReply}
                    disabled={replyMutation.isPending}
                  >
                    {replyMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Publish Reply
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={handleCloseDrawer}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handlePreviewReply}
                    disabled={!replyText.trim()}
                  >
                    Preview Reply
                  </Button>
                </>
              )}
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </TooltipProvider>
  );
}

export default function GBPReviews() {
  return (
    <RequireAdmin>
      <GBPLayout title="Reviews">
        <GBPReviewsContent />
      </GBPLayout>
    </RequireAdmin>
  );
}
