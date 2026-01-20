import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, MessageCircle, Lightbulb, Send, ArrowLeft } from "lucide-react";
import { SparkIcon } from "@/components/spark/SparkIcon";

/**
 * Spark AI Assistant page.
 * This is the dedicated route for /spark that was missing.
 */
export default function Spark() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <SparkIcon size={28} pose="idle" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Ask Spark</h1>
              <p className="text-muted-foreground">Your AI assistant for Seeksy</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-6">
          {/* Welcome Card */}
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-600" />
                Welcome to Spark AI
              </CardTitle>
              <CardDescription>
                Spark is your intelligent assistant that helps you get the most out of Seeksy.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Ask me anything about your content, campaigns, analytics, or how to use any feature in Seeksy. 
                I'm here to help you work smarter and grow faster.
              </p>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
              <CardHeader className="pb-2">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-2">
                  <Lightbulb className="h-5 w-5 text-blue-600" />
                </div>
                <CardTitle className="text-base">Content Ideas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Get AI-powered suggestions for your next podcast, newsletter, or social post.
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
              <CardHeader className="pb-2">
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-2">
                  <MessageCircle className="h-5 w-5 text-green-600" />
                </div>
                <CardTitle className="text-base">Ask Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Get instant answers about features, best practices, or troubleshooting.
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
              <CardHeader className="pb-2">
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-2">
                  <Send className="h-5 w-5 text-purple-600" />
                </div>
                <CardTitle className="text-base">Automate Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Let Spark help you set up workflows and automations to save time.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Chat Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Start a Conversation</CardTitle>
              <CardDescription>
                The full Spark chat experience is available in the floating assistant. 
                Click the Spark icon in the corner or use Ask Spark from the sidebar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/my-day')} className="w-full">
                <SparkIcon size={16} pose="idle" className="mr-2" />
                Go to My Day
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
