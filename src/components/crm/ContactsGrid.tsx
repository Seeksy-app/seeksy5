import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Building, MoreVertical, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  title?: string;
  lead_status?: string;
  lead_source?: string;
  sales_rep_id?: string;
  contact_tag_assignments?: Array<{
    contact_tags: {
      name: string;
      color: string;
    };
  }>;
}

interface ContactsGridProps {
  contacts: Contact[];
  selectedContacts: string[];
  onSelectContact: (id: string) => void;
  onViewContact: (contact: Contact) => void;
  onSelectAll: () => void;
  isLoading: boolean;
}

export function ContactsGrid({
  contacts,
  selectedContacts,
  onSelectContact,
  onViewContact,
  onSelectAll,
  isLoading,
}: ContactsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="p-4 h-40 animate-pulse bg-muted/20" />
        ))}
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No contacts yet</h3>
        <p className="text-muted-foreground">
          Start building your network by adding your first contact
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Select All Header */}
      <div className="flex items-center gap-2 mb-4 p-3 bg-muted/20 rounded-lg">
        <Checkbox
          checked={selectedContacts.length === contacts.length && contacts.length > 0}
          onCheckedChange={onSelectAll}
        />
        <span className="text-sm text-muted-foreground">
          {selectedContacts.length > 0
            ? `${selectedContacts.length} selected`
            : "Select all"}
        </span>
      </div>

      {/* Contacts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contacts.map((contact) => (
          <Card
            key={contact.id}
            className="p-4 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] bg-card border-border/40 cursor-pointer"
            onClick={() => onViewContact(contact)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={selectedContacts.includes(contact.id)}
                  onCheckedChange={() => onSelectContact(contact.id)}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">{contact.name}</h3>
                  {contact.title && (
                    <p className="text-sm text-muted-foreground">{contact.title}</p>
                  )}
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span className="truncate">{contact.email}</span>
              </div>
              
              {contact.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{contact.phone}</span>
                </div>
              )}
              
              {contact.company && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building className="w-4 h-4" />
                  <span>{contact.company}</span>
                </div>
              )}
            </div>

            {/* Lead Status & Source Badges */}
            {(contact.lead_status || contact.lead_source || (contact.contact_tag_assignments && contact.contact_tag_assignments.length > 0)) && (
              <div className="flex flex-wrap gap-1 mt-3">
                {contact.lead_status && (
                  <Badge variant="secondary">
                    {contact.lead_status}
                  </Badge>
                )}
                {contact.lead_source && (
                  <Badge variant="outline">{contact.lead_source}</Badge>
                )}
                {contact.contact_tag_assignments && contact.contact_tag_assignments.length > 0 && (
                  contact.contact_tag_assignments.map((assignment, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      style={{
                        backgroundColor: assignment.contact_tags.color + "20",
                        color: assignment.contact_tags.color,
                        borderColor: assignment.contact_tags.color,
                      }}
                      className="border"
                    >
                      {assignment.contact_tags.name}
                    </Badge>
                  ))
                )}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}