import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, Plus, MessageSquare, Clock, CheckCircle2, XCircle, Send } from "lucide-react";
import { demoOffersV2, demoCreatorsV2 } from "@/data/advertiserDemoDataV2";
import { motion } from "framer-motion";

const OffersListPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filteredOffers = demoOffersV2.filter((offer) => {
    const matchesSearch = offer.creatorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.campaignName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" || offer.status === activeTab;
    return matchesSearch && matchesTab;
  });

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

  const getCreatorAvatar = (creatorId?: string) => {
    if (!creatorId) return undefined;
    const creator = demoCreatorsV2.find((c) => c.id === creatorId);
    return creator?.avatarUrl;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gradient-to-br from-[#053877] to-[#041d3a] p-6"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Offers & Negotiations</h1>
            <p className="text-white/70 mt-1">Manage your creator partnerships</p>
          </div>
          <Button
            className="bg-[#2C6BED] hover:bg-[#2C6BED]/90"
            onClick={() => navigate("/advertiser/marketplace-v2")}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Offer
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-4 bg-white/95 backdrop-blur">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search offers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="negotiating">Negotiating</TabsTrigger>
                <TabsTrigger value="accepted">Accepted</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </Card>

        {/* Offers List */}
        <div className="space-y-4">
          {filteredOffers.length === 0 ? (
            <Card className="p-12 bg-white/95 backdrop-blur text-center">
              <p className="text-muted-foreground">No offers found</p>
            </Card>
          ) : (
            filteredOffers.map((offer) => (
              <Card
                key={offer.id}
                className="p-5 bg-white/95 backdrop-blur hover:shadow-lg transition-all cursor-pointer"
                onClick={() => navigate(`/advertiser/offers/${offer.id}`)}
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={offer.creatorAvatar || getCreatorAvatar((offer as any).creatorId)} className="object-cover" />
                    <AvatarFallback className="bg-[#2C6BED]/10 text-[#2C6BED]">
                      {offer.creatorName?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-[#053877]">{offer.creatorName}</h3>
                      {getStatusBadge(offer.status)}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{offer.campaignName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-[#053877]">${offer.budget?.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Budget</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); }}>
                    <Send className="w-4 h-4 mr-1" />
                    Message
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default OffersListPage;