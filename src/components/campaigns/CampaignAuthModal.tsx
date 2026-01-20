import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

// Brand colors from spec
const colors = {
  primary: "#0031A2",
  primaryDark: "#001B5C",
  accent: "#FFCC33",
  surface: "#FFFFFF",
  borderSubtle: "#E1E5ED",
  textPrimary: "#0A0A0A",
  textSecondary: "#5A6472",
  textOnDark: "#FFFFFF",
};

interface CampaignAuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CampaignAuthModal({ open, onOpenChange }: CampaignAuthModalProps) {
  const [mode, setMode] = useState<"create" | "signin">("create");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "create") {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
            },
          },
        });

        if (error) throw error;

        toast({
          title: "Account created!",
          description: "Welcome to CampaignStaff.ai. Let's set up your campaign.",
        });

        onOpenChange(false);
        navigate("/campaign-staff/dashboard");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        toast({
          title: "Welcome back!",
          description: "You're now signed in.",
        });

        onOpenChange(false);
        navigate("/campaign-staff/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[420px] p-0 overflow-hidden"
        style={{ 
          backgroundColor: colors.surface,
          borderRadius: "18px",
          border: `1px solid ${colors.borderSubtle}`,
          boxShadow: "0 18px 45px rgba(15,23,42,0.22)"
        }}
      >
        <div className="p-8">
          <DialogHeader className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div 
                className="h-10 w-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: colors.primary }}
              >
                <span className="text-white font-bold text-xl">C</span>
              </div>
              <span className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                Campaign<span style={{ color: colors.primary }}>Staff</span>.ai
              </span>
            </div>
            <DialogTitle 
              className="text-xl font-bold"
              style={{ color: colors.textPrimary }}
            >
              {mode === "create" 
                ? "Create your CampaignStaff.ai account" 
                : "Sign in to CampaignStaff.ai"}
            </DialogTitle>
            <DialogDescription style={{ color: colors.textSecondary }}>
              {mode === "create"
                ? "Save your campaign plan, content, events, and AI conversations so you can pick up right where you left off."
                : "Welcome back! Sign in to access your campaign dashboard."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "create" && (
              <div>
                <Label 
                  htmlFor="fullName" 
                  className="text-sm font-medium"
                  style={{ color: colors.textPrimary }}
                >
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Your name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required={mode === "create"}
                  className="mt-1"
                  style={{ borderColor: colors.borderSubtle }}
                />
              </div>
            )}

            <div>
              <Label 
                htmlFor="email" 
                className="text-sm font-medium"
                style={{ color: colors.textPrimary }}
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="mt-1"
                style={{ borderColor: colors.borderSubtle }}
              />
            </div>

            <div>
              <Label 
                htmlFor="password" 
                className="text-sm font-medium"
                style={{ color: colors.textPrimary }}
              >
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={mode === "create" ? "Create a password" : "Enter your password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="mt-1"
                style={{ borderColor: colors.borderSubtle }}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full font-medium"
              disabled={loading}
              style={{ 
                backgroundColor: colors.primary, 
                color: colors.textOnDark 
              }}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "create" ? "Create Account" : "Sign In"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setMode(mode === "create" ? "signin" : "create")}
              className="text-sm font-medium hover:opacity-80"
              style={{ color: colors.primary }}
            >
              {mode === "create" 
                ? "Already have an account? Sign in" 
                : "Don't have an account? Create one"}
            </button>
          </div>

          <p 
            className="mt-6 text-xs text-center"
            style={{ color: colors.textSecondary }}
          >
            Your data is encrypted and never sold. Free to start—no credit card required.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
