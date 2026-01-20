import { supabase } from "@/integrations/supabase/client";

interface SendEmailParams {
  venueId: string;
  clientId?: string;
  to: string;
  subject: string;
  body: string;
  isDemoMode: boolean;
}

interface SendSMSParams {
  venueId: string;
  clientId?: string;
  to: string;
  body: string;
  isDemoMode: boolean;
}

export async function sendVenueEmail({ 
  venueId, 
  clientId, 
  to, 
  subject, 
  body, 
  isDemoMode 
}: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    // Log the communication
    const { error: logError } = await supabase
      .from('venue_communications')
      .insert({
        venue_id: venueId,
        client_id: clientId,
        type: 'email',
        direction: 'outbound',
        subject,
        body,
        is_demo: isDemoMode,
        channel_metadata: {
          to,
          demo: isDemoMode,
          sent_at: new Date().toISOString()
        }
      });

    if (logError) {
      console.error('Failed to log email:', logError);
      return { success: false, error: logError.message };
    }

    // Only send real email if not in demo mode
    if (!isDemoMode) {
      // Call the send-email edge function
      const { error: sendError } = await supabase.functions.invoke('send-email', {
        body: {
          to,
          subject,
          html: body
        }
      });

      if (sendError) {
        console.error('Failed to send email:', sendError);
        return { success: false, error: sendError.message };
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

export async function sendVenueSMS({ 
  venueId, 
  clientId, 
  to, 
  body, 
  isDemoMode 
}: SendSMSParams): Promise<{ success: boolean; error?: string }> {
  try {
    // Log the communication
    const { error: logError } = await supabase
      .from('venue_communications')
      .insert({
        venue_id: venueId,
        client_id: clientId,
        type: 'sms',
        direction: 'outbound',
        body,
        is_demo: isDemoMode,
        channel_metadata: {
          to,
          demo: isDemoMode,
          sent_at: new Date().toISOString()
        }
      });

    if (logError) {
      console.error('Failed to log SMS:', logError);
      return { success: false, error: logError.message };
    }

    // Only send real SMS if not in demo mode
    if (!isDemoMode) {
      // Call the send-sms edge function
      const { error: sendError } = await supabase.functions.invoke('send-sms', {
        body: {
          to,
          body
        }
      });

      if (sendError) {
        console.error('Failed to send SMS:', sendError);
        return { success: false, error: sendError.message };
      }
    }

    return { success: true };
  } catch (error) {
    console.error('SMS error:', error);
    return { success: false, error: 'Failed to send SMS' };
  }
}

export async function logVenueNote({
  venueId,
  clientId,
  note
}: {
  venueId: string;
  clientId?: string;
  note: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('venue_communications')
      .insert({
        venue_id: venueId,
        client_id: clientId,
        type: 'note',
        direction: 'internal',
        body: note,
        is_demo: false
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to save note' };
  }
}
