import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Folder, Image, Music, Video } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

export const MediaVaultCard = () => {
  const navigate = useNavigate();

  const { data: recentMedia } = useQuery({
    queryKey: ['recent-media'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data } = await supabase
        .from('media_files')
        .select('id, file_name, file_type, created_at')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(4);

      return data || [];
    },
  });

  const getMediaIcon = (type: string) => {
    if (type.includes('video')) return <Video className="h-4 w-4" />;
    if (type.includes('audio')) return <Music className="h-4 w-4" />;
    if (type.includes('image')) return <Image className="h-4 w-4" />;
    return <Folder className="h-4 w-4" />;
  };

  const getMediaColor = (type: string) => {
    if (type.includes('video')) return "from-purple-500 to-purple-600";
    if (type.includes('audio')) return "from-pink-500 to-pink-600";
    if (type.includes('image')) return "from-blue-500 to-blue-600";
    return "from-gray-500 to-gray-600";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
    >
      <Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 bg-card">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <CardHeader className="relative">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/10 to-amber-500/10">
              <Folder className="h-5 w-5 text-orange-600" />
            </div>
            <CardTitle className="text-lg">Media Vault</CardTitle>
          </div>
          <CardDescription>Recent uploads</CardDescription>
        </CardHeader>
        <CardContent className="relative space-y-4">
          {recentMedia && recentMedia.length > 0 ? (
            <div className="space-y-2">
              {recentMedia.map((media, index) => (
                <motion.div 
                  key={media.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group/item cursor-pointer"
                  onClick={() => navigate("/media/library")}
                >
                  <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${getMediaColor(media.file_type)} flex items-center justify-center text-white shadow-sm`}>
                    {getMediaIcon(media.file_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate group-hover/item:text-primary transition-colors">{media.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(media.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <div className="p-4 rounded-full bg-muted/50 inline-flex mb-3">
                <Folder className="h-10 w-10 opacity-50" />
              </div>
              <p className="text-sm">No media yet</p>
            </div>
          )}

          <Button 
            onClick={() => navigate("/media/library")}
            className="w-full"
            variant="outline"
          >
            Open Media Vault
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};
