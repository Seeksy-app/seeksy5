import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeEmailHtml } from "@/lib/sanitizeHtml";

export default function EmailWebView() {
  const { emailId } = useParams();

  const { data: campaign, isLoading } = useQuery({
    queryKey: ["email-web-view", emailId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_campaigns")
        .select("*")
        .eq("id", emailId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!emailId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading email...</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Email not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-background rounded-lg shadow-lg p-8">
          <div className="mb-6 border-b pb-4">
            <h1 className="text-2xl font-bold mb-2">{campaign.subject}</h1>
            <p className="text-sm text-muted-foreground">
              Sent on {new Date(campaign.created_at).toLocaleDateString()}
            </p>
          </div>
          <div 
            dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml(campaign.html_content) }}
            className="prose prose-sm max-w-none"
          />
        </div>
      </div>
    </div>
  );
}
