import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Volume2, VolumeX } from "lucide-react";

interface PersonaVideoCardProps {
  name: string;
  role: string;
  tagline: string;
  videoUrl: string;
  thumbnailUrl?: string;
  onClick: () => void;
  onHoverChange?: (isHovering: boolean) => void;
  tags?: Array<{ emoji: string; label: string }>;
}

// CSS to completely hide ALL video controls
const videoStyles = `
  .persona-video-card video {
    display: block !important;
    width: 100% !important;
    height: 100% !important;
    object-fit: cover !important;
  }
  .persona-video-card video::-webkit-media-controls {
    display: none !important;
    -webkit-appearance: none !important;
  }
  .persona-video-card video::-webkit-media-controls-enclosure {
    display: none !important;
  }
  .persona-video-card video::-webkit-media-controls-panel {
    display: none !important;
  }
  .persona-video-card video::-webkit-media-controls-play-button {
    display: none !important;
  }
  .persona-video-card video::-webkit-media-controls-start-playback-button {
    display: none !important;
  }
  .persona-video-card video::-webkit-media-controls-timeline {
    display: none !important;
  }
  .persona-video-card video::-webkit-media-controls-current-time-display {
    display: none !important;
  }
  .persona-video-card video::-webkit-media-controls-time-remaining-display {
    display: none !important;
  }
  .persona-video-card video::-webkit-media-controls-volume-slider {
    display: none !important;
  }
  .persona-video-card video::-webkit-media-controls-mute-button {
    display: none !important;
  }
  .persona-video-card video::-webkit-media-controls-fullscreen-button {
    display: none !important;
  }
  .persona-video-card video::-webkit-media-controls-overlay-play-button {
    display: none !important;
  }
  .persona-video-card video::-internal-media-controls-overlay-cast-button {
    display: none !important;
  }
`;

export const PersonaVideoCard = ({
  name,
  role,
  tagline,
  videoUrl,
  thumbnailUrl,
  onClick,
  onHoverChange,
  tags = [],
}: PersonaVideoCardProps) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const modalVideoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const isIframe = videoUrl && (videoUrl.includes('heygen.com') || videoUrl.includes('iframe'));

  const handleMouseEnter = () => {
    setIsHovering(true);
    onHoverChange?.(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    onHoverChange?.(false);
  };

  const handleClick = () => {
    setIsModalOpen(true);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (modalVideoRef.current) {
      modalVideoRef.current.pause();
    }
  };

  const toggleMute = () => {
    if (modalVideoRef.current) {
      modalVideoRef.current.muted = !modalVideoRef.current.muted;
      setIsMuted(modalVideoRef.current.muted);
    }
  };

  return (
    <>
      <style>{videoStyles}</style>
      <div className="w-full aspect-[2/3]">
        <motion.div
          ref={cardRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02, y: -4 }}
          transition={{ 
            opacity: { duration: 0.5 },
            y: { duration: 0.5 },
            scale: { duration: 0.2 },
          }}
          className="persona-video-card relative w-full h-full cursor-pointer"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        >
          {/* Card - Video with Text Overlays */}
          <div className="absolute inset-0 rounded-2xl shadow-2xl bg-black overflow-hidden">
            {videoUrl ? (
              isIframe ? (
                <div className="absolute inset-0 w-full h-full pointer-events-none">
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`${videoUrl}${videoUrl.includes('?') ? '&' : '?'}controls=0&autoplay=1&loop=1&muted=1`}
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                    style={{ 
                      border: 'none',
                      objectFit: 'cover',
                      width: '100%',
                      height: '100%'
                    }}
                  />
                </div>
              ) : (
                <div className="absolute inset-0 w-full h-full overflow-hidden">
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    className="absolute w-full h-full block"
                    style={{ 
                      objectFit: 'cover',
                      objectPosition: 'center center',
                      pointerEvents: 'none',
                      display: 'block',
                      margin: 0,
                      padding: 0,
                      border: 'none',
                      outline: 'none',
                      width: '100%',
                      height: '100%'
                    }}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    poster={thumbnailUrl}
                    controls={false}
                    controlsList="nodownload nofullscreen noremoteplayback"
                    disablePictureInPicture
                    onCanPlay={(e) => {
                      const video = e.currentTarget;
                      video.controls = false;
                      video.muted = true;
                      video.removeAttribute('controls');
                    }}
                    onLoadedMetadata={(e) => {
                      const video = e.currentTarget;
                      video.controls = false;
                      video.muted = true;
                      video.removeAttribute('controls');
                    }}
                    onContextMenu={(e) => e.preventDefault()}
                  />
                </div>
              )
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/20" />
            )}
            
            {/* Text Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none">
              <div className="absolute inset-0 flex flex-col justify-between p-6">
                {/* Role at top */}
                <motion.p 
                  className="text-xs uppercase tracking-widest text-white/90 font-semibold"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  {role}
                </motion.p>
                
                {/* Name and tagline at bottom */}
                <div className="space-y-2">
                  <motion.h3 
                    className="text-5xl font-bold text-white tracking-tight"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                  >
                    {name}
                  </motion.h3>
                  <motion.p 
                    className="text-lg text-white/90 font-light"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                  >
                    {tagline}
                  </motion.p>
                  
                  {/* Tags */}
                  {tags.length > 0 && (
                    <motion.div 
                      className="flex flex-wrap gap-2 mt-4 min-h-[72px] content-start max-w-[280px]"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 0.4 }}
                    >
                      {tags.map((tag, index) => (
                        <div
                          key={index}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium h-fit"
                        >
                          <span>{tag.emoji}</span>
                          <span>{tag.label}</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                 </div>
              </div>
            </div>
          </div>

        </motion.div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 hover:bg-white transition-colors"
              >
                <X className="w-6 h-6 text-gray-800" />
              </button>

              <div className="grid md:grid-cols-2 gap-0">
                {/* Left: Video */}
                <div className="relative bg-black aspect-[3/4] md:aspect-auto md:min-h-[600px] flex items-center justify-center overflow-hidden">
                  {videoUrl && !isIframe && (
                    <>
                      <video
                        ref={modalVideoRef}
                        src={videoUrl}
                        className="w-full h-full object-cover cursor-pointer"
                        autoPlay
                        loop
                        playsInline
                        onClick={(e) => {
                          if (e.currentTarget.paused) {
                            e.currentTarget.play();
                          } else {
                            e.currentTarget.pause();
                          }
                        }}
                        onLoadedMetadata={(e) => {
                          e.currentTarget.muted = false;
                        }}
                      />
                      {/* Mute/Unmute Button */}
                      <button
                        onClick={toggleMute}
                        className="absolute top-4 left-4 p-3 rounded-full bg-white/90 hover:bg-white transition-colors"
                      >
                        {modalVideoRef.current?.muted ? (
                          <VolumeX className="w-5 h-5 text-gray-800" />
                        ) : (
                          <Volume2 className="w-5 h-5 text-gray-800" />
                        )}
                      </button>
                      {/* Name overlay on video */}
                      <div className="absolute bottom-8 left-8">
                        <h3 className="text-5xl font-bold text-white tracking-tight drop-shadow-lg">
                          {name}
                        </h3>
                      </div>
                    </>
                  )}
                </div>

                {/* Right: Info */}
                <div className="p-8 md:p-12 flex flex-col justify-between">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-4xl font-bold text-gray-900 mb-2">{name}</h2>
                      <p className="text-lg text-gray-600">{role}</p>
                    </div>

                    <p className="text-gray-700 leading-relaxed">
                      {tagline}
                    </p>

                    {/* Tags */}
                    {tags.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-gray-900 mb-3">{name}'s style</p>
                        <div className="flex flex-wrap gap-2">
                          {tags.map((tag, index) => (
                            <div
                              key={index}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gray-700/80 backdrop-blur-sm text-white text-sm font-medium"
                            >
                              <span>{tag.emoji}</span>
                              <span>{tag.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClick();
                    }}
                    className="w-full py-4 px-6 bg-green-600 hover:bg-green-700 text-white rounded-full font-semibold text-lg transition-colors"
                  >
                    Work with {name}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
