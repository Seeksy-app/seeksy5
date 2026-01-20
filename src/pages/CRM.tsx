import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Users, Tag, Mail, Filter, Search } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContactsGrid } from "@/components/crm/ContactsGrid";
import { ListsSidebar } from "@/components/crm/ListsSidebar";
import { CreateListDialog } from "@/components/crm/CreateListDialog";
import { CreateContactDialog } from "@/components/crm/CreateContactDialog";
import { TagManager } from "@/components/crm/TagManager";
import { PipelineStagesManager } from "@/components/crm/PipelineStagesManager";
import { BulkActions } from "@/components/crm/BulkActions";
import { ContactViewDialog } from "@/components/contacts/ContactViewDialog";

const CRM = () => {
  const [selectedList, setSelectedList] = useState<string | null>("all");
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("contacts");
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingContact, setViewingContact] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: contacts, isLoading: contactsLoading } = useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("contacts")
        .select(`
          *,
          contact_tag_assignments(
            tag_id,
            contact_tags(id, name, color)
          )
        `)
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: lists } = useQuery({
    queryKey: ["contact_lists"],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("contact_lists")
        .select(`
          *,
          contact_list_members(count)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: tags } = useQuery({
    queryKey: ["contact_tags"],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("contact_tags")
        .select("*")
        .eq("user_id", user.id)
        .order("name");
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: listMembers } = useQuery({
    queryKey: ["contact_list_members", selectedList],
    queryFn: async () => {
      if (!selectedList || selectedList === "all") return null;
      const { data, error } = await supabase
        .from("contact_list_members")
        .select("contact_id")
        .eq("list_id", selectedList);
      
      if (error) throw error;
      return data?.map(m => m.contact_id) || [];
    },
    enabled: !!selectedList && selectedList !== "all",
  });

  const filteredContacts = contacts?.filter(contact => {
    const matchesSearch = 
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.company?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedList === "all") return matchesSearch;
    
    // Filter by list membership
    if (listMembers && !listMembers.includes(contact.id)) {
      return false;
    }
    
    return matchesSearch;
  });

  const handleSelectAll = () => {
    if (selectedContacts.length === filteredContacts?.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(filteredContacts?.map(c => c.id) || []);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="flex h-screen">
        {/* Sidebar with Lists */}
        <ListsSidebar
          lists={lists || []}
          selectedList={selectedList}
          onSelectList={setSelectedList}
          totalContacts={contacts?.length || 0}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-card border-b border-border/40 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                  <Users className="w-8 h-8 text-primary" />
                  Contact Center
                </h1>
                <p className="text-muted-foreground mt-1">
                  Manage your connections and build relationships
                </p>
              </div>
              
              <div className="flex gap-2">
                <CreateListDialog />
                <CreateContactDialog />
              </div>
            </div>

            {/* Search and Actions Bar */}
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background/50"
                />
              </div>
              
              {selectedContacts.length > 0 && (
                <BulkActions
                  selectedContacts={selectedContacts}
                  onClearSelection={() => setSelectedContacts([])}
                  lists={lists || []}
                  tags={tags || []}
                />
              )}
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="bg-card border-b border-border/40 px-6">
              <TabsList className="bg-transparent">
                <TabsTrigger value="contacts" className="data-[state=active]:bg-primary/10">
                  <Users className="w-4 h-4 mr-2" />
                  Contacts
                </TabsTrigger>
                <TabsTrigger value="tags" className="data-[state=active]:bg-primary/10">
                  <Tag className="w-4 h-4 mr-2" />
                  Tags
                </TabsTrigger>
                <TabsTrigger value="pipeline" className="data-[state=active]:bg-primary/10">
                  Pipeline
                </TabsTrigger>
                <TabsTrigger value="campaigns" className="data-[state=active]:bg-primary/10">
                  <Mail className="w-4 h-4 mr-2" />
                  Campaigns
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="contacts" className="flex-1 overflow-auto p-6 mt-0">
              <ContactsGrid
                contacts={filteredContacts || []}
                selectedContacts={selectedContacts}
                onSelectContact={(id) => {
                  setSelectedContacts(prev =>
                    prev.includes(id)
                      ? prev.filter(cid => cid !== id)
                      : [...prev, id]
                  );
                }}
                onViewContact={(contact) => {
                  setViewingContact(contact);
                  setViewDialogOpen(true);
                }}
                onSelectAll={handleSelectAll}
                isLoading={contactsLoading}
              />
            </TabsContent>

            <TabsContent value="tags" className="flex-1 overflow-auto p-6 mt-0">
              <TagManager tags={tags || []} />
            </TabsContent>

            <TabsContent value="pipeline" className="flex-1 overflow-auto p-6 mt-0">
              <PipelineStagesManager />
            </TabsContent>

            <TabsContent value="campaigns" className="flex-1 overflow-auto p-6 mt-0">
              <div className="text-center py-12">
                <Mail className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Email Campaigns Coming Soon</h3>
                <p className="text-muted-foreground">
                  Send beautiful email campaigns to your contacts
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <ContactViewDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        contact={viewingContact}
      />
    </div>
  );
};

export default CRM;
