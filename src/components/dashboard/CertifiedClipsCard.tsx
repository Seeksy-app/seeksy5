import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Scissors, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

interface ClipData {
  id: string;
  cert_status: string;
  created_at: string;
}

export const CertifiedClipsCard = () => {
  const navigate = useNavigate();

  const { data: clips } = useQuery<ClipData[]>({
    queryKey: ['certified-clips'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const result = await (supabase as any)
        .from('clips')
        .select('id, cert_status, created_at')
        .eq('user_id', user.id)
        .eq('cert_status', 'minted')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      return ((result.data as any[]) || []) as ClipData[];
    },
  });

  const certifiedCount = clips?.length || 0;
  const hasClips = certifiedCount > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 bg-card">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <CardHeader className="relative">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10">
              <ShieldCheck className="h-5 w-5 text-green-600" />
            </div>
            <CardTitle className="text-lg">Certified Clips</CardTitle>
          </div>
          <CardDescription>Blockchain-verified content</CardDescription>
        </CardHeader>
        <CardContent className="relative space-y-4">
          <div className="text-center py-6">
            <div className="relative inline-flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full blur-xl" />
              <span className="relative text-5xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {certifiedCount}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {hasClips ? 'certified clips' : 'No clips yet'}
            </p>
          </div>

          <Button 
            onClick={() => navigate(hasClips ? "/clips" : "/media/create-clips")}
            className={`w-full ${!hasClips ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-md" : ""}`}
            variant={hasClips ? "outline" : "default"}
          >
            <Scissors className="h-4 w-4 mr-2" />
            {hasClips ? "Manage Clips" : "Create Your First Clip"}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};
