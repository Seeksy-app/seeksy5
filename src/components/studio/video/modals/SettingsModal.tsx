import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Settings, Video, Mic, Circle, Image, 
  Keyboard, User, Code, ChevronRight, Sparkles, Focus
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsSection = "general" | "video" | "audio" | "recordings" | "virtual" | "shortcuts" | "profile";

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>("general");
  const [resolution, setResolution] = useState("720p");
  const [showGraphics, setShowGraphics] = useState(true);
  const [guestControl, setGuestControl] = useState(false);
  const [showNonVideo, setShowNonVideo] = useState(false);
  const [showQrAlerts, setShowQrAlerts] = useState(true);
  const [pushProductLinks, setPushProductLinks] = useState(true);
  // NEW AI FEATURES
  const [captureRealtimeClips, setCaptureRealtimeClips] = useState(false);
  const [captureCameraFocus, setCaptureCameraFocus] = useState(false);

  const sections = [
    { id: "general" as const, label: "General", icon: Settings },
    { id: "video" as const, label: "Video", icon: Video },
    { id: "audio" as const, label: "Audio", icon: Mic },
    { id: "recordings" as const, label: "Recordings", icon: Circle },
    { id: "virtual" as const, label: "Virtual Background", icon: Image },
    { id: "shortcuts" as const, label: "Shortcuts", icon: Keyboard },
    { id: "profile" as const, label: "Profile", icon: User },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] bg-white p-0 h-[500px] flex">
        {/* Sidebar */}
        <div className="w-48 border-r border-gray-100 p-2">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle className="text-lg font-semibold text-gray-900">Settings</DialogTitle>
          </DialogHeader>
          <nav className="space-y-1">
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  activeSection === section.id
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                <section.icon className="w-4 h-4" />
                {section.label}
                {activeSection === section.id && (
                  <ChevronRight className="w-4 h-4 ml-auto" />
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeSection === "general" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm text-gray-500">Live stream quality</label>
                <Select value={resolution} onValueChange={setResolution}>
                  <SelectTrigger className="bg-white border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="720p">High Definition (720p @ 30fps)</SelectItem>
                    <SelectItem value="1080p">Full HD (1080p @ 30fps)</SelectItem>
                    <SelectItem value="1080p60">Full HD (1080p @ 60fps)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* AI Features Section */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <h4 className="font-semibold text-gray-900">AI Features</h4>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center mt-0.5">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Capture Realtime AI Clips</span>
                        <p className="text-xs text-gray-500 mt-0.5">Auto-generate clips during streaming. Appear in Media Library within 10 min.</p>
                      </div>
                    </div>
                    <Switch checked={captureRealtimeClips} onCheckedChange={setCaptureRealtimeClips} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center mt-0.5">
                        <Focus className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Capture AI Camera Focus</span>
                        <p className="text-xs text-gray-500 mt-0.5">Auto-adjusts camera to follow active speaker and crop faces.</p>
                      </div>
                    </div>
                    <Switch checked={captureCameraFocus} onCheckedChange={setCaptureCameraFocus} />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">Show graphics and captions on top of video clips</span>
                    <span className="text-gray-400 text-xs">ⓘ</span>
                  </div>
                  <Switch checked={showGraphics} onCheckedChange={setShowGraphics} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">Guest can control all presentations</span>
                    <span className="text-gray-400 text-xs">ⓘ</span>
                  </div>
                  <Switch checked={guestControl} onCheckedChange={setGuestControl} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">Show non-video participants</span>
                    <span className="text-gray-400 text-xs">ⓘ</span>
                  </div>
                  <Switch checked={showNonVideo} onCheckedChange={setShowNonVideo} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">Show QR code scan alerts on stream</span>
                    <span className="text-gray-400 text-xs">ⓘ</span>
                  </div>
                  <Switch checked={showQrAlerts} onCheckedChange={setShowQrAlerts} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">Push product links to live chat</span>
                    <span className="text-gray-400 text-xs">ⓘ</span>
                  </div>
                  <Switch checked={pushProductLinks} onCheckedChange={setPushProductLinks} />
                </div>
              </div>
            </div>
          )}

          {activeSection === "video" && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Video Settings</h3>
              <p className="text-sm text-gray-500">Configure your camera and video settings here.</p>
            </div>
          )}

          {activeSection === "audio" && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Audio Settings</h3>
              <p className="text-sm text-gray-500">Configure your microphone and audio settings here.</p>
            </div>
          )}
        </div>

        {/* Embed Stream Button */}
        <div className="absolute bottom-6 left-6">
          <Button variant="outline" className="text-blue-500 border-blue-200 gap-2">
            <Code className="w-4 h-4" />
            Embed Stream
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
