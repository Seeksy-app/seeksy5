import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="prose prose-slate max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
            <p className="text-foreground mb-4">
              Welcome to Seeksy ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
            <p className="text-foreground mb-4">We collect information that you provide directly to us, including:</p>
            <ul className="list-disc pl-6 space-y-2 text-foreground">
              <li>Account information (name, email address, username, password)</li>
              <li>Profile information (bio, avatar, social media links)</li>
              <li>Event, meeting, and poll data you create</li>
              <li>Contact information you add to your CRM</li>
              <li>Communication preferences and settings</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
            <p className="text-foreground mb-4">We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2 text-foreground">
              <li>Provide, maintain, and improve our services</li>
              <li>Process your transactions and send related information</li>
              <li>Send you technical notices, updates, and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Analyze usage patterns and optimize user experience</li>
              <li>Detect, prevent, and address technical issues and fraud</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
            <p className="text-foreground mb-4">
              We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
            <p className="text-foreground mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2 text-foreground">
              <li>Access and receive a copy of your personal data</li>
              <li>Rectify inaccurate or incomplete information</li>
              <li>Request deletion of your personal data</li>
              <li>Object to or restrict processing of your data</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="text-foreground">
              If you have any questions about this Privacy Policy, please contact us at{" "}
              <a href="mailto:hello@seeksy.io" className="text-primary hover:underline">
                hello@seeksy.io
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
