import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { RSSMigrationWizard } from "@/components/podcast/RSSMigrationWizard";
import { ArrowLeft } from "lucide-react";

const RSSMigrationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  if (!user || !id) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" className="mb-4" onClick={() => navigate(`/podcasts/${id}`)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Podcast
        </Button>
        <RSSMigrationWizard userId={user.id} podcastId={id} />
      </div>
    </div>
  );
};

export default RSSMigrationPage;
