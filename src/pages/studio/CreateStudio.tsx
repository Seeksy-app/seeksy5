import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  ChevronRight, Video, Mic, Radio, 
  Image, Upload, ArrowRight, Check
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const studioTypes = [
  { 
    id: "video", 
    name: "Video Studio", 
    description: "Full video production with camera, overlays, and scenes",
    icon: Video,
    color: "bg-blue-500"
  },
  { 
    id: "audio", 
    name: "Audio Studio", 
    description: "Podcast and audio recording with sound boards",
    icon: Mic,
    color: "bg-purple-500"
  },
  { 
    id: "live", 
    name: "Live Stream Studio", 
    description: "Go live to multiple platforms simultaneously",
    icon: Radio,
    color: "bg-red-500"
  },
];

export default function CreateStudio() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [studioType, setStudioType] = useState<string | null>(null);
  const [studioName, setStudioName] = useState("");
  const [studioDescription, setStudioDescription] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleThumbnailUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
        toast.error("Please upload a PNG or JPG image");
        return;
      }
      setThumbnail(file);
    }
  };

  const handleCreate = async () => {
    if (!studioType || !studioName) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsCreating(true);
    let createdTemplateId: string | null = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to create a studio");
        return;
      }

      // Upload thumbnail if provided
      let thumbnailUrl = null;
      if (thumbnail) {
        const fileName = `${user.id}/studio-thumbnails/${Date.now()}-${thumbnail.name}`;
        const { error: uploadError } = await supabase.storage
          .from('studio-recordings')
          .upload(fileName, thumbnail);
        
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('studio-recordings')
            .getPublicUrl(fileName);
          thumbnailUrl = publicUrl;
        }
      }

      // Create the studio template
      const { data: templateData, error } = await supabase
        .from('studio_templates')
        .insert({
          user_id: user.id,
          session_name: studioName,
          description: studioDescription || `${studioTypes.find(t => t.id === studioType)?.name} created on ${new Date().toLocaleDateString()}`,
          thumbnail_url: thumbnailUrl,
        })
        .select()
        .single();

      if (error) throw error;
      createdTemplateId = templateData?.id;

      toast.success("Studio created successfully!");
      
      // Navigate to the appropriate studio based on type
      if (studioType === 'video') {
        navigate(`/studio/video?template=${createdTemplateId}`);
      } else if (studioType === 'audio') {
        navigate(`/studio/audio?template=${createdTemplateId}`);
      } else if (studioType === 'live') {
        navigate(`/studio/live?template=${createdTemplateId}`);
      } else {
        navigate("/studio");
      }
    } catch (error) {
      console.error("Error creating studio:", error);
      toast.error("Failed to create studio. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 lg:px-8 py-8 space-y-8">
        {/* Breadcrumb */}
        <nav className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
          <button onClick={() => navigate("/studio")} className="hover:text-foreground transition-colors">
            Studio Hub
          </button>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-medium">Create New Studio</span>
        </nav>

        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Create New Studio</h1>
          <p className="text-muted-foreground mt-1">Set up a persistent creative environment</p>
        </motion.div>

        {/* Progress Steps */}
        <div className="flex items-center gap-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                step >= s 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted text-muted-foreground"
              )}>
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
              <span className={cn(
                "text-sm hidden sm:block",
                step >= s ? "text-foreground" : "text-muted-foreground"
              )}>
                {s === 1 ? "Type" : s === 2 ? "Details" : "Branding"}
              </span>
              {s < 3 && <div className="w-8 h-px bg-border hidden sm:block" />}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          {step === 1 && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Choose Studio Type</CardTitle>
                <CardDescription>Select the type of content you'll create</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {studioTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setStudioType(type.id)}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                      studioType === type.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    )}
                  >
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", type.color)}>
                      <type.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{type.name}</h3>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </div>
                    {studioType === type.id && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                ))}
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Studio Details</CardTitle>
                <CardDescription>Give your studio a name and description</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Studio Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., My Podcast Studio"
                    value={studioName}
                    onChange={(e) => setStudioName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what you'll create in this studio..."
                    value={studioDescription}
                    onChange={(e) => setStudioDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Studio Branding</CardTitle>
                <CardDescription>Add a thumbnail and customize appearance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Studio Thumbnail</Label>
                  <input
                    type="file"
                    id="thumbnail-upload"
                    accept="image/png,image/jpeg,image/jpg"
                    className="hidden"
                    onChange={handleThumbnailUpload}
                  />
                  <label 
                    htmlFor="thumbnail-upload"
                    className="aspect-video border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-all block"
                  >
                    {thumbnail ? (
                      <img 
                        src={URL.createObjectURL(thumbnail)} 
                        alt="Thumbnail" 
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                          <Image className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-foreground">Upload thumbnail</p>
                          <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                        </div>
                      </>
                    )}
                  </label>
                </div>

                {/* Summary */}
                <div className="p-4 rounded-xl bg-muted/30 space-y-2">
                  <h4 className="font-medium text-foreground">Summary</h4>
                  <div className="text-sm space-y-1">
                    <p><span className="text-muted-foreground">Type:</span> {studioTypes.find(t => t.id === studioType)?.name}</p>
                    <p><span className="text-muted-foreground">Name:</span> {studioName || "Not set"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => step > 1 ? setStep(step - 1) : navigate("/studio")}
          >
            {step > 1 ? "Back" : "Cancel"}
          </Button>
          <Button
            onClick={() => {
              if (step < 3) {
                if (step === 1 && !studioType) {
                  toast.error("Please select a studio type");
                  return;
                }
                if (step === 2 && !studioName) {
                  toast.error("Please enter a studio name");
                  return;
                }
                setStep(step + 1);
              } else {
                handleCreate();
              }
            }}
            disabled={isCreating}
            className="bg-primary hover:bg-primary/90"
          >
            {isCreating ? (
              "Creating..."
            ) : step < 3 ? (
              <>Next <ArrowRight className="w-4 h-4 ml-2" /></>
            ) : (
              <>Create Studio <Check className="w-4 h-4 ml-2" /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
