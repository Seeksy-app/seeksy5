import { Helmet } from "react-helmet";
import { PodcastAgentChat } from "@/components/podcast-agent";

export default function PodcastAgent() {
  return (
    <>
      <Helmet>
        <title>Podcast Production Agent | Seeksy</title>
        <meta 
          name="description" 
          content="AI-powered podcast production assistant. Invite guests, research topics, create outlines, and manage episode preparation automatically." 
        />
      </Helmet>

      <div className="container mx-auto py-6 px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Podcast Production Agent</h1>
          <p className="text-muted-foreground mt-1">
            Your AI-powered production assistant for episode preparation
          </p>
        </div>

        <PodcastAgentChat />
      </div>
    </>
  );
}
