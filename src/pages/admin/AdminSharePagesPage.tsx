import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Link2, Eye, Pencil, Trash2, Copy, ExternalLink, Lock, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { CreateSharePageModal } from "@/components/admin/share/CreateSharePageModal";
import { useNavigate } from "react-router-dom";

export default function AdminSharePagesPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: pages, isLoading } = useQuery({
    queryKey: ["admin-share-pages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_share_pages")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (pageId: string) => {
      const { error } = await supabase
        .from("admin_share_pages")
        .delete()
        .eq("id", pageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-share-pages"] });
      toast.success("Share page deleted");
    },
    onError: () => {
      toast.error("Failed to delete share page");
    },
  });

  const filteredPages = pages?.filter(
    (page) =>
      page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/share/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Share Pages</h1>
          <p className="text-muted-foreground">
            Create private pages to share demos, proposals, and documents with external parties
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Share Page
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Input
          placeholder="Search pages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredPages?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Link2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No share pages yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first share page to start sharing content
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Share Page
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPages?.map((page) => (
            <Card key={page.id} className={!page.is_active || isExpired(page.expires_at) ? "opacity-60" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{page.title}</CardTitle>
                    <CardDescription className="text-xs font-mono">
                      /share/{page.slug}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    {page.password_hash && (
                      <Badge variant="secondary" className="text-xs">
                        <Lock className="h-3 w-3 mr-1" />
                        Protected
                      </Badge>
                    )}
                    {isExpired(page.expires_at) ? (
                      <Badge variant="destructive" className="text-xs">Expired</Badge>
                    ) : !page.is_active ? (
                      <Badge variant="secondary" className="text-xs">Inactive</Badge>
                    ) : (
                      <Badge variant="default" className="text-xs bg-green-600">Active</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {page.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {page.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {page.view_count} views
                  </div>
                  {page.expires_at && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {isExpired(page.expires_at) ? "Expired" : `Expires ${format(new Date(page.expires_at), "MMM d")}`}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => copyLink(page.slug)}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy Link
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/share/${page.slug}`, "_blank")}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/admin/share/${page.id}`)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm("Delete this share page?")) {
                        deleteMutation.mutate(page.id);
                      }
                    }}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateSharePageModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </div>
  );
}
