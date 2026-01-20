import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Pencil, Trash2, Mail, Calendar, MapPin, Tag, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface ContactOverviewTabProps {
  contact: any;
}

export function ContactOverviewTab({ contact }: ContactOverviewTabProps) {
  const queryClient = useQueryClient();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [name, setName] = useState(contact.name);
  const [email, setEmail] = useState(contact.email);
  const [phone, setPhone] = useState(contact.phone || "");
  const [notes, setNotes] = useState(contact.notes || "");

  const updateContact = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("contacts")
        .update({
          name,
          email,
          phone: phone || null,
          notes: notes || null,
        })
        .eq("id", contact.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact", contact.id] });
      toast.success("Contact updated successfully");
      setIsEditOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update contact");
    },
  });

  return (
    <div className="space-y-6">
      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Mail className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium text-muted-foreground">Email</span>
          </div>
          <p className="font-semibold">{contact.email}</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium text-muted-foreground">Added</span>
          </div>
          <p className="font-semibold">
            {format(new Date(contact.created_at), "MMM d, yyyy")}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="h-5 w-5 text-purple-500" />
            <span className="text-sm font-medium text-muted-foreground">Source</span>
          </div>
          <p className="font-semibold">{contact.source || "Manual"}</p>
        </div>
      </div>

      {/* Main Details Card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border shadow-sm">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Contact Details</h3>
            <p className="text-sm text-muted-foreground">
              View and manage contact information
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="text-sm text-muted-foreground">Name</Label>
            <p className="font-medium mt-1">{contact.name}</p>
          </div>

          <div>
            <Label className="text-sm text-muted-foreground">Email</Label>
            <p className="font-medium mt-1">{contact.email}</p>
          </div>

          {contact.phone && (
            <div>
              <Label className="text-sm text-muted-foreground">Phone</Label>
              <p className="font-medium mt-1">{contact.phone}</p>
            </div>
          )}

          {contact.tags && contact.tags.length > 0 && (
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">Tags</Label>
              <div className="flex flex-wrap gap-2">
                {contact.tags.map((tag: string, i: number) => (
                  <Badge key={i} variant="secondary">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {contact.notes && (
            <div className="md:col-span-2">
              <Label className="text-sm text-muted-foreground">Notes</Label>
              <p className="mt-1 text-sm">{contact.notes}</p>
            </div>
          )}
        </div>

        {contact.is_unsubscribed && (
          <div className="mt-6 pt-6 border-t">
            <Badge variant="destructive" className="text-sm">
              Unsubscribed from all communications
            </Badge>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label>Phone (optional)</Label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1.5"
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="mt-1.5"
                placeholder="Add notes about this contact..."
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                disabled={updateContact.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={() => updateContact.mutate()}
                disabled={!name || !email || updateContact.isPending}
              >
                {updateContact.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
