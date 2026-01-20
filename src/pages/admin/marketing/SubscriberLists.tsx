import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Download, 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  Users, 
  Mail,
  UserPlus,
  UserMinus,
  Globe
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { format } from "date-fns";

interface SubscriberList {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  member_count?: number;
  include_in_general_subscribe?: boolean;
}

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  status: string;
  created_at: string;
  tenant_id: string;
  lists?: { id: string; name: string; slug: string }[];
}

export default function SubscriberLists() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [editingList, setEditingList] = useState<SubscriberList | null>(null);
  const [newListName, setNewListName] = useState("");
  const [newListSlug, setNewListSlug] = useState("");
  const [selectedSubscriberId, setSelectedSubscriberId] = useState<string>("");

  // Fetch all lists with member counts
  const { data: lists = [], isLoading: listsLoading } = useQuery({
    queryKey: ["subscriber-lists"],
    queryFn: async () => {
      const { data: listsData, error: listsError } = await supabase
        .from("subscriber_lists")
        .select("*")
        .order("name");

      if (listsError) throw listsError;

      // Get member counts
      const listsWithCounts = await Promise.all(
        (listsData || []).map(async (list) => {
          const { count } = await supabase
            .from("subscriber_list_members")
            .select("*", { count: "exact", head: true })
            .eq("list_id", list.id);
          return { ...list, member_count: count || 0 };
        })
      );

      return listsWithCounts as SubscriberList[];
    },
  });

  // Fetch subscribers (all or by list)
  const { data: subscribers = [], isLoading: subscribersLoading } = useQuery({
    queryKey: ["subscribers", selectedListId, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("newsletter_subscribers")
        .select("id, email, name, status, created_at, tenant_id")
        .order("created_at", { ascending: false });

      if (searchTerm) {
        query = query.or(`email.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`);
      }

      const { data: subsData, error: subsError } = await query;
      if (subsError) throw subsError;

      // If filtering by list, get only subscribers in that list
      if (selectedListId) {
        const { data: memberIds } = await supabase
          .from("subscriber_list_members")
          .select("subscriber_id")
          .eq("list_id", selectedListId);

        const memberIdSet = new Set((memberIds || []).map(m => m.subscriber_id));
        return (subsData || []).filter(s => memberIdSet.has(s.id)) as Subscriber[];
      }

      // Get list memberships for each subscriber
      const subscribersWithLists = await Promise.all(
        (subsData || []).map(async (sub) => {
          const { data: memberships } = await supabase
            .from("subscriber_list_members")
            .select("list_id, subscriber_lists(id, name, slug)")
            .eq("subscriber_id", sub.id);

          const lists = (memberships || [])
            .map((m: any) => m.subscriber_lists)
            .filter(Boolean);

          return { ...sub, lists };
        })
      );

      return subscribersWithLists as Subscriber[];
    },
  });

  // Create list mutation
  const createListMutation = useMutation({
    mutationFn: async ({ name, slug }: { name: string; slug: string }) => {
      const { error } = await supabase
        .from("subscriber_lists")
        .insert({ name, slug });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriber-lists"] });
      setIsCreateDialogOpen(false);
      setNewListName("");
      setNewListSlug("");
      toast.success("List created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create list");
    },
  });

  // Update list mutation
  const updateListMutation = useMutation({
    mutationFn: async ({ id, name, slug }: { id: string; name: string; slug: string }) => {
      const { error } = await supabase
        .from("subscriber_lists")
        .update({ name, slug })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriber-lists"] });
      setIsEditDialogOpen(false);
      setEditingList(null);
      toast.success("List updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update list");
    },
  });

  // Delete list mutation
  const deleteListMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("subscriber_lists")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriber-lists"] });
      if (selectedListId) setSelectedListId(null);
      toast.success("List deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete list");
    },
  });

  // Add subscriber to list mutation
  const addToListMutation = useMutation({
    mutationFn: async ({ subscriberId, listId, tenantId }: { subscriberId: string; listId: string; tenantId: string }) => {
      const { error } = await supabase
        .from("subscriber_list_members")
        .insert({ subscriber_id: subscriberId, list_id: listId, tenant_id: tenantId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscribers"] });
      queryClient.invalidateQueries({ queryKey: ["subscriber-lists"] });
      setIsAddMemberDialogOpen(false);
      setSelectedSubscriberId("");
      toast.success("Subscriber added to list");
    },
    onError: (error: any) => {
      if (error.message?.includes("duplicate")) {
        toast.error("Subscriber is already in this list");
      } else {
        toast.error(error.message || "Failed to add subscriber");
      }
    },
  });

  // Remove subscriber from list mutation
  const removeFromListMutation = useMutation({
    mutationFn: async ({ subscriberId, listId }: { subscriberId: string; listId: string }) => {
      const { error } = await supabase
        .from("subscriber_list_members")
        .delete()
        .eq("subscriber_id", subscriberId)
        .eq("list_id", listId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscribers"] });
      queryClient.invalidateQueries({ queryKey: ["subscriber-lists"] });
      toast.success("Subscriber removed from list");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to remove subscriber");
    },
  });

  // Export CSV
  const handleExport = () => {
    const listName = selectedListId 
      ? lists.find(l => l.id === selectedListId)?.name || "list"
      : "all_subscribers";
    
    const csvContent = [
      ["Email", "Name", "Status", "Lists", "Subscribed At"].join(","),
      ...subscribers.map((sub) =>
        [
          sub.email,
          sub.name || "",
          sub.status,
          sub.lists?.map(l => l.name).join("; ") || "",
          format(new Date(sub.created_at), "yyyy-MM-dd HH:mm"),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${listName.toLowerCase().replace(/\s+/g, "_")}_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Export downloaded");
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
  };

  return (
    <div className="px-10 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Subscriber Lists</h1>
          <p className="text-muted-foreground">
            Manage subscriber lists and memberships
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create List
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New List</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>List Name</Label>
                <Input
                  value={newListName}
                  onChange={(e) => {
                    setNewListName(e.target.value);
                    setNewListSlug(generateSlug(e.target.value));
                  }}
                  placeholder="e.g. VIP Subscribers"
                />
              </div>
              <div className="space-y-2">
                <Label>Slug (used in CTAs)</Label>
                <Input
                  value={newListSlug}
                  onChange={(e) => setNewListSlug(e.target.value)}
                  placeholder="e.g. vip_subscribers"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => createListMutation.mutate({ name: newListName, slug: newListSlug })}
                disabled={!newListName || !newListSlug || createListMutation.isPending}
              >
                Create List
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="lists" className="space-y-4">
        <TabsList>
          <TabsTrigger value="lists">
            <Users className="mr-2 h-4 w-4" />
            Lists
          </TabsTrigger>
          <TabsTrigger value="subscribers">
            <Mail className="mr-2 h-4 w-4" />
            Subscribers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lists" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {listsLoading ? (
              <p className="text-muted-foreground">Loading lists...</p>
            ) : lists.length === 0 ? (
              <p className="text-muted-foreground">No lists created yet</p>
            ) : (
              lists.map((list) => (
                <Card key={list.id} className="relative">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{list.name}</CardTitle>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingList(list);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Delete this list? Subscribers won't be deleted.")) {
                              deleteListMutation.mutate(list.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <Badge variant="secondary" className="font-mono text-xs">
                          {list.slug}
                        </Badge>
                        <p className="mt-2 text-2xl font-bold">{list.member_count}</p>
                        <p className="text-xs text-muted-foreground">subscribers</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedListId(list.id);
                          const tabsList = document.querySelector('[value="subscribers"]') as HTMLElement;
                          tabsList?.click();
                        }}
                      >
                        View
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                      <Switch
                        checked={list.include_in_general_subscribe || false}
                        onCheckedChange={async (checked) => {
                          await supabase
                            .from('subscriber_lists')
                            .update({ include_in_general_subscribe: checked } as any)
                            .eq('id', list.id);
                          queryClient.invalidateQueries({ queryKey: ['subscriber-lists'] });
                          toast.success(checked ? 'Added to general subscribe' : 'Removed from general subscribe');
                        }}
                      />
                      <Label className="text-xs flex items-center gap-1 cursor-pointer">
                        <Globe className="w-3 h-3" />
                        Include in footer subscribe
                      </Label>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="subscribers" className="space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedListId || "all"}
                    onValueChange={(v) => setSelectedListId(v === "all" ? null : v)}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="All Subscribers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subscribers</SelectItem>
                      {lists.map((list) => (
                        <SelectItem key={list.id} value={list.id}>
                          {list.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search subscribers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 w-[250px]"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  {selectedListId && (
                    <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <UserPlus className="mr-2 h-4 w-4" />
                          Add Subscriber
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Subscriber to List</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                          <Label>Select Subscriber</Label>
                          <Select
                            value={selectedSubscriberId}
                            onValueChange={setSelectedSubscriberId}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a subscriber" />
                            </SelectTrigger>
                            <SelectContent>
                              {subscribers
                                .filter(s => !s.lists?.some(l => l.id === selectedListId))
                                .map((sub) => (
                                  <SelectItem key={sub.id} value={sub.id}>
                                    {sub.email}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <DialogFooter>
                          <Button
                            onClick={() => {
                              if (selectedListId && selectedSubscriberId) {
                                const subscriber = subscribers.find(s => s.id === selectedSubscriberId);
                                if (subscriber) {
                                  addToListMutation.mutate({
                                    subscriberId: selectedSubscriberId,
                                    listId: selectedListId,
                                    tenantId: subscriber.tenant_id,
                                  });
                                }
                              }
                            }}
                            disabled={!selectedSubscriberId || addToListMutation.isPending}
                          >
                            Add to List
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                  <Button variant="outline" size="sm" onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {subscribersLoading ? (
                <p className="text-muted-foreground py-8 text-center">Loading...</p>
              ) : subscribers.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center">No subscribers found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Lists</TableHead>
                      <TableHead>Subscribed</TableHead>
                      {selectedListId && <TableHead className="w-[50px]"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscribers.map((subscriber) => (
                      <TableRow key={subscriber.id}>
                        <TableCell className="font-medium">{subscriber.email}</TableCell>
                        <TableCell>{subscriber.name || "—"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={subscriber.status === "active" ? "default" : "secondary"}
                          >
                            {subscriber.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {subscriber.lists?.map((list) => (
                              <Badge key={list.id} variant="outline" className="text-xs">
                                {list.name}
                              </Badge>
                            )) || "—"}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(subscriber.created_at), "MMM d, yyyy")}
                        </TableCell>
                        {selectedListId && (
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm("Remove from this list?")) {
                                  removeFromListMutation.mutate({
                                    subscriberId: subscriber.id,
                                    listId: selectedListId,
                                  });
                                }
                              }}
                            >
                              <UserMinus className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit List Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit List</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>List Name</Label>
              <Input
                value={editingList?.name || ""}
                onChange={(e) =>
                  setEditingList((prev) => prev ? { ...prev, name: e.target.value } : null)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={editingList?.slug || ""}
                onChange={(e) =>
                  setEditingList((prev) => prev ? { ...prev, slug: e.target.value } : null)
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (editingList) {
                  updateListMutation.mutate({
                    id: editingList.id,
                    name: editingList.name,
                    slug: editingList.slug,
                  });
                }
              }}
              disabled={updateListMutation.isPending}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}