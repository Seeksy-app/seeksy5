import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Trophy, MapPin, DollarSign, Users, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

export default function SponsorshipMarketplace() {
  const navigate = useNavigate();

  const { data: awardOpportunities, isLoading: loadingAwards } = useQuery({
    queryKey: ["award-sponsorship-opportunities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("award_sponsorship_packages")
        .select(`
          *,
          awards_programs(
            id,
            title,
            description,
            ceremony_date,
            cover_image_url
          ),
          award_sponsorships!award_sponsorships_package_id_fkey(
            id,
            status
          )
        `)
        .order("price", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: eventOpportunities, isLoading: loadingEvents } = useQuery({
    queryKey: ["event-sponsorship-opportunities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_sponsorship_packages")
        .select(`
          *,
          events(
            id,
            title,
            description,
            event_date,
            location,
            image_url
          ),
          event_sponsorships!event_sponsorships_package_id_fkey(
            id,
            status
          )
        `)
        .order("price", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/advertiser/campaigns/create-type")}
            className="mb-4 text-foreground"
          >
            ← Back to Ad Types
          </Button>
          <h1 className="text-4xl font-bold mb-2">Sponsorship Opportunities</h1>
          <p className="text-muted-foreground">
            Browse and sponsor events and awards programs
          </p>
        </div>

        <Tabs defaultValue="events" className="space-y-6">
          <TabsList>
            <TabsTrigger value="events">
              <Calendar className="h-4 w-4 mr-2" />
              Event Sponsorships
            </TabsTrigger>
            <TabsTrigger value="awards">
              <Trophy className="h-4 w-4 mr-2" />
              Awards Sponsorships
            </TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-6">
            {loadingEvents ? (
              <p className="text-center text-muted-foreground">Loading opportunities...</p>
            ) : eventOpportunities && eventOpportunities.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {eventOpportunities.map((pkg: any) => {
                  const event = pkg.events;
                  const paidSponsors = pkg.event_sponsorships?.filter((s: any) => s.status === 'paid').length || 0;
                  const isFull = pkg.max_sponsors && paidSponsors >= pkg.max_sponsors;

                  return (
                    <Card key={pkg.id} className="flex flex-col">
                      {event?.image_url && (
                        <div className="h-48 overflow-hidden rounded-t-lg">
                          <img 
                            src={event.image_url} 
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <Badge variant="outline" className="mb-2">
                              {pkg.package_name}
                            </Badge>
                            <CardTitle className="text-lg mb-2">{event?.title}</CardTitle>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">
                              ${pkg.price.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        {event?.event_date && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(event.event_date), "MMM d, yyyy")}
                          </div>
                        )}
                        {event?.location && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            {event.location}
                          </div>
                        )}
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col justify-between">
                        <div className="space-y-4">
                          {pkg.package_description && (
                            <p className="text-sm text-muted-foreground">{pkg.package_description}</p>
                          )}
                          
                          <div>
                            <h4 className="font-medium text-sm mb-2">Benefits:</h4>
                            <ul className="space-y-1">
                              {(pkg.benefits as string[])?.slice(0, 3).map((benefit: string, idx: number) => (
                                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <span className="text-green-500 mt-0.5">✓</span>
                                  {benefit}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {pkg.max_sponsors && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Users className="h-4 w-4" />
                              {paidSponsors} / {pkg.max_sponsors} sponsors
                              {isFull && <Badge variant="secondary">Full</Badge>}
                            </div>
                          )}
                        </div>

                        <Button 
                          className="w-full mt-4" 
                          disabled={isFull}
                          onClick={() => window.open(`/sponsorship/event/${event.id}`, '_blank')}
                        >
                          {isFull ? "Fully Sponsored" : "Sponsor This Event"}
                          <ExternalLink className="h-4 w-4 ml-2" />
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">No event sponsorships available</h3>
                <p className="text-muted-foreground">Check back later for new opportunities</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="awards" className="space-y-6">
            {loadingAwards ? (
              <p className="text-center text-muted-foreground">Loading opportunities...</p>
            ) : awardOpportunities && awardOpportunities.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {awardOpportunities.map((pkg: any) => {
                  const program = pkg.awards_programs;
                  const paidSponsors = pkg.award_sponsorships?.filter((s: any) => s.status === 'paid').length || 0;
                  const isFull = pkg.max_sponsors && paidSponsors >= pkg.max_sponsors;

                  return (
                    <Card key={pkg.id} className="flex flex-col">
                      {program?.cover_image_url && (
                        <div className="h-48 overflow-hidden rounded-t-lg">
                          <img 
                            src={program.cover_image_url} 
                            alt={program.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <Badge variant="outline" className="mb-2">
                              {pkg.package_name}
                            </Badge>
                            <CardTitle className="text-lg mb-2">{program?.title}</CardTitle>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">
                              ${pkg.price.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        {program?.ceremony_date && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(program.ceremony_date), "MMM d, yyyy")}
                          </div>
                        )}
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col justify-between">
                        <div className="space-y-4">
                          {pkg.package_description && (
                            <p className="text-sm text-muted-foreground">{pkg.package_description}</p>
                          )}
                          
                          <div>
                            <h4 className="font-medium text-sm mb-2">Benefits:</h4>
                            <ul className="space-y-1">
                              {(pkg.benefits as string[])?.slice(0, 3).map((benefit: string, idx: number) => (
                                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <span className="text-green-500 mt-0.5">✓</span>
                                  {benefit}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {pkg.max_sponsors && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Users className="h-4 w-4" />
                              {paidSponsors} / {pkg.max_sponsors} sponsors
                              {isFull && <Badge variant="secondary">Full</Badge>}
                            </div>
                          )}
                        </div>

                        <Button 
                          className="w-full mt-4" 
                          disabled={isFull}
                          onClick={() => window.open(`/purchase-sponsorship/${program.id}`, '_blank')}
                        >
                          {isFull ? "Fully Sponsored" : "Sponsor This Program"}
                          <ExternalLink className="h-4 w-4 ml-2" />
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">No awards sponsorships available</h3>
                <p className="text-muted-foreground">Check back later for new opportunities</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}