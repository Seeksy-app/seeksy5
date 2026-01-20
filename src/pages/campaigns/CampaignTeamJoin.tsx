import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Users, 
  Megaphone, 
  PenLine, 
  BarChart3, 
  DollarSign, 
  Shield,
  Check,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const colors = {
  primary: "#0031A2",
  primaryLight: "#2566FF",
  accent: "#FFCC33",
  textPrimary: "#0A0A0A",
  textSecondary: "#5A6472",
  textOnDark: "#FFFFFF",
  background: "#F5F7FA",
};

// Role configurations
const roleConfig: Record<string, { 
  title: string; 
  description: string; 
  icon: React.ElementType;
  features: string[];
}> = {
  manager: {
    title: "Campaign Manager",
    description: "Full access to strategy, scheduling, and team coordination",
    icon: Users,
    features: [
      "AI Campaign Manager access",
      "Team coordination tools",
      "Calendar & scheduling",
      "Full analytics dashboard",
    ],
  },
  communications: {
    title: "Communications Director",
    description: "Handle messaging, speeches, and public relations",
    icon: Megaphone,
    features: [
      "AI Speechwriter access",
      "Press release templates",
      "Social media management",
      "Email campaign tools",
    ],
  },
  content: {
    title: "Content Creator",
    description: "Create and manage campaign content and visuals",
    icon: PenLine,
    features: [
      "Content Studio access",
      "Graphics & media tools",
      "Social post scheduling",
      "Asset library",
    ],
  },
  field: {
    title: "Field Organizer",
    description: "Manage volunteers, events, and grassroots outreach",
    icon: BarChart3,
    features: [
      "Volunteer CRM access",
      "Event management",
      "Canvassing tools",
      "GOTV features",
    ],
  },
  finance: {
    title: "Finance Director",
    description: "Handle fundraising, donor management, and compliance",
    icon: DollarSign,
    features: [
      "Donation tracking",
      "Donor CRM access",
      "Fundraising tools",
      "Compliance reports",
    ],
  },
  volunteer: {
    title: "Volunteer",
    description: "Help with campaign activities and outreach",
    icon: Shield,
    features: [
      "Task assignments",
      "Event sign-ups",
      "Phone banking tools",
      "Canvassing lists",
    ],
  },
};

export default function CampaignTeamJoin() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const role = searchParams.get("role") || "volunteer";
  const campaignName = searchParams.get("campaign") || "Your Campaign";
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const currentRole = roleConfig[role] || roleConfig.volunteer;
  const RoleIcon = currentRole.icon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/campaign-staff/dashboard`,
          data: {
            full_name: formData.name,
            campaign_role: role,
            source: "team_invite",
          },
        },
      });

      if (error) throw error;

      toast.success("Account created! Welcome to the team.", {
        description: `You've joined as ${currentRole.title}`,
      });

      navigate("/campaign-staff/dashboard");
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error(error.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: colors.background }}
    >
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8">
        {/* Left side - Role info */}
        <div className="flex flex-col justify-center">
          <div className="mb-6">
            <div 
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-4"
              style={{ backgroundColor: colors.accent, color: colors.primary }}
            >
              Team Invite
            </div>
            <h1 
              className="text-3xl md:text-4xl font-bold mb-2"
              style={{ color: colors.textPrimary }}
            >
              Join {campaignName}
            </h1>
            <p style={{ color: colors.textSecondary }}>
              You've been invited to join the campaign team
            </p>
          </div>

          {/* Role card */}
          <Card className="mb-6">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${colors.primary}15` }}
                >
                  <RoleIcon className="w-6 h-6" style={{ color: colors.primary }} />
                </div>
                <div>
                  <CardTitle className="text-lg">{currentRole.title}</CardTitle>
                  <CardDescription>{currentRole.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <h4 className="text-sm font-medium mb-3" style={{ color: colors.textSecondary }}>
                What you'll have access to:
              </h4>
              <ul className="space-y-2">
                {currentRole.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4" style={{ color: colors.primary }} />
                    <span style={{ color: colors.textPrimary }}>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <p className="text-xs" style={{ color: colors.textSecondary }}>
            Powered by <span className="font-semibold">CampaignStaff.ai</span>
          </p>
        </div>

        {/* Right side - Signup form */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Create Your Account</CardTitle>
            <CardDescription>
              Fill in your details to join the campaign
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Smith"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@campaign.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 font-semibold"
                style={{ backgroundColor: colors.primary }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Join the Campaign"
                )}
              </Button>

              <p className="text-center text-sm" style={{ color: colors.textSecondary }}>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/campaign-staff")}
                  className="font-medium hover:underline"
                  style={{ color: colors.primary }}
                >
                  Sign in
                </button>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
