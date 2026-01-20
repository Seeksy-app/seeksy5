import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Building2, CheckCircle2 } from "lucide-react";
import { AdvertiserSignupSteps } from "@/components/advertiser/AdvertiserSignupSteps";

export default function AdvertiserSignup() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Clear any old cached advertiser signup data on mount
  useEffect(() => {
    const cachedData = localStorage.getItem("advertiserSignupData");
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        // If it contains legacy fields, clear it
        if (parsed.sponsor_name || parsed.sponsor_email || parsed.sponsor_type) {
          console.log("Clearing legacy cached data");
          localStorage.removeItem("advertiserSignupData");
        }
      } catch (e) {
        localStorage.removeItem("advertiserSignupData");
      }
    }
  }, []);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("advertiser_onboarding_completed")
        .eq("id", user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: existingAdvertiser } = useQuery({
    queryKey: ["advertiser-status", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("advertisers")
        .select("*")
        .eq("owner_profile_id", user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Check if already onboarded - redirect to dashboard if complete
  // Only redirect if NOT showing confirmation screen
  useEffect(() => {
    if (!showConfirmation && profile?.advertiser_onboarding_completed && existingAdvertiser) {
      navigate('/advertiser', { replace: true });
    }
  }, [profile, existingAdvertiser, navigate, showConfirmation]);

  const signupMutation = useMutation({
    mutationFn: async (formData: any) => {
      if (!user) throw new Error("Please log in to continue");

      // Step 1: Create advertiser record
      const { data: advertiserData, error: advertiserError } = await supabase
        .from("advertisers")
        .insert({
          owner_profile_id: user.id,
          company_name: formData.company_name,
          contact_name: formData.contact_name,
          contact_email: formData.contact_email,
          contact_phone: formData.contact_phone || null,
          website_url: formData.website_url || null,
          business_description: formData.business_description || null,
          status: "pending",
        })
        .select()
        .single();

      if (advertiserError) throw advertiserError;

      // Step 2: Create advertiser preferences
      const { error: preferencesError } = await supabase
        .from("advertiser_preferences")
        .insert({
          advertiser_id: advertiserData.id,
          objectives: { goals: formData.campaign_goals || [] },
          target_categories: formData.target_categories || [],
        });

      if (preferencesError) throw preferencesError;

      // Step 3: Add team members (only non-empty ones)
      if (formData.team_members && formData.team_members.length > 0) {
        // Filter out empty/placeholder members
        const validMembers = formData.team_members.filter(
          (member: any) => member.email && member.email.trim() !== ""
        );

        if (validMembers.length > 0) {
          const teamMemberInserts = validMembers.map((member: any) => ({
            advertiser_id: advertiserData.id,
            profile_id: null, // Will be filled when they accept invite
            email: member.email.trim().toLowerCase(),
            role: member.role,
          }));

          const { error: teamError } = await supabase
            .from("advertiser_team_members")
            .upsert(teamMemberInserts, {
              onConflict: "advertiser_id,email",
              ignoreDuplicates: false,
            })
            .select();

          if (teamError) throw teamError;
        }
      }

      // Step 4: Mark onboarding as complete
      await supabase
        .from("profiles")
        .update({ 
          advertiser_onboarding_completed: true,
          is_advertiser: true 
        })
        .eq("id", user.id);

      // Step 5: Create lead in contacts
      try {
        await supabase
          .from("contacts")
          .insert({
            name: formData.contact_name,
            email: formData.contact_email,
            phone: formData.contact_phone || null,
            company: formData.company_name,
            lead_source: "advertiser_signup",
            lead_status: "new",
            notes: `Business: ${formData.business_description || "N/A"}\nWebsite: ${formData.website_url || "N/A"}\nGoals: ${formData.campaign_goals?.join(", ") || "N/A"}\nCategories: ${formData.target_categories?.join(", ") || "N/A"}`,
          });

        // Notify sales team
        await supabase.functions.invoke('notify-sales-team-lead', {
          body: {
            contactId: advertiserData.id,
            leadSource: 'Advertiser Signup',
          },
        });
      } catch (leadError) {
        console.error('Lead creation failed:', leadError);
      }

      return advertiserData;
    },
    onSuccess: async () => {
      setShowConfirmation(true);
      queryClient.invalidateQueries({ queryKey: ["advertiser-status", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
    onError: (error: any) => {
      toast.error("Failed to submit application: " + error.message);
    },
  });

  // Auto-submit advertiser data if user just signed up
  useEffect(() => {
    if (user && !existingAdvertiser) {
      const advertiserData = localStorage.getItem("advertiserSignupData");
      if (advertiserData) {
        try {
          const data = JSON.parse(advertiserData);
          localStorage.removeItem("advertiserSignupData");
          
          // Clean data - only include valid fields
          const cleanData = {
            company_name: data.company_name,
            contact_name: data.contact_name,
            contact_email: data.contact_email,
            contact_phone: data.contact_phone,
            website_url: data.website_url,
            business_description: data.business_description,
            campaign_goals: data.campaign_goals || [],
            target_categories: data.target_categories || [],
            team_members: data.team_members || [],
          };
          
          signupMutation.mutate(cleanData);
        } catch (e) {
          console.error("Failed to process advertiser data:", e);
        }
      }
    }
  }, [user, existingAdvertiser]);

  const handleComplete = (formData: any) => {
    if (!user) {
      toast.error("Please create an account first to continue");
      const cleanData = {
        company_name: formData.company_name,
        contact_name: formData.contact_name,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
        website_url: formData.website_url,
        business_description: formData.business_description,
        campaign_goals: formData.campaign_goals || [],
        target_categories: formData.target_categories || [],
        team_members: formData.team_members || [],
      };
      localStorage.setItem("advertiserSignupData", JSON.stringify(cleanData));
      localStorage.setItem("signupIntent", "/advertiser/signup");
      navigate("/auth?mode=signup");
      return;
    }

    // Clean the data before submitting
    const cleanData = {
      company_name: formData.company_name,
      contact_name: formData.contact_name,
      contact_email: formData.contact_email,
      contact_phone: formData.contact_phone,
      website_url: formData.website_url,
      business_description: formData.business_description,
      campaign_goals: formData.campaign_goals || [],
      target_categories: formData.target_categories || [],
      team_members: formData.team_members || [],
    };

    signupMutation.mutate(cleanData);
  };

  // Confirmation screen
  if (showConfirmation) {
    return (
      <div className="container max-w-2xl mx-auto py-12">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl">Application Submitted!</CardTitle>
            <CardDescription>
              We're reviewing your application and will get back to you soon.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                You'll receive an email at <strong>{user?.email}</strong> once your account is activated.
                This typically takes 1-2 business days.
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => {
                setShowConfirmation(false);
                navigate("/advertiser", { replace: true });
              }}>
                Go to Advertiser Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show status screen for existing advertisers with non-pending status
  if (existingAdvertiser && profile?.advertiser_onboarding_completed === true && !showConfirmation) {
    if (existingAdvertiser.status === "approved") {
      // Approved advertisers should be on dashboard
      navigate("/advertiser", { replace: true });
      return null;
    }

    return (
      <div className="container max-w-2xl mx-auto py-12">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              {existingAdvertiser.status === "pending" ? (
                <Building2 className="h-16 w-16 text-yellow-500" />
              ) : existingAdvertiser.status === "rejected" ? (
                <Building2 className="h-16 w-16 text-red-500" />
              ) : (
                <Building2 className="h-16 w-16 text-gray-500" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {existingAdvertiser.status === "pending" && "Application Under Review"}
              {existingAdvertiser.status === "rejected" && "Application Not Approved"}
              {existingAdvertiser.status === "suspended" && "Account Suspended"}
            </CardTitle>
            <CardDescription>
              {existingAdvertiser.status === "pending" && (
                "We're reviewing your application. You'll receive an email once it's processed."
              )}
              {existingAdvertiser.status === "rejected" && (
                `Your application was not approved. Please contact support for details.`
              )}
              {existingAdvertiser.status === "suspended" && (
                "Please contact support for more information."
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate("/")}>Return to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-12">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2">Become an Advertiser</h1>
        <p className="text-muted-foreground">
          Reach engaged podcast audiences with targeted advertising
        </p>
        {!user && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm">
              Already have an account?{" "}
              <Button
                variant="link"
                className="p-0 h-auto"
                onClick={() => {
                  localStorage.setItem("signupIntent", "/advertiser/signup");
                  navigate("/auth?mode=login");
                }}
              >
                Log in here
              </Button>
            </p>
          </div>
        )}
      </div>

      <AdvertiserSignupSteps 
        onComplete={handleComplete}
        isSubmitting={signupMutation.isPending}
      />
    </div>
  );
}
