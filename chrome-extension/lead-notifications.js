// Seeksy Lead Notifications - Content Script
// Listens for pending lead events dispatched from the Trucking Dashboard

(function() {
  'use strict';
  
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
    indicator.id = 'seeksy-lead-status';
    indicator.innerHTML = `
      <div class="seeksy-lead-badge">
        <span class="seeksy-lead-dot"></span>
        <span class="seeksy-lead-text">Seeksy Leads</span>
      </div>
    `;
    
    // Apply styles
    const style = document.createElement('style');
    style.textContent = `
      #seeksy-lead-status {
        position: fixed;
        top: 10px;
        right: 10px;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .seeksy-lead-badge {
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(0, 0, 0, 0.85);
        color: white;
        padding: 8px 14px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        backdrop-filter: blur(10px);
        transition: all 0.3s ease;
      }
      .seeksy-lead-badge:hover {
        transform: scale(1.05);
      }
      .seeksy-lead-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #ef4444;
        transition: background 0.3s ease;
      }
      .seeksy-lead-dot.active {
        background: #22c55e;
        box-shadow: 0 0 8px #22c55e;
      }
      .seeksy-lead-notification {
        position: fixed;
        top: 60px;
        right: 10px;
        z-index: 999998;
        max-width: 320px;
        animation: slideIn 0.3s ease;
      }
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(100%);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      .seeksy-lead-card {
        background: white;
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        border-left: 4px solid #f59e0b;
        margin-bottom: 10px;
      }
      .seeksy-lead-card h3 {
        margin: 0 0 8px 0;
        font-size: 14px;
        font-weight: 600;
        color: #1f2937;
      }
      .seeksy-lead-card p {
        margin: 0;
        font-size: 13px;
        color: #6b7280;
      }
      .seeksy-lead-card .phone {
        font-weight: 600;
        color: #f59e0b;
        font-size: 15px;
      }
      .seeksy-lead-card .time {
        font-size: 11px;
        color: #9ca3af;
        margin-top: 8px;
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(indicator);
    return indicator;
  }
  
  // Update status indicator
  function updateStatusIndicator() {
    let indicator = document.getElementById('seeksy-lead-status');
    if (!indicator) {
      indicator = createStatusIndicator();
    }
    
    const dot = indicator.querySelector('.seeksy-lead-dot');
    const text = indicator.querySelector('.seeksy-lead-text');
    
    if (isLoggedIn) {
      dot.classList.add('active');
      text.textContent = 'Seeksy Leads Active';
    } else {
      dot.classList.remove('active');
      text.textContent = 'Seeksy: Not Logged In';
    }
  }
  
  // Show notification popup
  function showNotificationPopup(data) {
    // Remove existing notification container if present
    let container = document.getElementById('seeksy-lead-notifications');
    if (!container) {
      container = document.createElement('div');
      container.id = 'seeksy-lead-notifications';
      container.className = 'seeksy-lead-notification';
      document.body.appendChild(container);
    }
    
    const card = document.createElement('div');
    card.className = 'seeksy-lead-card';
    card.innerHTML = `
      <h3>🚛 New Pending Lead!</h3>
      <p class="phone">${data.caller_number || 'Unknown Number'}</p>
      ${data.summary ? `<p>${data.summary.substring(0, 100)}${data.summary.length > 100 ? '...' : ''}</p>` : ''}
      <p class="time">${new Date(data.created_at || Date.now()).toLocaleTimeString()}</p>
    `;
    
    container.insertBefore(card, container.firstChild);
    
    // Remove after 15 seconds
    setTimeout(() => {
      card.style.opacity = '0';
      card.style.transform = 'translateX(100%)';
      setTimeout(() => card.remove(), 300);
    }, 15000);
    
    // Play notification sound
    playNotificationSound();
    
    // Also show browser notification
    showBrowserNotification(data);
  }
  
  // Play notification sound
  function playNotificationSound() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // First beep
      const osc1 = audioContext.createOscillator();
      const gain1 = audioContext.createGain();
      osc1.connect(gain1);
      gain1.connect(audioContext.destination);
      osc1.frequency.value = 880;
      osc1.type = 'sine';
      gain1.gain.value = 0.3;
      osc1.start();
      osc1.stop(audioContext.currentTime + 0.15);
      
      // Second beep after delay
      setTimeout(() => {
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.frequency.value = 1047;
        osc2.type = 'sine';
        gain2.gain.value = 0.3;
        osc2.start();
        osc2.stop(audioContext.currentTime + 0.15);
      }, 150);
    } catch (error) {
      console.log('Could not play notification sound:', error);
    }
  }
  
  // Show browser notification
  function showBrowserNotification(data) {
    if (!('Notification' in window)) return;
    
    if (Notification.permission === 'granted') {
      new Notification('🚛 New Pending Lead!', {
        body: `${data.caller_number || 'Unknown'}${data.summary ? '\n' + data.summary.substring(0, 60) + '...' : ''}`,
        icon: 'icons/icon128.png',
        tag: data.notification_id || data.conversation_id,
        requireInteraction: true
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }
  
  // Listen for events from the Trucking Dashboard
  function listenForLeadEvents() {
    window.addEventListener('seeksy:pending-lead-created', (event) => {
      console.log('Seeksy Extension: Received pending lead event', event.detail);
      
      if (!isLoggedIn) {
        console.log('Seeksy Extension: Not logged in, ignoring event');
        return;
      }
      
      showNotificationPopup(event.detail);
      
      // Send to background script for logging/analytics
      chrome.runtime.sendMessage({
        action: 'leadNotification',
        data: event.detail
      }, (response) => {
        console.log('Seeksy Extension: Lead notification logged', response);
      });
    });
    
    console.log('Seeksy Extension: Listening for pending lead events');
  }
  
  // Initialize
  function init() {
    console.log('Seeksy Lead Notifications initialized');
    
    // Check login status
    checkLoginStatus();
    
    // Re-check periodically
    setInterval(checkLoginStatus, 30000);
    
    // Listen for lead events
    listenForLeadEvents();
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }
  
  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 500);
  }
})();
