import { Shield, CheckCircle, Lock, Eye, FileCheck, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Verified() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        {/* Hero Section */}
        <div className="text-center space-y-6 mb-16">
          <div className="flex justify-center">
            <div className="p-6 bg-primary/10 rounded-full">
              <Shield className="h-16 w-16 text-primary" />
            </div>
          </div>
          <h1 className="text-5xl font-bold">Verified by Seeksy</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            On-chain authenticity for creators, brands, and audiences.
          </p>
          <Badge className="text-lg px-6 py-2">
            <CheckCircle className="h-5 w-5 mr-2" />
            Blockchain-Certified Content
          </Badge>
        </div>

        {/* Main Content */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-2xl">What is Seeksy Certification?</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-lg max-w-none">
            <p>
              Seeksy doesn't just host your clips – <strong>it certifies them</strong>.
            </p>
            <p>
              When you publish a clip through Seeksy, you can choose to have it "Certified by Seeksy". Behind the scenes, we:
            </p>
            <ol className="space-y-2">
              <li>Link your clip to your creator wallet</li>
              <li>Record a certificate transaction on the Polygon blockchain</li>
              <li>Attach a public, verifiable proof that this clip is official</li>
            </ol>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Cryptographic Security</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Your content is cryptographically fingerprinted and secured on the Polygon blockchain, creating an immutable record of authenticity.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Eye className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Public Verification</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Anyone can verify your content's authenticity through our public certificate pages and blockchain explorer links.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <FileCheck className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Timestamp Proof</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Every certified clip includes a blockchain timestamp proving when it was officially certified, preventing backdating or manipulation.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Instant Certification</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Certification happens automatically during clip generation with gasless transactions, requiring no blockchain knowledge from creators.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* What's Included */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-2xl">Each Certified Clip Includes:</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-semibold">Seeksy Certification Badge</p>
                <p className="text-sm text-muted-foreground">
                  A visible badge in your dashboard showing certification status
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-semibold">Public Certificate Page</p>
                <p className="text-sm text-muted-foreground">
                  A shareable certificate page with creator details and on-chain proof
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-semibold">Blockchain Explorer Link</p>
                <p className="text-sm text-muted-foreground">
                  Direct link to the Polygon explorer showing the certification transaction
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* For Brands & Sponsors */}
        <Card className="mb-12 border-primary/20">
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-2xl">For Brands and Sponsors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                <p>You can verify that a clip really came from the creator</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                <p>It was certified at a specific time</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                <p>And the record cannot be quietly edited or deleted</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* For Creators */}
        <Card className="mb-12 border-green-500/20">
          <CardHeader className="bg-green-500/5">
            <CardTitle className="text-2xl">For Creators</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <p>Your content has a portable, independent proof of authenticity</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <p>Your best work isn't just "another video link" – it's a certified asset</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <p>Build trust with your audience through verifiable authenticity</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coming Next */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Coming Next</CardTitle>
            <CardDescription>The future of content authenticity</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              We'll attach stronger identity signals to your certified clips, so Seeksy can become your trusted identity layer across platforms:
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Voice Verification</Badge>
                <span className="text-sm text-muted-foreground">Cryptographic voice fingerprinting</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">AI Clone Disclosure</Badge>
                <span className="text-sm text-muted-foreground">Transparent AI usage labeling</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Face Verification</Badge>
                <span className="text-sm text-muted-foreground">Visual identity certification</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center mt-12">
          <Button size="lg" onClick={() => navigate("/dashboard")}>
            Get Started with Seeksy
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Join creators building trust through blockchain-certified content
          </p>
        </div>
      </div>
    </div>
  );
}
