import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Settings, LogOut, User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VeteransHeaderProps {
  variant?: "landing" | "dashboard";
}

export function VeteransHeader({ variant = "landing" }: VeteransHeaderProps) {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<{ full_name?: string; photo_url?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
    if (session?.user) {
      await loadProfile(session.user.id);
    }
    setLoading(false);
  };

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from("veteran_profiles")
      .select("full_name, photo_url")
      .eq("user_id", userId)
      .single();
    if (data) {
      setProfile(data as { full_name?: string; photo_url?: string });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/yourbenefits");
  };

  const scrollToCalculators = () => {
    document.getElementById('calculators-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left side - Profile dropdown when logged in, logo when not */}
        <div className="flex items-center gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.photo_url || undefined} alt="Profile" />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm font-medium">
                    {profile?.full_name || user?.email?.split('@')[0] || 'Account'}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/yourbenefits/profile" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/yourbenefits/settings" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}

          <Link to="/yourbenefits" className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-semibold hidden md:inline">Military & Federal Benefits Hub</span>
          </Link>
        </div>

        {/* Center nav (landing only) */}
        {variant === "landing" && (
          <nav className="hidden md:flex items-center gap-6">
            <button onClick={scrollToCalculators} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Calculators
            </button>
            <Link to="/yourbenefits/referral-partners" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Referral Program
            </Link>
            <Link to="/yourbenefits/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              About Us
            </Link>
          </nav>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2">
          {loading ? null : user ? (
            <Button asChild variant="default" size="sm">
              <Link to="/yourbenefits/dashboard">Dashboard</Link>
            </Button>
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
  );
}
