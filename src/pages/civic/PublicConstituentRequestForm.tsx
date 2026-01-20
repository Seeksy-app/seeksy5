import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { MessageSquare, Send } from "lucide-react";

export default function PublicConstituentRequestForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    topic: "",
    message: "",
  });

  const submitRequestMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from("constituent_requests")
        .insert([data]);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Request submitted successfully", {
        description: "We'll review your request and respond as soon as possible.",
      });
      setFormData({
        name: "",
        email: "",
        address: "",
        topic: "",
        message: "",
      });
    },
    onError: () => {
      toast.error("Failed to submit request", {
        description: "Please try again later.",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitRequestMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Contact Your Representative</CardTitle>
            <CardDescription>
              Submit your questions, concerns, or feedback. All requests are reviewed by our team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="john@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address (Optional)</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Main St, City, State ZIP"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="topic">Topic *</Label>
                <Input
                  id="topic"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  required
                  placeholder="e.g., Local Infrastructure, Education Policy"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Your Message *</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  placeholder="Please describe your question or concern..."
                  rows={6}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={submitRequestMutation.isPending}
              >
                <Send className="h-4 w-4 mr-2" />
                {submitRequestMutation.isPending ? "Submitting..." : "Submit Request"}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                By submitting this form, you acknowledge that your contact information may be used to respond to your request.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
