import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, Trash2, Copy, Loader2, Image as ImageIcon, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RequireAdmin } from "@/components/auth/RequireAdmin";

function AdminSeoAssetsContent() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [altText, setAltText] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: assets, isLoading } = useQuery({
    queryKey: ['seo-assets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seo_assets')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const asset = assets?.find(a => a.id === id);
      if (!asset) throw new Error('Asset not found');

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('seo-assets')
        .remove([asset.path]);
      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('seo_assets')
        .delete()
        .eq('id', id);
      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seo-assets'] });
      toast({ title: "Asset deleted" });
      setDeleteId(null);
    },
    onError: (error) => {
      toast({ title: "Failed to delete asset", description: error.message, variant: "destructive" });
    }
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const path = `og-images/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('seo-assets')
        .upload(path, file);
      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('seo-assets')
        .getPublicUrl(path);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Insert into database
      const { error: dbError } = await supabase
        .from('seo_assets')
        .insert({
          bucket: 'seo-assets',
          path,
          public_url: urlData.publicUrl,
          alt_text: altText || null,
          content_type: file.type,
          size_bytes: file.size,
          created_by: user?.id
        });
      if (dbError) throw dbError;

      queryClient.invalidateQueries({ queryKey: ['seo-assets'] });
      toast({ title: "Image uploaded successfully" });
      setAltText("");
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const copyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "URL copied to clipboard" });
  };

  return (
    <div className="container max-w-6xl py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/seo')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">SEO Assets</h1>
          <p className="text-muted-foreground text-sm">
            Manage OpenGraph and Twitter card images
          </p>
        </div>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Upload New Image</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="alt-text">Alt Text</Label>
              <Input
                id="alt-text"
                placeholder="Describe the image for accessibility..."
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  disabled={uploading}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Button disabled={uploading}>
                  {uploading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Upload Image
                </Button>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Recommended size: 1200×630 pixels for optimal display on social platforms
          </p>
        </CardContent>
      </Card>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !assets?.length ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ImageIcon className="h-10 w-10 mb-2 opacity-50" />
              <p>No assets uploaded yet</p>
            </CardContent>
          </Card>
        ) : (
          assets.map((asset) => (
            <Card key={asset.id} className="overflow-hidden">
              <div className="aspect-video bg-muted relative">
                <img
                  src={asset.public_url}
                  alt={asset.alt_text || 'SEO asset'}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-3 space-y-2">
                <p className="text-sm font-medium truncate" title={asset.alt_text || 'No alt text'}>
                  {asset.alt_text || <span className="text-muted-foreground italic">No alt text</span>}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(asset.created_at), { addSuffix: true })}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => copyUrl(asset.public_url, asset.id)}
                  >
                    {copiedId === asset.id ? (
                      <Check className="h-3 w-3 mr-1" />
                    ) : (
                      <Copy className="h-3 w-3 mr-1" />
                    )}
                    Copy URL
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteId(asset.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this image. Any pages using it will need to be updated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Wrap with admin guard
export default function AdminSeoAssets() {
  return (
    <RequireAdmin>
      <AdminSeoAssetsContent />
    </RequireAdmin>
  );
}
