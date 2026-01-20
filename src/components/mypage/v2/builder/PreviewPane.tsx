import { Smartphone, Tablet, Monitor, Eye, Edit3 } from "lucide-react";
import { MyPageTheme } from "@/config/myPageThemes";
import { Button } from "@/components/ui/button";
import { MyPagePreview } from "../public/MyPagePreview";
import { cn } from "@/lib/utils";

interface PreviewPaneProps {
  theme: MyPageTheme;
  device: "mobile" | "tablet" | "desktop";
  onDeviceChange: (device: "mobile" | "tablet" | "desktop") => void;
  mode: "edit" | "preview";
  onModeChange: (mode: "edit" | "preview") => void;
}

export function PreviewPane({ theme, device, onDeviceChange, mode, onModeChange }: PreviewPaneProps) {
  const deviceSizes = {
    mobile: { width: "375px", height: "667px" },
    tablet: { width: "768px", height: "1024px" },
    desktop: { width: "100%", height: "100%" },
  };

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-muted/30 to-muted/10">
      {/* Preview Controls */}
      <div className="border-b bg-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={device === "mobile" ? "default" : "outline"}
            size="sm"
            onClick={() => onDeviceChange("mobile")}
            className="gap-2"
          >
            <Smartphone className="w-4 h-4" />
            Mobile
          </Button>
          <Button
            variant={device === "tablet" ? "default" : "outline"}
            size="sm"
            onClick={() => onDeviceChange("tablet")}
            className="gap-2"
          >
            <Tablet className="w-4 h-4" />
            Tablet
          </Button>
          <Button
            variant={device === "desktop" ? "default" : "outline"}
            size="sm"
            onClick={() => onDeviceChange("desktop")}
            className="gap-2"
          >
            <Monitor className="w-4 h-4" />
            Desktop
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={mode === "edit" ? "default" : "outline"}
            size="sm"
            onClick={() => onModeChange("edit")}
            className="gap-2"
          >
            <Edit3 className="w-4 h-4" />
            Edit
          </Button>
          <Button
            variant={mode === "preview" ? "default" : "outline"}
            size="sm"
            onClick={() => onModeChange("preview")}
            className="gap-2"
          >
            <Eye className="w-4 h-4" />
            Preview
          </Button>
        </div>
      </div>

      {/* Device Preview */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
        {device === "desktop" ? (
          <div className="w-full h-full">
            <div className="bg-white w-full h-full overflow-y-auto overflow-x-hidden rounded-lg shadow-xl">
              <MyPagePreview theme={theme} mode={mode} />
            </div>
          </div>
        ) : device === "mobile" ? (
          <div
            className="relative transition-all duration-300"
            style={{
              width: "320px",
              height: "680px",
            }}
          >
            {/* Phone Frame Container with defined outline */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-[52px] shadow-2xl border-4 border-black">
              {/* Inner padding for bezel */}
              <div className="absolute inset-2">
                {/* Dynamic Island */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-20" />
                
                {/* Screen Content - scrollable */}
                <div className="relative w-full h-full rounded-[44px] overflow-y-auto overflow-x-hidden">
                  <MyPagePreview theme={theme} mode={mode} />
                </div>
              </div>
              
              {/* Side Buttons */}
              <div className="absolute left-0 top-28 w-1 h-14 bg-gray-700 rounded-r-sm" />
              <div className="absolute left-0 top-44 w-1 h-10 bg-gray-700 rounded-r-sm" />
              <div className="absolute left-0 top-56 w-1 h-10 bg-gray-700 rounded-r-sm" />
              <div className="absolute right-0 top-36 w-1 h-16 bg-gray-700 rounded-l-sm" />
            </div>
          </div>
        ) : (
          <div
            className="transition-all duration-300 rounded-3xl shadow-2xl border-8 border-gray-900"
            style={{
              width: deviceSizes[device].width,
              height: deviceSizes[device].height,
            }}
          >
            <div className="bg-white w-full h-full overflow-y-auto overflow-x-hidden">
              <MyPagePreview theme={theme} mode={mode} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
