// Seeksy Email Tracker - Gmail Content Script

(function() {
  'use strict';
  
  const TRACKING_PIXEL_BASE = 'https://taxqcioheqdqtlmjeaht.supabase.co/functions/v1/track-email-open';
  
  let isLoggedIn = false;
  let currentUser = null;
  
  // Check login status
  function checkLoginStatus() {
    chrome.runtime.sendMessage({ action: 'getUser' }, (response) => {
      isLoggedIn = !!(response?.seeksy_user && response?.seeksy_token);
      currentUser = response?.seeksy_user;
      updateStatusIndicator();
    });
  }
  
  // Create status indicator
  function createStatusIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'seeksy-status-indicator';
    indicator.innerHTML = `
      <div class="seeksy-badge">
        <span class="seeksy-dot"></span>
        <span class="seeksy-text">Seeksy</span>
      </div>
    `;
    document.body.appendChild(indicator);
    return indicator;
  }
  
  // Update status indicator
  function updateStatusIndicator() {
    let indicator = document.getElementById('seeksy-status-indicator');
    if (!indicator) {
      indicator = createStatusIndicator();
    }
    
    const dot = indicator.querySelector('.seeksy-dot');
    const text = indicator.querySelector('.seeksy-text');
    
    if (isLoggedIn) {
      dot.style.backgroundColor = '#22c55e';
      text.textContent = 'Seeksy Tracking Active';
    } else {
      dot.style.backgroundColor = '#ef4444';
      text.textContent = 'Seeksy: Not Logged In';
    }
  }
  
  // Generate unique tracking ID
  function generateTrackingId() {
    return 'stk_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }
  
  // Create tracking pixel HTML
  function createTrackingPixel(trackingId) {
    return `<img src="${TRACKING_PIXEL_BASE}?tid=${trackingId}" width="1" height="1" style="display:none !important; visibility:hidden !important; opacity:0 !important;" alt="" />`;
  }
  
  // Extract email data from compose window
  function extractEmailData(composeWindow) {
    const toField = composeWindow.querySelector('input[name="to"]') || 
                    composeWindow.querySelector('[aria-label*="To"]');
    const subjectField = composeWindow.querySelector('input[name="subjectbox"]') ||
                         composeWindow.querySelector('[aria-label*="Subject"]');
    
    return {
      to: toField?.value || '',
      subject: subjectField?.value || ''
    };
  }
  
  // Inject tracking pixel into email body
  function injectTrackingPixel(composeWindow) {
    if (!isLoggedIn) {
      console.log('Seeksy: Not logged in, skipping tracking');
      return null;
    }
    
    const emailBody = composeWindow.querySelector('[aria-label="Message Body"]') ||
                      composeWindow.querySelector('[role="textbox"][aria-multiline="true"]') ||
                      composeWindow.querySelector('.editable[contenteditable="true"]');
    
    if (!emailBody) {
      console.log('Seeksy: Could not find email body');
      return null;
    }
    
    const trackingId = generateTrackingId();
    const pixelHtml = createTrackingPixel(trackingId);
    
    // Inject at the end of the email body
    emailBody.innerHTML += pixelHtml;
    
    console.log('Seeksy: Tracking pixel injected with ID:', trackingId);
    return trackingId;
  }
  
  // Handle send button click
  function handleSendClick(event) {
    const sendButton = event.target.closest('[aria-label*="Send"], [data-tooltip*="Send"]');
    if (!sendButton) return;
    
    const composeWindow = sendButton.closest('[role="dialog"], .nH.Hd');
    if (!composeWindow) return;
    
    const emailData = extractEmailData(composeWindow);
    const trackingId = injectTrackingPixel(composeWindow);
    
    if (trackingId && emailData.to) {
      // Send tracking data to background
      chrome.runtime.sendMessage({
        action: 'trackEmail',
        data: {
          ...emailData,
          trackingId
        }
      }, (response) => {
        if (response?.success) {
          console.log('Seeksy: Email tracked successfully');
        } else {
          console.log('Seeksy: Failed to track email', response?.error);
        }
      });
    }
  }
  
  // Initialize
  function init() {
    console.log('Seeksy Email Tracker initialized');
    
    // Check login status
    checkLoginStatus();
    
    // Re-check periodically
    setInterval(checkLoginStatus, 30000);
    
    // Listen for send button clicks (capture phase)
    document.addEventListener('click', handleSendClick, true);
    
    // Watch for new compose windows
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1 && node.matches && node.matches('[role="dialog"]')) {
            console.log('Seeksy: New compose window detected');
          }
        });
      });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
  }
  
  // Wait for Gmail to fully load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 1000);
  }
})();
