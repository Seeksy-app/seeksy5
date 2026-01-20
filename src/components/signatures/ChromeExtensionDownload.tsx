import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Chrome, CheckCircle, ExternalLink, Sparkles, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import JSZip from "jszip";

interface ChromeExtensionDownloadProps {
  signatures: any[];
  apiKey: string | null;
}

// Chrome Web Store listing URL (placeholder for when published)
const CHROME_STORE_URL = ""; // Will be set after publishing

export function ChromeExtensionDownload({ signatures, apiKey }: ChromeExtensionDownloadProps) {
  const { toast } = useToast();
  const [selectedSignature, setSelectedSignature] = useState<string>("");
  const [downloading, setDownloading] = useState(false);
  const [installMethod, setInstallMethod] = useState<"store" | "developer">("store");

  const activeSignatures = signatures.filter(s => s.is_active);
  const selectedSig = signatures.find(s => s.id === selectedSignature);
  const isStorePublished = Boolean(CHROME_STORE_URL);

  const generateExtensionFiles = () => {
    const manifest = {
      manifest_version: 3,
      name: "Seeksy Email Signatures",
      version: "1.0.0",
      description: "Inject Seeksy smart signatures into Gmail with open & click tracking. Auto-insert your branded signature with analytics.",
      permissions: ["activeTab", "storage"],
      host_permissions: ["https://mail.google.com/*"],
      content_scripts: [
        {
          matches: ["https://mail.google.com/*"],
          js: ["content.js"],
          css: ["styles.css"],
          run_at: "document_idle"
        }
      ],
      icons: {
        "16": "icon16.png",
        "48": "icon48.png",
        "128": "icon128.png"
      },
      action: {
        default_popup: "popup.html",
        default_icon: {
          "16": "icon16.png",
          "48": "icon48.png"
        }
      },
      // For Chrome Web Store
      key: undefined,
      offline_enabled: true,
      short_name: "Seeksy Sigs"
    };

    const contentScript = `
// Seeksy Email Signature Injector for Gmail
(function() {
  'use strict';
  
  const SEEKSY_CONFIG = {
    apiKey: '${apiKey || ""}',
    signatureId: '${selectedSignature}',
    baseUrl: 'https://taxqcioheqdqtlmjeaht.supabase.co/functions/v1'
  };

  // Signature HTML (pre-generated with tracking)
  const SIGNATURE_HTML = ${JSON.stringify(generateSignatureHtml(selectedSig))};

  let injectionEnabled = true;
  let lastInjectedCompose = null;

  // Watch for Gmail compose windows
  function observeGmail() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            checkForComposeWindow(node);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  function checkForComposeWindow(node) {
    // Look for Gmail compose containers
    const composeBox = node.querySelector ? 
      node.querySelector('[role="dialog"] [contenteditable="true"][aria-label*="Message"]') ||
      node.querySelector('.Am.Al.editable') :
      null;
    
    if (composeBox && composeBox !== lastInjectedCompose && injectionEnabled) {
      injectSignature(composeBox);
      lastInjectedCompose = composeBox;
    }
  }

  function injectSignature(composeBox) {
    // Check if signature already exists
    if (composeBox.querySelector('.seeksy-signature')) {
      return;
    }

    // Create signature wrapper
    const signatureWrapper = document.createElement('div');
    signatureWrapper.className = 'seeksy-signature';
    signatureWrapper.innerHTML = '<br><br>--<br>' + SIGNATURE_HTML;
    
    // Insert at the end of the compose area
    composeBox.appendChild(signatureWrapper);
    
    console.log('[Seeksy] Signature injected');
  }

  // Initialize
  function init() {
    console.log('[Seeksy] Extension initialized');
    observeGmail();
    
    // Also check existing compose windows
    document.querySelectorAll('[contenteditable="true"]').forEach((el) => {
      if (el.getAttribute('aria-label')?.includes('Message')) {
        injectSignature(el);
      }
    });
  }

  // Wait for Gmail to fully load
  if (document.readyState === 'complete') {
    setTimeout(init, 1000);
  } else {
    window.addEventListener('load', () => setTimeout(init, 1000));
  }
})();
`;

    const popupHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      width: 320px;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      background: #fafafa;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e5e5e5;
    }
    .logo {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #fbbf24, #f59e0b);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      color: #000;
      font-size: 18px;
    }
    h1 {
      font-size: 18px;
      margin: 0;
      color: #18181b;
    }
    .subtitle {
      font-size: 12px;
      color: #71717a;
      margin-top: 2px;
    }
    .status {
      padding: 16px;
      background: #fff;
      border-radius: 12px;
      margin-bottom: 16px;
      border: 1px solid #e5e5e5;
    }
    .status.active {
      background: #f0fdf4;
      border-color: #bbf7d0;
    }
    .status-icon {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #16a34a;
      font-size: 13px;
      margin-bottom: 8px;
    }
    .signature-name {
      font-weight: 600;
      font-size: 15px;
      color: #18181b;
    }
    .toggle-btn {
      width: 100%;
      padding: 12px;
      background: #18181b;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: background 0.2s;
    }
    .toggle-btn:hover {
      background: #27272a;
    }
    .toggle-btn.disabled {
      background: #e11d48;
    }
    .footer {
      margin-top: 20px;
      text-align: center;
      font-size: 12px;
      color: #71717a;
    }
    .footer a {
      color: #f59e0b;
      text-decoration: none;
    }
    .tracking-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      background: #fef3c7;
      color: #92400e;
      font-size: 11px;
      border-radius: 4px;
      margin-top: 8px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">S</div>
    <div>
      <h1>Seeksy Signatures</h1>
      <div class="subtitle">Gmail Auto-Injector</div>
    </div>
  </div>
  
  <div class="status active" id="statusBox">
    <div class="status-icon">
      <span>✓</span> Active Signature
    </div>
    <div class="signature-name">${selectedSig?.name || "No signature selected"}</div>
    <div class="tracking-badge">📊 Tracking enabled</div>
  </div>
  
  <button class="toggle-btn" id="toggleBtn">Disable Auto-Inject</button>
  
  <div class="footer">
    Opens & clicks logged in <a href="https://seeksy.io/signatures" target="_blank">Seeksy Dashboard</a>
  </div>

  <script>
    let enabled = true;
    const btn = document.getElementById('toggleBtn');
    const statusBox = document.getElementById('statusBox');
    
    chrome.storage.local.get(['enabled'], (result) => {
      enabled = result.enabled !== false;
      updateUI();
    });
    
    btn.addEventListener('click', () => {
      enabled = !enabled;
      chrome.storage.local.set({ enabled });
      updateUI();
    });
    
    function updateUI() {
      if (enabled) {
        btn.textContent = 'Disable Auto-Inject';
        btn.classList.remove('disabled');
        statusBox.classList.add('active');
      } else {
        btn.textContent = 'Enable Auto-Inject';
        btn.classList.add('disabled');
        statusBox.classList.remove('active');
      }
    }
  </script>
</body>
</html>`;

    const styles = `
.seeksy-signature {
  margin-top: 16px;
  padding-top: 8px;
}
.seeksy-signature img {
  max-width: 100%;
  height: auto;
}
.seeksy-signature a {
  color: inherit;
  text-decoration: none;
}
`;

    return { manifest, contentScript, popupHtml, styles };
  };

  const generateSignatureHtml = (sig: any): string => {
    if (!sig) return "";
    
    const baseUrl = "https://taxqcioheqdqtlmjeaht.supabase.co/functions/v1";
    const trackingPixelUrl = `${baseUrl}/signature-tracking-pixel/${sig.id}.png`;
    const clickTrackingBase = `${baseUrl}/signature-click-tracking/${sig.id}`;

    let html = `<table cellpadding="0" cellspacing="0" border="0" style="font-family: ${sig.font_family || "Arial, sans-serif"}; font-size: 14px; color: ${sig.primary_color || "#000000"};">`;

    if (sig.quote_text) {
      html += `<tr><td style="padding-bottom: 12px; font-style: italic; color: ${sig.secondary_color || "#666666"};">"${sig.quote_text}"</td></tr>`;
    }

    if (sig.profile_name || sig.profile_title) {
      html += `<tr><td style="padding-bottom: 8px;"><table cellpadding="0" cellspacing="0" border="0"><tr>`;
      if (sig.profile_photo_url) {
        html += `<td style="padding-right: 12px; vertical-align: top;"><img src="${sig.profile_photo_url}" alt="${sig.profile_name}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover;" /></td>`;
      }
      html += `<td style="vertical-align: middle;">`;
      if (sig.profile_name) html += `<div style="font-weight: bold; font-size: 16px;">${sig.profile_name}</div>`;
      if (sig.profile_title) html += `<div style="color: ${sig.secondary_color || "#666666"};">${sig.profile_title}</div>`;
      html += `</td></tr></table></td></tr>`;
    }

    if (sig.company_name || sig.company_phone || sig.company_website) {
      html += `<tr><td style="padding-bottom: 8px; color: ${sig.secondary_color || "#666666"};">`;
      if (sig.company_name) html += `<div style="font-weight: 600;">${sig.company_name}</div>`;
      if (sig.company_phone) html += `<div>${sig.company_phone}</div>`;
      if (sig.company_website) {
        const trackUrl = `${clickTrackingBase}/website?url=${encodeURIComponent(sig.company_website)}`;
        const cleanUrl = sig.company_website.replace(/^https?:\/\//, "");
        html += `<div><a href="${trackUrl}" style="color: ${sig.link_color || "#0066cc"}; text-decoration: none;">${cleanUrl}</a></div>`;
      }
      if (sig.company_address) html += `<div style="font-size: 12px;">${sig.company_address}</div>`;
      html += `</td></tr>`;
    }

    const socialLinks = Object.entries(sig.social_links || {}).filter(([_, url]) => url);
    if (socialLinks.length > 0) {
      html += `<tr><td style="padding: 8px 0;">`;
      for (const [platform, url] of socialLinks) {
        const trackUrl = `${clickTrackingBase}/social/${platform}?url=${encodeURIComponent(url as string)}`;
        const iconUrl = getSocialIconUrl(platform);
        html += `<a href="${trackUrl}" style="margin-right: 8px; text-decoration: none; display: inline-block;"><img src="${iconUrl}" alt="${platform}" width="24" height="24" style="border: 0; display: inline-block;" /></a>`;
      }
      html += `</td></tr>`;
    }

    if (sig.banner_image_url) {
      const bannerTrackUrl = sig.banner_cta_url 
        ? `${clickTrackingBase}/banner?url=${encodeURIComponent(sig.banner_cta_url)}`
        : null;
      html += `<tr><td style="padding-top: 12px;">`;
      if (bannerTrackUrl) html += `<a href="${bannerTrackUrl}" target="_blank">`;
      html += `<img src="${sig.banner_image_url}" alt="${sig.banner_alt_text || "Banner"}" style="max-width: 600px; width: 100%; height: auto; display: block;" />`;
      if (bannerTrackUrl) html += `</a>`;
      html += `</td></tr>`;
    }

    html += `<tr><td><img src="${trackingPixelUrl}" width="1" height="1" style="display: block;" alt="" /></td></tr>`;
    html += `</table>`;
    
    return html;
  };

  // Inline SVG icons as data URIs (email-client safe, no external dependencies)
  const getSocialIconUrl = (platform: string): string => {
    const icons: Record<string, string> = {
      facebook: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%231877F2'%3E%3Cpath d='M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z'/%3E%3C/svg%3E",
      twitter: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23000000'%3E%3Cpath d='M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z'/%3E%3C/svg%3E",
      instagram: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23E4405F'%3E%3Cpath d='M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z'/%3E%3C/svg%3E",
      linkedin: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%230A66C2'%3E%3Cpath d='M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z'/%3E%3C/svg%3E",
      youtube: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23FF0000'%3E%3Cpath d='M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z'/%3E%3C/svg%3E",
      tiktok: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23000000'%3E%3Cpath d='M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z'/%3E%3C/svg%3E",
      pinterest: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23BD081C'%3E%3Cpath d='M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z'/%3E%3C/svg%3E",
    };
    return icons[platform] || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666666'%3E%3Cpath d='M10.59 13.41c.41.39.41 1.03 0 1.42-.39.39-1.03.39-1.42 0a5.003 5.003 0 0 1 0-7.07l3.54-3.54a5.003 5.003 0 0 1 7.07 0 5.003 5.003 0 0 1 0 7.07l-1.49 1.49c.01-.82-.12-1.64-.4-2.42l.47-.48a2.982 2.982 0 0 0 0-4.24 2.982 2.982 0 0 0-4.24 0l-3.53 3.53a2.982 2.982 0 0 0 0 4.24zm2.82-4.24c.39-.39 1.03-.39 1.42 0a5.003 5.003 0 0 1 0 7.07l-3.54 3.54a5.003 5.003 0 0 1-7.07 0 5.003 5.003 0 0 1 0-7.07l1.49-1.49c-.01.82.12 1.64.4 2.43l-.47.47a2.982 2.982 0 0 0 0 4.24 2.982 2.982 0 0 0 4.24 0l3.53-3.53a2.982 2.982 0 0 0 0-4.24.973.973 0 0 1 0-1.42z'/%3E%3C/svg%3E";
  };

  // Generate proper PNG icons as base64
  const generateIconPng = (size: number): Uint8Array => {
    // Create a simple PNG with a yellow "S" logo
    // This is a minimal valid PNG structure
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new Uint8Array();
    
    // Yellow gradient background
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#fbbf24');
    gradient.addColorStop(1, '#f59e0b');
    ctx.fillStyle = gradient;
    
    // Rounded rectangle
    const radius = size / 6;
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(size - radius, 0);
    ctx.quadraticCurveTo(size, 0, size, radius);
    ctx.lineTo(size, size - radius);
    ctx.quadraticCurveTo(size, size, size - radius, size);
    ctx.lineTo(radius, size);
    ctx.quadraticCurveTo(0, size, 0, size - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.fill();
    
    // "S" text
    ctx.fillStyle = '#000000';
    ctx.font = `bold ${size * 0.6}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('S', size / 2, size / 2 + size * 0.05);
    
    // Convert to blob
    const dataUrl = canvas.toDataURL('image/png');
    const base64 = dataUrl.split(',')[1];
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const handleDownload = async () => {
    if (!selectedSignature) {
      toast({
        title: "Select a signature",
        description: "Please select a signature to include in the extension.",
        variant: "destructive"
      });
      return;
    }

    setDownloading(true);
    try {
      const { manifest, contentScript, popupHtml, styles } = generateExtensionFiles();
      
      const zip = new JSZip();
      zip.file("manifest.json", JSON.stringify(manifest, null, 2));
      zip.file("content.js", contentScript);
      zip.file("popup.html", popupHtml);
      zip.file("styles.css", styles);
      
      // Generate proper PNG icons
      zip.file("icon16.png", generateIconPng(16));
      zip.file("icon48.png", generateIconPng(48));
      zip.file("icon128.png", generateIconPng(128));

      const content = await zip.generateAsync({ type: "blob" });
      
      // Download
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = "seeksy-signatures-extension.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Extension downloaded!",
        description: "Follow the installation steps below."
      });
    } catch (error) {
      console.error("Error generating extension:", error);
      toast({
        title: "Download failed",
        description: "Could not generate extension ZIP.",
        variant: "destructive"
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Chrome className="h-5 w-5" />
          Chrome Extension
        </CardTitle>
        <CardDescription>
          Auto-inject your signature into Gmail with open & click tracking
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={installMethod} onValueChange={(v) => setInstallMethod(v as "store" | "developer")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="store" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Easy Install
            </TabsTrigger>
            <TabsTrigger value="developer" className="gap-2">
              <Package className="h-4 w-4" />
              Developer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="store" className="space-y-4 mt-4">
            {isStorePublished ? (
              <>
                <Button 
                  asChild
                  className="w-full gap-2"
                >
                  <a href={CHROME_STORE_URL} target="_blank" rel="noopener noreferrer">
                    <Chrome className="h-4 w-4" />
                    Install from Chrome Web Store
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>One-click install • No developer mode required</span>
                </div>
              </>
            ) : (
              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertDescription className="ml-2">
                  <p className="font-medium">Coming Soon to Chrome Web Store</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    The extension is being submitted for review. Once approved, you'll be able to install with one click—no developer mode needed.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    For now, use the <strong>Developer</strong> tab to install manually.
                  </p>
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="developer" className="space-y-4 mt-4">
            {!apiKey && (
              <Alert>
                <AlertDescription>
                  Generate an API key in Settings to enable the extension.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Select Signature</label>
              <Select value={selectedSignature} onValueChange={setSelectedSignature}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a signature..." />
                </SelectTrigger>
                <SelectContent>
                  {signatures.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} {s.is_active && <Badge variant="secondary" className="ml-2">Active</Badge>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleDownload} 
              disabled={!selectedSignature || downloading}
              className="w-full gap-2"
            >
              <Download className="h-4 w-4" />
              {downloading ? "Generating..." : "Download Extension ZIP"}
            </Button>

            <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-sm">
              <p className="font-medium">Installation Steps:</p>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>Download and <strong>unzip</strong> the extension folder</li>
                <li>
                  Open Chrome and go to{" "}
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs">chrome://extensions</code>
                </li>
                <li>
                  Enable <strong>"Developer mode"</strong> toggle (top right corner)
                </li>
                <li>
                  Click <strong>"Load unpacked"</strong> and select the unzipped folder
                </li>
                <li>
                  Open <strong>Gmail</strong> → compose a new email → signature auto-injects!
                </li>
              </ol>
              <div className="pt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground">
                  💡 <strong>Tip:</strong> After installing, click the extension icon in your toolbar to toggle injection on/off.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Tracking pixel + click tracking included</span>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}