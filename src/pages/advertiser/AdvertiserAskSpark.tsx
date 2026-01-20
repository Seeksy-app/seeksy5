import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Sparkles, Bot, User, TrendingUp, Target, Users, DollarSign } from "lucide-react";
import { motion } from "framer-motion";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const quickPrompts = [
  { icon: TrendingUp, label: "Improve campaign performance" },
  { icon: Target, label: "Best creators for my brand" },
  { icon: Users, label: "Audience targeting tips" },
  { icon: DollarSign, label: "Budget optimization" },
];

const AdvertiserAskSpark = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I'm Spark, your Seeksy advertising assistant. I can help you optimize campaigns, find the right creators, and improve your ROI. What would you like help with today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "Based on your campaign data, I recommend focusing on creators with 50K-200K followers in the lifestyle niche. They typically have higher engagement rates and better ROI for brand awareness campaigns.",
        "To improve your CTR, consider using video content with clear call-to-actions in the first 3 seconds. Our top-performing ads use this approach.",
        "For your budget, I suggest allocating 60% to proven performers and 40% to testing new creators. This balance optimizes both stability and growth.",
        "Looking at your target audience, creators in Health & Fitness and Lifestyle niches would be ideal. Their audiences overlap well with your demographic.",
      ];

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responses[Math.floor(Math.random() * responses.length)],
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleQuickPrompt = (label: string) => {
    setInput(label);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gradient-to-br from-[#053877] to-[#041d3a] p-6"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500/20">
            <Sparkles className="w-8 h-8 text-amber-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Ask Spark</h1>
            <p className="text-white/70 mt-1">Your AI advertising assistant</p>
          </div>
        </div>

        {/* Chat Card */}
        <Card className="bg-white/95 backdrop-blur overflow-hidden">
          {/* Messages */}
          <ScrollArea className="h-[500px] p-6">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-amber-600" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-[#2C6BED] text-white"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                  {message.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-[#2C6BED]/20 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-[#2C6BED]" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="bg-muted rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" />
                      <span
                        className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <span
                        className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Quick Prompts */}
          <div className="px-6 py-3 border-t border-border/50">
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((prompt) => (
                <Button
                  key={prompt.label}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleQuickPrompt(prompt.label)}
                >
                  <prompt.icon className="w-3 h-3 mr-1" />
                  {prompt.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border/50">
            <div className="flex gap-2">
              <Input
                placeholder="Ask Spark anything about your campaigns..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="bg-[#2C6BED] hover:bg-[#2C6BED]/90"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </motion.div>
  );
};

export default AdvertiserAskSpark;
