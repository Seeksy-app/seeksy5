import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Tag, FolderPlus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

interface BulkActionsProps {
  selectedContacts: string[];
  onClearSelection: () => void;
  lists: any[];
  tags: any[];
}

export function BulkActions({ selectedContacts, onClearSelection, lists, tags }: BulkActionsProps) {
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const queryClient = useQueryClient();

  const addToList = useMutation({
    mutationFn: async (listId: string) => {
      const insertData = selectedContacts.map(contactId => ({
        list_id: listId,
        contact_id: contactId,
      }));

      const { error } = await supabase
        .from("contact_list_members")
        .insert(insertData);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact_lists"] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contacts added to list");
      onClearSelection();
    },
    onError: (error: any) => {
      if (error.code === "23505") {
        toast.error("Some contacts are already in this list");
      } else {
        toast.error("Failed to add contacts to list");
      }
      console.error(error);
    },
  });

  const addTags = useMutation({
    mutationFn: async (tagId: string) => {
      const insertData = selectedContacts.map(contactId => ({
        contact_id: contactId,
        tag_id: tagId,
      }));

      const { error } = await supabase
        .from("contact_tag_assignments")
        .insert(insertData);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Tags added to contacts");
      onClearSelection();
    },
    onError: (error: any) => {
      if (error.code === "23505") {
        toast.error("Some contacts already have this tag");
      } else {
        toast.error("Failed to add tags");
      }
      console.error(error);
    },
  });

  const sendBulkEmail = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: contacts, error: fetchError } = await supabase
        .from("contacts")
        .select("email, name")
        .in("id", selectedContacts);

      if (fetchError) throw fetchError;

      const recipientEmails = contacts?.map(c => c.email) || [];

      const { error } = await supabase.functions.invoke("send-contact-email", {
        body: {
          recipientEmails,
          subject: emailSubject,
          message: emailMessage,
          userId: user.id,
        },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Emails sent successfully");
      setEmailDialogOpen(false);
      setEmailSubject("");
      setEmailMessage("");
      onClearSelection();
    },
    onError: (error) => {
      toast.error("Failed to send emails");
      console.error(error);
    },
  });

  const deleteContacts = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("contacts")
        .delete()
        .in("id", selectedContacts);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contacts deleted");
      onClearSelection();
    },
    onError: () => {
      toast.error("Failed to delete contacts");
    },
  });

  return (
    <>
      <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-lg border border-primary/20">
        <span className="text-sm font-medium text-primary">
          {selectedContacts.length} selected
        </span>
        
        <div className="h-4 w-px bg-border mx-2" />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost" className="h-8">
              <FolderPlus className="w-4 h-4 mr-2" />
              Add to List
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {lists.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                No lists available
              </div>
            ) : (
              lists.map((list) => (
                <DropdownMenuItem 
                  key={list.id}
                  onClick={() => addToList.mutate(list.id)}
                >
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: list.color }}
                  />
                  {list.name}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost" className="h-8">
              <Tag className="w-4 h-4 mr-2" />
              Add Tags
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {tags.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                No tags available
              </div>
            ) : (
              tags.map((tag) => (
                <DropdownMenuItem 
                  key={tag.id}
                  onClick={() => addTags.mutate(tag.id)}
                >
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button 
          size="sm" 
          variant="ghost" 
          className="h-8"
          onClick={() => setEmailDialogOpen(true)}
        >
          <Mail className="w-4 h-4 mr-2" />
          Send Email
        </Button>

        <DropdownMenuSeparator />

        <Button 
          size="sm" 
          variant="ghost" 
          className="h-8 text-destructive hover:text-destructive"
          onClick={() => {
            if (confirm(`Delete ${selectedContacts.length} contacts?`)) {
              deleteContacts.mutate();
            }
          }}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </Button>

        <Button
          size="sm"
          variant="ghost"
          className="h-8 ml-2"
          onClick={onClearSelection}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Email to {selectedContacts.length} Contacts</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Email subject..."
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Your message..."
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                rows={8}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setEmailDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => sendBulkEmail.mutate()}
                disabled={!emailSubject.trim() || !emailMessage.trim() || sendBulkEmail.isPending}
              >
                {sendBulkEmail.isPending ? "Sending..." : "Send Emails"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
