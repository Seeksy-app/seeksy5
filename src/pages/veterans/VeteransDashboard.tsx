import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  MessageSquare, Calculator, Clock, FileText, TrendingUp, 
  Shield, ChevronRight, Plus, Sparkles, DollarSign, Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { format } from "date-fns";
import { Helmet } from "react-helmet";
import { CALCULATORS } from "@/lib/veteranCalculatorRegistry";
import { VeteransHeader } from "@/components/veterans/VeteransHeader";

interface Conversation {
  id: string;
  title: string | null;
  last_message_at: string;
}

interface SavedCalc {
  id: string;
  calculator_id: string;
  summary: string | null;
  created_at: string;
}

interface VeteranProfile {
  service_status: string | null;
  branch_of_service: string | null;
  has_intent_to_file: boolean | null;
}

export default function VeteransDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<VeteranProfile | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [savedCalcs, setSavedCalcs] = useState<SavedCalc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user;
      setUser(currentUser ?? null);

      if (!currentUser) {
        navigate('/yourbenefits/auth');
        return;
      }

      // Load profile
      const { data: profileData } = await supabase
        .from('veteran_profiles')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();
      
      if (profileData) setProfile(profileData);

      // Load recent conversations
      const { data: convos } = await supabase
        .from('veteran_conversations')
        .select('id, title, last_message_at')
        .eq('user_id', currentUser.id)
        .eq('is_archived', false)
        .order('last_message_at', { ascending: false })
        .limit(5);
      
      if (convos) setConversations(convos);

      // Load saved calculations
      const { data: calcs } = await supabase
        .from('veteran_calculator_results')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (calcs) setSavedCalcs(calcs as SavedCalc[]);

      setIsLoading(false);
    };

    loadData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate('/yourbenefits/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const quickActions = [
    {
      title: "Talk to AI Agent",
      description: "Get personalized claims guidance",
      icon: MessageSquare,
      href: "/yourbenefits/claims-agent",
      color: "text-orange-500 bg-orange-500/10",
    },
    {
      title: "VA Compensation Calculator",
      description: "Estimate your monthly benefits",
      icon: DollarSign,
      href: "/yourbenefits/calculators/va-compensation",
      color: "text-green-500 bg-green-500/10",
    },
    {
      title: "Military Buy-Back",
      description: "Calculate service credit costs",
      icon: Calculator,
      href: "/yourbenefits/calculators/military-buyback",
      color: "text-blue-500 bg-blue-500/10",
    },
    {
      title: "TSP Growth Calculator",
      description: "Project your retirement savings",
      icon: TrendingUp,
      href: "/yourbenefits/calculators/tsp-growth",
      color: "text-purple-500 bg-purple-500/10",
    },
  ];

  const popularCalculators = CALCULATORS.slice(0, 6);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const userName = user?.user_metadata?.full_name?.split(' ')[0] || 'Veteran';

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Dashboard | Veterans Benefits Hub</title>
      </Helmet>

      <VeteransHeader variant="dashboard" />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Welcome Header */}
        <div className="mb-8 p-6 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/10">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {userName}!</h1>
          <p className="text-muted-foreground">
            Continue exploring your benefits or start a new conversation.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {quickActions.map((action) => (
            <Link key={action.href} to={action.href}>
              <Card className="h-full hover:shadow-md hover:border-primary/30 transition-all cursor-pointer bg-gradient-to-br from-background to-muted/30">
                <CardHeader className="pb-2">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${action.color}`}>
                    <action.icon className="w-5 h-5" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-base">{action.title}</CardTitle>
                  <CardDescription className="text-sm">{action.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Conversations - Limited to 5 since sidebar has full history */}
            <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-orange-500" />
                    Recent Conversations
                  </CardTitle>
                  <CardDescription>Quick access to your latest 5 chats • Full history in sidebar</CardDescription>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link to="/yourbenefits/claims-agent">
                    <Plus className="w-4 h-4 mr-2" />
                    New Chat
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {conversations.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4">No conversations yet</p>
                    <Button asChild>
                      <Link to="/yourbenefits/claims-agent">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Start Your First Chat
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {conversations.slice(0, 5).map((convo) => (
                      <Link
                        key={convo.id}
                        to={`/yourbenefits/claims-agent?conversation=${convo.id}`}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-orange-500/10 bg-background/50 transition-colors group border border-transparent hover:border-orange-500/20"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                            <MessageSquare className="w-4 h-4 text-orange-500" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{convo.title || 'Benefits Discussion'}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(convo.last_message_at), 'MMM d, h:mm a')}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Popular Calculators */}
            <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-blue-500" />
                    Popular Calculators
                  </CardTitle>
                  <CardDescription>Quick access to benefit tools</CardDescription>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/yourbenefits#calculators-section">View All</Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {popularCalculators.map((calc) => (
                    <Link
                      key={calc.id}
                      to={calc.route}
                      className="p-3 rounded-lg border border-blue-500/10 hover:border-blue-500/30 hover:bg-blue-500/10 bg-background/50 transition-all text-center"
                    >
                      <Calculator className="w-5 h-5 mx-auto mb-2 text-blue-500" />
                      <p className="text-sm font-medium line-clamp-2">{calc.title}</p>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Summary */}
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Your Profile
                </CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/yourbenefits/profile">Edit</Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between p-2 rounded bg-background/50">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-medium capitalize">{profile?.service_status || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-background/50">
                    <span className="text-muted-foreground">Branch</span>
                    <span className="font-medium capitalize">{profile?.branch_of_service || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-background/50">
                    <span className="text-muted-foreground">Intent to File</span>
                    <span className={`font-medium ${profile?.has_intent_to_file ? 'text-green-600' : 'text-amber-600'}`}>
                      {profile?.has_intent_to_file ? 'Yes' : 'Not yet'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Saved Calculations */}
            <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-500" />
                  Saved Calculations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {savedCalcs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No saved calculations yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {savedCalcs.map((calc) => (
                      <div key={calc.id} className="p-2 rounded-lg bg-background/50 border border-green-500/10 text-sm">
                        <p className="font-medium">{calc.calculator_id.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(calc.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resources */}
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  Quick Resources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <a 
                  href="https://www.va.gov/claim-or-appeal-status/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block p-2 rounded hover:bg-white/50 text-sm transition-colors"
                >
                  Check Claim Status →
                </a>
                <a 
                  href="https://www.va.gov/health-care/schedule-view-va-appointments/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block p-2 rounded hover:bg-white/50 text-sm transition-colors"
                >
                  Schedule VA Appointment →
                </a>
                <a 
                  href="https://www.va.gov/disability/file-disability-claim-form-21-526ez/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block p-2 rounded hover:bg-white/50 text-sm transition-colors"
                >
                  File a Claim Online →
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
