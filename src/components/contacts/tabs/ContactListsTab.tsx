import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExternalLink, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface ContactListsTabProps {
  contactId: string;
}

export function ContactListsTab({ contactId }: ContactListsTabProps) {
  const navigate = useNavigate();

  const { data: memberships, isLoading } = useQuery({
    queryKey: ["contact-list-memberships", contactId],
    queryFn: async () => {
      const result = await (supabase as any)
        .from("contact_list_members")
        .select(`
          *,
          list:contact_lists(*)
        `)
        .eq("contact_id", contactId)
        .order("joined_at", { ascending: false });

      if (result.error) throw result.error;
      return (result.data as any[]) || [];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border shadow-sm space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Subscriber Lists</h3>
        <p className="text-sm text-muted-foreground">
          All lists this contact is subscribed to
        </p>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>List Name</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {memberships?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Not subscribed to any lists
                </TableCell>
              </TableRow>
            ) : (
              memberships?.map((membership: any) => (
                <TableRow key={membership.id}>
                  <TableCell className="font-medium">
                    {membership.list?.name}
                  </TableCell>
                  <TableCell>
                    {format(new Date(membership.joined_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      Active
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/email-settings?list=${membership.list_id}`)}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View List
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
