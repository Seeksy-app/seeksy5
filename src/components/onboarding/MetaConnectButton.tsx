import { Button } from "@/components/ui/button";
import { Instagram, Facebook } from "lucide-react";
import { useState } from "react";

interface MetaConnectButtonProps {
  platform: 'instagram' | 'facebook';
  onConnect?: () => void;
}

export function MetaConnectButton({ platform, onConnect }: MetaConnectButtonProps) {
  const [connecting, setConnecting] = useState(false);

  const handleConnect = () => {
    setConnecting(true);
    // Placeholder for OAuth flow
    console.log(`Connecting to ${platform}...`);
    onConnect?.();
    setTimeout(() => {
      setConnecting(false);
    }, 1000);
  };

  const Icon = platform === 'instagram' ? Instagram : Facebook;
  const label = platform === 'instagram' ? 'Instagram' : 'Facebook';
  const bgColor = platform === 'instagram' 
    ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
    : 'bg-blue-600 hover:bg-blue-700';

  return (
    <Button
      className={`w-full ${bgColor}`}
      onClick={handleConnect}
      disabled={connecting}
    >
      <Icon className="h-4 w-4 mr-2" />
      {connecting ? 'Connecting...' : `Connect ${label}`}
    </Button>
  );
}