import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature!,
      Deno.env.get("STRIPE_WEBHOOK_SECRET") || ""
    );

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata;

        // Handle Registration Payments
        if (metadata?.registrationId) {
          await supabaseClient
            .from("award_registrations")
            .update({
              status: "paid",
              paid_at: new Date().toISOString(),
            })
            .eq("id", metadata.registrationId);

          // Get registration details for email
          const { data: registration } = await supabaseClient
            .from("award_registrations")
            .select(`
              *,
              awards_programs (
                title,
                ceremony_date,
                user_id
              )
            `)
            .eq("id", metadata.registrationId)
            .single();

          // Send confirmation email
          if (registration?.attendee_email) {
            try {
              await resend.emails.send({
                from: Deno.env.get("SENDER_EMAIL_HELLO") || "Seeksy <hello@seeksy.io>",
                to: [registration.attendee_email],
                subject: `Registration Confirmed - ${registration.awards_programs.title}`,
                html: `
                  <h1>Registration Confirmed!</h1>
                  <p>Dear ${registration.attendee_name},</p>
                  <p>Your registration for <strong>${registration.awards_programs.title}</strong> has been confirmed!</p>
                  <p><strong>Amount Paid:</strong> $${(registration.amount_paid / 100).toFixed(2)}</p>
                  ${
                    registration.awards_programs.ceremony_date
                      ? `<p><strong>Ceremony Date:</strong> ${new Date(registration.awards_programs.ceremony_date).toLocaleDateString()}</p>`
                      : ""
                  }
                  <p>We look forward to seeing you at the ceremony!</p>
                  <p>Best regards,<br>The Seeksy Team</p>
                `,
              });
            } catch (emailError) {
              console.error("Failed to send registration confirmation email:", emailError);
            }
          }

          // Record payout
          const registrationFee = parseFloat(metadata.registrationFee || "0");
          const platformFee = parseFloat(metadata.platformFee || "0") + parseFloat(metadata.processingFee || "0");
          const creatorAmount = parseFloat(metadata.creatorAmount || "0");

          await supabaseClient
            .from("award_payouts")
            .insert({
              program_id: metadata.programId,
              creator_user_id: metadata.creatorUserId,
              source_id: metadata.registrationId,
              payout_type: "registration",
              amount: registrationFee,
              platform_fee: platformFee,
              net_amount: creatorAmount,
              status: "pending",
            });
        }

        // Handle Sponsorship Payments
        if (metadata?.sponsorshipId) {
          // Update sponsorship status
          await supabaseClient
            .from("award_sponsorships")
            .update({
              status: "paid",
              paid_at: new Date().toISOString(),
            })
            .eq("id", metadata.sponsorshipId);

          // Get sponsorship and program details for email
          const { data: sponsorship } = await supabaseClient
            .from("award_sponsorships")
            .select(`
              *,
              award_sponsorship_packages (
                package_name,
                price
              ),
              awards_programs (
                title,
                user_id
              )
            `)
            .eq("id", metadata.sponsorshipId)
            .single();

          // Send confirmation email to sponsor
          if (sponsorship?.sponsor_email) {
            try {
              await resend.emails.send({
                from: Deno.env.get("SENDER_EMAIL_HELLO") || "Seeksy <hello@seeksy.io>",
                to: [sponsorship.sponsor_email],
                subject: `Sponsorship Confirmed - ${sponsorship.awards_programs.title}`,
                html: `
                  <h1>Thank you for your sponsorship!</h1>
                  <p>Dear ${sponsorship.sponsor_name},</p>
                  <p>Your sponsorship for <strong>${sponsorship.awards_programs.title}</strong> has been confirmed!</p>
                  <p><strong>Package:</strong> ${sponsorship.award_sponsorship_packages.package_name}</p>
                  <p><strong>Amount:</strong> $${(sponsorship.amount_paid / 100).toFixed(2)}</p>
                  <p>Your logo and information will be displayed on the awards program page.</p>
                  <p>Thank you for your support!</p>
                  <p>Best regards,<br>The Seeksy Team</p>
                `,
              });
            } catch (emailError) {
              console.error("Failed to send sponsorship confirmation email:", emailError);
            }
          }

          // Record payout
          const packagePrice = parseFloat(metadata.packagePrice || "0");
          const processingFee = parseFloat(metadata.processingFee || "0");

          await supabaseClient
            .from("award_payouts")
            .insert({
              program_id: metadata.programId,
              creator_user_id: metadata.creatorUserId,
              source_id: metadata.sponsorshipId,
              payout_type: "sponsorship",
              amount: packagePrice,
              platform_fee: processingFee,
              net_amount: packagePrice,
              status: "completed",
            });
        }

        if (metadata?.nomineeId) {
          // Update nominee status
          await supabaseClient
            .from("award_nominees")
            .update({ status: "approved" })
            .eq("id", metadata.nomineeId);

          // Update self-nomination status
          await supabaseClient
            .from("award_self_nominations")
            .update({
              status: "paid",
              paid_at: new Date().toISOString(),
            })
            .eq("nominee_id", metadata.nomineeId);

          // Record payout (50/50 split)
          const nominationFee = session.amount_total ? session.amount_total / 100 : 0;
          const creatorShare = nominationFee * 0.5;
          const platformFee = nominationFee * 0.5;

          await supabaseClient
            .from("award_payouts")
            .insert({
              program_id: metadata.programId,
              creator_user_id: metadata.creatorUserId,
              source_id: metadata.nomineeId,
              payout_type: "nomination",
              amount: nominationFee,
              platform_fee: platformFee,
              net_amount: creatorShare,
              status: "completed",
            });
        }
        break;
      }

      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        
        // Update program Stripe Connect status
        await supabaseClient
          .from("awards_programs")
          .update({
            stripe_connect_status: account.charges_enabled ? "active" : "pending",
          })
          .eq("stripe_connect_account_id", account.id);
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
});
