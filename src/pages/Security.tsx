import { Shield, Lock, Server, Eye, RefreshCw, FileCheck, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Security = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-brand-blue/5 to-background">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Shield className="h-16 w-16 text-brand-gold" />
          </div>
          <h1 className="text-5xl font-black mb-6 bg-gradient-to-r from-brand-navy to-brand-blue bg-clip-text text-transparent">
            Your Security is Our Priority
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We implement industry-leading security practices to protect your data and ensure your content stays safe.
          </p>
        </div>

        {/* Security Practices Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <Card className="border-2 border-brand-blue/20 hover:border-brand-gold/50 transition-all duration-300 hover:shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-brand-gold/10 rounded-lg">
                  <Lock className="h-6 w-6 text-brand-gold" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">End-to-End Encryption</h3>
                  <p className="text-sm text-muted-foreground">
                    All data transmission is encrypted using industry-standard SSL/TLS protocols. Your content is secured both in transit and at rest.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-brand-blue/20 hover:border-brand-gold/50 transition-all duration-300 hover:shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-brand-gold/10 rounded-lg">
                  <Server className="h-6 w-6 text-brand-gold" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Secure Infrastructure</h3>
                  <p className="text-sm text-muted-foreground">
                    Hosted on enterprise-grade cloud infrastructure with automatic scaling, redundancy, and 99.9% uptime guarantee.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-brand-blue/20 hover:border-brand-gold/50 transition-all duration-300 hover:shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-brand-gold/10 rounded-lg">
                  <Eye className="h-6 w-6 text-brand-gold" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Privacy Protection</h3>
                  <p className="text-sm text-muted-foreground">
                    We never sell your data. Your content and personal information remain private and under your control at all times.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-brand-blue/20 hover:border-brand-gold/50 transition-all duration-300 hover:shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-brand-gold/10 rounded-lg">
                  <RefreshCw className="h-6 w-6 text-brand-gold" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Regular Security Updates</h3>
                  <p className="text-sm text-muted-foreground">
                    Our systems are continuously monitored and updated to protect against emerging security threats and vulnerabilities.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-brand-blue/20 hover:border-brand-gold/50 transition-all duration-300 hover:shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-brand-gold/10 rounded-lg">
                  <FileCheck className="h-6 w-6 text-brand-gold" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Data Backup & Recovery</h3>
                  <p className="text-sm text-muted-foreground">
                    Automated daily backups ensure your content is protected. Quick recovery processes minimize downtime in case of incidents.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-brand-blue/20 hover:border-brand-gold/50 transition-all duration-300 hover:shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-brand-gold/10 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-brand-gold" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Secure Authentication</h3>
                  <p className="text-sm text-muted-foreground">
                    Multi-factor authentication available. Passwords are hashed and never stored in plain text. Session management is secure and encrypted.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Compliance & Standards */}
        <Card className="border-2 border-brand-gold/30 mb-16">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-6 text-center">Our Commitment to Security</h2>
            <div className="space-y-4 max-w-3xl mx-auto">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-brand-gold mt-0.5 flex-shrink-0" />
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">HTTPS Everywhere:</span> All connections to Seeksy are encrypted and secure
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-brand-gold mt-0.5 flex-shrink-0" />
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">Privacy by Design:</span> We collect only the data necessary to provide our services
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-brand-gold mt-0.5 flex-shrink-0" />
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">Transparent Policies:</span> Clear privacy policy and terms of service that respect your rights
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-brand-gold mt-0.5 flex-shrink-0" />
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">Data Ownership:</span> You own your content. Delete your data at any time
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-brand-gold mt-0.5 flex-shrink-0" />
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">Continuous Monitoring:</span> 24/7 security monitoring to detect and respond to threats
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legal & Support */}
        <div className="text-center space-y-6">
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate("/privacy")}
              className="border-2 border-brand-blue hover:border-brand-gold"
            >
              View Privacy Policy
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate("/terms")}
              className="border-2 border-brand-blue hover:border-brand-gold"
            >
              View Terms of Service
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate("/cookies")}
              className="border-2 border-brand-blue hover:border-brand-gold"
            >
              Cookie Policy
            </Button>
          </div>

          <div className="pt-8">
            <p className="text-muted-foreground mb-4">
              Have security concerns or questions?
            </p>
            <Button 
              onClick={() => navigate("/support-chat")}
              className="bg-brand-gold hover:bg-brand-gold/90 text-brand-navy font-bold"
            >
              Contact Security Team
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Security;
