import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

export function AskSparkDock() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);

  // Listen for Spark button clicks
  useEffect(() => {
    const handleOpenChat = () => setOpen(true);
    window.addEventListener('openSparkChat', handleOpenChat);
    return () => window.removeEventListener('openSparkChat', handleOpenChat);
  }, []);

  const handleSend = () => {
    if (!message.trim()) return;
    
    setMessages(prev => [
      ...prev,
      { role: "user", content: message },
      { role: "assistant", content: "Hi! I'm Spark, your AI guide. This feature is coming soon!" }
    ]);
    setMessage("");
  };

  return (
    <>
      {/* Slide-over Panel */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px] p-0 flex flex-col">
          <SheetHeader className="p-6 border-b">
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Ask Spark – Your AI Guide ✨
            </SheetTitle>
            <SheetDescription>
              Get help with anything on Seeksy
            </SheetDescription>
          </SheetHeader>

          <Tabs defaultValue="spark" className="flex-1 flex flex-col">
            <div className="px-6 pt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="spark">Spark</TabsTrigger>
                <TabsTrigger value="scribe">Scribe</TabsTrigger>
                <TabsTrigger value="mia">Mia</TabsTrigger>
                <TabsTrigger value="castor">Castor</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="spark" className="flex-1 flex flex-col p-6 space-y-4">
              <ScrollArea className="flex-1">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Hi! I'm Spark. Ask me anything about Seeksy!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-4 py-2 ${
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              <div className="flex gap-2">
                <Input
                  placeholder="Ask Spark anything..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
                <Button onClick={handleSend}>Send</Button>
              </div>
            </TabsContent>

            <TabsContent value="scribe" className="flex-1 p-6">
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground">
                  Scribe helps with email drafting, rewriting, and deliverability.
                </p>
                <p className="text-xs text-muted-foreground mt-2">Coming soon!</p>
              </div>
            </TabsContent>

            <TabsContent value="mia" className="flex-1 p-6">
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground">
                  Mia helps with meetings, events, and scheduling.
                </p>
                <p className="text-xs text-muted-foreground mt-2">Coming soon!</p>
              </div>
            </TabsContent>

            <TabsContent value="castor" className="flex-1 p-6">
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground">
                  Castor helps with podcasting and audio content.
                </p>
                <p className="text-xs text-muted-foreground mt-2">Coming soon!</p>
              </div>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
    </>
  );
}
