import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Search,
  Plus,
  MoreVertical,
  Copy,
  Eye,
  Pencil,
  Trash2,
  Clock,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

export default function EmailTemplates() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: templates, isLoading } = useQuery({
    queryKey: ["email-templates", searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("email_templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (searchQuery) {
        query = query.ilike("name", `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const duplicateTemplate = useMutation({
    mutationFn: async (template: any) => {
      const { error } = await supabase.from("email_templates").insert({
        template_key: `${template.template_key}_copy`,
        template_name: `${template.template_name} (Copy)`,
        category: template.category,
        default_preheader: template.default_preheader,
        thumbnail_url: template.thumbnail_url,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast.success("Template duplicated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to duplicate template");
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from("email_templates")
        .delete()
        .eq("id", templateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast.success("Template deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete template");
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <div className="h-[72px] border-b bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20">
        <div className="container mx-auto h-full px-8 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Email Templates</h1>
            <p className="text-sm text-muted-foreground">
              Manage your reusable email templates
            </p>
          </div>

          <Button onClick={() => navigate("/email-templates/new")}>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-8 py-8 space-y-6">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Templates Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : templates?.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No templates found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates?.map((template: any) => (
              <Card key={template.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Thumbnail */}
                <div className="aspect-video bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 flex items-center justify-center border-b">
                  {template.thumbnail_url ? (
                    <img
                      src={template.thumbnail_url}
                      alt={template.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-4xl">📧</div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{template.template_name}</h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {template.description || template.template_key}
                      </p>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/email-campaigns/new?template=${template.id}`)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Use Template
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => duplicateTemplate.mutate(template)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/email-templates/${template.id}/edit`)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => deleteTemplate.mutate(template.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <Badge variant="secondary">{template.category}</Badge>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(template.created_at), "MMM d, yyyy")}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
