// Email template utilities for Seeksy
// All templates use inline CSS for maximum email client compatibility

interface BaseEmailProps {
  heading: string;
  content: string;
  ctaText?: string;
  ctaUrl?: string;
  enableMascot?: boolean;
}

const baseStyles = `
  body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f6f9fc; }
  .container { max-width: 560px; margin: 0 auto; background-color: #ffffff; }
  .header { padding: 32px 40px; text-align: center; }
  .logo { height: 40px; }
  .mascot { text-align: center; padding: 0 40px 20px; }
  .mascot img { width: 80px; height: 80px; }
  .content-card { background-color: #ffffff; border-radius: 12px; padding: 32px 40px; margin: 0 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
  h1 { color: #1a1a1a; font-size: 24px; font-weight: 600; line-height: 32px; margin: 0 0 20px; }
  p { color: #374151; font-size: 16px; line-height: 24px; margin: 16px 0; }
  .cta-button { display: inline-block; background-color: #3b82f6; color: #ffffff !important; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; margin: 24px 0; }
  .footer { padding: 32px 40px 0; }
  .divider { border: none; border-top: 1px solid #e5e7eb; margin: 20px 0; }
  .footer-text { color: #6b7280; font-size: 12px; line-height: 16px; margin: 8px 0; text-align: center; }
  .footer-link { color: #3b82f6; text-decoration: underline; }
  .code-box { background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center; }
  .code-text { font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1a1a1a; margin: 0; }
`;

function baseEmail({ heading, content, ctaText, ctaUrl, enableMascot }: BaseEmailProps): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="{{LOGO_URL}}" alt="Seeksy" class="logo">
    </div>
    ${enableMascot ? '<div class="mascot"><img src="{{MASCOT_URL}}" alt="Seeksy Spark"></div>' : ''}
    <div class="content-card">
      <h1>${heading}</h1>
      ${content}
      ${ctaText && ctaUrl ? `<a href="${ctaUrl}" class="cta-button">${ctaText}</a>` : ''}
    </div>
    <div class="footer">
      <hr class="divider">
      <p class="footer-text">{{PERSONA_SIGNATURE}}</p>
      <p class="footer-text">© ${new Date().getFullYear()} Seeksy. All rights reserved.</p>
      <p class="footer-text">
        <a href="{{BASE_URL}}/email-preferences" class="footer-link">Update Preferences</a> · 
        <a href="{{UNSUBSCRIBE_URL}}" class="footer-link">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

export const templates = {
  welcome: (variables: { name: string }) => baseEmail({
    heading: `Welcome to Seeksy, ${variables.name}!`,
    content: `
      <p>We're thrilled to have you join the Seeksy community. You now have access to powerful tools for creating, managing, and monetizing your content.</p>
      <p><strong>Here's what you can do:</strong></p>
      <p>
        • Create and manage podcasts with AI-powered editing<br>
        • Build your creator profile and monetize your content<br>
        • Connect with your audience through meetings and live streams<br>
        • Verify your identity with blockchain-backed certificates
      </p>
      <p>If you have any questions, our team is here to help. Just reply to this email.</p>
    `,
    ctaText: 'Get Started',
    ctaUrl: '{{BASE_URL}}/dashboard',
    enableMascot: true,
  }),

  'verify-email': (variables: { code: string }) => baseEmail({
    heading: 'Verify Your Email',
    content: `
      <p>Please confirm your email address by entering this verification code:</p>
      <div class="code-box">
        <p class="code-text">${variables.code}</p>
      </div>
      <p style="color: #6b7280; font-size: 14px;">This code will expire in 24 hours. If you didn't request this email, you can safely ignore it.</p>
    `,
    ctaText: 'Confirm Email',
    ctaUrl: '{{BASE_URL}}/verify-email?code={{CODE}}',
  }),

  'password-reset': (variables: { resetLink: string }) => baseEmail({
    heading: 'Reset Your Password',
    content: `
      <p>We received a request to reset your Seeksy account password. Click the button below to create a new password:</p>
      <p style="color: #6b7280; font-size: 14px;">This link will expire in 1 hour for security reasons.</p>
      <p style="color: #6b7280; font-size: 14px;">If you didn't request a password reset, you can safely ignore this email. Your password won't be changed.</p>
    `,
    ctaText: 'Reset Your Password',
    ctaUrl: '{{RESET_LINK}}',
  }),

  'meeting-invitation': (variables: { hostName: string; meetingTitle: string; date: string; time: string; meetingLink: string }) => baseEmail({
    heading: 'Meeting Invitation',
    content: `
      <p><strong>${variables.hostName}</strong> has invited you to join:</p>
      <p style="font-size: 20px; font-weight: 600; color: #1a1a1a; margin: 16px 0;">${variables.meetingTitle}</p>
      <p><strong>When:</strong> ${variables.date} at ${variables.time}</p>
      <p style="color: #6b7280; font-size: 14px;">You can join the meeting 5 minutes before the scheduled start time.</p>
    `,
    ctaText: 'Join Meeting',
    ctaUrl: '{{MEETING_LINK}}',
  }),

  'event-registration': (variables: { eventName: string; date: string; time: string; location: string; addToCalendarLink: string }) => baseEmail({
    heading: 'Event Registration Confirmed',
    content: `
      <p>You're all set! Your registration for <strong>${variables.eventName}</strong> is confirmed.</p>
      <p>
        <strong>Date:</strong> ${variables.date}<br>
        <strong>Time:</strong> ${variables.time}<br>
        <strong>Location:</strong> ${variables.location}
      </p>
      <p>We'll send you a reminder before the event. See you there!</p>
    `,
    ctaText: 'Add to Calendar',
    ctaUrl: '{{ADD_TO_CALENDAR_LINK}}',
    enableMascot: true,
  }),

  'podcast-published': (variables: { episodeTitle: string; showName: string; episodeLink: string }) => baseEmail({
    heading: 'New Podcast Episode',
    content: `
      <p>A new episode of <strong>${variables.showName}</strong> is now available:</p>
      <p style="font-size: 20px; font-weight: 600; color: #1a1a1a; margin: 16px 0;">${variables.episodeTitle}</p>
      <p>Don't miss out on this latest episode!</p>
    `,
    ctaText: 'Listen Now',
    ctaUrl: '{{EPISODE_LINK}}',
    enableMascot: true,
  }),

  'ai-production-ready': (variables: { sessionTitle: string; downloadLink: string; clipsLink: string }) => baseEmail({
    heading: 'Your Content is Ready',
    content: `
      <p>Great news! The AI post-production for <strong>${variables.sessionTitle}</strong> is complete.</p>
      <p>Your edited content is ready to download, and we've generated social media clips for you.</p>
      <p style="color: #6b7280; font-size: 14px;">Your assets will be available for 30 days.</p>
    `,
    ctaText: 'Download Assets',
    ctaUrl: '{{DOWNLOAD_LINK}}',
    enableMascot: true,
  }),

  'new-subscriber': (variables: { subscriberEmail: string; preferencesLink: string }) => baseEmail({
    heading: 'New Subscriber!',
    content: `
      <p>You have a new subscriber! <strong>${variables.subscriberEmail}</strong> just subscribed to your content.</p>
      <p>Your audience is growing — keep creating amazing content!</p>
      <p>Manage all your subscribers and their preferences in your dashboard.</p>
    `,
    ctaText: 'View Subscriber',
    ctaUrl: '{{PREFERENCES_LINK}}',
    enableMascot: true,
  }),

  'campaign-email': (variables: { subject: string; body: string; ctaText?: string; ctaLink?: string }) => baseEmail({
    heading: variables.subject,
    content: variables.body,
    ctaText: variables.ctaText,
    ctaUrl: variables.ctaLink,
  }),

  'identity-verified': (variables: { type: 'Face' | 'Voice'; certificateUrl: string }) => baseEmail({
    heading: `${variables.type} Identity Verified`,
    content: `
      <p>Congratulations! Your <strong>${variables.type.toLowerCase()}</strong> identity has been successfully verified and secured on the blockchain.</p>
      <p>Your identity is now protected by cryptographic certification, ensuring authenticity and security across all platforms.</p>
      <p>This certificate is permanent and can be used to verify your identity anywhere.</p>
    `,
    ctaText: 'View Certificate',
    ctaUrl: '{{CERTIFICATE_URL}}',
    enableMascot: true,
  }),
};
