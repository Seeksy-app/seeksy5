import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Download, Calendar, Sparkles, ArrowRight, 
  CheckCircle, ExternalLink, Mail
} from "lucide-react";
import QRCode from "react-qr-code";

export default function LeadMagnetThankYou() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  const { downloadUrl, title, name } = (location.state as any) || {};

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, "_blank");
    }
  };

  return (
    <>
      <Helmet>
        <title>Download Ready | Seeksy</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-[#053877]/5 to-[#2C6BED]/5">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            {/* Success Icon */}
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>

            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              🎉 Thank You{name ? `, ${name}` : ""}!
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Your download is ready. We've also sent a copy to your email.
            </p>

            {/* Download Card */}
            <Card className="mb-8">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Download className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">{title || "Your Resource"}</h3>
                    <p className="text-sm text-muted-foreground">PDF Download Ready</p>
                  </div>
                </div>

                {downloadUrl ? (
                  <Button onClick={handleDownload} size="lg" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Download Now
                  </Button>
                ) : (
                  <div className="p-4 bg-muted rounded-lg">
                    <Mail className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Check your email for the download link.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Next Steps */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">What's Next?</h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="cursor-pointer hover:border-primary transition-colors" 
                      onClick={() => navigate("/book-demo")}>
                  <CardContent className="pt-6 text-left">
                    <Calendar className="h-8 w-8 text-primary mb-3" />
                    <h3 className="font-semibold mb-1">Book a Demo</h3>
                    <p className="text-sm text-muted-foreground">
                      See how Seeksy can help you grow your audience and revenue.
                    </p>
                    <div className="flex items-center gap-1 text-primary text-sm mt-2">
                      Schedule Now <ArrowRight className="h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:border-primary transition-colors"
                      onClick={() => navigate("/apps-and-tools")}>
                  <CardContent className="pt-6 text-left">
                    <Sparkles className="h-8 w-8 text-primary mb-3" />
                    <h3 className="font-semibold mb-1">Explore Seeksy Tools</h3>
                    <p className="text-sm text-muted-foreground">
                      Discover our suite of creator, brand, and event tools.
                    </p>
                    <div className="flex items-center gap-1 text-primary text-sm mt-2">
                      View All Tools <ArrowRight className="h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="pt-4">
                <Button variant="outline" onClick={() => navigate("/")}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
