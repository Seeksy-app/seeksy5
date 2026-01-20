import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Volume2, MessageSquare, Upload, Monitor, Calendar, FileText, Handshake, ArrowLeft } from "lucide-react";

export default function CreateCampaignTypeSelection() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-4 max-w-7xl">
      <Button
        variant="ghost"
        onClick={() => navigate("/advertiser/ads")}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Ad Library
      </Button>
      
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Create New Ad
        </h1>
        <p className="text-muted-foreground">
          Choose the type of ad creative you want to create
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {/* Standard Audio Ad */}
        <Card 
          className="group cursor-pointer hover:shadow-lg hover:border-primary/50 hover:scale-[1.02] transition-all duration-300 bg-gradient-to-br from-background to-muted/20 flex flex-col min-h-[280px]" 
          onClick={() => navigate("/advertiser/create-ad-wizard")}
        >
          <CardHeader className="pb-3 pt-6 px-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/10">
                <Volume2 className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-xl">Audio Ads</CardTitle>
            </div>
            <CardDescription className="text-sm">
              Create audio ads with AI - standard or conversational
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 pt-2 px-6 pb-6">
            <ul className="space-y-2 text-sm text-muted-foreground mb-4 flex-1">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Standard audio ads</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Conversational AI ads</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>AI voice generation</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Step-by-step wizard</span>
              </li>
            </ul>
            <Button className="w-full" size="default">
              Create Audio Ad
            </Button>
          </CardContent>
        </Card>

        {/* Upload Ready Ad */}
        <Card 
          className="group cursor-pointer hover:shadow-lg hover:border-primary/50 hover:scale-[1.02] transition-all duration-300 bg-gradient-to-br from-background to-muted/20 flex flex-col min-h-[280px]" 
          onClick={() => navigate("/advertiser/upload-ad")}
        >
          <CardHeader className="pb-3 pt-6 px-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/10">
                <Upload className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-xl">Upload Ready Ad</CardTitle>
            </div>
            <CardDescription className="text-sm">
              Upload your pre-made audio or video advertisement
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 pt-2 px-6 pb-6">
            <ul className="space-y-2 text-sm text-muted-foreground mb-4 flex-1">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Upload audio/video files</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Ready-to-use ads</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Multiple format support</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Quick deployment</span>
              </li>
            </ul>
            <Button className="w-full" size="default">
              Upload Ad
            </Button>
          </CardContent>
        </Card>

        {/* Digital Ad Card */}
        <Card 
          className="group cursor-pointer hover:shadow-lg hover:border-primary/50 hover:scale-[1.02] transition-all duration-300 bg-gradient-to-br from-background to-muted/20 flex flex-col min-h-[280px]" 
          onClick={() => navigate("/advertiser/ads/create-digital")}
        >
          <CardHeader className="pb-3 pt-6 px-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/10">
                <Monitor className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle className="text-xl">Digital Ad</CardTitle>
            </div>
            <CardDescription className="text-sm">
              Create display ads for websites and social media
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 pt-2 px-6 pb-6">
            <ul className="space-y-2 text-sm text-muted-foreground mb-4 flex-1">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Multiple ad sizes</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Social media formats</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Website banners</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Canva integration</span>
              </li>
            </ul>
            <Button className="w-full" size="default">
              Create Digital Ad
            </Button>
          </CardContent>
        </Card>

        {/* Host Read Script */}
        <Card 
          className="group cursor-pointer hover:shadow-lg hover:border-primary/50 hover:scale-[1.02] transition-all duration-300 bg-gradient-to-br from-background to-muted/20 flex flex-col min-h-[280px]" 
          onClick={() => navigate("/advertiser/create-host-script")}
        >
          <CardHeader className="pb-3 pt-6 px-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/10">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle className="text-xl">Host Read Script</CardTitle>
            </div>
            <CardDescription className="text-sm">
              Create scripts for hosts to read during shows
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 pt-2 px-6 pb-6">
            <ul className="space-y-2 text-sm text-muted-foreground mb-4 flex-1">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Custom ad scripts</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Host reads live</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Authentic integration</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Campaign tracking</span>
              </li>
            </ul>
            <Button className="w-full" size="default">
              Create Script
            </Button>
          </CardContent>
        </Card>

        {/* Create Sponsorship */}
        <Card 
          className="group cursor-pointer hover:shadow-lg hover:border-primary/50 hover:scale-[1.02] transition-all duration-300 bg-gradient-to-br from-background to-muted/20 flex flex-col min-h-[280px]" 
          onClick={() => navigate("/advertiser/create-sponsorship")}
        >
          <CardHeader className="pb-3 pt-6 px-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-teal-500/10 to-teal-600/10">
                <Handshake className="h-6 w-6 text-teal-600" />
              </div>
              <CardTitle className="text-xl">Create Sponsorship</CardTitle>
            </div>
            <CardDescription className="text-sm">
              Sponsor creators, events, and content directly
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 pt-2 px-6 pb-6">
            <ul className="space-y-2 text-sm text-muted-foreground mb-4 flex-1">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Direct partnerships</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Creator collaborations</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Custom packages</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Flexible terms</span>
              </li>
            </ul>
            <Button className="w-full" size="default">
              Create Sponsorship
            </Button>
          </CardContent>
        </Card>

        {/* Browse Sponsorships */}
        <Card 
          className="group cursor-pointer hover:shadow-lg hover:border-primary/50 hover:scale-[1.02] transition-all duration-300 bg-gradient-to-br from-background to-muted/20 flex flex-col min-h-[280px]" 
          onClick={() => navigate("/advertiser/sponsorships")}
        >
          <CardHeader className="pb-3 pt-6 px-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500/10 to-pink-600/10">
                <Calendar className="h-6 w-6 text-pink-600" />
              </div>
              <CardTitle className="text-xl">Browse Sponsorships</CardTitle>
            </div>
            <CardDescription className="text-sm">
              Sponsor creator events, awards, and experiences
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 pt-2 px-6 pb-6">
            <ul className="space-y-2 text-sm text-muted-foreground mb-4 flex-1">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Event sponsorships</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Awards program sponsors</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Brand placement</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Live audience reach</span>
              </li>
            </ul>
            <Button className="w-full" size="default">
              Browse Opportunities
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="text-center mt-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/advertiser/campaigns")}>
          Cancel
        </Button>
      </div>
    </div>
  );
}