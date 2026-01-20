import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import AdvertiserForm from "./AdvertiserForm";

export default function AdminAdvertisersList() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAdvertiser, setEditingAdvertiser] = useState<any>(null);

  const { data: advertisers, isLoading, refetch } = useQuery({
    queryKey: ["admin-advertisers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("advertisers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this advertiser?")) return;

    const { error } = await supabase
      .from("advertisers")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete advertiser");
      console.error(error);
    } else {
      toast.success("Advertiser deleted successfully");
      refetch();
    }
  };

  const handleEdit = (advertiser: any) => {
    setEditingAdvertiser(advertiser);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingAdvertiser(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingAdvertiser(null);
    refetch();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "pending":
        return "secondary";
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            Advertisers
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage advertiser accounts and profiles
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Advertiser
        </Button>
      </div>

      <Card>
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            Loading advertisers...
          </div>
        ) : !advertisers || advertisers.length === 0 ? (
          <div className="p-8 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No advertisers yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first advertiser to get started
            </p>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Advertiser
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {advertisers.map((advertiser) => (
                <TableRow key={advertiser.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold">{advertiser.company_name}</div>
                      {advertiser.website_url && (
                        <a
                          href={advertiser.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          {advertiser.website_url}
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{advertiser.contact_name}</div>
                      <div className="text-muted-foreground">{advertiser.contact_email}</div>
                      {advertiser.contact_phone && (
                        <div className="text-muted-foreground">{advertiser.contact_phone}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{advertiser.primary_goal || "N/A"}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(advertiser.status || "pending")}>
                      {advertiser.status || "pending"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(advertiser.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(advertiser)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(advertiser.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {isFormOpen && (
        <AdvertiserForm
          advertiser={editingAdvertiser}
          open={isFormOpen}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
