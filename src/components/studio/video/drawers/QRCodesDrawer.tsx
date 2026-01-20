import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Plus, QrCode, Link, ExternalLink } from "lucide-react";
import QRCode from "react-qr-code";
import { cn } from "@/lib/utils";

interface QRCodesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface QRItem {
  id: string;
  name: string;
  url: string;
}

const mockQRCodes: QRItem[] = [
  { id: "1", name: "Meeting Link", url: "https://seeksy.io/meet/demo" },
  { id: "2", name: "Product Page", url: "https://seeksy.io/products" },
];

export function QRCodesDrawer({ isOpen, onClose }: QRCodesDrawerProps) {
  const [qrCodes, setQrCodes] = useState<QRItem[]>(mockQRCodes);
  const [activeQR, setActiveQR] = useState<string | null>(null);
  const [newUrl, setNewUrl] = useState("");
  const [newName, setNewName] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const handleAddQR = () => {
    if (!newUrl.trim()) return;
    
    const newQR: QRItem = {
      id: Date.now().toString(),
      name: newName || "New QR Code",
      url: newUrl,
    };
    setQrCodes(prev => [...prev, newQR]);
    setNewUrl("");
    setNewName("");
    setShowAdd(false);
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-0 right-16 bottom-0 w-[400px] bg-[#1a1d21] border-l border-white/10 flex flex-col z-20">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h3 className="text-lg font-semibold text-white">QR Codes</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdd(!showAdd)}
            className="text-blue-400 hover:text-blue-300 gap-1"
          >
            <Plus className="w-4 h-4" />
            Add
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="text-white/70 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {/* Add New QR Form */}
          {showAdd && (
            <div className="p-4 bg-white/5 rounded-lg border border-white/10 space-y-3">
              <div className="space-y-2">
                <Label className="text-white/70 text-sm">Name</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Landing Page"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/70 text-sm">URL</Label>
                <Input
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://..."
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <Button onClick={handleAddQR} className="w-full">
                Generate QR Code
              </Button>
            </div>
          )}

          {/* QR Code List */}
          {qrCodes.map(qr => (
            <button
              key={qr.id}
              onClick={() => setActiveQR(activeQR === qr.id ? null : qr.id)}
              className={cn(
                "w-full p-4 rounded-lg text-left transition-all",
                activeQR === qr.id
                  ? "bg-blue-500/20 border border-blue-500/50"
                  : "bg-white/5 border border-white/10 hover:bg-white/10"
              )}
            >
              <div className="flex items-start gap-4">
                <div className="bg-white p-2 rounded">
                  <QRCode value={qr.url} size={64} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-white/60" />
                    <span className="font-medium text-white">{qr.name}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-sm text-white/50">
                    <Link className="w-3 h-3" />
                    <span className="truncate">{qr.url}</span>
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </div>
                </div>
              </div>
              {activeQR === qr.id && (
                <p className="text-xs text-green-400 mt-2">
                  ✓ QR Code is visible on stream
                </p>
              )}
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
