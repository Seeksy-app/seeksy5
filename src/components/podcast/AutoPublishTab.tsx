import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ExternalLink, Youtube, Music2, Rss } from "lucide-react";

interface AutoPublishTabProps {
  userId: string;
}

export const AutoPublishTab = ({ userId }: AutoPublishTabProps) => {
  return (
    <div className="space-y-6">
      <Alert>
        <AlertTitle className="flex items-center gap-2">
          <Youtube className="w-5 h-5" />
          YouTube Auto-Publishing Setup
        </AlertTitle>
        <AlertDescription className="mt-4 space-y-4">
          <div className="space-y-2">
            <p className="font-semibold">Step 1: Enable YouTube Data API</p>
            <ol className="list-decimal list-inside space-y-1 text-sm ml-2">
              <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline">Google Cloud Console</a></li>
              <li>Create a new project or select existing one</li>
              <li>Enable "YouTube Data API v3"</li>
              <li>Create OAuth 2.0 credentials (Web application type)</li>
              <li>Add authorized redirect URI: <code className="bg-secondary px-1 rounded">{window.location.origin}/integrations/youtube/callback</code></li>
            </ol>
          </div>

          <div className="space-y-2">
            <p className="font-semibold">Step 2: Configure Seeksy Integration</p>
            <ol className="list-decimal list-inside space-y-1 text-sm ml-2">
              <li>Copy your YouTube Client ID and Client Secret from Google Cloud Console</li>
              <li>Go to Seeksy Settings → Integrations → YouTube</li>
              <li>Enter your credentials and connect your YouTube channel</li>
              <li>Grant permissions for video uploads</li>
            </ol>
          </div>

          <div className="space-y-2">
            <p className="font-semibold">Step 3: Set Upload Preferences</p>
            <p className="text-sm">Once connected, you can configure:</p>
            <ul className="list-disc list-inside space-y-1 text-sm ml-2">
              <li>Automatic upload after ad insertion</li>
              <li>Default video privacy (Public, Unlisted, Private)</li>
              <li>Video category and tags</li>
              <li>Thumbnail selection (auto-generated or custom)</li>
            </ul>
          </div>
        </AlertDescription>
      </Alert>

      <Alert>
        <AlertTitle className="flex items-center gap-2">
          <Music2 className="w-5 h-5 text-green-600" />
          Spotify for Podcasters Setup
        </AlertTitle>
        <AlertDescription className="mt-4 space-y-4">
          <div className="space-y-2">
            <p className="font-semibold">Step 1: Claim Your Podcast on Spotify</p>
            <ol className="list-decimal list-inside space-y-1 text-sm ml-2">
              <li>Go to <a href="https://podcasters.spotify.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline">Spotify for Podcasters</a></li>
              <li>Sign in with your Spotify account</li>
              <li>Search for and claim your podcast (must already be in Spotify's catalog)</li>
              <li>Verify ownership via email or RSS feed</li>
            </ol>
          </div>

          <div className="space-y-2">
            <p className="font-semibold">Step 2: Submit Your RSS Feed</p>
            <ol className="list-decimal list-inside space-y-1 text-sm ml-2">
              <li>If not already listed, submit your RSS feed URL</li>
              <li>Your Seeksy RSS feed URL: <code className="bg-secondary px-1 rounded">{window.location.origin}/rss/your-podcast-id</code></li>
              <li>Spotify will automatically check for new episodes every few hours</li>
              <li>No additional API integration needed - works via RSS</li>
            </ol>
          </div>

          <div className="space-y-2">
            <p className="font-semibold">Auto-Publishing to Spotify</p>
            <p className="text-sm">
              Spotify automatically pulls new episodes from your RSS feed. When you:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm ml-2">
              <li>Upload a new episode to Seeksy</li>
              <li>Add ads to an episode</li>
              <li>Publish your episode</li>
            </ul>
            <p className="text-sm mt-2">
              It will appear in your RSS feed immediately and Spotify will detect it within 2-6 hours.
            </p>
          </div>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rss className="w-5 h-5" />
            Your Podcast RSS Feeds
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Your podcast RSS feeds are automatically generated and updated when you publish episodes.
            Use these URLs to submit to directories:
          </p>
          <div className="bg-secondary p-4 rounded-lg">
            <code className="text-sm">
              {window.location.origin}/rss/[your-podcast-id]
            </code>
          </div>
          <Button variant="outline" className="mt-4" size="sm">
            <ExternalLink className="w-4 h-4 mr-2" />
            View All RSS Feeds
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon: Enhanced Auto-Publishing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            We're working on advanced auto-publishing features including:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>One-click YouTube video creation from podcast audio</li>
            <li>Automatic audiogram generation for social media</li>
            <li>Scheduled publishing across all platforms</li>
            <li>Custom templates for YouTube thumbnails and descriptions</li>
            <li>Cross-posting to Instagram, TikTok, and Twitter</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
