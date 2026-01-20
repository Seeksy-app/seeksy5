import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Clock, CheckCircle2, XCircle, MessageSquare, Send, DollarSign, Calendar } from "lucide-react";
import { demoOffersV2, demoCreatorsV2 } from "@/data/advertiserDemoDataV2";
import { motion } from "framer-motion";
import { useState } from "react";

const OfferDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");

  // Find the offer from demo data
  const offer = demoOffersV2.find((o) => o.id === id) || demoOffersV2[0];
  const creator = demoCreatorsV2.find((c) => c.id === (offer as any)?.creatorId) || demoCreatorsV2[0];

  if (!offer) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-lg font-medium mb-4">Offer not found</p>
          <Button onClick={() => navigate("/advertiser/offers")}>Back to Offers</Button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "accepted":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle2 className="w-3 h-3 mr-1" />Accepted</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case "negotiating":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20"><MessageSquare className="w-3 h-3 mr-1" />Negotiating</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const demoMessages = [
    { id: 1, sender: "advertiser", content: "Hi! We'd love to collaborate with you on our new campaign.", time: "2 days ago" },
    { id: 2, sender: "creator", content: "Thanks for reaching out! I'm interested. Can you share more details about the deliverables?", time: "2 days ago" },
    { id: 3, sender: "advertiser", content: "We're looking for 3 Instagram posts and 5 stories over a 2-week period.", time: "1 day ago" },
    { id: 4, sender: "creator", content: "That works for me. Let me review the budget and I'll get back to you.", time: "1 day ago" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gradient-to-br from-[#053877] to-[#041d3a] p-6"
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/advertiser/offers")}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">Offer Details</h1>
            <p className="text-white/70">{offer.campaignName}</p>
          </div>
          {getStatusBadge(offer.status)}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Creator Info */}
            <Card className="p-6 bg-white/95 backdrop-blur">
              <h3 className="font-semibold text-[#053877] mb-4">Creator</h3>
              <div
                className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => navigate(`/advertiser/creators/${creator.id}`)}
              >
                <Avatar className="h-16 w-16">
                  <AvatarImage src={creator.avatarUrl} className="object-cover" />
                  <AvatarFallback className="bg-[#2C6BED]/10 text-[#2C6BED] text-lg">
                    {creator.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h4 className="font-semibold text-lg">{creator.name}</h4>
                  <p className="text-sm text-muted-foreground">{creator.niche}</p>
                  <p className="text-sm text-muted-foreground">
                    {(creator.followers / 1000).toFixed(0)}K followers · {creator.engagementRate}% engagement
                  </p>
                </div>
                <Button variant="outline" size="sm">View Profile</Button>
              </div>
            </Card>

            {/* Messages */}
            <Card className="p-6 bg-white/95 backdrop-blur">
              <h3 className="font-semibold text-[#053877] mb-4">Conversation</h3>
              <div className="space-y-4 max-h-[400px] overflow-y-auto mb-4">
                {demoMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === "advertiser" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        msg.sender === "advertiser"
                          ? "bg-[#2C6BED] text-white"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.sender === "advertiser" ? "text-white/70" : "text-muted-foreground"}`}>
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex-1 min-h-[80px]"
                />
                <Button className="bg-[#2C6BED] hover:bg-[#2C6BED]/90 self-end">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="p-5 bg-white/95 backdrop-blur">
              <h3 className="font-semibold text-[#053877] mb-4">Offer Details</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#053877]">${offer.budget?.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Budget</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold">Campaign Period</p>
                    <p className="text-sm text-muted-foreground">Jan 15 - Feb 15, 2025</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-5 bg-white/95 backdrop-blur">
              <h3 className="font-semibold text-[#053877] mb-4">Actions</h3>
              <div className="space-y-2">
                {offer.status === "pending" && (
                  <>
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Accept Offer
                    </Button>
                    <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50">
                      <XCircle className="w-4 h-4 mr-2" />
                      Decline
                    </Button>
                  </>
                )}
                {offer.status === "accepted" && (
                  <Button className="w-full bg-[#2C6BED] hover:bg-[#2C6BED]/90">
                    View Campaign
                  </Button>
                )}
                {(offer.status as string) === "negotiating" && (
                  <Button variant="outline" className="w-full">
                    Update Offer
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default OfferDetailPage;