import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Pencil, Trash2, Users, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ListOverviewTabProps {
  list: any;
  onListUpdated: () => void;
}

export function ListOverviewTab({ list, onListUpdated }: ListOverviewTabProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [name, setName] = useState(list.name);
  const [description, setDescription] = useState(list.description || "");

  const memberCount = list.contact_list_members?.[0]?.count || 0;

  const updateList = useMutation({
    mutationFn: async () => {
      const result = await (supabase as any)
        .from("contact_lists")
        .update({
          name,
          description: description || null,
        })
        .eq("id", list.id);

      if (result.error) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-lists"] });
      toast.success("List updated successfully");
      setIsEditOpen(false);
      onListUpdated();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update list");
    },
  });

  const deleteList = useMutation({
    mutationFn: async () => {
      // Delete list members first
      const membersResult = await (supabase as any)
        .from("contact_list_members")
        .delete()
        .eq("list_id", list.id);

      if (membersResult.error) throw membersResult.error;

      // Delete list
      const listResult = await (supabase as any)
        .from("contact_lists")
        .delete()
        .eq("id", list.id);

      if (listResult.error) throw listResult.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-lists"] });
      toast.success("List deleted successfully");
      navigate("/email-settings");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete list");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{list.name}</h2>
          {list.description && (
            <p className="text-muted-foreground mt-1">{list.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditOpen(true)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit List
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDeleteOpen(true)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete List
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700 mb-1">Total Subscribers</p>
              <p className="text-3xl font-semibold text-blue-900">{memberCount}</p>
            </div>
            <Users className="h-10 w-10 text-blue-500 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700 mb-1">Active Subscribers</p>
              <p className="text-3xl font-semibold text-green-900">{memberCount}</p>
              <p className="text-xs text-green-600 mt-1">100% active</p>
            </div>
            <Users className="h-10 w-10 text-green-500 opacity-50" />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Preference Channels</h3>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            Marketing Updates
          </Badge>
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            System Notifications
          </Badge>
          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
            Event Invites
          </Badge>
          <Badge variant="secondary" className="bg-orange-100 text-orange-700">
            Identity/Verification
          </Badge>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit List</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>List Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1.5"
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                disabled={updateList.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={() => updateList.mutate()}
                disabled={!name || updateList.isPending}
              >
                {updateList.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete List?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{list.name}" and remove all {memberCount} subscribers from the list.
              The contacts will remain in your database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteList.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteList.mutate()}
              disabled={deleteList.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteList.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete List
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
