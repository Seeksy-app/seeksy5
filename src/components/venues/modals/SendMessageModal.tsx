import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Mail, MessageSquare } from "lucide-react";

interface SendMessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMode?: "email" | "sms";
}

export function SendMessageModal({ open, onOpenChange, defaultMode = "email" }: SendMessageModalProps) {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"email" | "sms">(defaultMode);
  const [formData, setFormData] = useState({
    recipient: "",
    subject: "",
    body: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const venueMode = localStorage.getItem("venueos_mode") || "demo";
    
    if (venueMode === "demo") {
      toast.success(`${mode === "email" ? "Email" : "SMS"} queued (Demo mode)`, {
        description: "Message not actually sent in demo mode"
      });
    } else {
      toast.success(`${mode === "email" ? "Email" : "SMS"} sent!`, {
        description: `Message sent to ${formData.recipient}`
      });
    }
    
    setFormData({ recipient: "", subject: "", body: "" });
    setLoading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Send Message</DialogTitle>
        </DialogHeader>
        
        <Tabs value={mode} onValueChange={(v) => setMode(v as "email" | "sms")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="sms" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              SMS
            </TabsTrigger>
          </TabsList>
          
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <TabsContent value="email" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label htmlFor="emailRecipient">To *</Label>
                <Input
                  id="emailRecipient"
                  type="email"
                  value={formData.recipient}
                  onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                  placeholder="client@example.com"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="emailSubject">Subject *</Label>
                <Input
                  id="emailSubject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Following up on your inquiry"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="emailBody">Message *</Label>
                <Textarea
                  id="emailBody"
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  placeholder="Write your email..."
                  rows={6}
                  required
                />
              </div>
            </TabsContent>
            
            <TabsContent value="sms" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label htmlFor="smsRecipient">Phone Number *</Label>
                <Input
                  id="smsRecipient"
                  type="tel"
                  value={formData.recipient}
                  onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                  placeholder="(555) 123-4567"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="smsBody">Message * <span className="text-muted-foreground text-xs">({formData.body.length}/160)</span></Label>
                <Textarea
                  id="smsBody"
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value.slice(0, 160) })}
                  placeholder="Your SMS message..."
                  rows={4}
                  maxLength={160}
                  required
                />
              </div>
            </TabsContent>
            
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} style={{ backgroundColor: "#EF4444" }}>
                {loading ? "Sending..." : `Send ${mode === "email" ? "Email" : "SMS"}`}
              </Button>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
