import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, User, Mail, Ticket, Clock, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function UserProfiles() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["helpdesk-users"],
    queryFn: async () => {
      // Get unique requesters from tickets
      const { data, error } = await supabase
        .from("tickets")
        .select("requester_name, requester_email, created_at")
        .not("requester_email", "is", null)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      // Group by email and count tickets
      const userMap = new Map();
      data?.forEach((ticket) => {
        const email = ticket.requester_email;
        if (!userMap.has(email)) {
          userMap.set(email, {
            email,
            name: ticket.requester_name || "Unknown",
            ticketCount: 1,
            lastSeen: ticket.created_at,
          });
        } else {
          userMap.get(email).ticketCount++;
        }
      });
      
      return Array.from(userMap.values());
    },
  });

  const filteredUsers = users.filter((user: any) =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">User Profiles</h1>
          <p className="text-muted-foreground">View customers who have submitted tickets</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No users found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredUsers.map((user: any, index: number) => (
            <Card key={user.email || index} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {user.name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{user.name}</CardTitle>
                    <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {user.email}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Ticket className="h-4 w-4" />
                    <span>{user.ticketCount} ticket{user.ticketCount !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{formatDistanceToNow(new Date(user.lastSeen), { addSuffix: true })}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}