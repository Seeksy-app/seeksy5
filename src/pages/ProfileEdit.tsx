import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, User, Palette, Link2, QrCode, Image, Video, Settings, Upload, Plus, X, Smartphone, Tablet, Monitor } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { ProfileQRCode } from "@/components/ProfileQRCode";
import { supabase } from "@/integrations/supabase/client";


export default function ProfileEdit() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState("profile");

  // Profile
  const [displayName, setDisplayName] = useState("Johnny Rocket");
  const [username, setUsername] = useState("johnny-rocket");
  const [bio, setBio] = useState("");
  const [imageStyle, setImageStyle] = useState<"circular" | "square" | "portrait">("portrait");
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Design
  const [themeColor, setThemeColor] = useState("#3b82f6");
  const [backgroundColor, setBackgroundColor] = useState("#e5e7eb");
  const [profileImageBgColor, setProfileImageBgColor] = useState("#ffffff");
  const [titleColor, setTitleColor] = useState("#1f2937");
  const [titleFont, setTitleFont] = useState("sans");
  const [linkShade, setLinkShade] = useState<"none" | "minimal" | "light" | "color" | "dark">("color");
  const [linkShape, setLinkShape] = useState<"rounded" | "oval" | "rectangle">("rounded");
  const [linkStyle, setLinkStyle] = useState<"default" | "gradient" | "shadow" | "outline" | "filled" | "bw-outline">("default");
  const [linkColor, setLinkColor] = useState("#3b82f6");
  const [linkBorderColor, setLinkBorderColor] = useState("#3b82f6");
  const [bioFontColor, setbioFontColor] = useState("#6b7280");
  const [textSize, setTextSize] = useState<"small" | "medium" | "large">("medium");
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [showBranding, setShowBranding] = useState(true);
  const [showLibrary, setShowLibrary] = useState(false);
  
  // Device preview
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "tablet" | "desktop">("mobile");
  
  // Media
  const [selectedMedia, setSelectedMedia] = useState<string>("");
  const [selectedPodcast, setSelectedPodcast] = useState<string>("");
  
  // Streaming
  const [selectedAd, setSelectedAd] = useState<string>("");
  const [selectedAdVideo, setSelectedAdVideo] = useState<string>("");
  const [streamingVideo, setStreamingVideo] = useState<string>("");

  // Links & Features
  const [showMeetings, setShowMeetings] = useState(true);
  const [showEvents, setShowEvents] = useState(true);
  const [showSignupSheets, setShowSignupSheets] = useState(false);
  const [showPolls, setShowPolls] = useState(false);
  const [showAwards, setShowAwards] = useState(false);
  const [showQRCodes, setShowQRCodes] = useState(true);
  const [showNewsletter, setShowNewsletter] = useState(false);
  const [customSections, setCustomSections] = useState<Array<{ id: string; title: string; links: Array<{ id: string; title: string; url: string; imageType: 'no_image' | 'icon' | 'featured' }> }>>([]);
  const [activatedApps, setActivatedApps] = useState<string[]>(["meetings", "events", "qrcodes"]);

  // QR Code
  const [qrShape, setQrShape] = useState<"square" | "round">("square");
  const [qrColor, setQrColor] = useState("#000000");
  const [qrLogo, setQrLogo] = useState<string | null>(null);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        setDisplayName(profile.account_full_name || "");
        setUsername(profile.username || "");
        setBio(profile.bio || "");
        setProfileImage(profile.account_avatar_url || null);
        setBackgroundColor(profile.page_background_color || "#e5e7eb");
      }
    } catch (error) {
      console.error("Error loading profile data:", error);
    }
  };

  const fontOptions = [
    { value: "sans", label: "Inter" },
    { value: "serif", label: "Playfair Display" },
    { value: "script", label: "Dancing Script" },
    { value: "mono", label: "Roboto Mono" },
    { value: "poppins", label: "Poppins" },
    { value: "montserrat", label: "Montserrat" },
    { value: "lato", label: "Lato" },
    { value: "opensans", label: "Open Sans" },
    { value: "raleway", label: "Raleway" },
    { value: "ubuntu", label: "Ubuntu" },
  ];

  const defaultColorPalette = [
    "#000000", "#6b7280", "#991b1b", "#dc2626", "#ea580c", "#f97316",
    "#d946ef", "#a855f7", "#0000ff", "#3b82f6", "#06b6d4", "#10b981"
  ];

  const navItems = [
    { id: "profile", icon: User, label: "Profile", color: "bg-gradient-to-br from-blue-500 to-cyan-500" },
    { id: "design", icon: Palette, label: "Design", color: "bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500" },
    { id: "links", icon: Link2, label: "Links", color: "bg-gradient-to-br from-emerald-500 to-teal-500" },
    { id: "qrcode", icon: QrCode, label: "QR Code", color: "bg-gradient-to-br from-violet-500 to-purple-600" },
    { id: "media", icon: Image, label: "Media", color: "bg-gradient-to-br from-amber-500 to-orange-500" },
    { id: "streaming", icon: Video, label: "Streaming", color: "bg-gradient-to-br from-red-500 to-pink-500" },
    
    { id: "advanced", icon: Settings, label: "Advanced", color: "bg-gradient-to-br from-slate-600 to-gray-700" },
  ];

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to save changes");
        return;
      }

      // Save basic profile settings to database
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          account_full_name: displayName,
          username,
          bio,
          account_avatar_url: profileImage,
          page_background_color: backgroundColor,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      toast.success("Changes saved successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-screen bg-[#e5e7eb] dark:bg-[#1e293b] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b bg-card shrink-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Edit My Page</h1>
              <p className="text-muted-foreground text-sm">Customize your profile</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} size="lg">
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Icon Navigation */}
        <div className="w-20 border-r bg-card flex-shrink-0 overflow-y-auto">
          <div className="flex flex-col items-center py-4 gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
                  activeSection === item.id
                    ? `${item.color} text-white shadow-lg scale-105`
                    : "hover:bg-muted text-muted-foreground"
                }`}
                title={item.label}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[9px] font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Settings Panel */}
        <div className="w-[450px] border-r bg-background flex-shrink-0 overflow-y-auto">
          <div className="p-6">
            {activeSection === "profile" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="displayName" className="text-sm font-medium">Display Name</Label>
                      <Input
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="mt-1.5"
                      />
                      <p className="text-xs text-muted-foreground mt-1">seeksy.io/{username}</p>
                    </div>
                    <div>
                      <Label htmlFor="bio" className="text-sm font-medium">Description</Label>
                      <Textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={4}
                        className="mt-1.5 resize-none"
                      />
                    </div>
                    <div>
                      <Label htmlFor="profileImage" className="text-sm font-medium">Profile Image</Label>
                      <div className="mt-1.5">
                        <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary transition-colors cursor-pointer">
                          <input
                            type="file"
                            id="profileImage"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (e) => setProfileImage(e.target?.result as string);
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <label htmlFor="profileImage" className="cursor-pointer">
                            {profileImage ? (
                              <div className="flex flex-col items-center gap-2">
                                <img src={profileImage} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
                                <p className="text-xs text-muted-foreground">Click to change</p>
                              </div>
                            ) : (
                              <>
                                <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                                <p className="text-sm font-medium">Upload profile image</p>
                                <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                              </>
                            )}
                          </label>
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Image Style</Label>
                      <div className="grid grid-cols-3 gap-2 mt-1.5">
                        {[
                          { value: "circular", label: "Circular" },
                          { value: "square", label: "Square" },
                          { value: "portrait", label: "Portrait" }
                        ].map((style) => (
                          <Button
                            key={style.value}
                            type="button"
                            size="sm"
                            variant={imageStyle === style.value ? "default" : "outline"}
                            onClick={() => setImageStyle(style.value as any)}
                          >
                            {style.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "design" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-4">Design</h2>
                  <div className="space-y-6">
                    {/* Color */}
                    <div>
                      <Label className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        Pick your color
                      </Label>
                      <div className="flex items-center gap-2 mb-3">
                        <Input
                          type="color"
                          value={themeColor}
                          onChange={(e) => setThemeColor(e.target.value)}
                          className="w-12 h-12 p-1 border rounded-lg"
                        />
                        <Input
                          type="text"
                          value={themeColor}
                          onChange={(e) => setThemeColor(e.target.value)}
                          className="flex-1 font-mono uppercase"
                          placeholder="#FFFFFF"
                        />
                      </div>
                      <p className="text-xs font-medium mb-2">Default Colors</p>
                      <div className="grid grid-cols-6 gap-2">
                        {defaultColorPalette.map((color) => (
                          <button
                            key={color}
                            onClick={() => setThemeColor(color)}
                            className={`w-10 h-10 rounded-full border-2 hover:scale-110 transition-transform ${
                              themeColor === color ? "ring-2 ring-primary ring-offset-2" : ""
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Shade */}
                    <div>
                      <Label className="text-sm font-medium mb-3 flex items-center gap-2">
                        Choose a shade
                      </Label>
                      <div className="grid grid-cols-5 gap-3">
                        {[
                          { value: "none", label: "None" },
                          { value: "minimal", label: "Minimal" },
                          { value: "light", label: "Light" },
                          { value: "color", label: "Color" },
                          { value: "dark", label: "Dark" },
                        ].map((shade) => (
                          <button
                            key={shade.value}
                            onClick={() => setLinkShade(shade.value as any)}
                            className={`flex flex-col items-center gap-2 p-2 rounded-lg border-2 transition-all ${
                              linkShade === shade.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-full border flex items-center justify-center text-xs font-medium ${
                              shade.value === "none" ? "bg-white border-gray-300" :
                              shade.value === "minimal" ? "bg-gray-50 border-gray-200" :
                              shade.value === "light" ? "bg-gray-100 border-gray-300" :
                              shade.value === "color" ? "bg-primary/20 border-primary" :
                              "bg-gray-800 text-white border-gray-900"
                            }`}>
                              Aa
                            </div>
                            <span className="text-xs font-medium">{shade.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Font */}
                    <div>
                      <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                        Choose a Font
                      </Label>
                      <p className="text-xs text-muted-foreground mb-3">Choose from Google Fonts</p>
                      <p className="text-xs text-muted-foreground mb-3">Customize fonts to your brand style</p>
                      <Select value={titleFont} onValueChange={setTitleFont}>
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Inter (default)" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover z-50">
                          {fontOptions.map((f) => (
                            <SelectItem key={f.value} value={f.value}>
                              {f.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="grid grid-cols-3 gap-3 mt-4">
                        <div>
                          <Label className="text-xs font-medium mb-2 block">Bio Font Color</Label>
                          <div className="flex items-center gap-1">
                            <Input
                              type="color"
                              value={bioFontColor}
                              onChange={(e) => setbioFontColor(e.target.value)}
                              className="w-10 h-8 p-1 border rounded"
                            />
                            <Input
                              type="text"
                              value={bioFontColor}
                              className="flex-1 text-xs font-mono uppercase h-8"
                            />
                          </div>
                          <Button variant="link" size="sm" className="mt-1 h-auto p-0 text-xs" onClick={() => setbioFontColor("#6b7280")}>
                            Reset
                          </Button>
                        </div>
                        <div>
                          <Label className="text-xs font-medium mb-2 block">Font Color</Label>
                          <div className="flex items-center gap-1">
                            <Input
                              type="color"
                              value={titleColor}
                              onChange={(e) => setTitleColor(e.target.value)}
                              className="w-10 h-8 p-1 border rounded"
                            />
                            <Input
                              type="text"
                              value={titleColor}
                              className="flex-1 text-xs font-mono uppercase h-8"
                            />
                          </div>
                          <Button variant="link" size="sm" className="mt-1 h-auto p-0 text-xs" onClick={() => setTitleColor("#1f2937")}>
                            Reset
                          </Button>
                        </div>
                        <div>
                          <Label className="text-xs font-medium mb-2 block">Text Size</Label>
                          <Select value={textSize} onValueChange={(v) => setTextSize(v as any)}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover z-50">
                              <SelectItem value="small">Small</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="large">Large</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="link" size="sm" className="mt-1 h-auto p-0 text-xs" onClick={() => setTextSize("medium")}>
                            Reset
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Link Shape */}
                    <div>
                      <Label className="text-sm font-medium mb-3 flex items-center gap-2">
                        Choose a link shape
                      </Label>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { value: "rounded", label: "Rounded Rectangle", style: "rounded-2xl" },
                          { value: "oval", label: "Oval", style: "rounded-full" },
                          { value: "rectangle", label: "Rectangle", style: "rounded-md" },
                        ].map((shape) => (
                          <button
                            key={shape.value}
                            onClick={() => setLinkShape(shape.value as any)}
                            className="flex flex-col items-center gap-2"
                          >
                            <div className={`w-full h-16 border-2 transition-all ${shape.style} ${
                              linkShape === shape.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                            } bg-muted`} />
                            <span className="text-xs font-medium">{shape.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Link Style */}
                    <div>
                      <Label className="text-sm font-medium mb-3 flex items-center gap-2">
                        Choose a link style
                      </Label>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { value: "default", label: "Default" },
                          { value: "gradient", label: "Gradient" },
                          { value: "shadow", label: "Drop Shadow" },
                          { value: "outline", label: "Outline" },
                          { value: "filled", label: "Filled" },
                          { value: "bw-outline", label: "B/W Outline" },
                        ].map((style) => (
                          <button
                            key={style.value}
                            onClick={() => setLinkStyle(style.value as any)}
                            className="flex flex-col items-center gap-2"
                          >
                            <div className={`w-full h-12 rounded-lg border-2 transition-all ${
                              linkStyle === style.value ? "border-primary" : "border-border hover:border-primary/50"
                            } ${
                              style.value === "gradient" ? "bg-gradient-to-r from-primary to-primary/60" :
                              style.value === "shadow" ? "shadow-lg bg-white" :
                              style.value === "outline" ? "bg-transparent border-2 border-primary" :
                              style.value === "filled" ? "bg-primary" :
                              style.value === "bw-outline" ? "bg-transparent border-2 border-black" :
                              "bg-muted"
                            }`} />
                            <span className="text-xs font-medium">{style.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Link Color */}
                    <div>
                      <Label className="text-sm font-medium mb-3 flex items-center gap-2">
                        Choose a link color
                      </Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs font-medium mb-2 block">Link Color</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="color"
                              value={linkColor}
                              onChange={(e) => setLinkColor(e.target.value)}
                              className="w-12 h-10 p-1 border rounded-lg"
                            />
                            <Input
                              type="text"
                              value={linkColor}
                              onChange={(e) => setLinkColor(e.target.value)}
                              className="flex-1 font-mono uppercase"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs font-medium mb-2 block">Border Color</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="color"
                              value={linkBorderColor}
                              onChange={(e) => setLinkBorderColor(e.target.value)}
                              className="w-12 h-10 p-1 border rounded-lg"
                            />
                            <Input
                              type="text"
                              value={linkBorderColor}
                              onChange={(e) => setLinkBorderColor(e.target.value)}
                              className="flex-1 font-mono uppercase"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Background */}
                    <div>
                      <Label className="text-sm font-medium mb-3 flex items-center gap-2">
                        Choose a background
                      </Label>
                      <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                        <input
                          type="file"
                          id="backgroundImage"
                          accept="image/png, image/jpeg, image/svg+xml"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (e) => setBackgroundImage(e.target?.result as string);
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <label htmlFor="backgroundImage" className="cursor-pointer">
                          {backgroundImage ? (
                            <div className="flex flex-col items-center gap-2">
                              <img src={backgroundImage} alt="Background" className="w-20 h-20 rounded object-cover" />
                              <p className="text-xs text-muted-foreground">Click to change</p>
                            </div>
                          ) : (
                            <>
                              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                              <p className="text-sm font-medium">Upload file</p>
                              <p className="text-xs text-muted-foreground mt-2">Accepted file types: image/png, image/jpeg, image/svg</p>
                              <p className="text-xs text-muted-foreground">Max file size: 20MB</p>
                            </>
                          )}
                        </label>
                      </div>
                    </div>

                    {/* Branding */}
                    <div>
                      <Label className="text-sm font-medium mb-3 flex items-center gap-2">
                        Seeksy Branding
                      </Label>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="text-sm font-medium">Remove Seeksy branding from the footer</p>
                        </div>
                        <Switch checked={!showBranding} onCheckedChange={(checked) => setShowBranding(!checked)} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "links" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-4">Links</h2>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Seeksy Apps</Label>
                      <p className="text-xs text-muted-foreground mb-3">Only Streaming is available for My Page</p>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Streaming</p>
                            <p className="text-xs text-muted-foreground">Show streaming on My Page</p>
                          </div>
                          <Switch checked={true} disabled />
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-sm font-medium">Custom Links</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newId = Date.now().toString();
                            setCustomSections([...customSections, { id: newId, title: "New Section", links: [] }]);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Section
                        </Button>
                      </div>
                      <div className="space-y-4">
                        {customSections.map((section, sIdx) => (
                          <div key={section.id} className="border rounded-lg p-3 space-y-2">
                            <div className="flex items-center gap-2">
                              <Input
                                placeholder="Section Title"
                                value={section.title}
                                onChange={(e) => {
                                  const n = [...customSections];
                                  n[sIdx].title = e.target.value;
                                  setCustomSections(n);
                                }}
                                className="flex-1 font-medium"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setCustomSections(customSections.filter((_, idx) => idx !== sIdx))}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="pl-4 space-y-2">
                              {section.links.map((link, lIdx) => (
                                <div key={link.id} className="flex gap-2">
                                  <Input
                                    placeholder="Link Title"
                                    value={link.title}
                                    onChange={(e) => {
                                      const n = [...customSections];
                                      n[sIdx].links[lIdx].title = e.target.value;
                                      setCustomSections(n);
                                    }}
                                    className="flex-1"
                                  />
                                  <Input
                                    placeholder="URL"
                                    value={link.url}
                                    onChange={(e) => {
                                      const n = [...customSections];
                                      n[sIdx].links[lIdx].url = e.target.value;
                                      setCustomSections(n);
                                    }}
                                    className="flex-1"
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      const n = [...customSections];
                                      n[sIdx].links = n[sIdx].links.filter((_, idx) => idx !== lIdx);
                                      setCustomSections(n);
                                    }}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const n = [...customSections];
                                  const newLinkId = Date.now().toString();
                                  n[sIdx].links.push({ id: newLinkId, title: "", url: "", imageType: 'no_image' });
                                  setCustomSections(n);
                                }}
                                className="w-full"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Link
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "qrcode" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-4">QR Code</h2>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Shape</Label>
                      <div className="grid grid-cols-2 gap-2 mt-1.5">
                        <Button
                          size="sm"
                          variant={qrShape === "square" ? "default" : "outline"}
                          onClick={() => setQrShape("square")}
                        >
                          Square
                        </Button>
                        <Button
                          size="sm"
                          variant={qrShape === "round" ? "default" : "outline"}
                          onClick={() => setQrShape("round")}
                        >
                          Round
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">QR Code Color</Label>
                      <div className="mt-3">
                        <div className="flex gap-2 flex-wrap">
                          {["#000000", "#374151", "#3b82f6", "#8b5cf6", "#ec4899", "#ef4444", "#f97316", "#10b981"].map((color) => (
                            <button
                              key={color}
                              onClick={() => setQrColor(color)}
                              className={`w-10 h-10 rounded-full border-2 hover:scale-110 transition-transform ${
                                qrColor === color ? "border-primary ring-2 ring-primary ring-offset-2" : "border-border"
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="qrLogo" className="text-sm font-medium">Logo (Optional)</Label>
                      <div className="mt-1.5">
                        <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary transition-colors cursor-pointer">
                          <input
                            type="file"
                            id="qrLogo"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (e) => setQrLogo(e.target?.result as string);
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <label htmlFor="qrLogo" className="cursor-pointer">
                            {qrLogo ? (
                              <div className="flex flex-col items-center gap-2">
                                <img src={qrLogo} alt="Logo" className="w-12 h-12 rounded object-cover" />
                                <p className="text-xs text-muted-foreground">Click to change</p>
                              </div>
                            ) : (
                              <>
                                <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                                <p className="text-sm font-medium">Upload logo</p>
                                <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 2MB</p>
                              </>
                            )}
                          </label>
                        </div>
                      </div>
                    </div>
                    <div className="border rounded-lg p-4 flex justify-center bg-white">
                      <ProfileQRCode username={username} shape={qrShape} themeColor={qrColor} logoUrl={qrLogo || undefined} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "media" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Select Media</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="mediaSelect" className="text-sm font-medium">Video from Library</Label>
                      <Select value={selectedMedia} onValueChange={setSelectedMedia}>
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Select a video..." />
                        </SelectTrigger>
                        <SelectContent className="bg-popover z-50">
                          <SelectItem value="video1">My Latest Video</SelectItem>
                          <SelectItem value="video2">Tutorial Recording</SelectItem>
                          <SelectItem value="video3">Interview with Guest</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="podcastSelect" className="text-sm font-medium">Podcast</Label>
                      <Select value={selectedPodcast} onValueChange={setSelectedPodcast}>
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Select a podcast..." />
                        </SelectTrigger>
                        <SelectContent className="bg-popover z-50">
                          <SelectItem value="podcast1">The Creator's Journey</SelectItem>
                          <SelectItem value="podcast2">Tech Talks Weekly</SelectItem>
                          <SelectItem value="podcast3">Business Insights</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "streaming" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Streaming</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Enable streaming on your My Page
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Show Library</p>
                        <p className="text-sm text-muted-foreground">Display your media library</p>
                      </div>
                      <Switch checked={showLibrary} onCheckedChange={setShowLibrary} />
                    </div>
                    
                    <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                      <h4 className="text-sm font-semibold mb-2">💡 Go Live</h4>
                      <p className="text-xs text-muted-foreground mb-3">
                        Go to Studio to start streaming live on your My Page
                      </p>
                      <Button variant="outline" size="sm" className="w-full" onClick={() => navigate("/studio")}>
                        Open Studio to Go Live
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}


            {activeSection === "advanced" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Advanced Settings</h3>
                  <p className="text-sm text-muted-foreground">
                    Coming soon...
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live Preview */}
        <div className="flex-1 bg-muted/20 overflow-y-auto">
          <div className="p-8">
            <div className="mb-4 flex justify-center gap-2">
              <button
                onClick={() => setPreviewDevice("mobile")}
                className={`p-2 rounded-lg transition-all ${
                  previewDevice === "mobile" ? "bg-primary text-primary-foreground shadow-md" : "bg-muted hover:bg-muted/80"
                }`}
                title="Mobile"
              >
                <Smartphone className="w-5 h-5" />
              </button>
              <button
                onClick={() => setPreviewDevice("tablet")}
                className={`p-2 rounded-lg transition-all ${
                  previewDevice === "tablet" ? "bg-primary text-primary-foreground shadow-md" : "bg-muted hover:bg-muted/80"
                }`}
                title="Tablet"
              >
                <Tablet className="w-5 h-5" />
              </button>
              <button
                onClick={() => setPreviewDevice("desktop")}
                className={`p-2 rounded-lg transition-all ${
                  previewDevice === "desktop" ? "bg-primary text-primary-foreground shadow-md" : "bg-muted hover:bg-muted/80"
                }`}
                title="Desktop"
              >
                <Monitor className="w-5 h-5" />
              </button>
            </div>
            
            <Card className={`mx-auto shadow-2xl transition-all ${
              previewDevice === "mobile" ? "max-w-md" :
              previewDevice === "tablet" ? "max-w-2xl" :
              "max-w-4xl"
            }`}>
              <CardContent className="p-0">
                <div className="rounded-lg overflow-hidden" style={{ 
                  backgroundColor,
                  backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center"
                }}>
                  <div className={`p-8 flex flex-col items-center ${
                    previewDevice === "mobile" ? "aspect-[9/16]" : "min-h-[600px]"
                  }`}>
                    {/* Profile Image */}
                    <div
                      className={`${
                        imageStyle === "circular"
                          ? "w-32 h-32 rounded-full"
                          : imageStyle === "square"
                          ? "w-32 h-32 rounded-2xl"
                          : "w-40 h-56 rounded-2xl"
                      } mb-4 shadow-lg overflow-hidden p-2`}
                      style={{ backgroundColor: profileImageBgColor }}
                    >
                      {profileImage ? (
                        <img src={profileImage} alt="Profile" className="w-full h-full object-cover rounded-inherit" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-600 rounded-inherit" />
                      )}
                    </div>

                    {/* Name */}
                    <h1
                      className={`text-2xl font-bold mb-2 font-${titleFont}`}
                      style={{ color: titleColor }}
                    >
                      {displayName}
                    </h1>

                    {/* Bio */}
                    {bio && (
                      <p className={`text-center mb-4 opacity-90 px-4 ${
                        textSize === "small" ? "text-xs" :
                        textSize === "large" ? "text-base" :
                        "text-sm"
                      }`} style={{ color: bioFontColor }}>
                        {bio}
                      </p>
                    )}

                    {/* Streaming Section (always visible as it's the only app) */}
                    <div className="w-full mb-4">
                      <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center">
                        <Video className="w-12 h-12 text-primary/40" />
                      </div>
                      {showLibrary && (
                        <p className="text-xs text-center mt-2 opacity-75" style={{ color: titleColor }}>
                          📚 View Library
                        </p>
                      )}
                    </div>

                    {/* Custom Link Sections */}
                    {customSections.map((section) => (
                      <div key={section.id} className="w-full mb-4">
                        <h3 className="text-sm font-semibold mb-2" style={{ color: titleColor }}>{section.title}</h3>
                        <div className="space-y-2">
                          {section.links.filter(l => l.title).map((link) => (
                            <div
                              key={link.id}
                              className={`w-full px-6 py-3 text-center font-medium transition-all ${
                                linkShape === "oval" ? "rounded-full" :
                                linkShape === "rectangle" ? "rounded-md" :
                                "rounded-2xl"
                              } ${
                                linkStyle === "gradient" ? "bg-gradient-to-r from-primary to-primary/60 text-white" :
                                linkStyle === "shadow" ? "shadow-lg" :
                                linkStyle === "outline" ? "bg-transparent border-2" :
                                linkStyle === "filled" ? "text-white" :
                                linkStyle === "bw-outline" ? "bg-transparent border-2 !border-black !text-black" :
                                ""
                              } ${
                                linkShade === "none" ? "bg-transparent" :
                                linkShade === "minimal" ? "bg-muted" :
                                linkShade === "light" ? "bg-muted/80" :
                                linkShade === "dark" ? "bg-gray-800 text-white" :
                                ""
                              }`}
                              style={{
                                backgroundColor: linkStyle === "filled" || linkStyle === "default" ? linkColor : undefined,
                                borderColor: linkStyle === "outline" || linkStyle === "bw-outline" ? (linkStyle === "bw-outline" ? "#000000" : linkBorderColor) : undefined,
                                color: linkStyle === "outline" ? linkColor : linkStyle === "bw-outline" ? "#000000" : (linkStyle === "filled" || linkStyle === "default") ? "#ffffff" : titleColor
                              }}
                            >
                              {link.title}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    {/* QR Code */}
                    {showQRCodes && (
                      <div className="mt-4">
                        <div className="bg-white p-4 rounded-xl shadow-lg">
                          <ProfileQRCode username={username} shape={qrShape} themeColor={qrColor} logoUrl={qrLogo || undefined} />
                        </div>
                        <p className="text-xs text-center mt-2" style={{ color: titleColor }}>
                          https://seeksy.io/{username}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
                    {/* Footer Branding */}
                    {showBranding && (
                      <div className="mt-8">
                        <p className="text-xs text-center opacity-60" style={{ color: titleColor }}>
                          Made with Seeksy
                        </p>
                      </div>
                    )}
                  </div>
                </div>
  );
}
