import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  User,
  Mail,
  Calendar,
  Coins,
  Plus,
  Minus,
  History,
  StickyNote,
  UserCog,
  ChevronDown,
  Clock,
  Activity,
  Mic,
  Video,
  CalendarCheck,
  ShoppingCart,
} from "lucide-react";
import { format } from "date-fns";

interface UserDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    account_full_name?: string;
    username?: string;
    avatar_url?: string;
    created_at?: string;
    user_roles?: { role: string }[];
    user_credits?: { balance: number };
    subscriptions?: { plan_name: string; status: string };
  } | null;
}

export function UserDetailDrawer({ open, onOpenChange, user }: UserDetailDrawerProps) {
  const [creditAmount, setCreditAmount] = useState("");
  const [creditReason, setCreditReason] = useState("");
  const [newNote, setNewNote] = useState("");
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [creditAction, setCreditAction] = useState<"add" | "remove">("add");
  const [transactionsOpen, setTransactionsOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch user credits
  const { data: userCredits, refetch: refetchCredits } = useQuery({
    queryKey: ["admin-user-credits-drawer", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("user_credits")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!user?.id && open,
  });

  // Fetch credit transactions
  const { data: transactions } = useQuery({
    queryKey: ["admin-credit-transactions", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      // Using raw query since credit_transactions may not be in types yet
      const { data, error } = await supabase
        .from("credit_transactions" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) return [];
      return (data as unknown || []) as Array<{
        id: string;
        amount: number;
        balance_after: number;
        type: string;
        reason: string;
        created_at: string;
      }>;
    },
    enabled: !!user?.id && open,
  });

  // Fetch admin notes
  const { data: notes, refetch: refetchNotes } = useQuery({
    queryKey: ["admin-user-notes", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      // Using raw query since admin_user_notes may not be in types yet
      const { data, error } = await supabase
        .from("admin_user_notes" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) return [];
      return (data as unknown || []) as Array<{
        id: string;
        note: string;
        admin_id: string;
        created_at: string;
      }>;
    },
    enabled: !!user?.id && open,
  });

  // Fetch recent activity
  const { data: recentActivity } = useQuery({
    queryKey: ["admin-user-activity", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) return [];
      return data || [];
    },
    enabled: !!user?.id && open,
  });

  // Add credits mutation
  const addCreditsMutation = useMutation({
    mutationFn: async ({ amount, reason, action }: { amount: number; reason: string; action: "add" | "remove" }) => {
      if (!user?.id) throw new Error("No user selected");
      
      const currentBalance = userCredits?.balance || 0;
      const newBalance = action === "add" 
        ? currentBalance + amount 
        : Math.max(0, currentBalance - amount);

      // Update user credits
      const { error: updateError } = await supabase
        .from("user_credits")
        .upsert({
          user_id: user.id,
          balance: newBalance,
          total_purchased: action === "add" 
            ? (userCredits?.total_purchased || 0) + amount 
            : userCredits?.total_purchased || 0,
          updated_at: new Date().toISOString(),
        });

      if (updateError) throw updateError;

      // Log transaction (using raw query)
      const { data: session } = await supabase.auth.getSession();
      await supabase.from("credit_transactions" as any).insert({
        user_id: user.id,
        admin_id: session.session?.user.id,
        amount: action === "add" ? amount : -amount,
        balance_after: newBalance,
        type: action,
        reason: reason || `Admin ${action}`,
      });

      return { newBalance };
    },
    onSuccess: (data) => {
      toast.success(`Credits ${creditAction === "add" ? "added" : "removed"} successfully`, {
        description: `New balance: ${data.newBalance} credits`,
      });
      setCreditDialogOpen(false);
      setCreditAmount("");
      setCreditReason("");
      refetchCredits();
      queryClient.invalidateQueries({ queryKey: ["admin-creators"] });
      queryClient.invalidateQueries({ queryKey: ["admin-credit-transactions", user?.id] });
    },
    onError: (error: any) => {
      toast.error("Failed to update credits", { description: error.message });
    },
  });

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: async (note: string) => {
      if (!user?.id) throw new Error("No user selected");
      const { data: session } = await supabase.auth.getSession();
      
      // Using raw query since admin_user_notes may not be in types yet
      const { error } = await supabase.from("admin_user_notes" as any).insert({
        user_id: user.id,
        admin_id: session.session?.user.id || "",
        note,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Note added");
      setNewNote("");
      refetchNotes();
    },
    onError: (error: any) => {
      toast.error("Failed to add note", { description: error.message });
    },
  });

  const handleCreditAction = (action: "add" | "remove") => {
    setCreditAction(action);
    setCreditDialogOpen(true);
  };

  const handleSubmitCredit = () => {
    const amount = parseInt(creditAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    addCreditsMutation.mutate({ amount, reason: creditReason, action: creditAction });
  };

  const getActivityIcon = (actionType: string) => {
    if (actionType.includes("podcast")) return <Mic className="h-4 w-4" />;
    if (actionType.includes("video") || actionType.includes("media")) return <Video className="h-4 w-4" />;
    if (actionType.includes("meeting") || actionType.includes("calendar")) return <CalendarCheck className="h-4 w-4" />;
    if (actionType.includes("credit") || actionType.includes("purchase")) return <ShoppingCart className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  if (!user) return null;

  const initials = user.account_full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U";

  const currentCredits = userCredits?.balance ?? user.user_credits?.balance ?? 0;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg overflow-hidden flex flex-col">
          <SheetHeader className="pb-4">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <SheetTitle className="text-xl">
                  {user.account_full_name || "No name"}
                </SheetTitle>
                <SheetDescription className="flex flex-wrap gap-2 mt-1">
                  {user.user_roles?.map((r, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {r.role}
                    </Badge>
                  ))}
                  <Badge variant="outline" className="text-xs">
                    {user.subscriptions?.plan_name || "Free"}
                  </Badge>
                </SheetDescription>
                <div className="flex items-center gap-2 mt-2">
                  <Coins className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-primary">{currentCredits} credits</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(`/admin/impersonate?user=${user.id}`, "_blank")}
              >
                <UserCog className="h-4 w-4 mr-1" />
                Impersonate
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleCreditAction("add")}>
                <Plus className="h-4 w-4 mr-1" />
                Add Credits
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleCreditAction("remove")}>
                <Minus className="h-4 w-4 mr-1" />
                Remove
              </Button>
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-6 pb-6">
              {/* Profile & Contact */}
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <User className="h-4 w-4" />
                  Profile & Contact
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>@{user.username || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Joined {user.created_at ? format(new Date(user.created_at), "MMM d, yyyy") : "—"}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Credits & Billing */}
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <Coins className="h-4 w-4" />
                  Credits & Billing
                </h3>
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Current Balance</span>
                    <span className="text-2xl font-bold text-primary">{currentCredits}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Purchased</p>
                      <p className="font-semibold">{userCredits?.total_purchased || 0}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Spent</p>
                      <p className="font-semibold">{userCredits?.total_spent || 0}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Earned</p>
                      <p className="font-semibold">{userCredits?.total_earned || 0}</p>
                    </div>
                  </div>

                  {/* Recent Transactions */}
                  <Collapsible open={transactionsOpen} onOpenChange={setTransactionsOpen}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full justify-between">
                        <span className="flex items-center gap-2">
                          <History className="h-4 w-4" />
                          Recent Transactions
                        </span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${transactionsOpen ? "rotate-180" : ""}`} />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-2 space-y-2">
                      {transactions && transactions.length > 0 ? (
                        transactions.map((txn: any) => (
                          <div key={txn.id} className="flex items-center justify-between text-xs p-2 bg-background rounded">
                            <div>
                              <p className="font-medium">{txn.reason || txn.type}</p>
                              <p className="text-muted-foreground">
                                {format(new Date(txn.created_at), "MMM d, h:mm a")}
                              </p>
                            </div>
                            <Badge variant={txn.amount > 0 ? "default" : "destructive"}>
                              {txn.amount > 0 ? "+" : ""}{txn.amount}
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground text-center py-2">No transactions yet</p>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </div>

              <Separator />

              {/* Activity & Usage */}
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <Activity className="h-4 w-4" />
                  Activity & Usage
                </h3>
                <div className="space-y-2">
                  {recentActivity && recentActivity.length > 0 ? (
                    recentActivity.slice(0, 5).map((activity: any) => (
                      <div key={activity.id} className="flex items-start gap-3 p-2 bg-muted/30 rounded text-sm">
                        <div className="text-muted-foreground mt-0.5">
                          {getActivityIcon(activity.action_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate">{activity.action_description}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(activity.created_at), "MMM d, h:mm a")}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Internal Notes */}
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <StickyNote className="h-4 w-4" />
                  Internal Notes
                </h3>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Add a note about this user..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={() => addNoteMutation.mutate(newNote)}
                    disabled={!newNote.trim() || addNoteMutation.isPending}
                  >
                    {addNoteMutation.isPending ? "Adding..." : "Add Note"}
                  </Button>

                  {notes && notes.length > 0 && (
                    <div className="space-y-2 mt-4">
                      {notes.map((note: any) => (
                        <div key={note.id} className="p-3 bg-muted/30 rounded-lg">
                          <p className="text-sm">{note.note}</p>
                          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(note.created_at), "MMM d, yyyy h:mm a")}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Credit Adjustment Dialog */}
      <Dialog open={creditDialogOpen} onOpenChange={setCreditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {creditAction === "add" ? "Add Credits" : "Remove Credits"}
            </DialogTitle>
            <DialogDescription>
              {creditAction === "add"
                ? "Add credits to this user's account"
                : "Remove credits from this user's account"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current Balance</Label>
              <p className="text-2xl font-bold text-primary">{currentCredits} credits</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="credit-amount">Amount</Label>
              <Input
                id="credit-amount"
                type="number"
                min="1"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                placeholder="Enter number of credits"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="credit-reason">Reason</Label>
              <Textarea
                id="credit-reason"
                value={creditReason}
                onChange={(e) => setCreditReason(e.target.value)}
                placeholder="Why are you adjusting credits?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitCredit}
              disabled={addCreditsMutation.isPending}
              variant={creditAction === "remove" ? "destructive" : "default"}
            >
              {addCreditsMutation.isPending
                ? "Processing..."
                : creditAction === "add"
                ? "Add Credits"
                : "Remove Credits"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}