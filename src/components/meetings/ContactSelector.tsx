import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus, Search, X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

interface ContactSelectorProps {
  userId: string;
  onSelectContacts: (contacts: Contact[]) => void;
  selectedContacts: Contact[];
}

export function ContactSelector({ userId, onSelectContacts, selectedContacts }: ContactSelectorProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [newContactEmail, setNewContactEmail] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [addManualAttendeeOpen, setAddManualAttendeeOpen] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadContacts();
    }
  }, [open, userId]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = contacts.filter(contact =>
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredContacts(filtered);
    } else {
      setFilteredContacts(contacts);
    }
  }, [searchQuery, contacts]);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("contacts")
        .select("id, name, email, phone")
        .eq("user_id", userId)
        .order("name");

      if (error) throw error;
      setContacts(data || []);
      setFilteredContacts(data || []);
    } catch (error) {
      console.error("Error loading contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleContact = (contact: Contact) => {
    const isSelected = selectedContacts.some(c => c.id === contact.id);
    
    if (isSelected) {
      onSelectContacts(selectedContacts.filter(c => c.id !== contact.id));
    } else {
      onSelectContacts([...selectedContacts, contact]);
    }
  };

  const handleRemoveContact = (contactId: string) => {
    onSelectContacts(selectedContacts.filter(c => c.id !== contactId));
  };

  const handleAddNewContact = async () => {
    if (!newContactName || !newContactEmail) {
      toast({
        title: "Missing information",
        description: "Name and email are required",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("contacts")
        .insert({
          user_id: userId,
          name: newContactName,
          email: newContactEmail,
          phone: newContactPhone || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Contact added",
        description: "New contact has been added successfully",
      });

      // Add to contacts list and select it
      const newContact = { id: data.id, name: data.name, email: data.email, phone: data.phone };
      setContacts([...contacts, newContact]);
      onSelectContacts([...selectedContacts, newContact]);

      // Reset form
      setNewContactName("");
      setNewContactEmail("");
      setNewContactPhone("");
      setAddContactOpen(false);
    } catch (error: any) {
      toast({
        title: "Error adding contact",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddManualAttendee = () => {
    if (!manualName || !manualEmail) {
      toast({
        title: "Missing information",
        description: "Name and email are required",
        variant: "destructive",
      });
      return;
    }

    // Create a temporary contact object (not saved to database)
    const tempContact: Contact = {
      id: `temp-${Date.now()}-${Math.random()}`,
      name: manualName,
      email: manualEmail,
      phone: manualPhone || null,
    };

    onSelectContacts([...selectedContacts, tempContact]);

    toast({
      title: "Attendee added",
      description: `${manualName} has been added to the meeting`,
    });

    // Reset form
    setManualName("");
    setManualEmail("");
    setManualPhone("");
    setAddManualAttendeeOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Meeting Attendees</Label>
        <div className="flex gap-2">
          <Dialog open={addManualAttendeeOpen} onOpenChange={setAddManualAttendeeOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Attendee
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Attendee</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="manual-name">Name *</Label>
                  <Input
                    id="manual-name"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="Enter attendee name"
                  />
                </div>
                <div>
                  <Label htmlFor="manual-email">Email *</Label>
                  <Input
                    id="manual-email"
                    type="email"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    placeholder="Enter attendee email"
                  />
                </div>
                <div>
                  <Label htmlFor="manual-phone">Phone (Optional)</Label>
                  <Input
                    id="manual-phone"
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    placeholder="Enter attendee phone"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setAddManualAttendeeOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddManualAttendee}>
                    Add Attendee
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Add from Contacts
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Select Contacts</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search contacts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Dialog open={addContactOpen} onOpenChange={setAddContactOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Contact</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          value={newContactName}
                          onChange={(e) => setNewContactName(e.target.value)}
                          placeholder="Enter name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newContactEmail}
                          onChange={(e) => setNewContactEmail(e.target.value)}
                          placeholder="Enter email"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone (Optional)</Label>
                        <Input
                          id="phone"
                          value={newContactPhone}
                          onChange={(e) => setNewContactPhone(e.target.value)}
                          placeholder="Enter phone"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setAddContactOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddNewContact} disabled={saving}>
                          {saving ? "Adding..." : "Add Contact"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <ScrollArea className="h-[400px] pr-4">
                {loading ? (
                  <p className="text-center text-muted-foreground py-8">Loading contacts...</p>
                ) : filteredContacts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {searchQuery ? "No contacts found" : "No contacts available. Add contacts in CRM first."}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {filteredContacts.map((contact) => {
                      const isSelected = selectedContacts.some(c => c.id === contact.id);
                      return (
                        <div
                          key={contact.id}
                          onClick={() => handleToggleContact(contact)}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-primary/10 border-primary"
                              : "bg-background hover:bg-muted/50"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <p className="font-medium">{contact.name}</p>
                              <p className="text-sm text-muted-foreground">{contact.email}</p>
                              {contact.phone && (
                                <p className="text-sm text-muted-foreground">{contact.phone}</p>
                              )}
                            </div>
                            {isSelected && (
                              <Badge variant="default">Selected</Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>

              <div className="flex justify-end">
                <Button onClick={() => setOpen(false)}>
                  Done ({selectedContacts.length} selected)
                </Button>
              </div>
            </div>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {selectedContacts.length > 0 && (
        <div className="space-y-2">
          {selectedContacts.map((contact) => (
            <div
              key={contact.id}
              className="flex items-center justify-between p-3 bg-muted rounded-lg border"
            >
              <div className="space-y-1">
                <p className="font-medium">{contact.name}</p>
                <p className="text-sm text-muted-foreground">{contact.email}</p>
                {contact.phone && (
                  <p className="text-sm text-muted-foreground">{contact.phone}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveContact(contact.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
