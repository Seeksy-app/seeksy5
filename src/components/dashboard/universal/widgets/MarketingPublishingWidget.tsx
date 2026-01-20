import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { FaInstagram, FaTiktok, FaYoutube, FaLinkedin } from "react-icons/fa";

interface Props {
  connectedAccounts?: string[];
}

export function MarketingPublishingWidget({ connectedAccounts = [] }: Props) {
  const navigate = useNavigate();

  const platforms = [
    { id: "instagram", name: "Instagram", icon: FaInstagram, color: "text-pink-500" },
    { id: "tiktok", name: "TikTok", icon: FaTiktok, color: "text-foreground" },
    { id: "youtube", name: "YouTube", icon: FaYoutube, color: "text-red-500" },
    { id: "linkedin", name: "LinkedIn", icon: FaLinkedin, color: "text-blue-600" },
  ];

  if (connectedAccounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-4 text-center">
        <Share2 className="h-10 w-10 text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground mb-4">
          Connect your social accounts to publish content.
        </p>
        <div className="flex gap-3 mb-4">
          {platforms.map((platform) => (
            <div
              key={platform.id}
              className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center"
            >
              <platform.icon className={`h-5 w-5 ${platform.color} opacity-50`} />
            </div>
          ))}
        </div>
        <Button size="sm" onClick={() => navigate("/social-hub")}>
          Connect Accounts
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {platforms.map((platform) => {
          const isConnected = connectedAccounts.includes(platform.id);
          return (
            <div
              key={platform.id}
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isConnected ? "bg-primary/10" : "bg-muted"
              }`}
            >
              <platform.icon className={`h-5 w-5 ${isConnected ? platform.color : "text-muted-foreground"}`} />
            </div>
          );
        })}
      </div>
      <Button size="sm" variant="outline" className="w-full" onClick={() => navigate("/social-hub")}>
        Manage Social Accounts
      </Button>
    </div>
  );
}
