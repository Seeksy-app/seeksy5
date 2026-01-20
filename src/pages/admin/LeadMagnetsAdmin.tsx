import { useState } from "react";
import { 
  FileText, Plus, Upload, Copy, Edit2, Trash2, Archive, CheckCircle, 
  Loader2, X, Share2, ExternalLink, Download, TrendingUp, Eye, BarChart3,
  Link as LinkIcon, QrCode
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  useAllLeadMagnets,
  useCreateLeadMagnet,
  useUpdateLeadMagnet,
  useToggleLeadMagnetStatus,
  useDeleteLeadMagnet,
  uploadLeadMagnetPdf,
  getLeadMagnetSignedUrl,
  type LeadMagnet,
} from "@/hooks/useLeadMagnets";
import { LeadMagnetShareDialog } from "@/components/lead-magnet/LeadMagnetShareDialog";

const AUDIENCE_ROLES = [
  { value: "podcaster", label: "Podcaster" },
  { value: "influencer", label: "Creator / Influencer" },
  { value: "event_creator", label: "Event Host / Speaker" },
  { value: "business", label: "Business Professional" },
  { value: "advertiser", label: "Brand / Advertiser" },
  { value: "investor", label: "Investor / Analyst" },
  { value: "agency", label: "Agency / Consultant" },
];

const CATEGORIES = [
  "Creators",
  "Brands & Agencies", 
  "Events",
  "General"
];

interface LeadMagnetFormData {
  title: string;
  description: string;
  slug: string;
  audience_roles: string[];
  bullets: string[];
  category: string;
  tags: string[];
}

// Extended LeadMagnet type with new fields
interface ExtendedLeadMagnet extends LeadMagnet {
  thumbnail_url?: string | null;
  category?: string | null;
  tags?: string[] | null;
  view_count?: number;
  conversion_rate?: number;
}

export default function LeadMagnetsAdmin() {
  const navigate = useNavigate();
  const { data: leadMagnets, isLoading } = useAllLeadMagnets();
  const createMutation = useCreateLeadMagnet();
  const updateMutation = useUpdateLeadMagnet();
  const toggleMutation = useToggleLeadMagnetStatus();
  const deleteMutation = useDeleteLeadMagnet();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ExtendedLeadMagnet | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [shareDialogItem, setShareDialogItem] = useState<ExtendedLeadMagnet | null>(null);
  const [formData, setFormData] = useState<LeadMagnetFormData>({
    title: "",
    description: "",
    slug: "",
    audience_roles: [],
    bullets: [],
    category: "General",
    tags: [],
  });
  const [bulletInput, setBulletInput] = useState("");
  const [tagInput, setTagInput] = useState("");

  // Fetch analytics summary
  const { data: analyticsData } = useQuery({
    queryKey: ["lead-magnet-analytics-summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_magnet_analytics")
        .select("lead_magnet_id, event_type")
        .order("created_at", { ascending: false });
      
      if (error) return {};
      
      // Group by lead_magnet_id
      const summary: Record<string, { views: number; downloads: number }> = {};
      data?.forEach((event: any) => {
        if (!summary[event.lead_magnet_id]) {
          summary[event.lead_magnet_id] = { views: 0, downloads: 0 };
        }
        if (event.event_type === 'view') summary[event.lead_magnet_id].views++;
        if (event.event_type === 'download') summary[event.lead_magnet_id].downloads++;
      });
      return summary;
    }
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      slug: "",
      audience_roles: [],
      bullets: [],
      category: "General",
      tags: [],
    });
    setSelectedFile(null);
    setBulletInput("");
    setTagInput("");
    setEditingItem(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (item: ExtendedLeadMagnet) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description || "",
      slug: item.slug,
      audience_roles: item.audience_roles || [],
      bullets: item.bullets || [],
      category: item.category || "General",
      tags: item.tags || [],
    });
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
    } else {
      toast.error("Please select a PDF file");
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
    }));
  };

  const addBullet = () => {
    if (bulletInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        bullets: [...prev.bullets, bulletInput.trim()],
      }));
      setBulletInput("");
    }
  };

  const removeBullet = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      bullets: prev.bullets.filter((_, i) => i !== index),
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const toggleRole = (role: string) => {
    setFormData((prev) => ({
      ...prev,
      audience_roles: prev.audience_roles.includes(role)
        ? prev.audience_roles.filter((r) => r !== role)
        : [...prev.audience_roles, role],
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.slug) {
      toast.error("Title and slug are required");
      return;
    }

    if (!editingItem && !selectedFile) {
      toast.error("Please upload a PDF file");
      return;
    }

    setIsUploading(true);
    try {
      let storagePath = editingItem?.storage_path || "";

      if (selectedFile) {
        const { path, error } = await uploadLeadMagnetPdf(selectedFile, formData.slug);
        if (error) throw error;
        storagePath = path;
      }

      if (editingItem) {
        await updateMutation.mutateAsync({
          id: editingItem.id,
          title: formData.title,
          description: formData.description || undefined,
          slug: formData.slug,
          storage_path: storagePath,
          audience_roles: formData.audience_roles,
          bullets: formData.bullets,
        });
      } else {
        await createMutation.mutateAsync({
          title: formData.title,
          description: formData.description || undefined,
          slug: formData.slug,
          storage_path: storagePath,
          audience_roles: formData.audience_roles,
          bullets: formData.bullets,
        });
      }

      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving lead magnet:", error);
      toast.error("Failed to save lead magnet");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopyLink = async (item: ExtendedLeadMagnet) => {
    const publicUrl = `${window.location.origin}/${item.slug}`;
    await navigator.clipboard.writeText(publicUrl);
    toast.success("Landing page link copied to clipboard");
  };

  const handleCopyDownloadLink = async (item: ExtendedLeadMagnet) => {
    const url = await getLeadMagnetSignedUrl(item.storage_path);
    if (url) {
      await navigator.clipboard.writeText(url);
      toast.success("Direct download link copied to clipboard");
    } else {
      toast.error("Failed to generate download link");
    }
  };

  const handleToggleActive = (item: ExtendedLeadMagnet) => {
    toggleMutation.mutate({ id: item.id, is_active: !item.is_active });
  };

  const handleDelete = (item: ExtendedLeadMagnet) => {
    if (confirm(`Are you sure you want to delete "${item.title}"?`)) {
      deleteMutation.mutate(item.id);
    }
  };

  const handleViewLanding = (item: ExtendedLeadMagnet) => {
    window.open(`/${item.slug}`, "_blank");
  };

  // Calculate stats
  const totalDownloads = leadMagnets?.reduce((sum, m) => sum + m.download_count, 0) || 0;
  const activeCount = leadMagnets?.filter(m => m.is_active).length || 0;

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Lead Magnets
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage downloadable resources for lead generation
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Add Lead Magnet
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Lead Magnets</p>
                <p className="text-2xl font-bold">{leadMagnets?.length || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{activeCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Downloads</p>
                <p className="text-2xl font-bold">{totalDownloads}</p>
              </div>
              <Download className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Conversion</p>
                <p className="text-2xl font-bold">--</p>
              </div>
              <TrendingUp className="h-8 w-8 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Lead Magnets</CardTitle>
          <CardDescription>Click on a row to view analytics and manage settings</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : leadMagnets?.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No lead magnets yet</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Create your first lead magnet to start capturing leads
              </p>
              <Button onClick={openCreateModal}>
                <Plus className="h-4 w-4 mr-2" />
                Add Lead Magnet
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead className="text-center">Downloads</TableHead>
                  <TableHead className="text-center">Conversion</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leadMagnets?.map((item) => {
                  const extItem = item as ExtendedLeadMagnet;
                  const analytics = analyticsData?.[item.id];
                  const conversionRate = analytics?.views 
                    ? Math.round((analytics.downloads / analytics.views) * 100) 
                    : 0;

                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{item.title}</p>
                            <p className="text-xs text-muted-foreground">/{item.slug}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {extItem.category || "General"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {extItem.tags?.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {(extItem.tags?.length || 0) > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{extItem.tags!.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold">{item.download_count}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        {analytics?.views ? (
                          <div className="flex items-center justify-center gap-2">
                            <Progress value={conversionRate} className="w-16 h-2" />
                            <span className="text-xs text-muted-foreground">{conversionRate}%</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">--</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.is_active ? "default" : "secondary"}>
                          {item.is_active ? "Active" : "Archived"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewLanding(extItem)}
                            title="View landing page"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShareDialogItem(extItem)}
                            title="Share link & QR"
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCopyLink(extItem)}
                            title="Copy landing page link"
                          >
                            <LinkIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditModal(extItem)}
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleActive(extItem)}
                            title={item.is_active ? "Archive" : "Activate"}
                          >
                            {item.is_active ? (
                              <Archive className="h-4 w-4" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(extItem)}
                            title="Delete"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Share Dialog */}
      {shareDialogItem && (
        <LeadMagnetShareDialog
          open={!!shareDialogItem}
          onOpenChange={(open) => !open && setShareDialogItem(null)}
          leadMagnet={shareDialogItem}
        />
      )}

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Lead Magnet" : "Add Lead Magnet"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g., Creator Growth Blueprint"
              />
            </div>

            <div>
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData((p) => ({ ...p, slug: e.target.value }))}
                placeholder="e.g., creator-growth-blueprint"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Landing page URL: /{formData.slug || "your-slug"}
              </p>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                placeholder="Brief description of the lead magnet..."
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <Label>Tags</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add a tag..."
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  Add
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button onClick={() => removeTag(tag)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label>PDF File {!editingItem && "*"}</Label>
              <div className="mt-1 border-2 border-dashed rounded-lg p-4 text-center">
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="text-sm">{selectedFile.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setSelectedFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Click to upload or drag & drop
                      </span>
                      <span className="text-xs text-muted-foreground">PDF only</span>
                    </div>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              {editingItem && !selectedFile && (
                <p className="text-xs text-muted-foreground mt-1">
                  Current file: {editingItem.storage_path}
                </p>
              )}
            </div>

            <div>
              <Label>Audience Roles</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {AUDIENCE_ROLES.map((role) => (
                  <Badge
                    key={role.value}
                    variant={formData.audience_roles.includes(role.value) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleRole(role.value)}
                  >
                    {role.label}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>Bullet Points</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={bulletInput}
                  onChange={(e) => setBulletInput(e.target.value)}
                  placeholder="Add a bullet point..."
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addBullet())}
                />
                <Button type="button" variant="outline" onClick={addBullet}>
                  Add
                </Button>
              </div>
              {formData.bullets.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {formData.bullets.map((bullet, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <span className="text-green-500">✓</span>
                      <span className="flex-1">{bullet}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeBullet(i)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : editingItem ? (
                "Save Changes"
              ) : (
                "Create Lead Magnet"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
