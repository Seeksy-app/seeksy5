import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-6">Terms and Conditions</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="prose prose-slate max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Agreement to Terms</h2>
            <p className="text-foreground mb-4">
              By accessing or using Seeksy, you agree to be bound by these Terms and Conditions. If you disagree with any part of these terms, you may not access the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Use of Service</h2>
            <p className="text-foreground mb-4">Our service allows you to:</p>
            <ul className="list-disc pl-6 space-y-2 text-foreground">
              <li>Create and manage events, meetings, polls, and sign-up sheets</li>
              <li>Build a personalized creator landing page</li>
              <li>Manage contacts through our CRM system</li>
              <li>Connect with your community</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">User Accounts</h2>
            <p className="text-foreground mb-4">
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must immediately notify us of any unauthorized use of your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Content</h2>
            <p className="text-foreground mb-4">
              You retain all rights to the content you create and share on Seeksy. By using our service, you grant us a license to use, store, and display your content solely for the purpose of providing our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Prohibited Uses</h2>
            <p className="text-foreground mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2 text-foreground">
              <li>Use the service for any illegal purpose</li>
              <li>Violate any laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Transmit harmful or malicious code</li>
              <li>Spam or harass other users</li>
              <li>Attempt to gain unauthorized access to the service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Limitation of Liability</h2>
            <p className="text-foreground mb-4">
              Seeksy shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Changes to Terms</h2>
            <p className="text-foreground mb-4">
              We reserve the right to modify these terms at any time. We will notify users of any material changes by posting the new terms on this page.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="text-foreground">
              If you have any questions about these Terms, please contact us at{" "}
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

export default Terms;
