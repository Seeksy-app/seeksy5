import EmailHome from "@/pages/EmailHome";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function AdminEmailClient() {
  usePageTitle("Admin Inbox");
  
  // Reuse the full EmailHome component for admin email client
  // Pass isAdmin=true to ensure all navigation stays within admin routes
  return <EmailHome isAdmin />;
}
