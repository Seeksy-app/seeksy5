import { Shield, CheckCircle } from "lucide-react";

interface DataIntegrityBannerProps {
  className?: string;
}

export function DataIntegrityBanner({ className }: DataIntegrityBannerProps) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg ${className}`}>
      <Shield className="h-4 w-4 text-green-500" />
      <span className="text-xs text-green-700 dark:text-green-300">
        Your data is safely stored with redundant backups and version history. Nothing is ever deleted unless you delete it.
      </span>
      <CheckCircle className="h-3.5 w-3.5 text-green-500 ml-auto" />
    </div>
  );
}