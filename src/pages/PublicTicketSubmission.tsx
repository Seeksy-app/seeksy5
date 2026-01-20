import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Loader2, Camera, MapPin } from "lucide-react";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";

const ticketSubmissionSchema = z.object({
  name: z.string().trim().min(1, { message: "Name is required" }).max(100, { message: "Name must be less than 100 characters" }),
  email: z.string().trim().email({ message: "Invalid email address" }).max(255, { message: "Email must be less than 255 characters" }),
  company: z.string().trim().max(200, { message: "Company name must be less than 200 characters" }).optional(),
  phone: z.string().trim().max(20, { message: "Phone must be less than 20 characters" }).optional(),
  address: z.string().trim().max(500, { message: "Address must be less than 500 characters" }).optional(),
  subject: z.string().trim().min(1, { message: "Subject is required" }).max(200, { message: "Subject must be less than 200 characters" }),
  description: z.string().trim().min(10, { message: "Description must be at least 10 characters" }).max(2000, { message: "Description must be less than 2000 characters" }),
  category: z.enum(["support", "sales", "technical", "billing", "general"]),
  priority: z.enum(["low", "medium", "high", "urgent"])
});

type TicketSubmission = z.infer<typeof ticketSubmissionSchema>;

export default function PublicTicketSubmission() {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createTicket, setCreateTicket] = useState(true);
  const [assignedTo, setAssignedTo] = useState("");
  const [gettingLocation, setGettingLocation] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);

  const [formData, setFormData] = useState<TicketSubmission>({
    name: "",
    email: "",
    company: "",
    phone: "",
    address: "",
    subject: "",
    description: "",
    category: "general",
    priority: "medium"
  });

  const { data: teamMembers } = useQuery({
    queryKey: ["team-members-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, profiles(id, full_name, account_full_name)")
        .in("role", ["admin", "super_admin"]);
      
      if (error) throw error;
      return data;
    },
  });

  const getLocation = async () => {
    if (!navigator.geolocation) {
      toast({ title: "Error", description: "Geolocation is not supported by your browser", variant: "destructive" });
      return;
    }

    setGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
          );
          const data = await response.json();
          
          const capturedLocation = {
            latitude: lat,
            longitude: lon,
            address: data.display_name || `${lat}, ${lon}`,
          };
          
          setLocation(capturedLocation);
          setFormData({ ...formData, address: capturedLocation.address });
          toast({ title: "Location Captured!", description: "GPS location added to form" });
        } catch (error) {
          console.error("Error getting address:", error);
          const capturedLocation = {
            latitude: lat,
            longitude: lon,
            address: `${lat}, ${lon}`,
          };
          setLocation(capturedLocation);
          setFormData({ ...formData, address: capturedLocation.address });
          toast({ title: "GPS Captured!", description: "Coordinates added to form" });
        } finally {
          setGettingLocation(false);
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        toast({ title: "Error", description: "Unable to get location. Please enable location permissions.", variant: "destructive" });
        setGettingLocation(false);
      }
    );
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: "Photo must be less than 5MB", variant: "destructive" });
      return;
    }

    setPhotos(prev => [...prev, file]);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreviews(prev => [...prev, reader.result as string]);
    };
    reader.readAsDataURL(file);
    
    toast({ title: "Photo Added!", description: "Photo attached to ticket" });
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadPhotos = async (): Promise<string[]> => {
    if (photos.length === 0) return [];

    setUploadingPhoto(true);
    const uploadedUrls: string[] = [];
    
    try {
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        const fileExt = photo.name.split('.').pop();
        const fileName = `public-ticket-${Date.now()}-${i}.${fileExt}`;
        const filePath = `ticket-photos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('contact-photos')
          .upload(filePath, photo);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('contact-photos')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }
      return uploadedUrls;
    } catch (error) {
      console.error("Error uploading photos:", error);
      toast({ title: "Warning", description: "Failed to upload some photos", variant: "destructive" });
      return uploadedUrls;
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      // Validate input
      const validated = ticketSubmissionSchema.parse(formData);
      
      setSubmitting(true);

      // Upload photos first
      const photoUrls = await uploadPhotos();

      const { data, error } = await supabase.functions.invoke("submit-public-ticket", {
        body: {
          ...validated,
          photos: photoUrls,
          location: location ? `${location.address} (${location.latitude}, ${location.longitude})` : null,
          create_ticket: createTicket,
          assigned_to: assignedTo || null
        }
      });

      if (error) throw error;

      setTicketNumber(data.ticket_number);
      setSubmitted(true);
      
      toast({
        title: "Ticket Submitted!",
        description: `Your ticket #${data.ticket_number} has been created. We'll be in touch soon.`,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        toast({
          title: "Validation Error",
          description: "Please check the form and try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to submit ticket. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl">Ticket Submitted!</CardTitle>
            <CardDescription>
              Your ticket <span className="font-semibold text-foreground">#{ticketNumber}</span> has been created successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              We've received your request and will respond to <span className="font-medium text-foreground">{formData.email}</span> as soon as possible.
            </p>
            <Button 
              onClick={() => {
                setSubmitted(false);
                setFormData({
                  name: "",
                  email: "",
                  company: "",
                  phone: "",
                  address: "",
                  subject: "",
                  description: "",
                  category: "general",
                  priority: "medium"
                });
                setTicketNumber("");
                setPhotos([]);
                setPhotoPreviews([]);
                setLocation(null);
                setCreateTicket(true);
                setAssignedTo("");
              }}
              variant="outline"
              className="w-full"
            >
              Submit Another Ticket
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle className="text-3xl">Submit a Lead Form</CardTitle>
          <CardDescription>
            Fill out the form below and our team will get back to you shortly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address / Location</Label>
              <div className="space-y-2">
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street address, city, state, ZIP"
                  className={errors.address ? "border-red-500" : ""}
                />
                {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={getLocation}
                  disabled={gettingLocation}
                  className="w-full"
                >
                  {gettingLocation ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Getting Location...
                    </>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4 mr-2" />
                      {location ? "Update GPS Location" : "Capture GPS Location"}
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Acme Corp"
                  className={errors.company ? "border-red-500" : ""}
                />
                {errors.company && <p className="text-sm text-red-500">{errors.company}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  className={errors.phone ? "border-red-500" : ""}
                />
                {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value: any) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Inquiry</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="technical">Technical Issue</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority *</Label>
                <Select value={formData.priority} onValueChange={(value: any) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Brief description of your issue"
                className={errors.subject ? "border-red-500" : ""}
              />
              {errors.subject && <p className="text-sm text-red-500">{errors.subject}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Provide detailed information about your request (minimum 10 characters)"
                rows={6}
                className={errors.description ? "border-red-500" : ""}
              />
              {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
            </div>

            {/* Photo Upload */}
            <div className="space-y-3">
              <Label>Attach Photos ({photos.length})</Label>
              <div className="flex gap-2">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoCapture}
                  className="hidden"
                  id="photo-input"
                />
                <label htmlFor="photo-input" className="flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => document.getElementById('photo-input')?.click()}
                    disabled={uploadingPhoto}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    {photos.length > 0 ? "Add Another Photo" : "Add Photo"}
                  </Button>
                </label>
              </div>

              {photoPreviews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {photoPreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Ticket photo ${index + 1}`}
                        className="w-full h-32 object-cover rounded-md border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0"
                        onClick={() => removePhoto(index)}
                      >
                        ×
                      </Button>
                      <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                        Photo {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Lead Form Creation and Assignment */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="create-ticket" 
                  checked={createTicket}
                  onCheckedChange={(checked) => setCreateTicket(checked as boolean)}
                />
                <Label htmlFor="create-ticket" className="cursor-pointer">
                  Create lead form from this submission
                </Label>
              </div>

              {createTicket && (
                <div className="space-y-2">
                  <Label htmlFor="assign-to">Assign to Team Member (Optional)</Label>
                  <Select value={assignedTo} onValueChange={setAssignedTo}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select team member" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border border-border shadow-lg z-[100]">
                      {teamMembers?.map((member: any) => (
                        <SelectItem key={member.user_id} value={member.user_id} className="cursor-pointer hover:bg-accent">
                          {member.profiles?.account_full_name || member.profiles?.full_name || "Team Member"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

              <Button
                type="submit"
                disabled={submitting || uploadingPhoto}
                className="w-full bg-[hsl(207,100%,50%)] hover:bg-[hsl(207,100%,45%)]"
                size="lg"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Lead Form"
                )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
