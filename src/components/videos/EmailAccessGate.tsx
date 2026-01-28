import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, Mail } from "lucide-react";

interface EmailAccessGateProps {
  pageSlug: string;
  onAccessGranted: () => void;
}

const ACCESS_TOKEN_PREFIX = "video_access_";
const TOKEN_EXPIRY_DAYS = 14;

export function checkStoredAccess(pageSlug: string): boolean {
  const stored = localStorage.getItem(`${ACCESS_TOKEN_PREFIX}${pageSlug}`);
  if (!stored) return false;
  
  try {
    const { expiry } = JSON.parse(stored);
    if (new Date(expiry) > new Date()) {
      return true;
    }
    localStorage.removeItem(`${ACCESS_TOKEN_PREFIX}${pageSlug}`);
  } catch {
    localStorage.removeItem(`${ACCESS_TOKEN_PREFIX}${pageSlug}`);
  }
  return false;
}

export function storeAccess(pageSlug: string, email: string): void {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + TOKEN_EXPIRY_DAYS);
  localStorage.setItem(
    `${ACCESS_TOKEN_PREFIX}${pageSlug}`,
    JSON.stringify({ email, expiry: expiry.toISOString() })
  );
}

export function EmailAccessGate({ pageSlug, onAccessGranted }: EmailAccessGateProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      
      // Get the page ID first
      const pageResult = await (supabase as any)
        .from("video_pages")
        .select("id")
        .eq("slug", pageSlug)
        .single();

      if (!pageResult.data) {
        setError("This page doesn't exist.");
        setIsLoading(false);
        return;
      }
      const page = pageResult.data as any;

      // Check if email is in allowlist
      const accessResult = await (supabase as any)
        .from("video_page_access")
        .select("id")
        .eq("page_id", page.id)
        .eq("email", email.toLowerCase().trim())
        .maybeSingle();

      if (accessResult.data) {
        storeAccess(pageSlug, email.toLowerCase().trim());
        onAccessGranted();
      } else {
        setError("This email doesn't have access yet.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Private Content</h1>
          <p className="text-muted-foreground">
            Enter your registered email to access
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Checking..." : "Access Videos"}
          </Button>
        </form>
      </div>
    </div>
  );
}
