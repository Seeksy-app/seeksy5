import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Coins, Search, User, Plus, Minus, History } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function CreditManagement() {
  const [searchQuery, setSearchQuery] = useState("");

  const mockUsers = [
    { id: "1", name: "John Doe", email: "john@example.com", credits: 45, plan: "Pro" },
    { id: "2", name: "Jane Smith", email: "jane@example.com", credits: 12, plan: "Free" },
    { id: "3", name: "Bob Johnson", email: "bob@example.com", credits: 150, plan: "Business" },
  ];

  const transactions = [
    { id: "1", user: "John Doe", type: "add", amount: 50, reason: "Promotional credits", date: "2024-01-15" },
    { id: "2", user: "Jane Smith", type: "remove", amount: 10, reason: "Adjustment", date: "2024-01-14" },
    { id: "3", user: "Bob Johnson", type: "add", amount: 100, reason: "Bonus credits", date: "2024-01-13" },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Coins className="h-8 w-8 text-primary" />
            Credit Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage user credits and subscription balances
          </p>
        </div>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList>
          <TabsTrigger value="users">User Credits</TabsTrigger>
          <TabsTrigger value="history">Transaction History</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search Users</CardTitle>
              <CardDescription>
                Find a user to manage their credit balance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="space-y-2">
                {mockUsers.map((user) => (
                  <Card key={user.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{user.name}</span>
                            <Badge variant="outline">{user.plan}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">{user.credits}</p>
                            <p className="text-xs text-muted-foreground">Credits</p>
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline">
                              <Plus className="h-3 w-3 mr-1" />
                              Add
                            </Button>
                            <Button size="sm" variant="outline">
                              <Minus className="h-3 w-3 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {transactions.map((txn) => (
            <Card key={txn.id}>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <History className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{txn.user}</span>
                      <Badge variant={txn.type === "add" ? "default" : "destructive"}>
                        {txn.type === "add" ? "+" : "-"}{txn.amount} credits
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{txn.reason}</p>
                    <p className="text-xs text-muted-foreground">{txn.date}</p>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
