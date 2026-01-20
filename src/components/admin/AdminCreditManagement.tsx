import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Coins } from "lucide-react";

export function AdminCreditManagement() {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAISearching, setIsAISearching] = useState(false);
  const queryClient = useQueryClient();

  const { data: users } = useQuery({
    queryKey: ["admin-users-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, account_full_name, username")
        .order("account_full_name");

      if (error) throw error;
      return data;
    },
  });

  const handleAISearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search query");
      return;
    }

    setIsAISearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-admin-search", {
        body: { query: searchQuery, searchType: "profiles" },
      });

      if (error) throw error;

      if (data.results?.length > 0) {
        const firstResult = data.results[0];
        setSelectedUserId(firstResult.id);
        toast.success(`Found: ${firstResult.name}`, {
          description: firstResult.matchReason,
        });
      } else {
        toast.info("No matches found", {
          description: "Try a different search term",
        });
      }
    } catch (error: any) {
      console.error("AI search error:", error);
      toast.error("Search failed", {
        description: error.message,
      });
    } finally {
      setIsAISearching(false);
    }
  };

  const filteredUsers = users?.filter(user => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.account_full_name?.toLowerCase().includes(query) ||
      user.username?.toLowerCase().includes(query) ||
      user.id.toLowerCase().includes(query)
    );
  });

  const { data: userCredits } = useQuery({
    queryKey: ["admin-user-credits", selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return null;
      
      const { data, error } = await supabase
        .from("user_credits")
        .select("*")
        .eq("user_id", selectedUserId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!selectedUserId,
  });

  const addCreditsMutation = useMutation({
    mutationFn: async ({
      targetUserId,
      amount,
      reason,
    }: {
      targetUserId: string;
      amount: number;
      reason: string;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("admin-add-credits", {
        body: { targetUserId, amount, reason },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success("Credits added successfully", {
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["admin-user-credits"] });
      setAmount("");
      setReason("");
    },
    onError: (error: any) => {
      toast.error("Failed to add credits", {
        description: error.message,
      });
    },
  });

  const handleAddCredits = () => {
    if (!selectedUserId || !amount) {
      toast.error("Please select a user and enter an amount");
      return;
    }

    const numAmount = parseInt(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Please enter a valid positive number");
      return;
    }

    addCreditsMutation.mutate({
      targetUserId: selectedUserId,
      amount: numAmount,
      reason: reason || "Admin credit grant",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5" />
          Credit Management
        </CardTitle>
        <CardDescription>
          Add credits to user accounts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="ai-search">AI Search</Label>
          <div className="flex gap-2">
            <Input
              id="ai-search"
              placeholder="Try: 'Johnny Rocket', 'user with 0 credits'..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAISearch();
                }
              }}
            />
            <Button 
              onClick={handleAISearch}
              disabled={isAISearching || !searchQuery.trim()}
              size="sm"
            >
              {isAISearching ? "Searching..." : "Search"}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="user-select">Or Select User</Label>
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger id="user-select">
              <SelectValue placeholder="Choose a user" />
            </SelectTrigger>
            <SelectContent>
              {filteredUsers?.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.account_full_name || user.username || user.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedUserId && userCredits && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Current Balance</p>
            <p className="text-2xl font-bold">{userCredits.balance} credits</p>
            <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
              <div>
                <p className="text-muted-foreground">Purchased</p>
                <p className="font-semibold">{userCredits.total_purchased}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Spent</p>
                <p className="font-semibold">{userCredits.total_spent}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Earned</p>
                <p className="font-semibold">{userCredits.total_earned}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="amount">Amount to Add</Label>
          <Input
            id="amount"
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter number of credits"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reason">Reason (Optional)</Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why are you adding these credits?"
            rows={3}
          />
        </div>

        <Button
          onClick={handleAddCredits}
          disabled={!selectedUserId || !amount || addCreditsMutation.isPending}
          className="w-full"
        >
          {addCreditsMutation.isPending ? "Adding..." : "Add Credits"}
        </Button>
      </CardContent>
    </Card>
  );
}