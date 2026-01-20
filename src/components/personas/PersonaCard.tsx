import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface Tag {
  icon: string;
  label: string;
}

interface PersonaCardProps {
  name: string;
  role: string;
  videoUrl: string;
  thumbnailUrl?: string;
  tags: Tag[];
  description: string;
  onSelect?: () => void;
}

export const PersonaCard = ({
  name,
  role,
  videoUrl,
  tags,
  onSelect,
}: PersonaCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleClick = () => {
    onSelect?.();
  };

  const isIframe = videoUrl && (videoUrl.includes('heygen.com') || videoUrl.includes('iframe'));

  return (
    <motion.div
      ref={cardRef}
      className="relative w-full aspect-square cursor-pointer group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      whileHover={{ scale: 1.05, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl">
        <div className="relative w-full h-full">
          {/* Video background */}
          {videoUrl ? (
            isIframe ? (
              <iframe
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                src={videoUrl}
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                style={{ border: 'none' }}
              />
            ) : (
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                src={videoUrl}
                muted
                loop
                playsInline
                preload="auto"
              />
            )
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/20" />
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

          {/* Content - Bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <motion.h3
              className="text-3xl font-bold text-white mb-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {name}
            </motion.h3>

            <p className="text-lg text-white/80 mb-4">{role}</p>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <motion.div
                  key={index}
                  className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-sm font-medium flex items-center gap-1.5"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <span>{tag.icon}</span>
                  <span>{tag.label}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Cursor-following tag */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                className="absolute z-50 pointer-events-none"
                style={{
                  left: mousePosition.x,
                  top: mousePosition.y,
                  transform: 'translate(-50%, -120%)',
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <div className="px-4 py-2 bg-white rounded-full shadow-lg">
                  <p className="text-sm font-medium text-foreground whitespace-nowrap">
                    More about {name}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hover hint */}
          {!isHovered && (
            <motion.div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white/60 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <p className="text-center">Hover to preview • Click to learn more</p>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
