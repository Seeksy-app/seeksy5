import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Camera, X, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";

export default function FieldLeadCapture() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Validate userId exists
  if (!userId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Invalid Link</CardTitle>
            <CardDescription>
              This lead capture form requires a valid user link. Please contact your administrator for the correct link.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    notes: "",
    address: "",
  });
  
  const [createTicket, setCreateTicket] = useState(true);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [assignedTo, setAssignedTo] = useState<string>("");

  // Fetch current user and team members
  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("id", user.id)
        .single();
      
      return profile;
    },
  });

  const { data: teamMembers } = useQuery({
    queryKey: ["team-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name");
      
      if (error) throw error;
      return data || [];
    },
  });

  const getLocation = () => {
    setGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lng: longitude });
          
          // Reverse geocode to get address
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            setFormData(prev => ({ ...prev, address: data.display_name }));
          } catch (error) {
            console.error("Error getting address:", error);
          }
          
          setGettingLocation(false);
          toast({
            title: "Location captured",
            description: "GPS coordinates recorded",
          });
        },
        (error) => {
          setGettingLocation(false);
          toast({
            title: "Location error",
            description: "Could not get location. Please enter address manually.",
            variant: "destructive",
          });
        }
      );
    }
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (photos.length + files.length > 5) {
      toast({
        title: "Too many photos",
        description: "Maximum 5 photos allowed",
        variant: "destructive",
      });
      return;
    }

    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 5MB limit`,
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
      setPhotos(prev => [...prev, file]);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadPhotos = async (): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    for (const photo of photos) {
      const fileExt = photo.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `lead-photos/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('lead-photos')
        .upload(filePath, photo);

      if (uploadError) {
        console.error("Photo upload error:", uploadError);
        toast({
          title: "Photo upload failed",
          description: `Failed to upload ${photo.name}: ${uploadError.message}`,
          variant: "destructive",
        });
        throw uploadError; // Stop form submission if photo upload fails
      }

      const { data: { publicUrl } } = supabase.storage
        .from('lead-photos')
        .getPublicUrl(filePath);

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validate userId is present
      if (!userId) {
        throw new Error("User ID is missing. Please use a valid lead form link.");
      }

      // Upload photos
      const photoUrls = await uploadPhotos();

      // Create or update contact
      const contactData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        company: formData.company || null,
        address: formData.address || null,
        notes: [
          formData.notes,
          location ? `GPS: ${location.lat}, ${location.lng}` : "",
          photoUrls.length > 0 ? `Photos: ${photoUrls.join(', ')}` : ""
        ].filter(Boolean).join('\n'),
        lead_status: 'new',
        lead_source: 'field_capture',
        user_id: userId,
      };

      const { data: existingContact } = await supabase
        .from('contacts')
        .select('id')
        .eq('email', formData.email)
        .eq('user_id', userId)
        .single();

      let contactId: string;

      if (existingContact) {
        const { data: updatedContact, error: updateError } = await supabase
          .from('contacts')
          .update(contactData)
          .eq('id', existingContact.id)
          .select('id')
          .single();
        
        if (updateError) throw updateError;
        contactId = updatedContact!.id;
      } else {
        const { data: newContact, error: insertError } = await supabase
          .from('contacts')
          .insert(contactData)
          .select('id')
          .single();
        
        if (insertError) throw insertError;
        contactId = newContact!.id;
      }

      // Create ticket if requested
      if (createTicket) {
        const { error: ticketError } = await supabase.from('client_tickets').insert({
          title: `Field Lead: ${formData.name}`,
          description: formData.notes,
          client_contact_id: contactId,
          user_id: userId,
          assigned_to: assignedTo || userId,
          status: 'open',
          priority: 'medium',
          source: 'field_capture',
        });
        
        if (ticketError) throw ticketError;
      }

      toast({
        title: "Lead captured successfully",
        description: "Contact and ticket created",
      });

      // Reset form
      setFormData({ name: "", email: "", phone: "", company: "", notes: "", address: "" });
      setPhotos([]);
      setPhotoPreviews([]);
      setLocation(null);
      setCreateTicket(true);

    } catch (error: any) {
      console.error("Error submitting lead:", error);
      const errorMessage = error?.message || "Failed to capture lead. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Lead Form</CardTitle>
            <CardDescription>Capture client information and photos on-site</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Location Capture */}
              <div className="space-y-2">
                <Button
                  type="button"
                  onClick={getLocation}
                  disabled={gettingLocation}
                  variant="outline"
                  className="w-full"
                >
                  {gettingLocation ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Getting location...
                    </>
                  ) : (
                    <>
                      <MapPin className="mr-2 h-4 w-4" />
                      Capture GPS Location
                    </>
                  )}
                </Button>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Auto-filled from GPS or enter manually"
                />
              </div>

              {/* Photo Capture */}
              <div className="space-y-2">
                <Label>Photos (Max 5, 5MB each)</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {photoPreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img src={preview} alt={`Preview ${index + 1}`} className="w-20 h-20 object-cover rounded" />
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={() => removePhoto(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoCapture}
                  disabled={photos.length >= 5}
                  id="photo-input"
                  className="hidden"
                  capture="environment"
                />
                <label htmlFor="photo-input">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={photos.length >= 5}
                    asChild
                  >
                    <span className="cursor-pointer">
                      <Camera className="mr-2 h-4 w-4" />
                      {photos.length === 0 ? "Add Photos" : `Add More Photos (${photos.length}/5)`}
                    </span>
                  </Button>
                </label>
              </div>

              {/* Contact Info */}
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={4}
                  placeholder="Project details, requirements, etc."
                />
              </div>

              {/* Create Ticket */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="createTicket"
                    checked={createTicket}
                    onCheckedChange={(checked) => setCreateTicket(checked as boolean)}
                  />
                  <Label htmlFor="createTicket">Create ticket for this lead</Label>
                </div>

                {createTicket && (
                  <div className="space-y-2">
                    <Label htmlFor="assignTo">Assign to Team Member</Label>
                    <Select value={assignedTo} onValueChange={setAssignedTo}>
                      <SelectTrigger id="assignTo" className="bg-background">
                        <SelectValue placeholder="Select team member" />
                      </SelectTrigger>
                    <SelectContent className="bg-popover border border-border shadow-lg z-[100]">
                      {currentUser && (
                        <SelectItem value={currentUser.id} className="cursor-pointer hover:bg-accent">
                          {currentUser.full_name} (You)
                        </SelectItem>
                      )}
                      {teamMembers?.filter((member: any) => member.id !== currentUser?.id).map((member: any) => (
                        <SelectItem key={member.id} value={member.id} className="cursor-pointer hover:bg-accent">
                          {member.full_name || "Unknown"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Capture Lead"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
