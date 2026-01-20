import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, Radio, FileAudio, Fingerprint, Lock, Award, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

const VoiceCertification = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        
        <div className="container relative z-10 mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <Badge className="mb-6 bg-primary/10 text-primary hover:bg-primary/20">
              <Shield className="h-3 w-3 mr-1" />
              Voice Authentication Technology
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Certified Voice
              </span>
              <br />
              <span className="text-foreground">Authenticity</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Protect your voice, verify your content, and build trust with blockchain-backed voice certification for podcasts, livestreams, and social media.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => navigate("/auth?mode=signup")}
                className="text-lg px-8 py-6 h-auto"
              >
                Get Started Free
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate("/pricing")}
                className="text-lg px-8 py-6 h-auto"
              >
                View Pricing
              </Button>
            </div>
          </div>

          {/* Certification Badges Display */}
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-2 border-primary/20 bg-card/50 backdrop-blur-sm hover:border-primary/40 transition-all">
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold">
                  <Shield className="h-4 w-4" />
                  Certified Voice
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Appears on all certified content
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-accent/20 bg-card/50 backdrop-blur-sm hover:border-accent/40 transition-all">
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 rounded-full bg-accent/10 mx-auto mb-4 flex items-center justify-center">
                  <Fingerprint className="h-8 w-8 text-accent" />
                </div>
                <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full text-sm font-semibold">
                  <Lock className="h-4 w-4" />
                  Voice Verified
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Blockchain-backed authenticity
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-brand-gold/20 bg-card/50 backdrop-blur-sm hover:border-brand-gold/40 transition-all">
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 rounded-full bg-brand-gold/10 mx-auto mb-4 flex items-center justify-center">
                  <Award className="h-8 w-8 text-brand-gold" />
                </div>
                <div className="inline-flex items-center gap-2 bg-brand-gold/10 text-brand-gold px-4 py-2 rounded-full text-sm font-semibold">
                  <Radio className="h-4 w-4" />
                  Live Authenticated
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Real-time voice authentication
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black mb-4">
                How Voice Certification Works
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Seamless voice authentication across all your content
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card className="bg-card border-2 hover:border-primary/50 transition-all">
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Radio className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">1. Record</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Start your podcast, livestream, or social post in Seeksy Studio
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-2 hover:border-primary/50 transition-all">
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Fingerprint className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">2. Capture</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    AI automatically captures your unique voice fingerprint during recording
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-2 hover:border-primary/50 transition-all">
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">3. Certify</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Voice signature is encrypted and stored on blockchain with certificate hash
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-2 hover:border-primary/50 transition-all">
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <CheckCircle className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">4. Verify</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Content displays "Certified Voice" badge with verifiable proof of authenticity
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black mb-4">
                Why Voice Certification Matters
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Combat deepfakes and protect your brand in the age of AI
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="bg-card/50 backdrop-blur-sm border-2">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl mb-2">Combat Deepfakes</CardTitle>
                      <p className="text-muted-foreground">
                        With AI voice cloning on the rise, voice certification provides cryptographic proof that content is genuinely yours. By 2026, over 90% of online content may be AI-generated—stand out with verified authenticity.
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-2">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Lock className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl mb-2">Protect Your Rights</CardTitle>
                      <p className="text-muted-foreground">
                        Establish clear ownership and licensing terms for your voice. Advertisers can verify authenticity and creators maintain control over how their voice is used across platforms.
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-2">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Award className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl mb-2">Build Trust</CardTitle>
                      <p className="text-muted-foreground">
                        Display verification badges on your podcasts, livestreams, and social content. Give your audience confidence that they're hearing the real you, not an AI clone.
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-2">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileAudio className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl mb-2">Cross-Platform</CardTitle>
                      <p className="text-muted-foreground">
                        Your voice certification travels with your content everywhere. Works with podcasts, YouTube, Spotify, social clips, and any platform where your voice appears.
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Blockchain NFT Section - Simple Explanation */}
      <section className="py-24 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-brand-gold/10 text-brand-gold hover:bg-brand-gold/20">
                <Award className="h-3 w-3 mr-1" />
                Powered by Blockchain
              </Badge>
              <h2 className="text-4xl md:text-5xl font-black mb-4">
                Your Voice = Your Digital Property
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Think of it like a digital deed to your house, but for your voice. Here's how it works in simple terms:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <Card className="bg-card/80 backdrop-blur border-2 hover:border-primary/50 transition-all">
                <CardHeader className="text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 mx-auto mb-4 flex items-center justify-center">
                    <span className="text-4xl">🎤</span>
                  </div>
                  <CardTitle className="text-xl">You Record Your Voice</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center">
                    Just like taking a selfie, but with your voice! Our AI captures what makes your voice uniquely yours.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/80 backdrop-blur border-2 hover:border-accent/50 transition-all">
                <CardHeader className="text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 mx-auto mb-4 flex items-center justify-center">
                    <span className="text-4xl">🏆</span>
                  </div>
                  <CardTitle className="text-xl">We Create Your NFT</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center">
                    An NFT is like a digital certificate that says "This voice belongs to YOU." It's stored on the blockchain forever.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/80 backdrop-blur border-2 hover:border-brand-gold/50 transition-all">
                <CardHeader className="text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 mx-auto mb-4 flex items-center justify-center">
                    <span className="text-4xl">✨</span>
                  </div>
                  <CardTitle className="text-xl">You Own It Forever</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center">
                    Nobody can fake your voice, steal it, or claim it's theirs. Your NFT proves it's really you!
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gradient-to-br from-primary/10 to-accent/5 border-2 border-primary/20">
              <CardContent className="pt-8 pb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div>
                    <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                      <span className="text-3xl">💡</span>
                      What's a Blockchain?
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Imagine a notebook that everybody can read, but nobody can erase or change what's written. That's blockchain! 
                      When we write "This voice belongs to [Your Name]" in this special notebook, it stays there forever.
                    </p>
                    <p className="text-muted-foreground">
                      We use <span className="font-semibold text-primary">Polygon blockchain</span> - it's fast, eco-friendly, 
                      and <span className="font-semibold text-accent">completely FREE</span> for you (we pay the fees!)
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 bg-card/80 p-4 rounded-lg border">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold mb-1">Can't Be Faked</p>
                        <p className="text-sm text-muted-foreground">AI deepfakes can't copy your blockchain certificate</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 bg-card/80 p-4 rounded-lg border">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold mb-1">Works Everywhere</p>
                        <p className="text-sm text-muted-foreground">Your NFT follows your voice to YouTube, Spotify, TikTok...</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 bg-card/80 p-4 rounded-lg border">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold mb-1">Totally Free</p>
                        <p className="text-sm text-muted-foreground">No gas fees, no crypto wallet needed. We handle it all!</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Visual How-To Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black mb-4">
                See It In Action
              </h2>
              <p className="text-xl text-muted-foreground">
                From recording to blockchain in 3 simple steps
              </p>
            </div>

            <div className="space-y-8">
              {/* Step 1 Visual */}
              <Card className="bg-card border-2 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2">
                  <div className="p-8 flex flex-col justify-center">
                    <Badge className="w-fit mb-4 bg-primary/10 text-primary">Step 1</Badge>
                    <h3 className="text-2xl font-bold mb-4">Record in Studio</h3>
                    <p className="text-muted-foreground mb-4">
                      Click the record button and start talking! Our AI listens to things like:
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span className="text-sm text-muted-foreground">How high or low your voice is</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span className="text-sm text-muted-foreground">The rhythm of how you speak</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span className="text-sm text-muted-foreground">Your unique sound patterns</span>
                      </li>
                    </ul>
                  </div>
                  <div className="bg-gradient-to-br from-primary/10 to-accent/5 p-8 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-8xl mb-4">🎙️</div>
                      <p className="text-sm text-muted-foreground">Recording your unique voice fingerprint...</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Step 2 Visual */}
              <Card className="bg-card border-2 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2">
                  <div className="bg-gradient-to-br from-accent/10 to-primary/5 p-8 flex items-center justify-center md:order-2">
                    <div className="text-center">
                      <div className="text-8xl mb-4">⛓️</div>
                      <p className="text-sm text-muted-foreground">Minting your NFT on Polygon blockchain...</p>
                    </div>
                  </div>
                  <div className="p-8 flex flex-col justify-center md:order-1">
                    <Badge className="w-fit mb-4 bg-accent/10 text-accent">Step 2</Badge>
                    <h3 className="text-2xl font-bold mb-4">Automatic NFT Creation</h3>
                    <p className="text-muted-foreground mb-4">
                      Behind the scenes (takes about 3 seconds):
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-accent">•</span>
                        <span className="text-sm text-muted-foreground">AI creates a unique fingerprint of your voice</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-accent">•</span>
                        <span className="text-sm text-muted-foreground">System mints an NFT on Polygon blockchain</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-accent">•</span>
                        <span className="text-sm text-muted-foreground">Certificate stored permanently (can never be deleted!)</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>

              {/* Step 3 Visual */}
              <Card className="bg-card border-2 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2">
                  <div className="p-8 flex flex-col justify-center">
                    <Badge className="w-fit mb-4 bg-brand-gold/10 text-brand-gold">Step 3</Badge>
                    <h3 className="text-2xl font-bold mb-4">Show Your Badge</h3>
                    <p className="text-muted-foreground mb-4">
                      Now all your content gets the "Certified Voice" badge showing:
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-brand-gold mt-0.5" />
                        <span className="text-sm text-muted-foreground">This is REALLY your voice (not AI)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-brand-gold mt-0.5" />
                        <span className="text-sm text-muted-foreground">You own it (blockchain proof)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-brand-gold mt-0.5" />
                        <span className="text-sm text-muted-foreground">Anyone can verify it's authentic</span>
                      </li>
                    </ul>
                  </div>
                  <div className="bg-gradient-to-br from-brand-gold/10 to-primary/5 p-8 flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <div className="text-8xl">✅</div>
                      <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-6 py-3 rounded-full font-semibold">
                        <Shield className="h-5 w-5" />
                        Certified Voice
                      </div>
                      <p className="text-sm text-muted-foreground">Badge appears on all your content!</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ - Simple Q&A */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black mb-4">
                Questions? We've Got Answers!
              </h2>
            </div>

            <div className="space-y-4">
              <Card className="bg-card/50 backdrop-blur border-2">
                <CardHeader>
                  <CardTitle className="text-xl">Do I need to know anything about crypto or blockchain?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Nope! You don't need a crypto wallet, you don't need to buy anything, and you don't even need to know what "gas fees" means. 
                    We handle all the technical stuff. You just record your voice and we do the rest!
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur border-2">
                <CardHeader>
                  <CardTitle className="text-xl">Does this cost money?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    It's completely FREE for you! Usually, storing things on blockchain costs money (called "gas fees"), 
                    but we pay those fees for you. Your voice NFT is free to create and keep forever.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur border-2">
                <CardHeader>
                  <CardTitle className="text-xl">What if someone tries to fake my voice with AI?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    That's exactly why we built this! Even if someone uses AI to clone your voice, they can't copy your blockchain certificate. 
                    Anyone can check the blockchain and see that YOUR voice has the official certification, and the fake one doesn't.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur border-2">
                <CardHeader>
                  <CardTitle className="text-xl">Can I see my NFT certificate?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Yes! After creating a voice profile, go to Voice Tag & Certification in your dashboard. 
                    You'll see your NFT certificate with a transaction ID, token ID, and even a link to view it on Polygonscan 
                    (a website where anyone can verify your ownership).
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto bg-gradient-to-br from-primary/10 via-background to-accent/10 border-2 border-primary/20">
            <CardContent className="pt-12 pb-12 text-center">
              <h2 className="text-4xl md:text-5xl font-black mb-6">
                Ready to Certify Your Voice?
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join creators who are protecting their voice and building trust with verified content
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  onClick={() => navigate("/auth?mode=signup")}
                  className="text-lg px-8 py-6 h-auto"
                >
                  Get Started Free
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => navigate("/personas")}
                  className="text-lg px-8 py-6 h-auto"
                >
                  <FileAudio className="mr-2 h-5 w-5" />
                  Meet Our AI Personas
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default VoiceCertification;
