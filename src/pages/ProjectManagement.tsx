import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ClientsTab } from "@/components/pm/ClientsTab";
import { TicketsTab } from "@/components/pm/TicketsTab";
import { DocumentsTab } from "@/components/pm/DocumentsTab";
import { LegalDocumentsTab } from "@/components/pm/LegalDocumentsTab";
import { Link } from "react-router-dom";
import Header from "@/components/Header";

export default function ProjectManagement() {
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Project Management</h1>
            <p className="text-muted-foreground">Manage clients, support tickets, and e-signatures</p>
          </div>
          <Link to="/lead-form">
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              New Field Lead
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="tickets" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="tickets">Tickets</TabsTrigger>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="documents">E-Signatures</TabsTrigger>
            <TabsTrigger value="legal">Legal Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="tickets">
            <TicketsTab userId={user.id} />
          </TabsContent>

          <TabsContent value="clients">
            <ClientsTab userId={user.id} />
          </TabsContent>

          <TabsContent value="documents">
            <DocumentsTab userId={user.id} />
          </TabsContent>

          <TabsContent value="legal">
            <LegalDocumentsTab userId={user.id} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
