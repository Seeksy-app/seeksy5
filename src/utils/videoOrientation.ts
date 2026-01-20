/**
 * Video orientation utilities for detecting and handling vertical vs horizontal videos
 */

export type VideoOrientation = 'portrait' | 'landscape' | 'square';

export interface VideoMetadata {
  width: number;
  height: number;
  orientation: VideoOrientation;
  aspectRatio: string;
}

/**
 * Detect video orientation from a video element
 */
export const detectVideoOrientation = (video: HTMLVideoElement): VideoMetadata => {
  const width = video.videoWidth;
  const height = video.videoHeight;
  
  let orientation: VideoOrientation = 'landscape';
  let aspectRatio = '16:9';
  
  if (height > width) {
    // Vertical/Portrait video (9:16)
    orientation = 'portrait';
    aspectRatio = '9:16';
  } else if (Math.abs(width - height) < 10) {
    // Square video (1:1)
    orientation = 'square';
    aspectRatio = '1:1';
  } else {
    // Horizontal/Landscape video (16:9)
    orientation = 'landscape';
    aspectRatio = '16:9';
  }
  
  return {
    width,
    height,
    orientation,
    aspectRatio
  };
};

/**
 * Get container classes for video player based on orientation
 */
export const getVideoContainerClasses = (orientation: VideoOrientation): string => {
  switch (orientation) {
    case 'portrait':
      return 'aspect-[9/16] max-w-md mx-auto'; // Vertical container
    case 'square':
      return 'aspect-square max-w-2xl mx-auto'; // Square container
    case 'landscape':
    default:
      return 'aspect-video w-full'; // Standard horizontal container
  }
};

/**
 * Get orientation badge color
 */
export const getOrientationBadgeColor = (orientation: VideoOrientation): string => {
  switch (orientation) {
    case 'portrait':
      return 'bg-purple-500/10 text-purple-600 border-purple-600';
    case 'square':
      return 'bg-blue-500/10 text-blue-600 border-blue-600';
    case 'landscape':
    default:
      return 'bg-green-500/10 text-green-600 border-green-600';
  }
};

/**
 * Get orientation label
 */
export const getOrientationLabel = (orientation: VideoOrientation): string => {
  switch (orientation) {
    case 'portrait':
      return 'Portrait (9:16)';
    case 'square':
      return 'Square (1:1)';
    case 'landscape':
    default:
      return 'Landscape (16:9)';
  }
};

/**
 * Load video metadata from URL
 */
export const loadVideoMetadata = (videoUrl: string): Promise<VideoMetadata> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.addEventListener('loadedmetadata', () => {
      const metadata = detectVideoOrientation(video);
      resolve(metadata);
    });
    
    video.addEventListener('error', () => {
      reject(new Error('Failed to load video metadata'));
    });
    
    video.src = videoUrl;
  });
};
