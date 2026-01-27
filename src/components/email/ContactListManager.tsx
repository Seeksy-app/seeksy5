import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const ContactListManager = () => {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newListName, setNewListName] = useState("");

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: lists, isLoading } = useQuery({
    queryKey: ["contact-lists", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const result = await (supabase as any)
        .from("contact_lists")
        .select(`
          *,
          contact_list_members(count)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (result.error) throw result.error;
      return result.data as any[];
    },
    enabled: !!user,
  });

  const createList = useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error("Not authenticated");
      
      const result = await (supabase as any)
        .from("contact_lists")
        .insert({
          user_id: user.id,
          name,
          is_system: false,
        });
      
      if (result.error) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-lists"] });
      toast.success("List created successfully");
      setIsCreateOpen(false);
      setNewListName("");
    },
    onError: () => {
      toast.error("Failed to create list");
    },
  });

  const deleteList = useMutation({
    mutationFn: async (listId: string) => {
      const result = await (supabase as any)
        .from("contact_lists")
        .delete()
        .eq("id", listId);
      
      if (result.error) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-lists"] });
      toast.success("List deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete list");
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Contact Lists
        </CardTitle>
        <CardDescription>
          Organize contacts into lists for targeted campaigns
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading lists...</p>
        ) : lists && lists.length > 0 ? (
          <div className="space-y-2">
            {lists.map((list) => (
              <div
                key={list.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{list.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {list.contact_list_members?.[0]?.count || 0} contacts
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {list.is_system && <Badge variant="secondary">System</Badge>}
                  {!list.is_system && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteList.mutate(list.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No lists created yet
          </p>
        )}
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Create New List
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Contact List</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="List name (e.g., Newsletter Subscribers)"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
              />
              <Button
                onClick={() => createList.mutate(newListName)}
                disabled={!newListName.trim()}
                className="w-full"
              >
                Create List
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
