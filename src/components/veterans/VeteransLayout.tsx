import { ReactNode, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, MessageSquare, Calculator, Plus, User, LogOut, Menu, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useSavedCalculationsStore, CALC_DISPLAY_NAMES, CALCULATOR_ROUTES } from "@/hooks/useSavedCalculationsStore";

interface VeteransLayoutProps {
  children: ReactNode;
}

interface Conversation {
  id: string;
  title: string | null;
  last_message_at: string;
  created_at: string;
}

export function VeteransLayout({ children }: VeteransLayoutProps) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Use global store for saved calculations (real-time updates)
  const { calculations: savedCalcs, setUserId, loadCalculations } = useSavedCalculationsStore();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Set user ID for store (triggers load)
        setUserId(session.user.id);
        
        // Load conversations
        const { data: convos } = await supabase
          .from('veteran_conversations')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('is_archived', false)
          .order('last_message_at', { ascending: false })
          .limit(20);
        
        if (convos) setConversations(convos);
      }
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setUserId(session.user.id);
      } else {
        setUserId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUserId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/yourbenefits');
  };

  const handleNewConversation = () => {
    navigate('/yourbenefits/claims-agent?new=true');
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await supabase.from('veteran_conversations').delete().eq('id', id);
    setConversations(prev => prev.filter(c => c.id !== id));
  };

  const handleCalcClick = (calc: typeof savedCalcs[0]) => {
    const route = CALCULATOR_ROUTES[calc.calculator_id];
    if (route) {
      navigate(`${route}?saved=${calc.id}`);
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {user && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            )}
            <Link to="/yourbenefits" className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              <span className="font-semibold">Military & Federal Benefits Hub</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-2">
            {user && (
              <Button asChild variant="ghost" size="sm">
                <Link to="/yourbenefits/dashboard">
                  Dashboard
                </Link>
              </Button>
            )}
            <Button asChild variant="ghost" size="sm">
              <Link to="/yourbenefits#calculators-section">
                <Calculator className="w-4 h-4 mr-2" />
                Calculators
              </Link>
            </Button>
            
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {user.email}
                </span>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-1" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/yourbenefits/auth">Login</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/yourbenefits/auth">Sign Up Free</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Sidebar - Only show for logged in users */}
        {user && (
          <>
            {/* Desktop Sidebar */}
            <aside className={cn(
              "hidden lg:flex flex-col w-64 border-r bg-muted/30 shrink-0 transition-all",
              !sidebarOpen && "w-0 overflow-hidden"
            )}>
              <div className="p-4 border-b">
                <Button onClick={handleNewConversation} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  New Conversation
                </Button>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-4">
                  {/* Chat History */}
                  <div className="mb-6">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                      <MessageSquare className="w-3 h-3" />
                      Chat History
                    </h3>
                    {conversations.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No conversations yet</p>
                    ) : (
                      <div className="space-y-1">
                        {conversations.map((convo) => (
                          <Link
                            key={convo.id}
                            to={`/yourbenefits/claims-agent?conversation=${convo.id}`}
                            className="group flex items-center justify-between p-2 rounded-md hover:bg-muted text-sm"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="truncate font-medium">
                                {convo.title || 'New conversation'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(convo.last_message_at), 'MMM d')}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100"
                              onClick={(e) => handleDeleteConversation(convo.id, e)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Saved Calculations */}
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Calculator className="w-3 h-3" />
                      Saved Calculations
                    </h3>
                    {savedCalcs.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No saved calculations</p>
                    ) : (
                      <div className="space-y-1">
                        {savedCalcs.map((calc) => (
                          <button
                            key={calc.id}
                            onClick={() => handleCalcClick(calc)}
                            className="w-full text-left p-2 rounded-md hover:bg-muted text-sm cursor-pointer transition-colors"
                          >
                            <p className="font-medium">
                              {CALC_DISPLAY_NAMES[calc.calculator_id] || calc.calculator_id}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {calc.summary || format(new Date(calc.created_at), 'MMM d, yyyy')}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>

              {/* User section */}
              <div className="p-4 border-t">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.email}</p>
                    <p className="text-xs text-muted-foreground">Veteran Account</p>
                  </div>
                </div>
              </div>
            </aside>

            {/* Mobile Sidebar */}
            {mobileMenuOpen && (
              <div className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
                <aside 
                  className="absolute left-0 top-14 bottom-0 w-72 bg-background border-r shadow-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-4 border-b">
                    <Button onClick={handleNewConversation} className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      New Conversation
                    </Button>
                  </div>

                  <ScrollArea className="h-[calc(100%-140px)]">
                    <div className="p-4">
                      {/* Same content as desktop */}
                      <div className="mb-6">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                          Chat History
                        </h3>
                        {conversations.map((convo) => (
                          <Link
                            key={convo.id}
                            to={`/yourbenefits/claims-agent?conversation=${convo.id}`}
                            className="block p-2 rounded-md hover:bg-muted text-sm"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <p className="truncate font-medium">{convo.title || 'New conversation'}</p>
                          </Link>
                        ))}
                      </div>
                      
                      <div>
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                          Saved Calculations
                        </h3>
                        {savedCalcs.map((calc) => (
                          <button
                            key={calc.id}
                            onClick={() => handleCalcClick(calc)}
                            className="w-full text-left p-2 rounded-md hover:bg-muted text-sm"
                          >
                            <p className="font-medium">{CALC_DISPLAY_NAMES[calc.calculator_id] || calc.calculator_id}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {calc.summary || format(new Date(calc.created_at), 'MMM d')}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </ScrollArea>
                </aside>
              </div>
            )}
          </>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
