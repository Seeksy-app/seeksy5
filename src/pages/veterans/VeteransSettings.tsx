import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, ArrowLeft, Save, User, Flag, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Helmet } from "react-helmet";

const STATUS_OPTIONS = [
  { value: "veteran", label: "Veteran" },
  { value: "active_duty", label: "Active Duty" },
  { value: "guard_reserve", label: "Guard/Reserve" },
  { value: "spouse_caregiver", label: "Spouse/Caregiver" },
  { value: "federal_employee", label: "Federal Employee" },
  { value: "other", label: "Other" },
];

const BRANCH_OPTIONS = [
  { value: "army", label: "Army" },
  { value: "marine_corps", label: "Marine Corps" },
  { value: "navy", label: "Navy" },
  { value: "air_force", label: "Air Force" },
  { value: "space_force", label: "Space Force" },
  { value: "coast_guard", label: "Coast Guard" },
  { value: "multiple_other", label: "Multiple/Other" },
];

export default function VeteransSettings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    service_status: "",
    branch_of_service: "",
    has_intent_to_file: false,
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/yourbenefits/auth');
        return;
      }

      const { data } = await supabase
        .from('veteran_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setProfile({
          service_status: data.service_status || "",
          branch_of_service: data.branch_of_service || "",
          has_intent_to_file: data.has_intent_to_file || false,
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('veteran_profiles')
        .upsert({
          user_id: user.id,
          service_status: profile.service_status || null,
          branch_of_service: profile.branch_of_service || null,
          has_intent_to_file: profile.has_intent_to_file,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;

      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <Helmet>
        <title>Profile Settings | Veterans Benefits Hub</title>
      </Helmet>

      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/yourbenefits" className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-semibold">Military & Federal Benefits Hub</span>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link to="/yourbenefits/claims-agent" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Chat
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Settings
            </CardTitle>
            <CardDescription>
              Update your military service information to personalize your experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Service Status */}
            <div className="space-y-2">
              <Label htmlFor="status" className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                Service Status
              </Label>
              <Select 
                value={profile.service_status} 
                onValueChange={(value) => setProfile(p => ({ ...p, service_status: value }))}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select your status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Branch of Service */}
            <div className="space-y-2">
              <Label htmlFor="branch" className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-muted-foreground" />
                Branch of Service
              </Label>
              <Select 
                value={profile.branch_of_service} 
                onValueChange={(value) => setProfile(p => ({ ...p, branch_of_service: value }))}
              >
                <SelectTrigger id="branch">
                  <SelectValue placeholder="Select your branch" />
                </SelectTrigger>
                <SelectContent>
                  {BRANCH_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Intent to File */}
            <div className="space-y-2">
              <Label htmlFor="intent" className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-muted-foreground" />
                Have you filed an Intent to File?
              </Label>
              <Select 
                value={profile.has_intent_to_file ? "yes" : "no"} 
                onValueChange={(value) => setProfile(p => ({ ...p, has_intent_to_file: value === "yes" }))}
              >
                <SelectTrigger id="intent">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleSave} className="w-full" disabled={saving}>
              {saving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
