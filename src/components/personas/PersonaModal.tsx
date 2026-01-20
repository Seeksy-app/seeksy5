import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, X, Play } from "lucide-react";

interface PersonaModalProps {
  open: boolean;
  onClose: () => void;
  persona: {
    name: string;
    role: string;
    tagline?: string;
    description: string;
    videoUrl: string;
    tags?: Array<{ icon: string; label: string }>;
  } | null;
}

export const PersonaModal = ({ open, onClose, persona }: PersonaModalProps) => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);

  const isIframe = persona?.videoUrl && (persona.videoUrl.includes('heygen.com') || persona.videoUrl.includes('iframe'));

  useEffect(() => {
    if (open && videoRef.current && !isIframe) {
      videoRef.current.muted = false; // Unmute when modal opens
      videoRef.current.play().catch(console.error);
      setIsMuted(false);
      setIsPlaying(true);
    } else if (!open && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, [open, isIframe]);

  const togglePlayPause = () => {
    if (isIframe) return; // Can't control iframe playback
    
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(console.error);
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  if (!persona) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] p-0 gap-0 overflow-hidden bg-background">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 rounded-full bg-background/80 hover:bg-background backdrop-blur-sm text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col lg:flex-row h-full">
          {/* Video Section - Left */}
          <div 
            className="relative lg:w-1/2 aspect-square lg:aspect-square bg-muted/20 cursor-pointer"
            onClick={togglePlayPause}
          >
            {persona.videoUrl ? (
              <>
                {isIframe ? (
                  <iframe
                    className="w-full h-full object-cover"
                    src={persona.videoUrl}
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                    frameBorder="0"
                  />
                ) : (
                  <video
                    ref={videoRef}
                    src={persona.videoUrl}
                    className="w-full h-full object-cover"
                    loop
                    playsInline
                    autoPlay
                    muted={isMuted}
                    controls={false}
                  />
                )}
                
                {/* Mute Toggle - only show for regular videos, top left */}
                {!isIframe && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMute();
                    }}
                    className="absolute top-4 left-4 p-3 rounded-full bg-white hover:bg-white/90 backdrop-blur-md transition-colors shadow-lg z-10"
                  >
                    {isMuted ? (
                      <VolumeX className="w-5 h-5 text-foreground" />
                    ) : (
                      <Volume2 className="w-5 h-5 text-foreground" />
                    )}
                  </button>
                )}

                {/* Play button overlay when paused */}
                <AnimatePresence>
                  {!isIframe && !isPlaying && (
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center bg-black/20"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-xl">
                        <Play className="w-10 h-10 text-foreground ml-1" fill="currentColor" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Subtitle caption when paused */}
                <AnimatePresence>
                  {!isIframe && !isPlaying && persona.tagline && (
                    <motion.div
                      className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-md px-6 py-3 rounded-full shadow-lg max-w-[85%]"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                    >
                      <p className="text-sm md:text-base font-medium text-green-600 text-center">
                        {persona.tagline}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-accent/20">
                <p className="text-muted-foreground">No video available</p>
              </div>
            )}
          </div>

          {/* Info Section - Right */}
          <div className="lg:w-1/2 p-8 lg:p-12 overflow-y-auto flex flex-col justify-between">
            <div className="space-y-6">
              {/* Name and Role */}
              <div>
                <motion.h2
                  className="text-4xl md:text-5xl font-bold text-foreground mb-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  {persona.name}
                </motion.h2>
                <motion.p
                  className="text-lg text-muted-foreground"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {persona.role}
                </motion.p>
              </div>

              {/* Description */}
              <motion.p
                className="text-base text-muted-foreground leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {persona.description}
              </motion.p>

              {/* Tags / Style */}
              {persona.tags && persona.tags.length > 0 && (
                <motion.div
                  className="space-y-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    {persona.name.split(" ")[0]}'s style
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {persona.tags.map((tag, index) => (
                      <motion.div
                        key={index}
                        className="px-4 py-2 rounded-full bg-muted/50 text-foreground text-sm font-medium flex items-center gap-2"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                      >
                        <span>{tag.icon}</span>
                        <span>{tag.label}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-8"
            >
              <Button
                size="lg"
                onClick={() => {
                  onClose();
                  navigate("/auth");
                }}
                className="w-full text-lg py-6 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg font-semibold"
              >
                Work with {persona.name.split(" ")[0]}
              </Button>
            </motion.div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
