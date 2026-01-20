import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Volume2, Loader2, Save, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export const AppAudioManager = () => {
  const queryClient = useQueryClient();
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [editedScript, setEditedScript] = useState("");

  const { data: audioDescriptions, isLoading } = useQuery({
    queryKey: ["app-audio-descriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_audio_descriptions")
        .select("*")
        .order("app_name");
      
      if (error) throw error;
      return data;
    },
  });

  const generateAudioMutation = useMutation({
    mutationFn: async ({ appId, script, voiceId }: { appId: string; script: string; voiceId: string }) => {
      const { data, error } = await supabase.functions.invoke("generate-app-audio", {
        body: { appId, script, voiceId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-audio-descriptions"] });
      toast.success("Audio generated successfully!");
    },
    onError: (error) => {
      console.error("Error generating audio:", error);
      toast.error("Failed to generate audio");
    },
  });

  const generateAvatarMutation = useMutation({
    mutationFn: async ({ appId, appName }: { appId: string; appName: string }) => {
      const { data, error } = await supabase.functions.invoke("generate-app-avatar", {
        body: { appId, appName },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-audio-descriptions"] });
      toast.success("Avatar generated successfully!");
    },
    onError: (error) => {
      console.error("Error generating avatar:", error);
      toast.error("Failed to generate avatar");
    },
  });

  const updateScriptMutation = useMutation({
    mutationFn: async ({ appId, script }: { appId: string; script: string }) => {
      const { error } = await supabase
        .from("app_audio_descriptions")
        .update({ script })
        .eq("app_id", appId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-audio-descriptions"] });
      toast.success("Script updated successfully!");
      setSelectedApp(null);
    },
    onError: (error) => {
      console.error("Error updating script:", error);
      toast.error("Failed to update script");
    },
  });

  const handleEdit = (app: any) => {
    setSelectedApp(app.app_id);
    setEditedScript(app.script);
  };

  const handleSave = () => {
    if (selectedApp) {
      updateScriptMutation.mutate({ appId: selectedApp, script: editedScript });
    }
  };

  const handleGenerate = (app: any) => {
    generateAudioMutation.mutate({
      appId: app.app_id,
      script: app.script,
      voiceId: app.voice_id || "cgSgspJ2msm6clMCkdW9",
    });
  };

  const handleGenerateAvatar = (app: any) => {
    generateAvatarMutation.mutate({
      appId: app.app_id,
      appName: app.app_name,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">App Audio Descriptions</h2>
        <p className="text-muted-foreground">
          Manage audio descriptions for all apps. Edit scripts and regenerate audio using matched ElevenLabs voices (avatars are assigned gender-appropriate voices automatically).
        </p>
      </div>

      <div className="grid gap-4">
        {audioDescriptions?.map((app) => (
          <Card key={app.id} className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {app.avatar_url && (
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={app.avatar_url} alt={app.app_name} />
                      <AvatarFallback>{app.app_name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  )}
                  <div>
                    <h3 className="font-semibold text-lg">{app.app_name}</h3>
                    <p className="text-sm text-muted-foreground">ID: {app.app_id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {app.audio_url && (
                    <audio controls className="h-10">
                      <source src={app.audio_url} type="audio/mpeg" />
                    </audio>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleGenerateAvatar(app)}
                    disabled={generateAvatarMutation.isPending}
                  >
                    {generateAvatarMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ImageIcon className="h-4 w-4" />
                    )}
                    Avatar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleGenerate(app)}
                    disabled={generateAudioMutation.isPending}
                  >
                    {generateAudioMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                    Audio
                  </Button>
                </div>
              </div>

              {selectedApp === app.app_id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editedScript}
                    onChange={(e) => setEditedScript(e.target.value)}
                    rows={3}
                    className="w-full"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={updateScriptMutation.isPending}
                    >
                      {updateScriptMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedApp(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm mb-2">{app.script}</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(app)}
                  >
                    Edit Script
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
