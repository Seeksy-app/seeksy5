import jsPDF from 'jspdf';

interface SecuritySection {
  title: string;
  content: string[];
}

export const exportSecurityOverviewPDF = () => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPos = 20;
  
  const currentDate = new Date().toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });

  // Helper to add new page if needed
  const checkPageBreak = (requiredSpace: number) => {
    if (yPos + requiredSpace > 270) {
      doc.addPage();
      yPos = 20;
    }
  };

  // Header
  doc.setFillColor(5, 56, 119); // Seeksy blue
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Seeksy Security & Data Protection Overview', margin, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Confidential | Last Updated: ${currentDate}`, margin, 35);
  
  yPos = 55;
  doc.setTextColor(0, 0, 0);

  // Executive Summary
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPos, contentWidth, 30, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Executive Summary', margin + 5, yPos + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const execSummary = 'Seeksy implements enterprise-grade security with Row Level Security (RLS), encrypted OAuth tokens, JWT authentication, and comprehensive audit logging. All sensitive data is protected at the database level with role-based access controls.';
  const summaryLines = doc.splitTextToSize(execSummary, contentWidth - 10);
  doc.text(summaryLines, margin + 5, yPos + 16);
  yPos += 40;

  const sections: SecuritySection[] = [
    {
      title: '1. Platform Architecture',
      content: [
        '• Frontend: React/TypeScript with modular architecture',
        '• Backend: Supabase (PostgreSQL + Edge Functions)',
        '• Auth: Supabase Auth with JWT-based sessions',
        '• Security: RLS on all sensitive tables, OAuth encryption at rest'
      ]
    },
    {
      title: '2. Authentication & Authorization',
      content: [
        '• Supabase Auth with email/password and OAuth providers',
        '• All authenticated requests include signed JWT',
        '• Role-based access: user, admin, super_admin, cfo, board_member',
        '• Specialized roles: judge, host, organizer for Events & Awards'
      ]
    },
    {
      title: '3. Row Level Security (RLS) Strategy',
      content: [
        '• Core principle: Users only see their own data',
        '• profiles: is_public controls discoverability',
        '• contacts: owner_user_id restriction enforced',
        '• OAuth tables: RLS restricts to owning user only',
        '• Events/Awards: Scoped by organizer, attendee, or judge role'
      ]
    },
    {
      title: '4. OAuth & Third-Party Integrations',
      content: [
        '• Supports: Google, Meta, Zoom, Microsoft integrations',
        '• Tokens encrypted at rest using symmetric key',
        '• TOKEN_ENCRYPTION_KEY never exposed to clients',
        '• Only server-side Edge Functions can decrypt tokens',
        '• OAuth callbacks validate state parameter for security'
      ]
    },
    {
      title: '5. Edge Functions & API Security',
      content: [
        '• Most functions require verify_jwt = true',
        '• JWT extraction + role validation on sensitive endpoints',
        '• Resource ownership validation enforced',
        '• Unauthenticated only for: OAuth callbacks, webhooks, public RSS'
      ]
    },
    {
      title: '6. XSS & Content Sanitization',
      content: [
        '• All dangerouslySetInnerHTML usages audited (13 instances)',
        '• DOMPurify used for HTML sanitization',
        '• Shared sanitizer utility for blogs, emails, templates'
      ]
    },
    {
      title: '7. Webhooks & Inbound Events',
      content: [
        '• Stripe: Signing secret validation',
        '• Zoom, Twilio, Shotstack, Resend: Provider signature verification',
        '• No business logic without sender validation'
      ]
    },
    {
      title: '8. Logging & Monitoring',
      content: [
        '• Auth failures logged',
        '• RLS failures tracked',
        '• OAuth errors captured',
        '• Sync failures and fallback paths recorded'
      ]
    },
    {
      title: '9. Backups & Disaster Recovery',
      content: [
        '• Supabase-managed database backups',
        '• Encryption-at-rest at storage layer',
        '• Snapshot rollback capability'
      ]
    }
  ];

  sections.forEach((section) => {
    checkPageBreak(40);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(5, 56, 119);
    doc.text(section.title, margin, yPos);
    yPos += 7;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    
    section.content.forEach((line) => {
      checkPageBreak(6);
      doc.text(line, margin + 5, yPos);
      yPos += 5;
    });
    yPos += 5;
  });

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 30, 285);
    doc.text('Confidential - Seeksy Inc.', margin, 285);
  }

  doc.save('seeksy-security-overview.pdf');
};

export const exportTechStackPDF = () => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPos = 20;
  
  const currentDate = new Date().toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });

  const checkPageBreak = (requiredSpace: number) => {
    if (yPos + requiredSpace > 270) {
      doc.addPage();
      yPos = 20;
    }
  };

  // Header
  doc.setFillColor(5, 56, 119);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Seeksy Technology Stack', margin, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Technical Architecture Overview | ${currentDate}`, margin, 35);
  
  yPos = 55;
  doc.setTextColor(0, 0, 0);

  // Executive Summary
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPos, contentWidth, 25, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Overview', margin + 5, yPos + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const overview = 'Seeksy is built on modern, scalable technologies designed for enterprise performance. Our stack prioritizes security, developer productivity, and seamless user experiences.';
  const overviewLines = doc.splitTextToSize(overview, contentWidth - 10);
  doc.text(overviewLines, margin + 5, yPos + 16);
  yPos += 35;

  const techCategories = [
    {
      title: 'Frontend Framework',
      technologies: [
        { name: 'React 18', desc: 'Modern UI library with hooks and concurrent features' },
        { name: 'TypeScript', desc: 'Type-safe JavaScript for robust code' },
        { name: 'Vite', desc: 'Next-generation frontend tooling with fast HMR' },
        { name: 'Tailwind CSS', desc: 'Utility-first CSS framework' }
      ]
    },
    {
      title: 'Backend & Database',
      technologies: [
        { name: 'Supabase', desc: 'PostgreSQL database with real-time capabilities' },
        { name: 'Edge Functions', desc: 'Serverless TypeScript functions (Deno runtime)' },
        { name: 'Row Level Security', desc: 'Database-level security policies' }
      ]
    },
    {
      title: 'Cloud Infrastructure',
      technologies: [
        { name: 'Cloudflare R2', desc: 'S3-compatible object storage for media' },
        { name: 'Cloudflare Stream', desc: 'Video hosting, transcoding, and delivery' },
        { name: 'Daily.co', desc: 'Real-time video/audio infrastructure' }
      ]
    },
    {
      title: 'AI & Audio Processing',
      technologies: [
        { name: 'ElevenLabs', desc: 'AI voice generation and transcription' },
        { name: 'OpenAI GPT', desc: 'Content generation and analysis' },
        { name: 'Lovable AI', desc: 'Integrated AI capabilities (Gemini, GPT)' }
      ]
    },
    {
      title: 'Authentication & Security',
      technologies: [
        { name: 'Supabase Auth', desc: 'Email, OAuth (Google, Meta), and MFA' },
        { name: 'JWT Tokens', desc: 'Secure session management' },
        { name: 'RLS Policies', desc: 'Row-level data access control' }
      ]
    },
    {
      title: 'Performance & Optimization',
      technologies: [
        { name: 'React Query', desc: 'Server state management and caching' },
        { name: 'Lazy Loading', desc: 'Code splitting for faster initial load' },
        { name: 'CDN Distribution', desc: 'Global content delivery via Cloudflare' }
      ]
    }
  ];

  techCategories.forEach((category) => {
    checkPageBreak(45);
    
    doc.setFillColor(5, 56, 119);
    doc.rect(margin, yPos, contentWidth, 8, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(category.title, margin + 5, yPos + 6);
    yPos += 12;
    
    doc.setTextColor(0, 0, 0);
    
    category.technologies.forEach((tech) => {
      checkPageBreak(12);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(tech.name, margin + 5, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text(tech.desc, margin + 5, yPos + 5);
      doc.setTextColor(0, 0, 0);
      yPos += 12;
    });
    yPos += 5;
  });

  // Integration Ecosystem
  checkPageBreak(50);
  doc.setFillColor(5, 56, 119);
  doc.rect(margin, yPos, contentWidth, 8, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Integration Ecosystem', margin + 5, yPos + 6);
  yPos += 15;
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);

  const integrations = [
    { category: 'Social Media', items: 'Meta (Facebook/Instagram), YouTube, Spotify, TikTok' },
    { category: 'Calendar & Meetings', items: 'Google Calendar, Microsoft Teams, Zoom, Daily.co' },
    { category: 'Payment & Commerce', items: 'Stripe Connect, Automated payouts, Invoice generation' },
    { category: 'Email & Communication', items: 'Gmail API, Resend, Twilio' }
  ];

  integrations.forEach((int) => {
    checkPageBreak(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`${int.category}:`, margin + 5, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(int.items, margin + 45, yPos);
    yPos += 7;
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 30, 285);
    doc.text('Confidential - Seeksy Inc.', margin, 285);
  }

  doc.save('seeksy-tech-stack.pdf');
};
