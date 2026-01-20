import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Shield, ArrowLeft, Save, User, Flag, ClipboardList, 
  Download, Calculator, Mail, Phone, MapPin, FileText, Settings, Camera, Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Helmet } from "react-helmet";
import { format } from "date-fns";
import { useSavedCalculationsStore, CALC_DISPLAY_NAMES, CALCULATOR_ROUTES } from "@/hooks/useSavedCalculationsStore";
import { VeteransHeader } from "@/components/veterans/VeteransHeader";

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

const ERA_OPTIONS = [
  { value: "post_911", label: "Post-9/11 (2001-Present)" },
  { value: "gulf_war", label: "Gulf War (1990-2001)" },
  { value: "cold_war", label: "Cold War (1947-1991)" },
  { value: "vietnam", label: "Vietnam Era (1955-1975)" },
  { value: "korea", label: "Korean War (1950-1953)" },
  { value: "wwii", label: "World War II (1941-1945)" },
  { value: "peacetime", label: "Peacetime" },
];

interface UserProfile {
  service_status: string | null;
  branch_of_service: string | null;
  has_intent_to_file: boolean | null;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  address_line1: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  photo_url: string | null;
}

interface DownloadItem {
  id: string;
  name: string;
  type: string;
  created_at: string;
  url?: string;
}

export default function VeteransProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [serviceEra, setServiceEra] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    service_status: "",
    branch_of_service: "",
    has_intent_to_file: false,
    full_name: "",
    phone: "",
    email: "",
    address_line1: "",
    address_city: "",
    address_state: "",
    address_zip: "",
    photo_url: "",
  });
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);


  const { calculations: savedCalcs, setUserId } = useSavedCalculationsStore();

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

      setUserEmail(user.email || "");
      setUserId(user.id);
      setCurrentUserId(user.id);

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
          full_name: (data as any).full_name || "",
          phone: (data as any).phone || "",
          email: (data as any).email || user.email || "",
          address_line1: (data as any).address_line1 || "",
          address_city: (data as any).address_city || "",
          address_state: (data as any).address_state || "",
          address_zip: (data as any).address_zip || "",
          photo_url: (data as any).photo_url || "",
        });
      } else {
        setProfile(prev => ({ ...prev, email: user.email || "" }));
      }

      // Load downloads (placeholder - would come from storage/documents table)
      // For now, show saved calculations as downloadable artifacts
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
          full_name: profile.full_name || null,
          phone: profile.phone || null,
          email: profile.email || null,
          address_line1: profile.address_line1 || null,
          address_city: profile.address_city || null,
          address_state: profile.address_state || null,
          address_zip: profile.address_zip || null,
          photo_url: profile.photo_url || null,
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

  const handleCalcClick = (calc: typeof savedCalcs[0]) => {
    const route = CALCULATOR_ROUTES[calc.calculator_id];
    if (route) {
      navigate(`${route}?saved=${calc.id}`);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUserId) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUserId}/profile.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('veteran-photos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('veteran-photos')
        .getPublicUrl(fileName);

      // Update profile with new URL
      setProfile(p => ({ ...p, photo_url: publicUrl }));
      
      // Save to database
      await supabase
        .from('veteran_profiles')
        .upsert({
          user_id: currentUserId,
          photo_url: publicUrl,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      toast.success("Profile photo updated!");
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error("Failed to upload photo. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const getInitials = () => {
    if (profile.full_name) {
      return profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (userEmail) {
      return userEmail[0].toUpperCase();
    }
    return "U";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Profile | Military & Federal Benefits Hub</title>
      </Helmet>

      <VeteransHeader variant="dashboard" />

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Link to="/yourbenefits/dashboard" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>

        <div className="flex items-center gap-4 mb-6">
          {/* Profile Photo with Upload */}
          <div className="relative group">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile.photo_url || undefined} alt="Profile" />
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {uploading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <Camera className="w-5 h-5 text-white" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Profile & Settings</h1>
            <p className="text-muted-foreground">{userEmail}</p>
          </div>
        </div>

        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="military">Military</TabsTrigger>
            <TabsTrigger value="downloads">Downloads</TabsTrigger>
            <TabsTrigger value="calculations">Calculations</TabsTrigger>
          </TabsList>

          {/* Personal Info Tab */}
          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Your contact information and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      Email
                    </Label>
                    <Input id="email" value={userEmail} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground">Contact support to change email</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input 
                      id="fullName" 
                      value={profile.full_name || ""} 
                      onChange={(e) => setProfile(p => ({ ...p, full_name: e.target.value }))}
                      placeholder="Your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      Phone
                    </Label>
                    <Input 
                      id="phone" 
                      value={profile.phone || ""} 
                      onChange={(e) => setProfile(p => ({ ...p, phone: e.target.value }))}
                      placeholder="(555) 555-5555"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input 
                      id="address" 
                      value={profile.address_line1 || ""} 
                      onChange={(e) => setProfile(p => ({ ...p, address_line1: e.target.value }))}
                      placeholder="Street address"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input 
                      id="city" 
                      value={profile.address_city || ""} 
                      onChange={(e) => setProfile(p => ({ ...p, address_city: e.target.value }))}
                      placeholder="City"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state" className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      State
                    </Label>
                    <Input 
                      id="state" 
                      value={profile.address_state || ""} 
                      onChange={(e) => setProfile(p => ({ ...p, address_state: e.target.value }))}
                      placeholder="e.g., TX, CA, FL"
                      maxLength={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zip">ZIP Code</Label>
                    <Input 
                      id="zip" 
                      value={profile.address_zip || ""} 
                      onChange={(e) => setProfile(p => ({ ...p, address_zip: e.target.value }))}
                      placeholder="12345"
                      maxLength={10}
                    />
                  </div>
                </div>
                <div className="pt-4 border-t mt-6">
                  <Button onClick={handleSave} disabled={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "Saving..." : "Save Profile"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Military Info Tab */}
          <TabsContent value="military">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="w-5 h-5" />
                  Military Information
                </CardTitle>
                <CardDescription>
                  Your service details help us personalize guidance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Service Status</Label>
                    <Select 
                      value={profile.service_status || ""} 
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

                  <div className="space-y-2">
                    <Label htmlFor="branch">Branch of Service</Label>
                    <Select 
                      value={profile.branch_of_service || ""} 
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

                  <div className="space-y-2">
                    <Label htmlFor="era">Service Era (optional)</Label>
                    <Select 
                      value={serviceEra} 
                      onValueChange={(value) => setServiceEra(value)}
                    >
                      <SelectTrigger id="era">
                        <SelectValue placeholder="Select era" />
                      </SelectTrigger>
                      <SelectContent>
                        {ERA_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="intent">Intent to File Status</Label>
                    <Select 
                      value={profile.has_intent_to_file ? "yes" : "no"} 
                      onValueChange={(value) => setProfile(p => ({ ...p, has_intent_to_file: value === "yes" }))}
                    >
                      <SelectTrigger id="intent">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes, I have filed</SelectItem>
                        <SelectItem value="no">No, not yet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Downloads Tab */}
          <TabsContent value="downloads">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Downloads History
                </CardTitle>
                <CardDescription>
                  Your prepared documents and claim packets
                </CardDescription>
              </CardHeader>
              <CardContent>
                {downloads.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4">No downloads yet</p>
                    <p className="text-sm text-muted-foreground">
                      Complete a claim preparation flow to generate downloadable documents.
                    </p>
                    <Button asChild variant="outline" className="mt-4">
                      <Link to="/yourbenefits/claims-agent">
                        Start a Claim
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {downloads.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(item.created_at), 'MMM d, yyyy h:mm a')}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Saved Calculations Tab */}
          <TabsContent value="calculations">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Saved Calculations
                </CardTitle>
                <CardDescription>
                  Your benefit estimates and calculations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {savedCalcs.length === 0 ? (
                  <div className="text-center py-8">
                    <Calculator className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4">No saved calculations</p>
                    <Button asChild variant="outline">
                      <Link to="/yourbenefits#calculators-section">
                        Explore Calculators
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-3">
                    {savedCalcs.map((calc) => (
                      <button
                        key={calc.id}
                        onClick={() => handleCalcClick(calc)}
                        className="text-left p-4 rounded-lg border hover:border-primary/30 hover:bg-muted/50 transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-green-500/10">
                            <Calculator className="w-4 h-4 text-green-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">
                              {CALC_DISPLAY_NAMES[calc.calculator_id] || calc.calculator_id}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {calc.summary || 'Click to view details'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(calc.created_at), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="mt-6">
          <Button onClick={handleSave} className="w-full md:w-auto" disabled={saving}>
            {saving ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save All Changes
              </>
            )}
          </Button>
        </div>

        {/* Compliance Footer */}
        <div className="mt-8 p-4 rounded-lg bg-muted/50 border text-center">
          <p className="text-xs text-muted-foreground">
            We help prepare benefit claims and connect users with accredited representatives. 
            Final submission must be completed by you through official government systems.
          </p>
        </div>
      </div>
    </div>
  );
}
