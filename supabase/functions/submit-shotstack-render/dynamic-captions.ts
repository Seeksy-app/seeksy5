/**
 * Dynamic Captions Template Generator for Shotstack
 * 
 * Generates OpusClip-style animated captions with:
 * - Word-by-word highlighting (yellow pop)
 * - Smooth fade transitions
 * - Shadow/outline for readability
 * - Positioning optimized for vertical video
 */

interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

interface CaptionSegment {
  text: string;
  words: WordTimestamp[];
  start: number;
  end: number;
  highlightWord?: string;
}

interface CaptionStyle {
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  highlightColor: string;
  backgroundColor: string;
  position: 'bottom' | 'center' | 'top';
  animation: 'pop' | 'fade' | 'bounce' | 'none';
}

const DEFAULT_STYLE: CaptionStyle = {
  fontFamily: 'Montserrat ExtraBold',
  fontSize: 42,
  fontColor: '#FFFFFF',
  highlightColor: '#FFFF00', // Yellow for highlighted words
  backgroundColor: 'transparent',
  position: 'bottom',
  animation: 'pop',
};

/**
 * Generate Shotstack caption clips for word-by-word animation
 */
export function generateDynamicCaptionClips(
  segments: CaptionSegment[],
  style: Partial<CaptionStyle> = {}
): any[] {
  const captionStyle = { ...DEFAULT_STYLE, ...style };
  const clips: any[] = [];

  for (const segment of segments) {
    // Create a clip for each word in the segment
    for (let i = 0; i < segment.words.length; i++) {
      const word = segment.words[i];
      const isHighlight = word.word === segment.highlightWord;
      
      // Calculate the text to display at this moment
      // Show all words up to and including current word
      const displayWords = segment.words.slice(0, i + 1).map((w, idx) => {
        if (idx === i) {
          // Current word - will be highlighted
          return w.word;
        }
        return w.word;
      });

      // Create HTML caption with highlighting
      const htmlContent = generateCaptionHTML(
        segment.words,
        i, // current word index
        captionStyle
      );

      clips.push({
        asset: {
          type: 'html',
          html: htmlContent,
          width: 1080,
          height: 200,
          background: 'transparent',
        },
        start: word.start,
        length: word.end - word.start + 0.05, // Small overlap for smooth transition
        position: captionStyle.position,
        offset: {
          x: 0,
          y: captionStyle.position === 'bottom' ? -0.15 : 0,
        },
        transition: {
          in: captionStyle.animation === 'pop' ? 'zoom' : 'fade',
          out: 'fade',
        },
      });
    }

    // Add a final "hold" clip showing all words
    if (segment.words.length > 0) {
      const lastWord = segment.words[segment.words.length - 1];
      const holdDuration = Math.min(0.5, segment.end - lastWord.end);
      
      if (holdDuration > 0.1) {
        clips.push({
          asset: {
            type: 'html',
            html: generateCaptionHTML(segment.words, segment.words.length - 1, captionStyle),
            width: 1080,
            height: 200,
            background: 'transparent',
          },
          start: lastWord.end,
          length: holdDuration,
          position: captionStyle.position,
          offset: {
            x: 0,
            y: captionStyle.position === 'bottom' ? -0.15 : 0,
          },
        });
      }
    }
  }

  return clips;
}

/**
 * Generate HTML for a caption with the current word highlighted
 */
function generateCaptionHTML(
  words: WordTimestamp[],
  currentIndex: number,
  style: CaptionStyle
): string {
  const wordSpans = words.map((word, idx) => {
    if (idx > currentIndex) {
      // Future words - hidden
      return `<span style="opacity: 0;">${escapeHtml(word.word)}</span>`;
    } else if (idx === currentIndex) {
      // Current word - highlighted and animated
      return `<span style="
        color: ${style.highlightColor};
        transform: scale(1.1);
        display: inline-block;
        text-shadow: 0 0 20px ${style.highlightColor}40;
      ">${escapeHtml(word.word)}</span>`;
    } else {
      // Past words - normal
      return `<span style="color: ${style.fontColor};">${escapeHtml(word.word)}</span>`;
    }
  });

  return `<!DOCTYPE html>
<html>
<head>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      font-family: '${style.fontFamily}', sans-serif;
      font-size: ${style.fontSize}px;
      font-weight: 800;
      text-align: center;
      line-height: 1.3;
      padding: 10px 30px;
      overflow: hidden;
    }
    .caption {
      max-width: 100%;
      word-wrap: break-word;
      overflow-wrap: break-word;
      white-space: normal;
      text-shadow: 
        2px 2px 0 #000,
        -2px -2px 0 #000,
        2px -2px 0 #000,
        -2px 2px 0 #000,
        0 4px 8px rgba(0,0,0,0.5);
      word-spacing: 0.05em;
    }
  </style>
</head>
<body>
  <div class="caption">${wordSpans.join(' ')}</div>
</body>
</html>`;
}

/**
 * Generate a simpler title-based caption track (fallback)
 * Uses Shotstack's native title asset instead of HTML
 */
export function generateSimpleCaptionClips(
  segments: CaptionSegment[],
  style: Partial<CaptionStyle> = {}
): any[] {
  const captionStyle = { ...DEFAULT_STYLE, ...style };
  const clips: any[] = [];

  for (const segment of segments) {
    // Create one clip per segment with full text
    clips.push({
      asset: {
        type: 'title',
        text: segment.text.toUpperCase(),
        style: 'subtitle',
        size: 'medium',
        position: captionStyle.position,
        color: captionStyle.fontColor,
        background: 'rgba(0,0,0,0.6)',
      },
      start: segment.start,
      length: segment.end - segment.start,
      transition: {
        in: 'fade',
        out: 'fade',
      },
    });
  }

  return clips;
}

/**
 * Build a complete Shotstack render payload with dynamic captions
 */
export function buildCaptionedRenderPayload(
  videoUrl: string,
  duration: number,
  segments: CaptionSegment[],
  options: {
    orientation?: 'vertical' | 'horizontal';
    style?: Partial<CaptionStyle>;
    useHtmlCaptions?: boolean;
    callbackUrl?: string;
    title?: string;
    enableWatermark?: boolean;
    watermarkUrl?: string;
  } = {}
): any {
  const {
    orientation = 'vertical',
    style = {},
    useHtmlCaptions = true,
    callbackUrl,
    title,
    enableWatermark = false,
    watermarkUrl,
  } = options;

  const isVertical = orientation === 'vertical';
  const resolution = isVertical ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 };

  // Generate caption clips
  const captionClips = useHtmlCaptions
    ? generateDynamicCaptionClips(segments, style)
    : generateSimpleCaptionClips(segments, style);

  // Build tracks
  const tracks: any[] = [];

  // Track 1: Main video
  tracks.push({
    clips: [
      {
        asset: {
          type: 'video',
          src: videoUrl,
        },
        start: 0,
        length: duration,
        fit: 'crop',
      },
    ],
  });

  // Track 2: Captions (on top of video)
  if (captionClips.length > 0) {
    tracks.push({ clips: captionClips });
  }

  // Track 3: Title overlay (optional, first 2 seconds)
  if (title) {
    tracks.push({
      clips: [
        {
          asset: {
            type: 'title',
            text: title,
            style: 'chunk',
            size: 'medium',
            position: 'top',
            color: '#FFFFFF',
            background: '#8B5CF6',
          },
          start: 0,
          length: Math.min(3, duration),
          transition: {
            in: 'fade',
            out: 'fade',
          },
        },
      ],
    });
  }

  // Track 4: Watermark (optional)
  if (enableWatermark && watermarkUrl) {
    tracks.push({
      clips: [
        {
          asset: {
            type: 'image',
            src: watermarkUrl,
          },
          start: 0,
          length: duration,
          position: 'bottomRight',
          offset: { x: -0.02, y: 0.02 },
          scale: 0.15,
          opacity: 0.7,
        },
      ],
    });
  }

  const payload: any = {
    timeline: {
      tracks,
      background: '#000000',
    },
    output: {
      format: 'mp4',
      fps: 30,
      size: resolution,
      aspectRatio: isVertical ? '9:16' : '16:9',
      quality: 'high',
    },
  };

  if (callbackUrl) {
    payload.callback = callbackUrl;
  }

  return payload;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
