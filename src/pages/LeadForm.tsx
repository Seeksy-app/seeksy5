import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Camera, MapPin, Loader2, Upload } from "lucide-react";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const leadFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  phone: z.string().trim().max(20).optional(),
  company: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export default function LeadForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    notes: "",
  });
  
  const [createTicket, setCreateTicket] = useState(false);
  const [assignedTo, setAssignedTo] = useState("");
  
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);
  
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  const { data: teamMembers } = useQuery({
    queryKey: ["team-members"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, profiles(id, full_name)")
        .in("role", ["admin", "super_admin", "member", "staff"]);
      
      if (error) throw error;
      return data;
    },
  });

  const getLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        try {
          // Reverse geocode using OpenStreetMap Nominatim API
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
          );
          const data = await response.json();
          
          setLocation({
            latitude: lat,
            longitude: lon,
            address: data.display_name || `${lat}, ${lon}`,
          });
          
          toast.success("Location captured!");
        } catch (error) {
          console.error("Error getting address:", error);
          setLocation({
            latitude: lat,
            longitude: lon,
            address: `${lat}, ${lon}`,
          });
          toast.success("GPS coordinates captured!");
        } finally {
          setGettingLocation(false);
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        toast.error("Unable to get location. Please enable location permissions.");
        setGettingLocation(false);
      }
    );
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo must be less than 5MB");
      return;
    }

    // Add to photos array
    setPhotos(prev => [...prev, file]);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreviews(prev => [...prev, reader.result as string]);
    };
    reader.readAsDataURL(file);
    
    toast.success("Photo added!");
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadPhotos = async (contactId: string): Promise<string[]> => {
    if (photos.length === 0) return [];

    setUploadingPhoto(true);
    const uploadedUrls: string[] = [];
    
    try {
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        const fileExt = photo.name.split('.').pop();
        const fileName = `${contactId}-${Date.now()}-${i}.${fileExt}`;
        const filePath = `contact-photos/${fileName}`;

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
      toast.error("Failed to upload some photos");
      return uploadedUrls;
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    try {
      leadFormSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to create leads");
        navigate("/auth");
        return;
      }

      // Create contact first to get the ID
      const contactData: any = {
        user_id: user.id,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone?.trim() || null,
        company: formData.company?.trim() || null,
        notes: formData.notes?.trim() || null,
        lead_source: "mobile_lead_form",
        lead_status: "new",
      };

      // Add location data if available
      if (location) {
        contactData.notes = contactData.notes 
          ? `${contactData.notes}\n\nLocation: ${location.address}\nCoordinates: ${location.latitude}, ${location.longitude}`
          : `Location: ${location.address}\nCoordinates: ${location.latitude}, ${location.longitude}`;
      }

      const { data: contact, error: contactError } = await supabase
        .from("contacts")
        .insert(contactData)
        .select()
        .single();

      if (contactError) throw contactError;

      // Upload photos if available
      let photoUrls: string[] = [];
      if (photos.length > 0 && contact) {
        photoUrls = await uploadPhotos(contact.id);
        
        if (photoUrls.length > 0) {
          // Update contact with photo URLs
          const photosList = photoUrls.map((url, i) => `Photo ${i + 1}: ${url}`).join('\n');
          await supabase
            .from("contacts")
            .update({ notes: `${contact.notes || ''}\n\n${photosList}` })
            .eq("id", contact.id);
        }
      }

      // Create ticket if requested
      if (createTicket && contact) {
        const ticketData: any = {
          title: `New Lead: ${formData.name}`,
          description: formData.notes || "Lead captured via mobile form",
          priority: "medium",
          contact_id: contact.id,
          user_id: user.id,
          ticket_number: "", // Will be auto-generated by trigger
          photos: photoUrls.length > 0 ? photoUrls : null,
        };

        if (assignedTo) {
          ticketData.assigned_to = assignedTo;
        }

        const { error: ticketError } = await supabase
          .from("tickets")
          .insert(ticketData);

        if (ticketError) {
          console.error("Error creating ticket:", ticketError);
          toast.error("Lead created but ticket creation failed");
        }
      }


      toast.success("Lead captured successfully! 🎉");
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        notes: "",
      });
      setLocation(null);
      setPhotos([]);
      setPhotoPreviews([]);
      setCreateTicket(false);
      setAssignedTo("");
      
      // Navigate to contacts page
      setTimeout(() => {
        navigate("/contacts");
      }, 1500);

    } catch (error) {
      console.error("Error creating lead:", error);
      toast.error("Failed to create lead. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-8 px-4">
      <div className="container max-w-2xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">📋 Mobile Lead Capture</CardTitle>
            <CardDescription>
              Capture lead information with location and photos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    placeholder="Company name"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional information..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>

              {/* Location Capture */}
              <div className="space-y-3">
                <Label>Location</Label>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={getLocation}
                  disabled={gettingLocation}
                >
                  {gettingLocation ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Getting Location...
                    </>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4 mr-2" />
                      {location ? "Update Location" : "Capture GPS Location"}
                    </>
                  )}
                </Button>
                
                {location && (
                  <div className="p-3 bg-muted rounded-md text-sm">
                    <p className="font-medium mb-1">📍 Location Captured</p>
                    <p className="text-muted-foreground break-words">{location.address}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Lat: {location.latitude.toFixed(6)}, Lon: {location.longitude.toFixed(6)}
                    </p>
                  </div>
                )}
              </div>

              {/* Photo Capture */}
              <div className="space-y-3">
                <Label>Photos ({photos.length})</Label>
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
                      {photos.length > 0 ? "Add Another Photo" : "Take Photo"}
                    </Button>
                  </label>
                </div>

                {photoPreviews.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {photoPreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview}
                          alt={`Lead photo ${index + 1}`}
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

              {/* Ticket Creation */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="create-ticket" 
                    checked={createTicket}
                    onCheckedChange={(checked) => setCreateTicket(checked as boolean)}
                  />
                  <Label htmlFor="create-ticket" className="cursor-pointer">
                    Create Ticket
                  </Label>
                </div>

                {createTicket && (
                  <div>
                    <Label htmlFor="assign-to">Assign to</Label>
                    <Select value={assignedTo} onValueChange={setAssignedTo}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select team member (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {teamMembers?.map((member: any) => (
                          <SelectItem key={member.user_id} value={member.user_id}>
                            {member.profiles?.full_name || "Unknown"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading || uploadingPhoto}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Lead...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Submit Lead
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
