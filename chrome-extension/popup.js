// Seeksy Email Tracker - Popup Script

document.addEventListener('DOMContentLoaded', () => {
  const loggedOutView = document.getElementById('loggedOutView');
  const loggedInView = document.getElementById('loggedInView');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const errorMessage = document.getElementById('errorMessage');
  const userEmailDisplay = document.getElementById('userEmail');
  
  // Check current login status
  function checkLoginStatus() {
    chrome.runtime.sendMessage({ action: 'getUser' }, (response) => {
      if (response?.seeksy_user) {
        showLoggedInView(response.seeksy_user);
      } else {
        showLoggedOutView();
      }
    });
  }
  
  // Show logged in view
  function showLoggedInView(user) {
    loggedOutView.classList.add('hidden');
    loggedInView.classList.remove('hidden');
    userEmailDisplay.textContent = user.email;
    
    // Load stats from storage
    chrome.storage.local.get(['emailsSent', 'emailsOpened'], (result) => {
      document.getElementById('emailsSent').textContent = result.emailsSent || 0;
      document.getElementById('emailsOpened').textContent = result.emailsOpened || 0;
    });
  }
  
  // Show logged out view
  function showLoggedOutView() {
    loggedOutView.classList.remove('hidden');
    loggedInView.classList.add('hidden');
    errorMessage.classList.remove('show');
    emailInput.value = '';
    passwordInput.value = '';
  }
  
  // Show error
  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
  }
  
  // Login handler
  loginBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (!email || !password) {
      showError('Please enter email and password');
      return;
    }
    
    loginBtn.textContent = 'Signing in...';
    loginBtn.disabled = true;
    
    chrome.runtime.sendMessage(
      { action: 'login', email, password },
      (response) => {
        loginBtn.textContent = 'Sign In';
        loginBtn.disabled = false;
        
        if (response?.success) {
          showLoggedInView(response.user);
        } else {
          showError(response?.error || 'Login failed. Please try again.');
        }
      }
    );
  });
  
  // Logout handler
  logoutBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'logout' }, () => {
      showLoggedOutView();
    });
  });
  
  // Enter key handler
  [emailInput, passwordInput].forEach(input => {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        loginBtn.click();
      }
    });
  });
  
  // Initialize
  checkLoginStatus();
});
