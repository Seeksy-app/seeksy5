import { supabase } from "@/integrations/supabase/client";

/**
 * Log a user activity to the activity_logs table
 */
export async function logActivity(
  actionType: string,
  actionDescription: string,
  relatedEntityType?: string,
  relatedEntityId?: string,
  metadata?: Record<string, any>
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("activity_logs")
      .insert({
        user_id: user.id,
        action_type: actionType,
        action_description: actionDescription,
        related_entity_type: relatedEntityType || null,
        related_entity_id: relatedEntityId || null,
        metadata: metadata || null,
      });

    if (error) {
      console.error("Error logging activity:", error);
    }
  } catch (error) {
    console.error("Error logging activity:", error);
  }
}

// Predefined activity loggers for common actions
export const ActivityLogger = {
  inviteSent: (recipientEmail: string, inviteType: string) => 
    logActivity(
      "invite_sent",
      `Sent ${inviteType} invitation to ${recipientEmail}`,
      "invite",
      undefined,
      { recipient_email: recipientEmail, invite_type: inviteType }
    ),

  emailSent: (recipientEmail: string, subject: string) =>
    logActivity(
      "email_sent",
      `Sent email to ${recipientEmail}: ${subject}`,
      "email",
      undefined,
      { recipient_email: recipientEmail, subject }
    ),

  profileUpdated: () =>
    logActivity(
      "profile_updated",
      "Updated profile information",
      "profile"
    ),

  integrationConnected: (integrationName: string) =>
    logActivity(
      "integration_connected",
      `Connected ${integrationName} integration`,
      "integration",
      undefined,
      { integration_name: integrationName }
    ),

  integrationDisconnected: (integrationName: string) =>
    logActivity(
      "integration_disconnected",
      `Disconnected ${integrationName} integration`,
      "integration",
      undefined,
      { integration_name: integrationName }
    ),

  taskCompleted: (taskTitle: string, taskId: string) =>
    logActivity(
      "task_completed",
      `Completed task: ${taskTitle}`,
      "task",
      taskId
    ),

  campaignCreated: (campaignName: string, campaignId: string) =>
    logActivity(
      "campaign_created",
      `Created campaign: ${campaignName}`,
      "campaign",
      campaignId
    ),

  adCreated: (adType: string, adId: string) =>
    logActivity(
      "ad_created",
      `Created ${adType} ad`,
      "ad",
      adId,
      { ad_type: adType }
    ),

  moduleEnabled: (moduleName: string) =>
    logActivity(
      "module_enabled",
      `Enabled module: ${moduleName}`,
      "module",
      undefined,
      { module_name: moduleName }
    ),

  modulePurchased: (moduleName: string, price: number) =>
    logActivity(
      "module_purchased",
      `Purchased module: ${moduleName}`,
      "module",
      undefined,
      { module_name: moduleName, price }
    ),
};