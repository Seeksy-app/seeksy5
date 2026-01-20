import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  CalendarSearch, 
  CalendarClock, 
  Boxes, 
  Users, 
  PartyPopper, 
  Megaphone, 
  Video, 
  Settings,
  Menu,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Bot
} from "lucide-react";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { VenueAuthModal } from "./VenueAuthModal";

const colors = {
  background: "#F5F7FF",
  panel: "#FFFFFF",
  panelBorder: "#E2E8F0",
  primary: "#053877",
  secondary: "#2C6BED",
  accent: "#E6ECFF",
  textDark: "#1A1A1A",
  textMuted: "#6B7280",
  textOnDark: "#FFFFFF",
};

interface VenueLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: "/venueOS/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/venueOS/bookings", label: "Bookings", icon: CalendarSearch },
  { path: "/venueOS/calendar", label: "Calendar", icon: CalendarClock },
  { path: "/venueOS/inventory", label: "Inventory", icon: Boxes },
  { path: "/venueOS/clients", label: "Clients", icon: Users },
  { path: "/venueOS/events", label: "Events", icon: PartyPopper },
  { path: "/venueOS/influencers", label: "Influencers", icon: Megaphone },
  { path: "/venueOS/ai-manager", label: "AI Manager", icon: Bot },
  { path: "/venueOS/studio", label: "Media Studio", icon: Video },
  { path: "/venueOS/settings", label: "Settings", icon: Settings },
];

export function VenueLayout({ children }: VenueLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem("venueos_sidebar_collapsed") === "true";
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const toggleSidebar = () => {
    const newValue = !sidebarCollapsed;
    setSidebarCollapsed(newValue);
    localStorage.setItem("venueos_sidebar_collapsed", String(newValue));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/venueOS");
  };

  const SidebarContent = () => (
    <nav className="flex flex-col gap-1 p-3">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
              isActive
                ? "shadow-sm"
                : "hover:bg-white/10"
            }`}
            style={{
              backgroundColor: isActive ? colors.secondary : "transparent",
              color: isActive ? colors.textOnDark : "rgba(255,255,255,0.85)",
            }}
            title={sidebarCollapsed ? item.label : undefined}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!sidebarCollapsed && <span>{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: colors.background }}>
      {/* Desktop Sidebar */}
      <aside 
        className={`hidden lg:flex flex-col fixed left-0 top-0 h-screen z-40 transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-56'
        }`}
        style={{ backgroundColor: colors.primary }}
      >
        {/* Logo + Collapse Toggle */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <Link to="/venueOS" className="flex items-center gap-2">
            <div 
              className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: colors.secondary }}
            >
              <span className="text-white font-bold text-lg">V</span>
            </div>
            {!sidebarCollapsed && (
              <span className="text-base font-bold text-white">
                Venue<span style={{ color: colors.secondary }}>OS</span>
              </span>
            )}
          </Link>
          {!sidebarCollapsed && (
            <button
              onClick={toggleSidebar}
              className="h-7 w-7 rounded flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Expand button when collapsed */}
        {sidebarCollapsed && (
          <div className="p-2 flex justify-center">
            <button
              onClick={toggleSidebar}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              title="Expand sidebar"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Nav Items */}
        <div className="flex-1 overflow-y-auto">
          <SidebarContent />
        </div>

        {/* Bottom section */}
        <div className="p-3 border-t border-white/10">
          {user ? (
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              title={sidebarCollapsed ? "Logout" : undefined}
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              {!sidebarCollapsed && <span>Logout</span>}
            </button>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-sm font-medium"
              style={{ backgroundColor: colors.secondary, color: colors.textOnDark }}
            >
              {!sidebarCollapsed ? "Sign In" : "→"}
            </button>
          )}
        </div>

      </aside>

      {/* Mobile Header */}
      <header 
        className="lg:hidden fixed top-0 left-0 right-0 z-50 border-b h-14 flex items-center px-4"
        style={{ 
          backgroundColor: colors.primary,
          borderColor: "rgba(255,255,255,0.1)"
        }}
      >
        <Link to="/venueOS" className="flex items-center gap-2 flex-1">
          <div 
            className="h-8 w-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: colors.secondary }}
          >
            <span className="text-white font-bold text-lg">V</span>
          </div>
          <span className="text-lg font-bold text-white">
            Venue<span style={{ color: colors.secondary }}>OS</span>
          </span>
        </Link>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent 
            side="left" 
            className="w-64 p-0"
            style={{ backgroundColor: colors.primary, borderColor: "rgba(255,255,255,0.1)" }}
          >
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div 
                  className="h-8 w-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: colors.secondary }}
                >
                  <span className="text-white font-bold">V</span>
                </div>
                <span className="text-lg font-bold text-white">
                  VenueOS
                </span>
              </div>
            </div>
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </header>

      {/* Main Content */}
      <main 
        className={`flex-1 min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-56'
        } pt-14 lg:pt-0`}
      >
        <div className="max-w-[1200px] mx-auto px-6 py-6 animate-fade-in">
          {children}
        </div>
      </main>

      {/* Auth Modal */}
      <VenueAuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  );
}
