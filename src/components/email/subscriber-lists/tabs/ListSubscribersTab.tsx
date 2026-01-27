import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Search, Plus, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface ListSubscribersTabProps {
  listId: string;
}

export function ListSubscribersTab({ listId }: ListSubscribersTabProps) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");

  const { data: members, isLoading } = useQuery({
    queryKey: ["list-members", listId, searchQuery, statusFilter],
    queryFn: async () => {
      const result = await (supabase as any)
        .from("contact_list_members")
        .select(`
          *,
          contact:contacts(*)
        `)
        .eq("list_id", listId)
        .order("joined_at", { ascending: false });

      if (result.error) throw result.error;
      return (result.data || []) as any[];
    },
  });

  const addSubscriber = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // First, check if contact exists
      const existingResult = await (supabase as any)
        .from("contacts")
        .select("id")
        .eq("email", newEmail)
        .eq("user_id", user.id)
        .single();

      let contactId = existingResult.data?.id;

      // If not, create contact
      if (!contactId) {
        const newContactResult = await (supabase as any)
          .from("contacts")
          .insert({
            name: newName,
            email: newEmail,
            user_id: user.id,
          })
          .select("id")
          .single();

        if (newContactResult.error) throw newContactResult.error;
        contactId = newContactResult.data.id;
      }

      // Add to list
      const result = await (supabase as any)
        .from("contact_list_members")
        .insert({
          list_id: listId,
          contact_id: contactId,
        });

      if (result.error) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["list-members", listId] });
      queryClient.invalidateQueries({ queryKey: ["contact-lists"] });
      toast.success("Subscriber added successfully");
      setIsAddOpen(false);
      setNewEmail("");
      setNewName("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add subscriber");
    },
  });

  const removeSubscriber = useMutation({
    mutationFn: async (memberId: string) => {
      const result = await (supabase as any)
        .from("contact_list_members")
        .delete()
        .eq("id", memberId);

      if (result.error) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["list-members", listId] });
      queryClient.invalidateQueries({ queryKey: ["contact-lists"] });
      toast.success("Subscriber removed from list");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to remove subscriber");
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search subscribers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
            <SelectItem value="bounced">Bounced</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Subscriber
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Loading subscribers...
                </TableCell>
              </TableRow>
            ) : members?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No subscribers yet. Add your first subscriber to get started.
                </TableCell>
              </TableRow>
            ) : (
              members?.map((member: any) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.contact?.name}</TableCell>
                  <TableCell>{member.contact?.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      Active
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">Manual</TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(member.joined_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`/contacts/${member.contact_id}`, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSubscriber.mutate(member.id)}
                        disabled={removeSubscriber.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Subscriber Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Subscriber</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Email Address</Label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="subscriber@example.com"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label>Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="John Doe"
                className="mt-1.5"
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setIsAddOpen(false)}
                disabled={addSubscriber.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={() => addSubscriber.mutate()}
                disabled={!newEmail || addSubscriber.isPending}
              >
                {addSubscriber.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Subscriber
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
