import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  MessageSquare, 
  PenTool, 
  Users, 
  Globe,
  Menu,
  LogOut,
  Mail,
  Phone,
  Video,
  DollarSign,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { CampaignAuthModal } from "./CampaignAuthModal";

const colors = {
  background: "#F7F9FC",
  panel: "#FFFFFF",
  panelBorder: "#E2E8F0",
  primary: "#0A1628",
  secondary: "#1A73E8",
  accent: "#FFD764",
  textDark: "#1A1A1A",
  textMuted: "#6B7280",
};

interface CampaignLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: "/campaign-staff/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/campaign-staff/ai-manager", label: "AI Manager", icon: MessageSquare },
  { path: "/campaign-staff/studio", label: "Content Studio", icon: PenTool },
  { path: "/campaign-staff/outreach", label: "Outreach", icon: Users },
  { path: "/campaign-staff/email", label: "Email", icon: Mail },
  { path: "/campaign-staff/sms", label: "SMS", icon: Phone },
  { path: "/campaign-staff/live", label: "Live Stream", icon: Video },
  { path: "/campaign-staff/donations", label: "Donations", icon: DollarSign },
  { path: "/campaign-staff/site-builder", label: "Site Builder", icon: Globe },
];

export function CampaignLayout({ children }: CampaignLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/campaign-staff");
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
              backgroundColor: isActive ? colors.accent : "transparent",
              color: isActive ? colors.textDark : "white",
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
        {/* Logo */}
        <div className="p-4 border-b border-white/10">
          <Link to="/campaign-staff" className="flex items-center gap-2">
            <div 
              className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: colors.accent }}
            >
              <span style={{ color: colors.primary }} className="font-bold text-lg">C</span>
            </div>
            {!sidebarCollapsed && (
              <span className="text-base font-bold text-white">
                Campaign<span style={{ color: colors.accent }}>Staff</span>
              </span>
            )}
          </Link>
        </div>

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
              style={{ backgroundColor: colors.accent, color: colors.textDark }}
            >
              {!sidebarCollapsed ? "Sign In" : "→"}
            </button>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-20 h-6 w-6 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
          style={{ color: colors.primary }}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </aside>

      {/* Mobile Header */}
      <header 
        className="lg:hidden fixed top-0 left-0 right-0 z-50 border-b h-14 flex items-center px-4"
        style={{ 
          backgroundColor: colors.primary,
          borderColor: "rgba(255,255,255,0.1)"
        }}
      >
        <Link to="/campaign-staff" className="flex items-center gap-2 flex-1">
          <div 
            className="h-8 w-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: colors.accent }}
          >
            <span style={{ color: colors.primary }} className="font-bold text-lg">C</span>
          </div>
          <span className="text-lg font-bold text-white">
            Campaign<span style={{ color: colors.accent }}>Staff</span>
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
                  style={{ backgroundColor: colors.accent }}
                >
                  <span style={{ color: colors.primary }} className="font-bold">C</span>
                </div>
                <span className="text-lg font-bold text-white">
                  CampaignStaff
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
        <div className="p-6">
          {children}
        </div>
      </main>

      {/* Auth Modal */}
      <CampaignAuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  );
}
