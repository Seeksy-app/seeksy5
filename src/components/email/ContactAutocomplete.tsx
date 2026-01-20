import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Contact {
  id: string;
  name: string;
  email: string;
}

interface ContactAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function ContactAutocomplete({ value, onChange, placeholder, className }: ContactAutocompleteProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Only show dropdown when actively typing a partial name (not a complete email)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (value && value.length > 0) {
        const lastEmail = value.split(",").pop()?.trim() || "";
        // Only show suggestions if:
        // 1. There's a partial entry without @ (searching by name)
        // 2. Entry has at least 2 characters
        if (lastEmail.length >= 2 && !lastEmail.includes("@")) {
          setSearchQuery(lastEmail);
          setShowDropdown(true);
        } else {
          setShowDropdown(false);
          setSearchQuery("");
        }
      } else {
        setShowDropdown(false);
        setSearchQuery("");
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [value]);

  const { data: contacts = [] } = useQuery({
    queryKey: ["contacts-autocomplete", searchQuery],
    queryFn: async () => {
      if (!searchQuery) return [];
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("contacts")
        .select("id, name, email")
        .eq("user_id", user.id)
        .or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .limit(5);

      if (error) throw error;
      return data as Contact[];
    },
    enabled: !!searchQuery && searchQuery.length > 0,
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [contacts]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Allow Tab to close dropdown and move to next field
    if (e.key === "Tab") {
      setShowDropdown(false);
      return;
    }

    // If dropdown is not shown or no contacts, allow normal typing
    if (!showDropdown || contacts.length === 0) {
      // Allow Enter to submit the form when dropdown is closed
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, contacts.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
        // Only select contact if dropdown is visible and there are suggestions
        if (showDropdown && contacts[selectedIndex]) {
          e.preventDefault();
          selectContact(contacts[selectedIndex]);
        }
        // Otherwise let Enter propagate normally
        break;
      case "Escape":
        e.preventDefault();
        setShowDropdown(false);
        break;
    }
  };

  const selectContact = (contact: Contact) => {
    const emails = value.split(",").map(e => e.trim()).filter(e => e);
    emails.pop(); // Remove the incomplete email
    emails.push(contact.email);
    onChange(emails.join(", "));
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      />

      {showDropdown && contacts.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg"
        >
          <div className="max-h-[200px] overflow-y-auto p-1">
            {contacts.map((contact, index) => (
              <button
                key={contact.id}
                onClick={() => selectContact(contact)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-sm px-3 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                  index === selectedIndex && "bg-accent text-accent-foreground"
                )}
              >
                <div className="flex flex-col items-start flex-1 min-w-0">
                  <span className="font-medium truncate w-full">{contact.name}</span>
                  <span className="text-xs text-muted-foreground truncate w-full">
                    {contact.email}
                  </span>
                </div>
                {index === selectedIndex && (
                  <Check className="h-4 w-4 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
