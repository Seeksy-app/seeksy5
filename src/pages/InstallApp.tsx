import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Monitor, Share, Plus, MoreVertical, Download, Check, ArrowRight } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallApp = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("desktop");

  useEffect(() => {
    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform("ios");
    } else if (/android/.test(userAgent)) {
      setPlatform("android");
    } else {
      setPlatform("desktop");
    }

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-green-500" />
            </div>
            <CardTitle className="text-2xl">You're All Set!</CardTitle>
            <CardDescription>
              Seeksy is installed on your device. Look for the app icon on your home screen.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-background py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Download className="h-4 w-4" />
            Install Seeksy
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Get the Seeksy App
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Install Seeksy on your device for the best experience. It's fast, works offline, and feels just like a native app.
          </p>

          {/* Direct Install Button (Android/Desktop) */}
          {deferredPrompt && (
            <Button size="lg" onClick={handleInstallClick} className="gap-2">
              <Download className="h-5 w-5" />
              Install Now
            </Button>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          {/* iOS Instructions */}
          <Card className={platform === "ios" ? "ring-2 ring-primary" : ""}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">iPhone & iPad</CardTitle>
                  <CardDescription>Safari browser</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                  1
                </div>
                <div>
                  <p className="font-medium">Tap the Share button</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    Look for the <Share className="h-4 w-4" /> icon at the bottom of Safari
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                  2
                </div>
                <div>
                  <p className="font-medium">Scroll down and tap "Add to Home Screen"</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    Look for the <Plus className="h-4 w-4" /> icon
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                  3
                </div>
                <div>
                  <p className="font-medium">Tap "Add" to confirm</p>
                  <p className="text-sm text-muted-foreground">
                    Seeksy will appear on your home screen
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Android Instructions */}
          <Card className={platform === "android" ? "ring-2 ring-primary" : ""}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Android</CardTitle>
                  <CardDescription>Chrome browser</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                  1
                </div>
                <div>
                  <p className="font-medium">Tap the menu button</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    Look for <MoreVertical className="h-4 w-4" /> in the top right of Chrome
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                  2
                </div>
                <div>
                  <p className="font-medium">Tap "Install app" or "Add to Home screen"</p>
                  <p className="text-sm text-muted-foreground">
                    You may see a banner at the bottom instead
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                  3
                </div>
                <div>
                  <p className="font-medium">Tap "Install" to confirm</p>
                  <p className="text-sm text-muted-foreground">
                    Seeksy will appear in your app drawer
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Desktop */}
        <Card className={`mt-8 ${platform === "desktop" ? "ring-2 ring-primary" : ""}`}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                <Monitor className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Desktop</CardTitle>
                <CardDescription>Chrome, Edge, or other browsers</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                <ArrowRight className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium">Look for the install icon in your browser's address bar</p>
                <p className="text-sm text-muted-foreground">
                  Click the <Download className="h-4 w-4 inline" /> icon or the "Install" button that appears in your browser.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Benefits */}
        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold mb-6">Why Install?</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="p-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Smartphone className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Full Screen</h3>
              <p className="text-sm text-muted-foreground">No browser bars, just your app</p>
            </div>
            <div className="p-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Download className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Works Offline</h3>
              <p className="text-sm text-muted-foreground">Access your content anytime</p>
            </div>
            <div className="p-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Fast Launch</h3>
              <p className="text-sm text-muted-foreground">Open instantly from home screen</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallApp;
