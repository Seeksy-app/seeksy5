import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const FaceProcessing = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const images = location.state?.images || [];

  useEffect(() => {
    if (images.length < 3) {
      navigate("/face-verification");
      return;
    }

    verifyFace();
  }, []);

  const verifyFace = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("verify-face", {
        body: { images },
      });

      if (error) throw error;

      if (data.status === "verified") {
        navigate("/face-verification/success", { 
          state: { 
            assetId: data.assetId,
            explorerUrl: data.explorerUrl 
          } 
        });
      } else {
        toast.error("Verification failed", {
          description: data.message || "Please try again"
        });
        navigate("/face-verification");
      }
    } catch (error) {
      console.error("Face verification error:", error);
      toast.error("Connection error", {
        description: "Please try again"
      });
      navigate("/face-verification");
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 flex items-center justify-center">
      <Card className="p-8 max-w-2xl w-full">
        <div className="text-center space-y-8">
          {/* Image Grid with Scanner Effect */}
          <div className="flex justify-center gap-4 flex-wrap">
            {images.slice(0, 5).map((img: string, index: number) => (
              <div 
                key={index} 
                className="relative w-24 h-24 rounded-lg overflow-hidden"
              >
                {/* Distorted Image */}
                <img 
                  src={img} 
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover grayscale contrast-125 blur-[1px]"
                  style={{
                    filter: 'grayscale(100%) contrast(1.25) blur(1px) saturate(0.5)',
                  }}
                />
                
                {/* Scanline Overlay */}
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
                  }}
                />
                
                {/* Moving Scanner Line */}
                <div 
                  className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-80"
                  style={{
                    animation: `scanLine 1.5s ease-in-out infinite`,
                    animationDelay: `${index * 0.2}s`,
                    boxShadow: '0 0 10px hsl(var(--primary)), 0 0 20px hsl(var(--primary))',
                  }}
                />
                
                {/* Glitch Effect Overlay */}
                <div 
                  className="absolute inset-0 mix-blend-overlay opacity-30"
                  style={{
                    background: 'linear-gradient(180deg, transparent 0%, rgba(59, 130, 246, 0.1) 50%, transparent 100%)',
                    animation: 'pulse 2s ease-in-out infinite',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Text */}
          <div>
            <h1 className="text-2xl font-bold mb-2">Analyzing your photos…</h1>
            <p className="text-sm text-muted-foreground">
              This usually takes less than a minute.
            </p>
          </div>

          {/* Processing Dots */}
          <div className="flex justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <div 
                key={i}
                className="w-2 h-2 rounded-full bg-primary"
                style={{
                  animation: 'bounce 1s ease-in-out infinite',
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </div>
        </div>
      </Card>

      {/* CSS Keyframes */}
      <style>{`
        @keyframes scanLine {
          0%, 100% {
            top: 0%;
          }
          50% {
            top: calc(100% - 4px);
          }
        }
        
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
            opacity: 0.5;
          }
          50% {
            transform: translateY(-8px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default FaceProcessing;
