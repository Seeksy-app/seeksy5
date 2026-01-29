import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, ArrowLeft, Settings, BarChart3, Users, 
  Calendar, Share2, Video, Eye, Copy 
} from "lucide-react";
import { format } from "date-fns";
import { CreateCategoryDialog } from "@/components/awards/CreateCategoryDialog";
import { SponsorshipPackageManager } from "@/components/awards/SponsorshipPackageManager";
import { SponsorshipFlyerUpload } from "@/components/awards/SponsorshipFlyerUpload";
import { NomineeManager } from "@/components/awards/NomineeManager";
import { AwardsFinancialDashboard } from "@/components/awards/AwardsFinancialDashboard";
import { useToast } from "@/hooks/use-toast";
import { BackButton } from "@/components/navigation/BackButton";

interface AwardsProgram {
  id: string;
  title: string;
  description?: string;
  status: string;
  cover_image_url?: string;
  ceremony_date?: string;
  sponsorship_flyer_url?: string;
  award_categories?: any[];
}

export default function AwardsProgramDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: program, isLoading, refetch } = useQuery({
    queryKey: ["awards-program", id],
    queryFn: async () => {
      const result = await (supabase as any)
        .from("awards_programs")
        .select(`
          *,
          award_categories (
            *,
            award_nominees (*)
          )
        `)
        .eq("id", id)
        .single();
      
      if (result.error) throw result.error;
      return result.data as AwardsProgram;
    },
  });

  const copyNominationLink = () => {
    const link = `${window.location.origin}/nominate/${id}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link Copied!",
      description: "Nomination link copied to clipboard",
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: "bg-gray-500",
      nominations_open: "bg-blue-500",
      voting_open: "bg-green-500",
      closed: "bg-orange-500",
      completed: "bg-purple-500",
    };
    return colors[status as keyof typeof colors] || "bg-gray-500";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-brand-gold border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!program) {
    return <div>Program not found</div>;
  }

  const totalNominees = program.award_categories?.reduce(
    (sum: number, cat: any) => sum + (cat.award_nominees?.length || 0), 
    0
  ) || 0;

  return (
    <div className="container mx-auto py-8 px-4">
      <BackButton fallbackPath="/awards" className="mb-6" />

      {/* Header */}
      <div className="mb-8">
        {program.cover_image_url ? (
          <div className="w-full h-64 rounded-lg overflow-hidden mb-6">
            <img
              src={program.cover_image_url}
              alt={program.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-full h-64 bg-brand-gold/20 rounded-lg flex items-center justify-center mb-6">
            <Trophy className="h-24 w-24 text-brand-gold" />
          </div>
        )}

        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold">{program.title}</h1>
              <Badge className={`${getStatusColor(program.status)} text-white`}>
                {program.status.replace(/_/g, " ").toUpperCase()}
              </Badge>
            </div>
            {program.description && (
              <p className="text-muted-foreground text-lg">{program.description}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={copyNominationLink}>
              <Copy className="mr-2 h-4 w-4" />
              Copy Nomination Link
            </Button>
            <Button variant="outline" size="icon" onClick={() => window.open(`/nominate/${id}`, '_blank')}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigate(`/awards/${id}/edit`)}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <Card className="p-4 border-brand-gold/20">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Trophy className="h-4 w-4" />
              <span className="text-sm">Categories</span>
            </div>
            <p className="text-2xl font-bold">{program.award_categories?.length || 0}</p>
          </Card>
          <Card className="p-4 border-brand-gold/20">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              <span className="text-sm">Nominees</span>
            </div>
            <p className="text-2xl font-bold">{totalNominees}</p>
          </Card>
          <Card className="p-4 border-brand-gold/20">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <BarChart3 className="h-4 w-4" />
              <span className="text-sm">Total Votes</span>
            </div>
            <p className="text-2xl font-bold">0</p>
          </Card>
          <Card className="p-4 border-brand-gold/20">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">Ceremony</span>
            </div>
            <p className="text-sm font-semibold">
              {program.ceremony_date ? format(new Date(program.ceremony_date), "MMM d, yyyy") : "TBD"}
            </p>
          </Card>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="categories" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="nominees">Nominees</TabsTrigger>
          <TabsTrigger value="sponsorships">Sponsorships</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="votes">Votes</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="ceremony">Ceremony</TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Award Categories</h2>
              <CreateCategoryDialog 
                programId={id!} 
                programTitle={program.title}
                programDescription={program.description || undefined}
                onSuccess={refetch} 
              />
            </div>

            {program.award_categories && program.award_categories.length > 0 ? (
              <div className="space-y-4">
                {program.award_categories.map((category: any) => (
                  <Card key={category.id} className="p-4 border-brand-gold/20 hover:border-brand-gold/50 transition-all cursor-pointer">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{category.name}</h3>
                        {category.description && (
                          <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                        )}
                        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                          <span>{category.award_nominees?.length || 0} Nominees</span>
                          {category.media_type && (
                            <Badge variant="outline">{category.media_type}</Badge>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">Manage</Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No categories yet. Add your first category to get started.</p>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="nominees">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-6">All Nominees</h2>
            <NomineeManager programId={id!} />
          </Card>
        </TabsContent>

        <TabsContent value="sponsorships">
          <div className="space-y-6">
            <SponsorshipFlyerUpload 
              programId={id!} 
              currentFlyerUrl={program.sponsorship_flyer_url}
            />
            <SponsorshipPackageManager programId={id!} />
          </div>
        </TabsContent>

        <TabsContent value="financials">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-6">Financial Dashboard</h2>
            <AwardsFinancialDashboard programId={id!} />
          </Card>
        </TabsContent>

        <TabsContent value="votes">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-6">Vote Tracking</h2>
            <p className="text-muted-foreground">Real-time vote tracking coming soon...</p>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-6">Analytics & Predictions</h2>
            <p className="text-muted-foreground">Winner predictions and analytics coming soon...</p>
          </Card>
        </TabsContent>

        <TabsContent value="ceremony">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-6">Virtual Ceremony</h2>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Video className="h-5 w-5" />
              <p>Connect your Studio for a virtual awards presentation</p>
            </div>
            <Button className="mt-4 bg-brand-gold hover:bg-brand-darkGold text-white">
              Set Up Studio Session
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
