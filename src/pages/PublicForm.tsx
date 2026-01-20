import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Camera, X, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function PublicForm() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const trackingCode = searchParams.get("agent");

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { data: form, isLoading } = useQuery({
    queryKey: ["public-form", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forms")
        .select("*")
        .eq("form_slug", slug)
        .eq("is_active", true)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const getLocation = () => {
    setGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lng: longitude });

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
          toast.success("Location captured");
        },
        () => {
          setGettingLocation(false);
          toast.error("Could not get location");
        }
      );
    }
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (photos.length + files.length > 5) {
      toast.error("Maximum 5 photos allowed");
      return;
    }

    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 5MB limit`);
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

  const submitForm = useMutation({
    mutationFn: async () => {
      if (!form) throw new Error("Form not found");

      const { data, error } = await supabase.functions.invoke("submit-form", {
        body: {
          formId: form.id,
          formData: {
            ...formData,
            location,
            photos: photos.map(p => p.name), // Photo upload handled by edge function
          },
          trackingCode,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Form submitted successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to submit form");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitForm.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Form Not Found</CardTitle>
            <CardDescription>
              This form doesn't exist or is no longer available.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="pt-12 pb-8 text-center space-y-4">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold">Thank You!</h2>
            <p className="text-muted-foreground">
              Your submission has been received. We'll get back to you soon.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const enabledFields = (form.enabled_fields as string[]) || [];

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{form.form_name}</CardTitle>
            {form.description && <CardDescription>{form.description}</CardDescription>}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {enabledFields.includes("gps") && (
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
              )}

              {enabledFields.includes("name") && (
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
              )}

              {enabledFields.includes("email") && (
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              )}

              {enabledFields.includes("phone") && (
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              )}

              {enabledFields.includes("company") && (
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={formData.company || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  />
                </div>
              )}

              {enabledFields.includes("address") && (
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
              )}

              {enabledFields.includes("notes") && (
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={4}
                  />
                </div>
              )}

              {enabledFields.includes("photos") && (
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
                        {photos.length === 0 ? "Add Photos" : `Add More (${photos.length}/5)`}
                      </span>
                    </Button>
                  </label>
                </div>
              )}

              <Button type="submit" disabled={submitForm.isPending} className="w-full">
                {submitForm.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
