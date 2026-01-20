import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("seeksy-cookie-consent");
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("seeksy-cookie-consent", "accepted");
    setIsVisible(false);
  };

  const declineCookies = () => {
    localStorage.setItem("seeksy-cookie-consent", "declined");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50 p-4 md:p-6">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm text-foreground mb-2">
              We use cookies to enhance your experience, analyze site traffic, and personalize content. By clicking "Accept All", you consent to our use of cookies.
            </p>
            <a href="/cookies" className="text-sm text-primary hover:underline">
              Learn more about cookies
            </a>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <Button variant="outline" onClick={declineCookies}>
              Decline
            </Button>
            <Button onClick={acceptCookies}>
              Accept All
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
