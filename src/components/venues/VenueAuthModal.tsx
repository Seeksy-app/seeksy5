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

const colors = {
  primary: "#053877",
  primaryDark: "#042a5c",
  secondary: "#2C6BED",
  surface: "#FFFFFF",
  borderSubtle: "#E1E5ED",
  textPrimary: "#0A0A0A",
  textSecondary: "#5A6472",
  textOnDark: "#FFFFFF",
};

interface VenueAuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VenueAuthModal({ open, onOpenChange }: VenueAuthModalProps) {
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    venueName: "",
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
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
              venue_name: formData.venueName,
            },
          },
        });

        if (error) throw error;

        // Create the venue record
        if (data.user) {
          await (supabase as any).from('venues').insert({
            owner_user_id: data.user.id,
            name: formData.venueName,
            slug: formData.venueName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          });
        }

        toast({
          title: "Account created!",
          description: "Welcome to Seeksy VenueOS. Let's set up your venue.",
        });

        onOpenChange(false);
        navigate("/venueOS/dashboard");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        toast({
          title: "Welcome back!",
          description: "You're now signed in.",
        });

        onOpenChange(false);
        navigate("/venueOS/dashboard");
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
                <span className="text-white font-bold text-xl">V</span>
              </div>
              <span className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                Seeksy <span style={{ color: colors.secondary }}>VenueOS</span>
              </span>
            </div>
            <DialogTitle 
              className="text-xl font-bold"
              style={{ color: colors.textPrimary }}
            >
              {mode === "signup" 
                ? "Create your VenueOS account" 
                : "Welcome back to VenueOS"}
            </DialogTitle>
            <DialogDescription style={{ color: colors.textSecondary }}>
              {mode === "signup"
                ? "Save bookings, timelines, inventory, and AI conversations in one place."
                : "Sign in to manage your events, clients, and marketing."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div>
                  <Label 
                    htmlFor="venueName" 
                    className="text-sm font-medium"
                    style={{ color: colors.textPrimary }}
                  >
                    Venue Name
                  </Label>
                  <Input
                    id="venueName"
                    type="text"
                    placeholder="The Grand Ballroom"
                    value={formData.venueName}
                    onChange={(e) => setFormData({ ...formData, venueName: e.target.value })}
                    required={mode === "signup"}
                    className="mt-1"
                    style={{ borderColor: colors.borderSubtle }}
                  />
                </div>
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
                    required={mode === "signup"}
                    className="mt-1"
                    style={{ borderColor: colors.borderSubtle }}
                  />
                </div>
              </>
            )}

            <div>
              <Label 
                htmlFor="email" 
                className="text-sm font-medium"
                style={{ color: colors.textPrimary }}
              >
                Work Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@venue.com"
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
                placeholder={mode === "signup" ? "Create a password" : "Enter your password"}
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
              {mode === "signup" ? "Create Account" : "Sign In"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setMode(mode === "signup" ? "login" : "signup")}
              className="text-sm font-medium hover:opacity-80"
              style={{ color: colors.secondary }}
            >
              {mode === "signup" 
                ? "Already using Seeksy VenueOS? Sign in" 
                : "New to VenueOS? Create account"}
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
