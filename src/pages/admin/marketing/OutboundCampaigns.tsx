import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, Mail, Share2, Users, Plus } from "lucide-react";

export default function OutboundCampaigns() {
  return (
    <div className="px-10 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Send className="h-8 w-8 text-primary" />
            Outbound Campaigns
          </h1>
          <p className="text-muted-foreground mt-1">
            Email, social, and influencer outreach campaigns
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-500" />
              Email Campaigns
            </CardTitle>
            <CardDescription>
              Automated email sequences and newsletters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">12</p>
            <p className="text-sm text-muted-foreground">Active campaigns</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-purple-500" />
              Social Campaigns
            </CardTitle>
            <CardDescription>
              Cross-platform social media outreach
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">5</p>
            <p className="text-sm text-muted-foreground">Active campaigns</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-amber-500" />
              Influencer Outreach
            </CardTitle>
            <CardDescription>
              Creator and influencer partnership campaigns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">3</p>
            <p className="text-sm text-muted-foreground">Active campaigns</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            Full campaign builder with templates, scheduling, and analytics
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <Send className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">
            Campaign management features are being developed.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
