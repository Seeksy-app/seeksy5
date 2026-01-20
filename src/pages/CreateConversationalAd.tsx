import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ConversationalAdCreator } from "@/components/ConversationalAdCreator";
import { ConversationalAdDemo } from "@/components/ConversationalAdDemo";
import { MessageSquare } from "lucide-react";

const CreateConversationalAd = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current user's advertiser profile
  const { data: advertiser } = useQuery({
    queryKey: ['current-advertiser'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('advertisers')
        .select('*')
        .eq('owner_profile_id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Create conversational ad mutation
  const createConversationalAd = useMutation({
    mutationFn: async (config: {
      agentId: string;
      phoneNumber: string;
      phoneNumberType: 'shared' | 'custom';
      faqs: Array<{ question: string; answer: string }>;
      instructions: string;
      trainingUrls: string[];
    }) => {
      if (!advertiser) throw new Error('Advertiser not found');

      const { data, error } = await supabase
        .from('audio_ads')
        .insert({
          advertiser_id: advertiser.id,
          ad_type: 'conversational',
          elevenlabs_agent_id: config.agentId || null,
          phone_number: config.phoneNumber,
          phone_number_type: config.phoneNumberType,
          conversation_config: {
            phoneNumber: config.phoneNumber,
            faqs: config.faqs,
            instructions: config.instructions,
            trainingUrls: config.trainingUrls,
          },
          script: `Conversational Ad - Phone: ${config.phoneNumber}`,
          voice_id: 'conversational',
          status: 'completed',
        })
        .select()
        .single();

      if (error) throw error;

      // Charge agent setup fee
      await supabase.functions.invoke('charge-conversational-ad-fees', {
        body: {
          audioAdId: data.id,
          feeType: 'agent_setup'
        }
      });

      // Charge custom phone fee if applicable
      if (config.phoneNumberType === 'custom') {
        await supabase.functions.invoke('charge-conversational-ad-fees', {
          body: {
            audioAdId: data.id,
            feeType: 'custom_phone'
          }
        });
      }

      return data;
    },
    onSuccess: () => {
      toast({
        title: "Conversational ad created!",
        description: "Your interactive ad is ready to use in campaigns.",
      });
      queryClient.invalidateQueries({ queryKey: ['audio-ads'] });
      navigate('/advertiser/ads');
    },
    onError: (error: Error) => {
      toast({
        title: "Creation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header with back button */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/advertiser/create-ad-wizard")}
            className="mb-4"
          >
            ← Back to Ad Types
          </Button>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/20">
              <MessageSquare className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Create Conversational AI Ad</h1>
              <p className="text-muted-foreground">
                Create an interactive voice ad where listeners can ask questions
              </p>
            </div>
          </div>
          {/* Progress indicator */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline" className="bg-background">Step 1 of 2</Badge>
            <span>Configure your interactive ad</span>
          </div>
        </div>

        <div className="space-y-6">
        {/* Demo and Instructions */}
        <ConversationalAdDemo demoPhoneNumber="+1 202 952 1925" />

        {/* Ad Creator */}
        <ConversationalAdCreator
          onSave={(config) => createConversationalAd.mutate(config)}
          isLoading={createConversationalAd.isPending}
        />

        <Button
          variant="outline"
          onClick={() => navigate('/advertiser/create-ad-wizard')}
          className="w-full"
        >
          Cancel
        </Button>
      </div>
      </div>
    </div>
  );
};

export default CreateConversationalAd;
