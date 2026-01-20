import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Cookies = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-6">Cookie Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="prose prose-slate max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">What Are Cookies</h2>
            <p className="text-foreground mb-4">
              Cookies are small text files that are placed on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and understanding how you use our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">How We Use Cookies</h2>
            <p className="text-foreground mb-4">We use cookies for the following purposes:</p>
            <ul className="list-disc pl-6 space-y-2 text-foreground">
              <li><strong>Essential Cookies:</strong> Required for the platform to function properly, including authentication and security</li>
              <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how visitors use our platform</li>
              <li><strong>Performance Cookies:</strong> Improve the speed and performance of our service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Types of Cookies We Use</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold mb-2">Session Cookies</h3>
                <p className="text-foreground">Temporary cookies that expire when you close your browser. These are essential for authentication and navigation.</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Persistent Cookies</h3>
                <p className="text-foreground">Remain on your device for a set period or until you delete them. These remember your preferences across visits.</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Third-Party Cookies</h3>
                <p className="text-foreground">Set by third-party services we use, such as analytics providers, to help us improve our service.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Managing Cookies</h2>
            <p className="text-foreground mb-4">
              You can control and manage cookies in various ways. Please note that removing or blocking cookies may impact your user experience and some features may no longer function properly.
            </p>
            <p className="text-foreground mb-4">
              Most browsers automatically accept cookies, but you can modify your browser settings to decline cookies if you prefer. Instructions for managing cookies in popular browsers:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground">
              <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data</li>
              <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data</li>
              <li><strong>Safari:</strong> Preferences → Privacy → Manage Website Data</li>
              <li><strong>Edge:</strong> Settings → Privacy, search, and services → Cookies and site permissions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Updates to This Policy</h2>
            <p className="text-foreground mb-4">
              We may update this Cookie Policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="text-foreground">
              If you have any questions about our use of cookies, please contact us at{" "}
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

export default Cookies;
