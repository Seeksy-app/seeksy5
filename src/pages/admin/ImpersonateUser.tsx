import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserCog, Search, User, Mail, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ImpersonateUser() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const mockUsers = [
    { id: "1", name: "John Doe", email: "john@example.com", role: "creator", plan: "Pro" },
    { id: "2", name: "Jane Smith", email: "jane@example.com", role: "advertiser", plan: "Business" },
    { id: "3", name: "Bob Johnson", email: "bob@example.com", role: "creator", plan: "Free" },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <UserCog className="h-8 w-8 text-primary" />
          Impersonate User
        </h1>
        <p className="text-muted-foreground mt-1">
          View the platform from any user's perspective for support and testing
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Security Notice:</strong> All impersonation sessions are logged for audit purposes. Only use this feature for legitimate support and testing needs.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Search Users</CardTitle>
          <CardDescription>
            Find a user by name, email, or ID to impersonate their session
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Enter user name, email, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {searchQuery && (
            <div className="space-y-2">
              <Label>Search Results</Label>
              <div className="space-y-2">
                {mockUsers
                  .filter(
                    (u) =>
                      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      u.email.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((user) => (
                    <Card
                      key={user.id}
                      className={`cursor-pointer hover:shadow-md transition-shadow ${
                        selectedUser?.id === user.id ? "border-primary" : ""
                      }`}
                      onClick={() => setSelectedUser(user)}
                    >
                      <CardHeader className="py-3">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{user.name}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {user.role} • {user.plan} Plan
                            </div>
                          </div>
                          {selectedUser?.id === user.id && (
                            <Button onClick={() => alert("Starting impersonation session...")}>
                              Start Session
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedUser && (
        <Alert>
          <UserCog className="h-4 w-4" />
          <AlertDescription>
            <strong>Selected User:</strong> {selectedUser.name} ({selectedUser.email})
            <br />
            Click "Start Session" to begin impersonation. You'll be logged in as this user and can access their account with full permissions.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
