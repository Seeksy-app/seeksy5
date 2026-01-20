import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, User, Mail, Phone, Check } from "lucide-react";

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

interface ContactsPickerDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedContacts: Contact[];
  onAddContact: (contact: Contact) => void;
  onRemoveContact: (contactId: string) => void;
}

export function ContactsPickerDrawer({
  open,
  onOpenChange,
  selectedContacts,
  onAddContact,
  onRemoveContact,
}: ContactsPickerDrawerProps) {
  const [search, setSearch] = useState("");
  const [editingPhone, setEditingPhone] = useState<string | null>(null);
  const [tempPhone, setTempPhone] = useState("");

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["contacts-for-meeting"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("id, name, email, phone")
        .order("name", { ascending: true })
        .limit(200);

      if (error) throw error;
      return (data || []) as Contact[];
    },
    enabled: open,
  });

  const filteredContacts = contacts.filter((contact) => {
    const searchLower = search.toLowerCase();
    return (
      contact.name?.toLowerCase().includes(searchLower) ||
      contact.email?.toLowerCase().includes(searchLower) ||
      contact.phone?.includes(search)
    );
  });

  const isSelected = (contactId: string) =>
    selectedContacts.some((c) => c.id === contactId);

  const handleAddContact = (contact: Contact) => {
    if (!isSelected(contact.id)) {
      // If contact has no phone, prompt to add one
      if (!contact.phone) {
        setEditingPhone(contact.id);
        setTempPhone("");
      } else {
        onAddContact(contact);
      }
    }
  };

  const handleSavePhone = (contact: Contact) => {
    const updatedContact = { ...contact, phone: tempPhone || null };
    onAddContact(updatedContact);
    setEditingPhone(null);
    setTempPhone("");
  };

  const handleSkipPhone = (contact: Contact) => {
    onAddContact(contact);
    setEditingPhone(null);
    setTempPhone("");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Add from Contacts
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Selected Count */}
          {selectedContacts.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary">{selectedContacts.length} selected</Badge>
            </div>
          )}

          {/* Contact List */}
          <ScrollArea className="h-[calc(100vh-240px)]">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading contacts...
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {search ? "No contacts found" : "No contacts available"}
              </div>
            ) : (
              <div className="space-y-2 pr-4">
                {filteredContacts.map((contact) => {
                  const selected = isSelected(contact.id);
                  const isEditingThis = editingPhone === contact.id;

                  return (
                    <div
                      key={contact.id}
                      className={`p-3 rounded-lg border transition-colors ${
                        selected
                          ? "bg-primary/5 border-primary"
                          : "hover:bg-muted/50 border-border"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{contact.name}</p>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{contact.email}</span>
                          </div>
                          {contact.phone && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              <span>{contact.phone}</span>
                            </div>
                          )}
                          {!contact.phone && !isEditingThis && (
                            <div className="text-xs text-orange-500 mt-1">
                              No phone number
                            </div>
                          )}
                        </div>

                        {selected ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemoveContact(contact.id)}
                          >
                            <Check className="h-4 w-4 text-primary mr-1" />
                            Added
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddContact(contact)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                          </Button>
                        )}
                      </div>

                      {/* Inline phone editor */}
                      {isEditingThis && (
                        <div className="mt-3 p-3 bg-muted/50 rounded-md space-y-2">
                          <p className="text-sm text-muted-foreground">
                            Add phone number (optional for SMS)
                          </p>
                          <div className="flex gap-2">
                            <Input
                              placeholder="+1 555 123 4567"
                              value={tempPhone}
                              onChange={(e) => setTempPhone(e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleSavePhone(contact)}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSkipPhone(contact)}
                            >
                              Skip
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Done button */}
          <Button
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Done ({selectedContacts.length} selected)
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
