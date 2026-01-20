import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calendar, MapPin, Users, Globe, ArrowLeft, Bookmark, BookmarkCheck, 
  Check, Mic, Video, Share2, Award, Sparkles 
} from "lucide-react";
import { getSponsorshipById } from "@/data/sponsorshipDemoData";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function SponsorshipDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string>("");
  
  const sponsorship = getSponsorshipById(id || "");

  if (!sponsorship) {
    return (
      <div className="p-6 flex flex-col items-center justify-center py-20">
        <Award className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Sponsorship Not Found</h2>
        <p className="text-muted-foreground mb-6">This sponsorship opportunity may no longer be available.</p>
        <Button onClick={() => navigate("/advertiser/sponsorships")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Opportunities
        </Button>
      </div>
    );
  }

  const handleSave = () => {
    setIsSaved(!isSaved);
    toast.success(isSaved ? "Removed from saved" : "Saved for later");
  };

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Sponsorship request submitted! Our team will contact you within 24 hours.");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="p-6 space-y-6"
    >
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => navigate("/advertiser/sponsorships")}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Opportunities
      </Button>

      {/* Hero Section */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <Avatar className="h-20 w-20 border-2 border-background shadow-lg">
              <AvatarImage src={sponsorship.hostAvatarUrl} />
              <AvatarFallback className="text-xl">{sponsorship.hostName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <Badge variant={sponsorship.type === 'event' ? 'default' : 'secondary'} className="mb-2">
                    {sponsorship.type === 'event' ? 'Event Sponsorship' : 'Awards Sponsorship'}
                  </Badge>
                  <h1 className="text-2xl md:text-3xl font-bold">{sponsorship.title}</h1>
                  <p className="text-muted-foreground mt-1">Hosted by {sponsorship.hostName}</p>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleSave}>
                    {isSaved ? (
                      <>
                        <BookmarkCheck className="h-4 w-4 mr-2 text-primary" />
                        Saved
                      </>
                    ) : (
                      <>
                        <Bookmark className="h-4 w-4 mr-2" />
                        Save for Later
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {sponsorship.dateRange || sponsorship.eventDate}
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {sponsorship.location}
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  {sponsorship.estimatedAttendees > 0 ? `${sponsorship.estimatedAttendees.toLocaleString()} attendees` : 'Virtual Event'}
                </div>
                <div className="flex items-center gap-1.5">
                  <Globe className="h-4 w-4" />
                  {sponsorship.estimatedOnlineReach.toLocaleString()} online reach
                </div>
              </div>

              <p className="mt-4 text-sm md:text-base">{sponsorship.description}</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Audience Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Audience Breakdown
              </CardTitle>
              <CardDescription>{sponsorship.audienceSummary}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold text-primary">
                    {sponsorship.estimatedAttendees > 0 ? sponsorship.estimatedAttendees.toLocaleString() : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">In-Person</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold text-primary">{sponsorship.estimatedOnlineReach.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Online Reach</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold text-primary">25-44</p>
                  <p className="text-xs text-muted-foreground">Primary Age</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold text-primary">68%</p>
                  <p className="text-xs text-muted-foreground">Decision Makers</p>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-2 gap-6 text-sm">
                <div>
                  <h4 className="font-medium mb-2">Top Interests</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {['Marketing', 'Technology', 'Entrepreneurship', 'Content Creation'].map((interest) => (
                      <Badge key={interest} variant="outline" className="text-xs">{interest}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Top Locations</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {['United States', 'Canada', 'United Kingdom'].map((loc) => (
                      <Badge key={loc} variant="outline" className="text-xs">{loc}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sponsorship Packages */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Sponsorship Packages
              </CardTitle>
              <CardDescription>Choose the package that fits your goals</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Package</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Inclusions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sponsorship.packages.map((pkg) => (
                    <TableRow key={pkg.name}>
                      <TableCell className="font-medium">{pkg.name}</TableCell>
                      <TableCell className="text-primary font-semibold">
                        ${pkg.price.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <ul className="space-y-1">
                          {pkg.highlights.map((highlight, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-sm">
                              <Check className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                              {highlight}
                            </li>
                          ))}
                        </ul>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Included Media */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Included Media & Creator Integration
              </CardTitle>
              <CardDescription>
                Seeksy bundles podcast ads, creator posts, and live event presence for maximum impact
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {sponsorship.includedMedia.map((media, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                    {i === 0 && <Mic className="h-5 w-5 text-primary shrink-0" />}
                    {i === 1 && <Share2 className="h-5 w-5 text-primary shrink-0" />}
                    {i === 2 && <Video className="h-5 w-5 text-primary shrink-0" />}
                    <span className="text-sm">{media}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="text-lg">Request This Sponsorship</CardTitle>
              <CardDescription>Get in touch to secure your spot</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm text-muted-foreground">Packages starting at</p>
                <p className="text-3xl font-bold text-primary">
                  ${Math.min(...sponsorship.packages.map(p => p.price)).toLocaleString()}
                </p>
              </div>

              <Sheet>
                <SheetTrigger asChild>
                  <Button className="w-full" size="lg">
                    Request Sponsorship
                  </Button>
                </SheetTrigger>
                <SheetContent className="sm:max-w-md">
                  <SheetHeader>
                    <SheetTitle>Request Sponsorship</SheetTitle>
                    <SheetDescription>
                      Fill out this form and our team will contact you within 24 hours.
                    </SheetDescription>
                  </SheetHeader>
                  <form onSubmit={handleRequestSubmit} className="space-y-4 mt-6">
                    <div className="space-y-2">
                      <Label htmlFor="company">Company Name</Label>
                      <Input id="company" placeholder="Your company" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact">Contact Name</Label>
                      <Input id="contact" placeholder="Your name" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="you@company.com" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="package">Interested Package</Label>
                      <Select value={selectedPackage} onValueChange={setSelectedPackage}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a package" />
                        </SelectTrigger>
                        <SelectContent>
                          {sponsorship.packages.map((pkg) => (
                            <SelectItem key={pkg.name} value={pkg.name}>
                              {pkg.name} - ${pkg.price.toLocaleString()}
                            </SelectItem>
                          ))}
                          <SelectItem value="custom">Custom / Not Sure</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Message (Optional)</Label>
                      <Textarea id="message" placeholder="Tell us about your goals..." rows={3} />
                    </div>
                    <Button type="submit" className="w-full">
                      Submit Request
                    </Button>
                  </form>
                </SheetContent>
              </Sheet>

              <Button variant="outline" className="w-full" onClick={handleSave}>
                {isSaved ? (
                  <>
                    <BookmarkCheck className="h-4 w-4 mr-2 text-primary" />
                    Saved
                  </>
                ) : (
                  <>
                    <Bookmark className="h-4 w-4 mr-2" />
                    Save for Later
                  </>
                )}
              </Button>

              <Separator />

              <div className="text-xs text-muted-foreground space-y-2">
                <p><strong>Next steps:</strong></p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Submit your request</li>
                  <li>Our team reviews within 24h</li>
                  <li>Schedule a call to finalize</li>
                  <li>Sign agreement & secure spot</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
