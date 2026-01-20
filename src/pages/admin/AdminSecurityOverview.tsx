import { Shield, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { exportSecurityOverviewPDF } from "@/lib/utils/exportSecurityPDF";

export default function AdminSecurityOverview() {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    month: '2-digit', 
    day: '2-digit', 
    year: 'numeric' 
  }).replace(/\//g, '-');

  return (
    <div className="container mx-auto py-8 max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Seeksy Security & Data Protection Overview</h1>
            <p className="text-muted-foreground">
              Audience: Internal (Founders, Admins, Engineering, Security Reviewers)
            </p>
            <p className="text-sm text-muted-foreground">Last Updated: {currentDate}</p>
          </div>
        </div>
        <Button onClick={exportSecurityOverviewPDF} className="gap-2">
          <Download className="h-4 w-4" />
          Export PDF
        </Button>
      </div>

      {/* Section 1 */}
      <Card>
        <CardHeader>
          <CardTitle>1. Platform Architecture (High-Level)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Seeksy is built on:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Frontend: React/TypeScript, modular pages (Studio, Events, Awards, Creator Hub, CFO, etc.)</li>
            <li>Backend: Supabase (Postgres + Edge Functions)</li>
            <li>Auth: Supabase Auth with JWT-based sessions</li>
            <li>Security Layers:
              <ul className="list-disc list-inside ml-6 mt-1">
                <li>Row Level Security (RLS) on all sensitive tables</li>
                <li>Edge functions with verify_jwt = true for authenticated-only flows</li>
                <li>OAuth token encryption at rest for third-party integrations</li>
              </ul>
            </li>
          </ul>
          <p className="text-muted-foreground">
            This document summarizes how we protect creator, subscriber, and admin data across Seeksy modules.
          </p>
        </CardContent>
      </Card>

      {/* Section 2 */}
      <Card>
        <CardHeader>
          <CardTitle>2. Authentication & Authorization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Authentication:</h4>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Supabase Auth with email/password and OAuth providers</li>
              <li>All authenticated requests include a signed JWT</li>
            </ul>
          </div>
          <Separator />
          <div>
            <h4 className="font-semibold mb-2">Roles / Personas (used in RLS + UI):</h4>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>user</strong> – standard creator/attendee/account owner</li>
              <li><strong>admin / super_admin</strong> – platform operators</li>
              <li><strong>cfo, board_member</strong> – privileged access to investor/CFO views</li>
              <li><strong>judge, host, organizer</strong> – scoped to Events & Awards modules</li>
            </ul>
          </div>
          <Separator />
          <div>
            <h4 className="font-semibold mb-2">Admin Bypass Logic (for internal tools):</h4>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Admins skip onboarding for CFO, GTM, Pro Forma, and other investor views</li>
              <li>Admin-only routes are wrapped with access guards and checks inside Edge Functions where needed</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Section 3 */}
      <Card>
        <CardHeader>
          <CardTitle>3. Row Level Security (RLS) Strategy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <p className="font-semibold">Core principle:</p>
            <p className="text-muted-foreground italic">Users should only see their own data, except where admin access is explicitly required.</p>
          </div>
          
          <h4 className="font-semibold">Key tables & policies:</h4>
          
          <div className="space-y-3">
            <div className="border-l-4 border-primary pl-4">
              <h5 className="font-medium">profiles</h5>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                <li>is_public column controls discoverability</li>
                <li>Non-admin users can see their own profile (full details) and public profiles where is_public = true</li>
                <li>Admins may have broader access for support operations</li>
              </ul>
            </div>
            
            <div className="border-l-4 border-primary pl-4">
              <h5 className="font-medium">contacts</h5>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                <li>Users can only see contacts where they are the owner_user_id</li>
                <li>Admin access is allowed but audited, used for support and platform operations</li>
              </ul>
            </div>
            
            <div className="border-l-4 border-primary pl-4">
              <h5 className="font-medium">advertisers</h5>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                <li>Admins can view advertiser business data (required for revenue, deals, contracts)</li>
                <li>Non-admin users only see advertiser data associated with their campaigns</li>
              </ul>
            </div>
            
            <div className="border-l-4 border-primary pl-4">
              <h5 className="font-medium">social_media_profiles, email_accounts, calendar_connections, zoom_connections, microsoft_connections</h5>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                <li>RLS restricts rows to the owning user</li>
                <li>Admins do not see tokens themselves; access is via platform tooling only</li>
              </ul>
            </div>
            
            <div className="border-l-4 border-primary pl-4">
              <h5 className="font-medium">events, event_registrations, event_tickets, awards_* tables</h5>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                <li>Organizers/hosts see only their events/awards</li>
                <li>Attendees see only their registrations/tickets</li>
                <li>Judges see only programs they're assigned to</li>
              </ul>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mt-4">
            RLS is enforced at the database level and is considered a critical security boundary.
          </p>
        </CardContent>
      </Card>

      {/* Section 4 */}
      <Card>
        <CardHeader>
          <CardTitle>4. OAuth & Third-Party Integrations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Seeksy connects to several external services:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Google (Gmail, Calendar, YouTube)</li>
            <li>Meta (Instagram, Facebook Pages)</li>
            <li>Zoom</li>
            <li>Microsoft (Outlook / Office 365)</li>
            <li>Other APIs where applicable</li>
          </ul>
          
          <Separator />
          
          <div>
            <h4 className="font-semibold mb-2">Token Storage & Encryption:</h4>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Tokens are stored in Postgres with encryption at rest using a symmetric key:
                <ul className="list-disc list-inside ml-6 mt-1">
                  <li>email_accounts</li>
                  <li>calendar_connections</li>
                  <li>zoom_connections</li>
                  <li>microsoft_connections</li>
                  <li>social_media_profiles (Instagram, Facebook, YouTube)</li>
                </ul>
              </li>
              <li>Encryption is handled server-side via shared helpers in Supabase Edge Functions.</li>
              <li>A TOKEN_ENCRYPTION_KEY secret is configured in Supabase and never exposed to clients.</li>
              <li>A migration function exists to encrypt legacy plaintext tokens and can be re-run safely (idempotent).</li>
            </ul>
          </div>
          
          <Separator />
          
          <div>
            <h4 className="font-semibold mb-2">Access Controls:</h4>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Only server-side code (Edge Functions) can decrypt tokens.</li>
              <li>Clients never see raw access tokens; they trigger actions (sync, send, fetch) via secure functions.</li>
              <li>OAuth callbacks validate the state parameter to ensure the integration is tied to the correct Seeksy user.</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Section 5 */}
      <Card>
        <CardHeader>
          <CardTitle>5. Edge Functions & API Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">verify_jwt Policy:</h4>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Most authenticated flows have verify_jwt = true in supabase/config.toml.</li>
              <li>The function then:
                <ul className="list-disc list-inside ml-6 mt-1">
                  <li>Extracts the user from the JWT</li>
                  <li>Validates role (admin, CFO, judge, etc.) where necessary</li>
                  <li>Validates resource ownership (e.g., event owner, meeting owner)</li>
                </ul>
              </li>
            </ul>
          </div>
          
          <Separator />
          
          <div>
            <h4 className="font-semibold mb-2">Examples:</h4>
            <div className="space-y-3 ml-4">
              <div className="bg-muted p-3 rounded">
                <p className="font-medium">cfo-ai-assistant</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  <li>Requires valid JWT</li>
                  <li>Restricted to admin, super_admin, cfo, or board_member roles</li>
                  <li>Protects revenue projections, advertiser data, and pricing assumptions</li>
                </ul>
              </div>
              <div className="bg-muted p-3 rounded">
                <p className="font-medium">automation-engine, process-meeting-intelligence</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  <li>Requires JWT + owner checks</li>
                  <li>Cannot be called anonymously</li>
                </ul>
              </div>
              <div className="bg-muted p-3 rounded">
                <p className="font-medium">generate-master-blog-posts</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  <li>Requires JWT + admin/editor roles</li>
                </ul>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h4 className="font-semibold mb-2">Unauthenticated Functions (By Design):</h4>
            <p className="text-sm text-muted-foreground mb-2">Some Edge Functions remain unauthenticated because they are:</p>
            <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
              <li><strong>OAuth callbacks (*-callback):</strong> Gmail, Zoom, Google Calendar, Microsoft, Meta, YouTube</li>
              <li><strong>Public RSS feed (podcast-rss):</strong> exposes only syndicated podcast episodes</li>
              <li><strong>Payment & email webhooks:</strong>
                <ul className="list-disc list-inside ml-6">
                  <li>Stripe (credits) – uses Stripe signature validation</li>
                  <li>Shotstack, Resend, Twilio – verify provider signatures / secret headers</li>
                </ul>
              </li>
              <li><strong>Public form submission (submit-public-ticket):</strong> intentionally public but validated & rate-limited</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2">
              All such functions are documented and reviewed to ensure they don't expose sensitive internal data.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Section 6 */}
      <Card>
        <CardHeader>
          <CardTitle>6. XSS & Content Sanitization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>To prevent cross-site scripting (XSS):</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>All dangerouslySetInnerHTML usages have been audited (13 instances).</li>
            <li>A shared sanitizer utility (sanitizeHtml / sanitizeEmailHtml) wraps:
              <ul className="list-disc list-inside ml-6 mt-1">
                <li>Public blog posts</li>
                <li>Email views</li>
                <li>Template previews</li>
                <li>Markdown rendering</li>
              </ul>
            </li>
            <li>DOMPurify is used to sanitize HTML before rendering.</li>
            <li>Styling-only dangerouslySetInnerHTML usage (pure CSS) was reviewed and deemed safe.</li>
          </ul>
        </CardContent>
      </Card>

      {/* Section 7 */}
      <Card>
        <CardHeader>
          <CardTitle>7. Webhooks & Inbound Events</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Stripe Webhook</strong>
              <ul className="list-disc list-inside ml-6 text-muted-foreground">
                <li>Uses Stripe's signing secret validation</li>
                <li>Handles credit purchases & billing updates</li>
              </ul>
            </li>
            <li><strong>Zoom, Twilio, Shotstack, Resend, etc.</strong>
              <ul className="list-disc list-inside ml-6 text-muted-foreground">
                <li>Validate provider-specific signatures/secrets</li>
                <li>Ignore unauthenticated calls without proper signature headers</li>
                <li>Log failures for audit and debugging</li>
              </ul>
            </li>
          </ul>
          <p className="text-muted-foreground mt-4">
            No business logic is executed from inbound webhooks without validating the sender.
          </p>
        </CardContent>
      </Card>

      {/* Section 8 */}
      <Card>
        <CardHeader>
          <CardTitle>8. Logging, Monitoring & Auditing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Edge Functions log:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Auth failures</li>
            <li>RLS failures where applicable</li>
            <li>OAuth errors (expired tokens, missing scopes)</li>
            <li>Sync failures and fallback paths</li>
          </ul>
          <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
            <li>Screen capture and AI processing functions log timing diagnostics (start/stop, encoding, upload).</li>
            <li>Security-relevant logs are retained for investigation of issues and abuse.</li>
          </ul>
        </CardContent>
      </Card>

      {/* Section 9 */}
      <Card>
        <CardHeader>
          <CardTitle>9. Backups & Disaster Recovery (High-Level)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Database is backed up regularly via Supabase-managed backups.</li>
            <li>Encryption-at-rest is supported at the storage layer.</li>
            <li>In the event of data corruption or incident, we can roll back to a recent snapshot.</li>
            <li>Future iterations may add:
              <ul className="list-disc list-inside ml-6 mt-1">
                <li>Formal RPO/RTO targets</li>
                <li>Playbooks for high-severity incidents</li>
              </ul>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Section 10 */}
      <Card>
        <CardHeader>
          <CardTitle>10. Open Issues & Future Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Expand token encryption to any new OAuth integrations by default.</li>
            <li>Periodic security scans to catch new dangerouslySetInnerHTML usage.</li>
            <li>Add audit trails for admin access to sensitive data (e.g., advertisers, financials).</li>
            <li>Optional: IP-based rate limiting on public forms and voting endpoints.</li>
          </ul>
          <p className="text-muted-foreground mt-4">
            For questions or security reviews, contact: security@seeksy.io (placeholder).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
