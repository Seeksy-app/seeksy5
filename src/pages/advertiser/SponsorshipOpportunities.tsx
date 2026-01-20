import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, MapPin, Users, Globe, Award, Sparkles, ArrowLeft } from "lucide-react";
import { getEventSponsorships, getAwardsSponsorships, Sponsorship } from "@/data/sponsorshipDemoData";
import { motion } from "framer-motion";

const SponsorshipCard = ({ sponsorship }: { sponsorship: Sponsorship }) => {
  const navigate = useNavigate();

  return (
    <Card 
      className="group cursor-pointer hover:shadow-md hover:border-primary/50 hover:scale-[1.01] transition-all duration-300 flex flex-col"
      onClick={() => navigate(`/advertiser/sponsorships/${sponsorship.id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12 border">
            <AvatarImage src={sponsorship.hostAvatarUrl} />
            <AvatarFallback>{sponsorship.hostName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base leading-tight line-clamp-2">{sponsorship.title}</CardTitle>
            <CardDescription className="text-xs mt-1">{sponsorship.hostName}</CardDescription>
          </div>
          <Badge variant={sponsorship.type === 'event' ? 'default' : 'secondary'} className="shrink-0">
            {sponsorship.type === 'event' ? 'Event' : 'Awards'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 pt-0 space-y-3">
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" />
            <span>{sponsorship.dateRange || sponsorship.eventDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5" />
            <span>{sponsorship.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5" />
            <span>{sponsorship.estimatedAttendees > 0 ? `${sponsorship.estimatedAttendees.toLocaleString()} attendees` : 'Virtual'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="h-3.5 w-3.5" />
            <span>{sponsorship.estimatedOnlineReach.toLocaleString()} online reach</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground italic">
          "{sponsorship.audienceSummary}"
        </p>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {sponsorship.packages.slice(0, 3).map((pkg) => (
            <Badge key={pkg.name} variant="outline" className="text-[10px] font-normal">
              {pkg.name} – ${pkg.price.toLocaleString()}
            </Badge>
          ))}
        </div>

        <div className="pt-2 mt-auto">
          <Button size="sm" className="w-full">
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const EmptyState = ({ type }: { type: 'event' | 'awards' }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    {type === 'event' ? (
      <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
    ) : (
      <Award className="h-12 w-12 text-muted-foreground/50 mb-4" />
    )}
    <h3 className="text-lg font-medium mb-2">
      No {type === 'event' ? 'event' : 'awards'} sponsorships available
    </h3>
    <p className="text-sm text-muted-foreground max-w-md">
      {type === 'event' 
        ? "Check back soon for upcoming event sponsorship opportunities, or explore Awards Sponsorships."
        : "Check back soon for awards sponsorship opportunities, or explore Event Sponsorships."
      }
    </p>
  </div>
);

export default function SponsorshipOpportunities() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'events' | 'awards'>('events');
  const eventSponsorships = getEventSponsorships();
  const awardsSponsorships = getAwardsSponsorships();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="p-6 space-y-6"
    >
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => navigate("/advertiser/create-ad")}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Create Ad
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Sponsorship Opportunities
          </h1>
          <p className="text-muted-foreground mt-1">
            Discover and sponsor creator events, awards programs, and brand activations
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'events' | 'awards')}>
        <TabsList className="mb-6">
          <TabsTrigger value="events" className="gap-2">
            <Calendar className="h-4 w-4" />
            Event Sponsorships
            <Badge variant="secondary" className="ml-1">{eventSponsorships.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="awards" className="gap-2">
            <Award className="h-4 w-4" />
            Awards Sponsorships
            <Badge variant="secondary" className="ml-1">{awardsSponsorships.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          {eventSponsorships.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {eventSponsorships.map((sponsorship) => (
                <SponsorshipCard key={sponsorship.id} sponsorship={sponsorship} />
              ))}
            </div>
          ) : (
            <EmptyState type="event" />
          )}
        </TabsContent>

        <TabsContent value="awards">
          {awardsSponsorships.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {awardsSponsorships.map((sponsorship) => (
                <SponsorshipCard key={sponsorship.id} sponsorship={sponsorship} />
              ))}
            </div>
          ) : (
            <EmptyState type="awards" />
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
