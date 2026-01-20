/**
 * Shotstack Template Library
 * 
 * Contains 11 pre-built templates for clip rendering:
 * - 5 Vertical templates (9:16 for Reels/TikTok/Shorts)
 * - 3 Horizontal templates (16:9 for YouTube/webinars)
 * - 3 Square templates (1:1 for feed posts)
 */

interface Placeholders {
  VIDEO_URL: string;
  CLIP_LENGTH_SECONDS: number;
  TITLE_TEXT: string;
  SUBTITLE_TEXT: string;
  HOOK_TEXT: string;
  USERNAME_OR_TAGLINE: string;
  CTA_TEXT: string;
  BRAND_COLOR_PRIMARY: string;
  LOGO_URL: string;
  CERT_WATERMARK_URL?: string; // Optional watermark for certified clips
}

type TemplatePayload = {
  timeline: any;
  output: any;
  callback?: string;
  disk?: string;
};

/**
 * Replace placeholders in template JSON
 */
function replacePlaceholders(template: string, placeholders: Placeholders): any {
  let result = template;
  
  // Replace string placeholders
  result = result.replace(/\{\{VIDEO_URL\}\}/g, placeholders.VIDEO_URL);
  result = result.replace(/\{\{TITLE_TEXT\}\}/g, placeholders.TITLE_TEXT);
  result = result.replace(/\{\{SUBTITLE_TEXT\}\}/g, placeholders.SUBTITLE_TEXT);
  result = result.replace(/\{\{HOOK_TEXT\}\}/g, placeholders.HOOK_TEXT);
  result = result.replace(/\{\{USERNAME_OR_TAGLINE\}\}/g, placeholders.USERNAME_OR_TAGLINE);
  result = result.replace(/\{\{CTA_TEXT\}\}/g, placeholders.CTA_TEXT);
  result = result.replace(/\{\{BRAND_COLOR_PRIMARY\}\}/g, placeholders.BRAND_COLOR_PRIMARY);
  result = result.replace(/\{\{LOGO_URL\}\}/g, placeholders.LOGO_URL);
  result = result.replace(/\{\{CERT_WATERMARK_URL\}\}/g, placeholders.CERT_WATERMARK_URL || "");
  
  // Replace numeric placeholders (CLIP_LENGTH_SECONDS and calculations)
  const lengthStr = String(placeholders.CLIP_LENGTH_SECONDS);
  result = result.replace(/\{\{CLIP_LENGTH_SECONDS\}\} - 0\.5/g, String(placeholders.CLIP_LENGTH_SECONDS - 0.5));
  result = result.replace(/\{\{CLIP_LENGTH_SECONDS\}\} - 1\.5/g, String(placeholders.CLIP_LENGTH_SECONDS - 1.5));
  result = result.replace(/\{\{CLIP_LENGTH_SECONDS\}\} - 2\.5/g, String(placeholders.CLIP_LENGTH_SECONDS - 2.5));
  result = result.replace(/\{\{CLIP_LENGTH_SECONDS\}\} - 2/g, String(placeholders.CLIP_LENGTH_SECONDS - 2));
  result = result.replace(/\{\{CLIP_LENGTH_SECONDS\}\} - 3/g, String(placeholders.CLIP_LENGTH_SECONDS - 3));
  result = result.replace(/\{\{CLIP_LENGTH_SECONDS\}\}/g, lengthStr);
  
  return JSON.parse(result);
}

// ====================
// VERTICAL TEMPLATES
// ====================

const VERTICAL_TEMPLATE_1 = `{
  "timeline": {
    "tracks": [
      {
        "clips": [
          {
            "asset": {
              "type": "video",
              "src": "{{VIDEO_URL}}"
            },
            "start": 0,
            "length": {{CLIP_LENGTH_SECONDS}},
            "scale": 1,
            "fit": "crop"
          }
        ]
      },
      {
        "clips": [
          {
            "asset": {
              "type": "title",
              "text": "{{TITLE_TEXT}}",
              "style": "minimal",
              "size": "medium",
              "position": "top",
              "color": "#ffffff",
              "background": "{{BRAND_COLOR_PRIMARY}}"
            },
            "start": 0,
            "length": {{CLIP_LENGTH_SECONDS}}
          }
        ]
      },
      {
        "clips": [
          {
            "asset": {
              "type": "title",
              "text": "{{SUBTITLE_TEXT}}",
              "style": "minimal",
              "size": "x-small",
              "position": "bottom",
              "color": "#ffffff",
              "background": "rgba(0,0,0,0.6)"
            },
            "start": 0,
            "length": {{CLIP_LENGTH_SECONDS}}
          }
        ]
      }
    ]
  },
  "output": {
    "format": "mp4",
    "fps": 30,
    "resolution": "hd"
  }
}`;

const VERTICAL_TEMPLATE_2 = `{
  "timeline": {
    "tracks": [
      {
        "clips": [
          {
            "asset": {
              "type": "video",
              "src": "{{VIDEO_URL}}"
            },
            "start": 0,
            "length": {{CLIP_LENGTH_SECONDS}},
            "fit": "crop"
          }
        ]
      },
      {
        "clips": [
          {
            "asset": {
              "type": "title",
              "text": "{{HOOK_TEXT}}",
              "style": "chunk",
              "size": "medium",
              "position": "top",
              "color": "#ffffff",
              "background": "{{BRAND_COLOR_PRIMARY}}"
            },
            "start": 0,
            "length": {{CLIP_LENGTH_SECONDS}}
          }
        ]
      },
      {
        "clips": [
          {
            "asset": {
              "type": "title",
              "text": "{{SUBTITLE_TEXT}}",
              "style": "minimal",
              "size": "small",
              "position": "center",
              "color": "#ffffff",
              "background": "rgba(0,0,0,0.35)"
            },
            "start": 0.5,
            "length": {{CLIP_LENGTH_SECONDS}} - 0.5
          }
        ]
      },
      {
        "clips": [
          {
            "asset": {
              "type": "title",
              "text": "{{CTA_TEXT}}",
              "style": "caption",
              "size": "small",
              "position": "bottom",
              "color": "#ffffff",
              "background": "{{BRAND_COLOR_PRIMARY}}"
            },
            "start": {{CLIP_LENGTH_SECONDS}} - 2,
            "length": 2
          }
        ]
      }
    ]
  },
  "output": {
    "format": "mp4",
    "fps": 30,
    "resolution": "hd"
  }
}`;

const VERTICAL_TEMPLATE_3 = `{
  "timeline": {
    "tracks": [
      {
        "clips": [
          {
            "asset": {
              "type": "title",
              "text": "{{TITLE_TEXT}}",
              "style": "chunk",
              "size": "large",
              "position": "center",
              "color": "#ffffff",
              "background": "{{BRAND_COLOR_PRIMARY}}"
            },
            "start": 0,
            "length": 1
          },
          {
            "asset": {
              "type": "video",
              "src": "{{VIDEO_URL}}"
            },
            "start": 1,
            "length": {{CLIP_LENGTH_SECONDS}} - 2.5,
            "fit": "crop"
          },
          {
            "asset": {
              "type": "title",
              "text": "{{CTA_TEXT}}",
              "style": "minimal",
              "size": "medium",
              "position": "center",
              "color": "#ffffff",
              "background": "{{BRAND_COLOR_PRIMARY}}"
            },
            "start": {{CLIP_LENGTH_SECONDS}} - 1.5,
            "length": 1.5
          }
        ]
      }
    ]
  },
  "output": {
    "format": "mp4",
    "fps": 30,
    "resolution": "hd"
  }
}`;

const VERTICAL_TEMPLATE_4 = `{
  "timeline": {
    "tracks": [
      {
        "clips": [
          {
            "asset": {
              "type": "video",
              "src": "{{VIDEO_URL}}"
            },
            "start": 0,
            "length": {{CLIP_LENGTH_SECONDS}},
            "fit": "crop"
          }
        ]
      },
      {
        "clips": [
          {
            "asset": {
              "type": "title",
              "text": "{{USERNAME_OR_TAGLINE}}",
              "style": "minimal",
              "size": "x-small",
              "position": "top",
              "color": "#ffffff",
              "background": "rgba(0,0,0,0.4)"
            },
            "start": 0,
            "length": {{CLIP_LENGTH_SECONDS}}
          }
        ]
      },
      {
        "clips": [
          {
            "asset": {
              "type": "title",
              "text": "{{SUBTITLE_TEXT}}",
              "style": "subtitle",
              "size": "medium",
              "position": "bottom",
              "color": "#ffffff",
              "background": "rgba(0,0,0,0.75)"
            },
            "start": 0,
            "length": {{CLIP_LENGTH_SECONDS}}
          }
        ]
      }
    ]
  },
  "output": {
    "format": "mp4",
    "fps": 30,
    "resolution": "hd"
  }
}`;

const VERTICAL_TEMPLATE_5 = `{
  "timeline": {
    "tracks": [
      {
        "clips": [
          {
            "asset": {
              "type": "video",
              "src": "{{VIDEO_URL}}"
            },
            "start": 0,
            "length": {{CLIP_LENGTH_SECONDS}},
            "fit": "crop"
          }
        ]
      },
      {
        "clips": [
          {
            "asset": {
              "type": "title",
              "text": "{{CTA_TEXT}}",
              "style": "caption",
              "size": "small",
              "position": "bottom",
              "color": "#ffffff",
              "background": "{{BRAND_COLOR_PRIMARY}}"
            },
            "start": {{CLIP_LENGTH_SECONDS}} - 3,
            "length": 3
          }
        ]
      }
    ]
  },
  "output": {
    "format": "mp4",
    "fps": 30,
    "resolution": "hd"
  }
}`;

// ====================
// HORIZONTAL TEMPLATES
// ====================

const HORIZONTAL_TEMPLATE_1 = `{
  "timeline": {
    "tracks": [
      {
        "clips": [
          {
            "asset": {
              "type": "video",
              "src": "{{VIDEO_URL}}"
            },
            "start": 0,
            "length": {{CLIP_LENGTH_SECONDS}},
            "fit": "crop"
          }
        ]
      },
      {
        "clips": [
          {
            "asset": {
              "type": "title",
              "text": "{{TITLE_TEXT}}",
              "style": "minimal",
              "size": "medium",
              "position": "top",
              "color": "#ffffff",
              "background": "{{BRAND_COLOR_PRIMARY}}"
            },
            "start": 0,
            "length": 3
          }
        ]
      },
      {
        "clips": [
          {
            "asset": {
              "type": "title",
              "text": "{{SUBTITLE_TEXT}}",
              "style": "caption",
              "size": "small",
              "position": "bottom",
              "color": "#ffffff",
              "background": "rgba(0,0,0,0.6)"
            },
            "start": 0.5,
            "length": {{CLIP_LENGTH_SECONDS}} - 0.5
          }
        ]
      }
    ]
  },
  "output": {
    "format": "mp4",
    "fps": 30,
    "resolution": "hd"
  }
}`;

const HORIZONTAL_TEMPLATE_2 = `{
  "timeline": {
    "tracks": [
      {
        "clips": [
          {
            "asset": {
              "type": "video",
              "src": "{{VIDEO_URL}}"
            },
            "start": 0,
            "length": {{CLIP_LENGTH_SECONDS}}
          }
        ]
      },
      {
        "clips": [
          {
            "asset": {
              "type": "title",
              "text": "{{USERNAME_OR_TAGLINE}}",
              "style": "minimal",
              "size": "small",
              "position": "bottomLeft",
              "color": "#ffffff",
              "background": "{{BRAND_COLOR_PRIMARY}}"
            },
            "start": 0,
            "length": {{CLIP_LENGTH_SECONDS}}
          }
        ]
      }
    ]
  },
  "output": {
    "format": "mp4",
    "fps": 30,
    "resolution": "hd"
  }
}`;

const HORIZONTAL_TEMPLATE_3 = `{
  "timeline": {
    "tracks": [
      {
        "clips": [
          {
            "asset": {
              "type": "video",
              "src": "{{VIDEO_URL}}"
            },
            "start": 0,
            "length": {{CLIP_LENGTH_SECONDS}} - 2,
            "fit": "crop"
          },
          {
            "asset": {
              "type": "title",
              "text": "{{CTA_TEXT}}",
              "style": "chunk",
              "size": "large",
              "position": "center",
              "color": "#ffffff",
              "background": "{{BRAND_COLOR_PRIMARY}}"
            },
            "start": {{CLIP_LENGTH_SECONDS}} - 2,
            "length": 2
          }
        ]
      }
    ]
  },
  "output": {
    "format": "mp4",
    "fps": 30,
    "resolution": "hd"
  }
}`;

// ====================
// SQUARE TEMPLATES
// ====================

const SQUARE_TEMPLATE_1 = `{
  "timeline": {
    "tracks": [
      {
        "clips": [
          {
            "asset": {
              "type": "video",
              "src": "{{VIDEO_URL}}"
            },
            "start": 0,
            "length": {{CLIP_LENGTH_SECONDS}},
            "fit": "crop"
          }
        ]
      },
      {
        "clips": [
          {
            "asset": {
              "type": "title",
              "text": "{{TITLE_TEXT}}",
              "style": "minimal",
              "size": "medium",
              "position": "top",
              "color": "#ffffff",
              "background": "{{BRAND_COLOR_PRIMARY}}"
            },
            "start": 0,
            "length": 2.5
          }
        ]
      },
      {
        "clips": [
          {
            "asset": {
              "type": "title",
              "text": "{{SUBTITLE_TEXT}}",
              "style": "subtitle",
              "size": "small",
              "position": "bottom",
              "color": "#ffffff",
              "background": "rgba(0,0,0,0.7)"
            },
            "start": 0.5,
            "length": {{CLIP_LENGTH_SECONDS}} - 0.5
          }
        ]
      }
    ]
  },
  "output": {
    "format": "mp4",
    "fps": 30,
    "resolution": "hd"
  }
}`;

const SQUARE_TEMPLATE_2 = `{
  "timeline": {
    "tracks": [
      {
        "clips": [
          {
            "asset": {
              "type": "video",
              "src": "{{VIDEO_URL}}"
            },
            "start": 0,
            "length": {{CLIP_LENGTH_SECONDS}},
            "fit": "crop"
          }
        ]
      },
      {
        "clips": [
          {
            "asset": {
              "type": "title",
              "text": "{{HOOK_TEXT}}",
              "style": "chunk",
              "size": "large",
              "position": "center",
              "color": "#ffffff",
              "background": "rgba(0,0,0,0.6)"
            },
            "start": 0,
            "length": 3
          }
        ]
      }
    ]
  },
  "output": {
    "format": "mp4",
    "fps": 30,
    "resolution": "hd"
  }
}`;

const SQUARE_TEMPLATE_3 = `{
  "timeline": {
    "tracks": [
      {
        "clips": [
          {
            "asset": {
              "type": "video",
              "src": "{{VIDEO_URL}}"
            },
            "start": 0,
            "length": {{CLIP_LENGTH_SECONDS}},
            "fit": "crop"
          }
        ]
      },
      {
        "clips": [
          {
            "asset": {
              "type": "title",
              "text": "{{CTA_TEXT}}",
              "style": "caption",
              "size": "small",
              "position": "bottom",
              "color": "#ffffff",
              "background": "{{BRAND_COLOR_PRIMARY}}"
            },
            "start": {{CLIP_LENGTH_SECONDS}} - 3,
            "length": 3
          }
        ]
      }
    ]
  },
  "output": {
    "format": "mp4",
    "fps": 30,
    "resolution": "hd"
  }
}`;

// Template registry
const TEMPLATES: Record<string, string> = {
  // Vertical templates (9:16)
  vertical_template_1: VERTICAL_TEMPLATE_1,
  vertical_template_2: VERTICAL_TEMPLATE_2,
  vertical_template_3: VERTICAL_TEMPLATE_3,
  vertical_template_4: VERTICAL_TEMPLATE_4,
  vertical_template_5: VERTICAL_TEMPLATE_5,
  
  // Horizontal templates (16:9)
  horizontal_template_1: HORIZONTAL_TEMPLATE_1,
  horizontal_template_2: HORIZONTAL_TEMPLATE_2,
  horizontal_template_3: HORIZONTAL_TEMPLATE_3,
  
  // Square templates (1:1)
  square_template_1: SQUARE_TEMPLATE_1,
  square_template_2: SQUARE_TEMPLATE_2,
  square_template_3: SQUARE_TEMPLATE_3,
};

/**
 * Get a Shotstack render payload for the specified template
 */
export function getTemplatePayload(
  templateName: string,
  placeholders: Placeholders,
  callbackUrl: string,
  addWatermark: boolean = false
): TemplatePayload {
  const templateString = TEMPLATES[templateName];
  
  if (!templateString) {
    throw new Error(`Template "${templateName}" not found. Available templates: ${Object.keys(TEMPLATES).join(', ')}`);
  }
  
  const payload = replacePlaceholders(templateString, placeholders);
  
  // Add certification watermark if requested
  if (addWatermark && placeholders.CERT_WATERMARK_URL) {
    addCertificationWatermark(payload, placeholders);
  }
  
  // Add callback and disk settings
  payload.callback = callbackUrl;
  payload.disk = "local";
  
  return payload;
}

/**
 * Add certification watermark overlay to a template payload
 */
function addCertificationWatermark(payload: any, placeholders: Placeholders): void {
  if (!payload.timeline?.tracks) return;
  
  // Add a new track with the watermark image
  const watermarkTrack = {
    clips: [
      {
        asset: {
          type: "image",
          src: placeholders.CERT_WATERMARK_URL,
        },
        start: 0,
        length: placeholders.CLIP_LENGTH_SECONDS,
        position: "bottomRight",
        offset: {
          x: -0.05, // 5% from right edge
          y: -0.05, // 5% from bottom edge
        },
        scale: 0.2, // 20% of video size
        opacity: 0.9,
      },
    ],
  };
  
  payload.timeline.tracks.push(watermarkTrack);
}

/**
 * Get list of available template names
 */
export function getAvailableTemplates(): string[] {
  return Object.keys(TEMPLATES);
}
