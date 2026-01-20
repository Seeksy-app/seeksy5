import { useParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ContactOverviewTab } from "@/components/contacts/tabs/ContactOverviewTab";
import { ContactPreferencesTab } from "@/components/contacts/tabs/ContactPreferencesTab";
import { ContactListsTab } from "@/components/contacts/tabs/ContactListsTab";
import { ContactCommunicationTab } from "@/components/contacts/tabs/ContactCommunicationTab";
import { ScribeAssistant } from "@/components/email/ScribeAssistant";
import { useState } from "react";

export default function ContactProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminContext = location.pathname.startsWith('/admin');
  const [scribeOpen, setScribeOpen] = useState(false);

  const { data: contact, isLoading } = useQuery({
    queryKey: ["contact", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading contact...</div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Contact not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <div className="h-[72px] border-b bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20">
        <div className="container mx-auto h-full px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(isAdminContext ? "/admin/contacts" : "/engagement/contacts")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Contacts
            </Button>
            <div className="h-8 w-px bg-border" />
            <div>
              <h1 className="text-xl font-semibold">{contact.name}</h1>
              <p className="text-sm text-muted-foreground">{contact.email}</p>
            </div>
          </div>

          <Button onClick={() => setScribeOpen(true)}>
            <Mail className="h-4 w-4 mr-2" />
            Send Email
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white dark:bg-gray-900 rounded-xl p-1 shadow-sm">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="lists">Lists</TabsTrigger>
            <TabsTrigger value="communication">Communication History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <ContactOverviewTab contact={contact} />
          </TabsContent>

          <TabsContent value="preferences">
            <ContactPreferencesTab contactId={contact.id} />
          </TabsContent>

          <TabsContent value="lists">
            <ContactListsTab contactId={contact.id} />
          </TabsContent>

          <TabsContent value="communication">
            <ContactCommunicationTab contactId={contact.id} />
          </TabsContent>
        </Tabs>

        <ScribeAssistant
          open={scribeOpen}
          onOpenChange={setScribeOpen}
          action="draft"
          contactId={contact.id}
          context={{ contactName: contact.name, contactEmail: contact.email }}
        />
      </div>
    </div>
  );
}
