import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Clock, MapPin, Plus, Users, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

const SignupSheets = () => {
  const navigate = useNavigate();

  const { data: sheets, isLoading } = useQuery({
    queryKey: ["signup_sheets"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("signup_sheets")
        .select(`
          *,
          signup_slots(count)
        `)
        .eq("user_id", user.id)
        .order("start_date", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const now = new Date();
  const activeSheets = sheets?.filter(s => new Date(s.end_date) >= now) || [];
  const expiredSheets = sheets?.filter(s => new Date(s.end_date) < now) || [];

  const SheetCard = ({ sheet }: { sheet: any }) => {
    const totalSlots = sheet.signup_slots?.[0]?.count || 0;
    
    return (
      <Card 
        className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer"
        onClick={() => navigate(`/signup-sheets/${sheet.id}`)}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-xl">{sheet.title}</CardTitle>
                {sheet.is_published ? (
                  <Badge variant="default">Published</Badge>
                ) : (
                  <Badge variant="secondary">Draft</Badge>
                )}
              </div>
              {sheet.description && (
                <CardDescription className="line-clamp-2">{sheet.description}</CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>
              {format(new Date(sheet.start_date), "MMM d")} - {format(new Date(sheet.end_date), "MMM d, yyyy")}
            </span>
          </div>
          {sheet.location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{sheet.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{sheet.slot_duration} minute slots</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-primary" />
              <span className="font-medium">{totalSlots} slots created</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
              <ClipboardList className="w-10 h-10 text-primary" />
              Sign-up Sheets
            </h1>
            <p className="text-muted-foreground mt-2">
              Create and manage volunteer sign-up sheets
            </p>
          </div>
          <Button onClick={() => navigate("/create-signup-sheet")} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Sheet
          </Button>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="active">
              Active ({activeSheets.length})
            </TabsTrigger>
            <TabsTrigger value="expired">
              Expired ({expiredSheets.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="h-64 animate-pulse bg-muted/20" />
                ))}
              </div>
            ) : activeSheets.length === 0 ? (
              <Card className="p-12 text-center">
                <ClipboardList className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No sign-up sheets yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first sign-up Seeksy and let people volunteer for time slots
                </p>
                <Button onClick={() => navigate("/create-signup-sheet")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Sign-up Seeksy
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeSheets.map((sheet) => (
                  <SheetCard key={sheet.id} sheet={sheet} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="expired" className="mt-6">
            {expiredSheets.length === 0 ? (
              <Card className="p-12 text-center">
                <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No expired sheets</h3>
                <p className="text-muted-foreground">
                  Your past sign-up sheets will appear here
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {expiredSheets.map((sheet) => (
                  <SheetCard key={sheet.id} sheet={sheet} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SignupSheets;
