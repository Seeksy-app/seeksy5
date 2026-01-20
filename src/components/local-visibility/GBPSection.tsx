import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MapPin, 
  Phone, 
  Globe, 
  Clock, 
  Star, 
  Eye, 
  MousePointerClick,
  Navigation,
  Image,
  MessageSquare,
  Sparkles,
  Check,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react";
import { useLocalVisibilityStore } from "@/hooks/useLocalVisibilityStore";
import type { GBPReview, MediaChecklistItem } from "@/types/local-visibility";
import { toast } from "sonner";

const TrendIndicator = ({ value }: { value: number }) => {
  if (value > 0) return <TrendingUp className="h-3.5 w-3.5 text-green-600" />;
  if (value < 0) return <TrendingDown className="h-3.5 w-3.5 text-red-600" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
};

const InsightCard = ({ label, value, change, icon: Icon }: { label: string; value: number; change: number; icon: React.ElementType }) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <div className="flex items-center gap-1">
          <TrendIndicator value={change} />
          <span className={`text-xs ${change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
            {change > 0 ? '+' : ''}{change}%
          </span>
        </div>
      </div>
      <p className="text-2xl font-semibold mt-2">{value.toLocaleString()}</p>
    </CardContent>
  </Card>
);

const ReviewCard = ({ review, onReply }: { review: GBPReview; onReply: (id: string, text: string) => void }) => {
  const [replyText, setReplyText] = useState(review.aiSuggestedReply || '');
  const [isReplying, setIsReplying] = useState(false);

  const handleReply = () => {
    if (!replyText.trim()) return;
    onReply(review.id, replyText);
    setIsReplying(false);
    toast.success('Reply sent successfully');
  };

  return (
    <Card className={review.replied ? 'opacity-75' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
            {review.reviewerName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="font-medium text-sm">{review.reviewerName}</p>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`h-3.5 w-3.5 ${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted'}`} 
                  />
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(review.createdAt).toLocaleDateString()}
            </p>
            <p className="text-sm mt-2">{review.comment}</p>

            {review.replied ? (
              <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Your reply</p>
                <p className="text-sm">{review.replyText}</p>
              </div>
            ) : (
              <div className="mt-3">
                {isReplying ? (
                  <div className="space-y-2">
                    {review.aiSuggestedReply && (
                      <div className="flex items-center gap-1.5 text-xs text-primary">
                        <Sparkles className="h-3 w-3" />
                        AI-suggested reply
                      </div>
                    )}
                    <Textarea 
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write your reply..."
                      className="text-sm min-h-[80px]"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleReply}>Send Reply</Button>
                      <Button size="sm" variant="ghost" onClick={() => setIsReplying(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setIsReplying(true)}>
                    <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                    Reply
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const MediaChecklist = () => {
  const items: MediaChecklistItem[] = [
    { type: 'logo', label: 'Logo', required: true, uploaded: true },
    { type: 'cover', label: 'Cover Photo', required: true, uploaded: true },
    { type: 'exterior', label: 'Exterior Photo', required: false, uploaded: true },
    { type: 'interior', label: 'Interior Photos', required: false, uploaded: false },
    { type: 'product', label: 'Product Photos', required: false, uploaded: false },
    { type: 'team', label: 'Team Photos', required: false, uploaded: false },
  ];

  const uploadedCount = items.filter(i => i.uploaded).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Image className="h-4 w-4" />
            Media Checklist
          </CardTitle>
          <Badge variant="outline">{uploadedCount}/{items.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => (
          <div key={item.type} className="flex items-center justify-between py-1.5">
            <div className="flex items-center gap-2">
              {item.uploaded ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              )}
              <span className="text-sm">{item.label}</span>
              {item.required && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Required</Badge>}
            </div>
            {!item.uploaded && (
              <Button size="sm" variant="ghost" className="h-7 text-xs">
                Add
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export function GBPSection() {
  const { connections, locations, insights, reviews, setReviews, addActivityLog } = useLocalVisibilityStore();
  const gbpConnection = connections.find(c => c.provider === 'google_business');
  const isConnected = gbpConnection?.status === 'connected';

  // Mock data
  const mockLocation = locations[0] || {
    id: '1',
    name: 'Downtown Coffee Shop',
    address: '123 Main Street',
    city: 'Austin',
    state: 'TX',
    zipCode: '78701',
    phone: '(512) 555-0123',
    website: 'https://example.com',
    category: 'Coffee Shop',
    isVerified: true,
    status: 'open' as const,
  };

  const mockInsights = insights || {
    locationId: '1',
    periodStart: '2024-12-01',
    periodEnd: '2024-12-20',
    views: 2847,
    viewsChange: 12,
    searches: 1234,
    searchesChange: 8,
    calls: 89,
    callsChange: -3,
    directions: 156,
    directionsChange: 15,
    websiteClicks: 203,
    websiteClicksChange: 5,
  };

  const mockReviews: GBPReview[] = reviews.length ? reviews : [
    {
      id: '1',
      locationId: '1',
      reviewerName: 'Sarah M.',
      rating: 5,
      comment: 'Best coffee in town! The staff is always friendly and the atmosphere is perfect for remote work.',
      createdAt: '2024-12-18T10:00:00Z',
      replied: false,
      aiSuggestedReply: "Thank you so much for the wonderful review, Sarah! We're thrilled to hear you enjoy our coffee and atmosphere. We look forward to seeing you again soon!",
    },
    {
      id: '2',
      locationId: '1',
      reviewerName: 'John D.',
      rating: 4,
      comment: 'Great coffee, but sometimes the wait can be long during peak hours.',
      createdAt: '2024-12-15T14:30:00Z',
      replied: false,
      aiSuggestedReply: "Hi John, thank you for your feedback! We appreciate you taking the time to share your experience. We're working on improving our service speed during busy times. Hope to see you again!",
    },
    {
      id: '3',
      locationId: '1',
      reviewerName: 'Emily R.',
      rating: 5,
      comment: 'Love the new seasonal menu! The pumpkin spice latte is amazing.',
      createdAt: '2024-12-10T09:15:00Z',
      replied: true,
      replyText: "Thank you Emily! We're so glad you're enjoying our seasonal offerings. The pumpkin spice latte is definitely a team favorite too!",
      repliedAt: '2024-12-10T15:00:00Z',
    },
  ];

  const handleReplyToReview = (reviewId: string, replyText: string) => {
    const updatedReviews = mockReviews.map(r => 
      r.id === reviewId 
        ? { ...r, replied: true, replyText, repliedAt: new Date().toISOString() }
        : r
    );
    setReviews(updatedReviews);
    addActivityLog({
      type: 'executed_change',
      title: 'Review reply sent',
      description: `Replied to review from ${mockReviews.find(r => r.id === reviewId)?.reviewerName}`,
      isAI: false,
    });
  };

  const handleConnect = () => {
    toast.info('OAuth connection flow would start here');
    addActivityLog({
      type: 'user_action',
      title: 'Connection initiated',
      description: 'Started Google Business Profile OAuth flow',
      isAI: false,
    });
  };

  if (!isConnected) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-3 rounded-full bg-primary/10 mb-4">
            <MapPin className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Connect Google Business Profile</h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-4">
            Link your Google Business Profile to manage reviews, update hours, and track local visibility.
          </p>
          <Button onClick={handleConnect}>
            <Globe className="h-4 w-4 mr-2" />
            Connect GBP
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Location Info */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{mockLocation.name}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <MapPin className="h-3.5 w-3.5" />
                {mockLocation.address}, {mockLocation.city}, {mockLocation.state} {mockLocation.zipCode}
              </CardDescription>
            </div>
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
              <Check className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 text-sm">
            {mockLocation.phone && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                {mockLocation.phone}
              </div>
            )}
            {mockLocation.website && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Globe className="h-3.5 w-3.5" />
                {mockLocation.website}
              </div>
            )}
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {mockLocation.category}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="hours">Hours</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <InsightCard label="Views" value={mockInsights.views} change={mockInsights.viewsChange} icon={Eye} />
            <InsightCard label="Searches" value={mockInsights.searches} change={mockInsights.searchesChange} icon={Globe} />
            <InsightCard label="Calls" value={mockInsights.calls} change={mockInsights.callsChange} icon={Phone} />
            <InsightCard label="Directions" value={mockInsights.directions} change={mockInsights.directionsChange} icon={Navigation} />
            <InsightCard label="Website Clicks" value={mockInsights.websiteClicks} change={mockInsights.websiteClicksChange} icon={MousePointerClick} />
          </div>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">AI Insight</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your profile views increased 12% this week. Most views come from direct searches for your business name, 
                    indicating strong brand awareness. Consider adding more photos to boost discovery searches.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews">
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              {mockReviews.map((review) => (
                <ReviewCard key={review.id} review={review} onReply={handleReplyToReview} />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="media">
          <MediaChecklist />
        </TabsContent>

        <TabsContent value="hours">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Business Hours
              </CardTitle>
              <CardDescription>Update your regular and holiday hours</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                <div key={day} className="flex items-center justify-between py-2 border-b last:border-0">
                  <span className="text-sm font-medium w-24">{day}</span>
                  <span className="text-sm text-muted-foreground">
                    {day === 'Sunday' ? 'Closed' : '7:00 AM - 7:00 PM'}
                  </span>
                  <Button size="sm" variant="ghost" className="h-7">Edit</Button>
                </div>
              ))}
              <Button variant="outline" className="w-full mt-4">
                <Clock className="h-4 w-4 mr-2" />
                Add Holiday Hours
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
