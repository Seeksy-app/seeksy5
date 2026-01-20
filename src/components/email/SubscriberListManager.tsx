import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ListDirectory } from "./subscriber-lists/ListDirectory";
import { ListDetailsPanel } from "./subscriber-lists/ListDetailsPanel";

export function SubscriberListManager() {
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: lists, isLoading } = useQuery({
    queryKey: ["contact-lists", user?.id, searchQuery],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from("contact_lists")
        .select(`
          *,
          contact_list_members(count)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (searchQuery) {
        query = query.ilike("name", `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const selectedList = lists?.find((l) => l.id === selectedListId);

  return (
    <div className="grid grid-cols-[35%_65%] gap-8">
      <ListDirectory
        lists={lists || []}
        isLoading={isLoading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedListId={selectedListId}
        onSelectList={setSelectedListId}
      />

      <ListDetailsPanel
        list={selectedList}
        onListUpdated={() => {
          // Refresh lists after updates
        }}
      />
    </div>
  );
}
