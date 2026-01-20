// Seeksy Email Tracker - Background Service Worker

const SUPABASE_URL = 'https://taxqcioheqdqtlmjeaht.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRheHFjaW9oZXFkcXRsbWplYWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5OTcwOTMsImV4cCI6MjA3OTU3MzA5M30.l_qol40MY-M2A7rRxpI8H7r5hSh_PpzZTmk5q08wrpw';

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'trackEmail') {
    trackEmailSent(request.data)
      .then(response => sendResponse({ success: true, data: response }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'getUser') {
    chrome.storage.local.get(['seeksy_user', 'seeksy_token'], (result) => {
      sendResponse(result);
    });
    return true;
  }
  
  if (request.action === 'login') {
    loginUser(request.email, request.password)
      .then(response => sendResponse(response))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (request.action === 'logout') {
    chrome.storage.local.remove(['seeksy_user', 'seeksy_token'], () => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (request.action === 'leadNotification') {
    console.log('Seeksy: Lead notification received', request.data);
    // Store for popup display
    chrome.storage.local.get(['recent_leads'], (result) => {
      const leads = result.recent_leads || [];
      leads.unshift({ ...request.data, received_at: new Date().toISOString() });
      chrome.storage.local.set({ recent_leads: leads.slice(0, 20) });
    });
    sendResponse({ success: true });
    return true;
  }
});

// Login user with Seeksy/Supabase
async function loginUser(email, password) {
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.error) {
      return { success: false, error: data.error_description || data.error };
    }
    
    // Store user and token
    await chrome.storage.local.set({
      seeksy_user: data.user,
      seeksy_token: data.access_token
    });
    
    return { success: true, user: data.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Track email sent event
async function trackEmailSent(emailData) {
  const { seeksy_token, seeksy_user } = await chrome.storage.local.get(['seeksy_token', 'seeksy_user']);
  
  if (!seeksy_token || !seeksy_user) {
    throw new Error('Not logged in');
  }
  
  const response = await fetch(`${SUPABASE_URL}/functions/v1/track-email-sent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${seeksy_token}`,
      'apikey': SUPABASE_ANON_KEY
    },
    body: JSON.stringify({
      user_id: seeksy_user.id,
      recipient_email: emailData.to,
      subject: emailData.subject,
      tracking_id: emailData.trackingId,
      sent_at: new Date().toISOString()
    })
  });
  
  return response.json();
}

console.log('Seeksy Email Tracker background service started');
