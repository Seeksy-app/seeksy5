import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Fingerprint, Plus, Calendar, CheckCircle2, Award, ExternalLink, Edit2, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { VoiceCertifiedBadge } from "@/components/VoiceCertifiedBadge";
import { VoiceNFTBadge } from "@/components/VoiceNFTBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VoiceSystemHealthPanel } from "@/components/admin/voice/VoiceSystemHealthPanel";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function VoiceTagAdmin() {
  const [showCreationFlow, setShowCreationFlow] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<any>(null);
  const [editForm, setEditForm] = useState({ voice_name: "", usage_terms: "", price_per_ad: 0 });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user
  const [user, setUser] = useState<any>(null);
  
  useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      return user;
    },
  });

  // Check if user is admin
  const { data: userRoles } = useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const isAdmin = userRoles?.some(r => r.role === 'admin' || r.role === 'super_admin');

  // Fetch voice fingerprints
  const { data: voiceFingerprints, isLoading: isLoadingFingerprints } = useQuery({
    queryKey: ['voice-fingerprints'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('creator_voice_fingerprints')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch blockchain certificates for voice profiles
  const { data: certificates, isLoading: isLoadingCertificates } = useQuery({
    queryKey: ['voice-blockchain-certificates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('voice_blockchain_certificates')
        .select('*, creator_voice_profiles(voice_name, usage_terms, price_per_ad, id)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (voiceProfileId: string) => {
      const { error } = await supabase
        .from('creator_voice_profiles')
        .delete()
        .eq('id', voiceProfileId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice-blockchain-certificates'] });
      toast({
        title: "Voice Deleted",
        description: "Voice profile has been permanently removed.",
      });
      setDeleteDialogOpen(false);
      setSelectedVoice(null);
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete voice profile",
        variant: "destructive",
      });
    },
  });

  // Edit mutation
  const editMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase
        .from('creator_voice_profiles')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice-blockchain-certificates'] });
      toast({
        title: "Voice Updated",
        description: "Voice profile has been updated successfully.",
      });
      setEditDialogOpen(false);
      setSelectedVoice(null);
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update voice profile",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (cert: any) => {
    setSelectedVoice(cert);
    setDeleteDialogOpen(true);
  };

  const handleEdit = (cert: any) => {
    setSelectedVoice(cert);
    setEditForm({
      voice_name: cert.creator_voice_profiles?.voice_name || "",
      usage_terms: cert.creator_voice_profiles?.usage_terms || "",
      price_per_ad: cert.creator_voice_profiles?.price_per_ad || 0,
    });
    setEditDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedVoice?.creator_voice_profiles?.id) {
      deleteMutation.mutate(selectedVoice.creator_voice_profiles.id);
    }
  };

  const confirmEdit = () => {
    if (selectedVoice?.creator_voice_profiles?.id) {
      editMutation.mutate({
        id: selectedVoice.creator_voice_profiles.id,
        updates: editForm,
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* System Health Panel */}
      <VoiceSystemHealthPanel />

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Voice Tag & Fingerprints</h1>
            <p className="text-muted-foreground">
              Cryptographically secured voice identity records
            </p>
          </div>
        </div>
        
        {/* Admin Controls */}
        {isAdmin && (
          <div>
            {!showCreationFlow ? (
              <Button 
                onClick={() => setShowCreationFlow(true)}
                size="lg"
                className="gap-2"
              >
                <Plus className="h-5 w-5" />
                Create Certification
              </Button>
            ) : (
              <Button 
                onClick={() => setShowCreationFlow(false)}
                variant="outline"
                size="lg"
              >
                View Dashboard
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Show dashboard for admins by default, creation flow when button clicked */}
      {(isAdmin && !showCreationFlow) ? (
        <>
          {/* Voice Fingerprints Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fingerprint className="h-6 w-6 text-primary" />
                Voice Fingerprints
              </CardTitle>
              <CardDescription>
                Cryptographically secured voice identity records
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingFingerprints ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading voice fingerprints...</p>
                </div>
              ) : voiceFingerprints && voiceFingerprints.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {voiceFingerprints.map((fingerprint) => (
                    <Card key={fingerprint.id} className="border-primary/20">
                      <CardHeader>
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Fingerprint className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <CardTitle className="text-base">
                              Fingerprint #{fingerprint.id.slice(0, 8)}
                            </CardTitle>
                            <VoiceCertifiedBadge size="sm" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="p-2 rounded-md bg-muted/50 space-y-1.5">
                          <div className="flex items-center gap-2 text-xs">
                            <Shield className="h-3 w-3 text-primary" />
                            <span className="font-medium">Blockchain Hash</span>
                          </div>
                          <div className="text-xs text-muted-foreground font-mono break-all">
                            {fingerprint.fingerprint_hash?.substring(0, 32)}...
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(fingerprint.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-sm pt-2 border-t">
                          <span className="text-muted-foreground">Confidence:</span>
                          <span className="font-semibold text-primary">
                            {fingerprint.confidence_score}%
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-muted/50">
                  <CardContent className="py-12 text-center">
                    <Fingerprint className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No voice fingerprints yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Voice fingerprints are created automatically when recording in Studio
                    </p>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          {/* Blockchain NFT Certificates Section - Enhanced */}
          <Card className="border-2 border-brand-gold/20">
            <CardHeader className="bg-gradient-to-r from-brand-gold/5 to-primary/5">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Award className="h-7 w-7 text-brand-gold" />
                    Voice NFT Certificates
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Blockchain-certified voice ownership on Polygon • Gasless • Permanent
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-brand-gold">
                    {certificates?.length || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Minted NFTs</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {isLoadingCertificates ? (
                <div className="text-center py-12">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading blockchain certificates...</p>
                </div>
              ) : certificates && certificates.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {certificates.map((cert) => (
                    <Card key={cert.id} className="border-2 border-brand-gold/20 hover:border-brand-gold/40 transition-all bg-gradient-to-br from-card to-brand-gold/5">
                      <CardHeader>
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-gold/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                            <Award className="h-7 w-7 text-brand-gold" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base line-clamp-2 mb-2">
                              {cert.creator_voice_profiles?.voice_name || 'Voice Profile'}
                            </CardTitle>
                            <VoiceNFTBadge 
                              tokenId={cert.token_id}
                              transactionHash={cert.transaction_hash}
                              showLink={false}
                            />
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEdit(cert)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(cert)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="p-3 rounded-lg bg-muted/50 border border-brand-gold/20 space-y-2">
                          <div className="flex items-center gap-2 text-xs font-medium text-brand-gold">
                            <Shield className="h-3 w-3" />
                            <span>NFT Token ID</span>
                          </div>
                          <div className="text-xs text-foreground font-mono break-all bg-background/50 p-2 rounded">
                            {cert.token_id}
                          </div>
                        </div>

                        <div className="p-3 rounded-lg bg-muted/50 border space-y-2">
                          <div className="flex items-center gap-2 text-xs font-medium">
                            <Fingerprint className="h-3 w-3 text-primary" />
                            <span>Voice Fingerprint Hash</span>
                          </div>
                          <div className="text-xs text-muted-foreground font-mono break-all">
                            {cert.voice_fingerprint_hash.substring(0, 32)}...
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(cert.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs font-semibold text-green-600 capitalize">
                              {cert.certification_status}
                            </span>
                          </div>
                        </div>

                        <div className="pt-3 border-t flex items-center justify-between">
                          <div className="text-xs text-muted-foreground">
                            <span className="font-medium">Network:</span> Polygon
                          </div>
                          <a
                            href={cert.cert_explorer_url || `https://amoy.polygonscan.com/tx/${cert.transaction_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            View on Polygonscan
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>

                        {cert.gas_sponsored && (
                          <div className="text-center">
                            <span className="inline-flex items-center gap-1 text-xs bg-green-500/10 text-green-600 px-2 py-1 rounded-full">
                              ⚡ Gas Free • Paid by Seeksy
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-gradient-to-br from-muted/50 to-muted/30 border-2 border-dashed">
                  <CardContent className="py-16 text-center">
                    <div className="mb-6">
                      <div className="w-20 h-20 rounded-full bg-brand-gold/10 mx-auto mb-4 flex items-center justify-center">
                        <Award className="h-10 w-10 text-brand-gold" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold mb-2">No Voice NFTs Yet</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      When you create a voice profile, we'll automatically mint a blockchain NFT certificate 
                      proving your ownership. It takes about 3 seconds!
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button onClick={() => setShowCreationFlow(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Voice Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* Creation Flow - Placeholder for now */}
          <Card>
            <CardHeader>
              <CardTitle>Create Blockchain Certification</CardTitle>
              <CardDescription>
                Certify podcast episodes with blockchain-backed voice verification
              </CardDescription>
            </CardHeader>
            <CardContent className="py-12 text-center">
              <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Certificate creation interface coming soon
              </p>
            </CardContent>
          </Card>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Voice Profile?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{selectedVoice?.creator_voice_profiles?.voice_name}" and cannot be undone. 
              The blockchain certificate will remain on-chain but the profile will be removed from your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Voice Profile</DialogTitle>
            <DialogDescription>
              Update the details for your voice profile
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="voice_name">Voice Name</Label>
              <Input
                id="voice_name"
                value={editForm.voice_name}
                onChange={(e) => setEditForm({ ...editForm, voice_name: e.target.value })}
                placeholder="Enter voice name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="usage_terms">Usage Terms</Label>
              <Textarea
                id="usage_terms"
                value={editForm.usage_terms}
                onChange={(e) => setEditForm({ ...editForm, usage_terms: e.target.value })}
                placeholder="Usage terms for this voice..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price_per_ad">Price per Ad ($)</Label>
              <Input
                id="price_per_ad"
                type="number"
                value={editForm.price_per_ad}
                onChange={(e) => setEditForm({ ...editForm, price_per_ad: parseFloat(e.target.value) })}
                placeholder="50"
                min="0"
                step="1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmEdit} disabled={editMutation.isPending}>
              {editMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
