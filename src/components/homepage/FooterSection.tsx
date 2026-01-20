import { Link } from "react-router-dom";
import { Sparkles, Twitter, Instagram, Youtube, Linkedin, ArrowRight, Check, Coins } from "lucide-react";
import { FooterSubscribe } from "@/components/footer/FooterSubscribe";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const footerLinks = {
  product: { title: "Product", links: [{ label: "Studio", href: "/studio" }, { label: "Analytics", href: "/analytics" }, { label: "Media Kit", href: "/media-kit" }, { label: "Booking", href: "/meetings" }, { label: "Pricing", href: "/pricing" }] },
  resources: { title: "Resources", links: [{ label: "Blog", href: "/blog" }, { label: "Help Center", href: "/help" }, { label: "Tutorials", href: "/tutorials" }, { label: "API Docs", href: "/docs" }] },
  company: { title: "Company", links: [{ label: "About", href: "/about" }, { label: "Careers", href: "/careers" }, { label: "Contact", href: "/contact" }] },
  legal: { title: "Legal", links: [{ label: "Privacy", href: "/privacy" }, { label: "Terms", href: "/terms" }, { label: "Security & Privacy", href: "/security" }] },
};

const socialLinks = [
  { icon: Twitter, href: "https://twitter.com/seeksy", label: "Twitter" },
  { icon: Instagram, href: "https://instagram.com/seeksy", label: "Instagram" },
  { icon: Youtube, href: "https://youtube.com/seeksy", label: "YouTube" },
  { icon: Linkedin, href: "https://linkedin.com/company/seeksy", label: "LinkedIn" },
];

const creditPoints = [
  "No subscriptions required",
  "No lockouts when credits run out",
  "Graceful limits per tool",
  "Transparent usage estimates",
];

export function FooterSection() {
  const navigate = useNavigate();

  return (
    <footer className="relative bg-[#070A0F] border-t border-white/5">
      <div className="container mx-auto px-4 py-16">
        {/* Combined Newsletter + Credits Section */}
        <div className="mb-12 pb-12 border-b border-white/10">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
            {/* Left: Newsletter */}
            <div className="text-left">
              <h3 className="text-xl font-bold text-white mb-2">Stay in the loop</h3>
              <p className="text-white/50 text-sm mb-6">Get the latest updates, tips, and exclusive content delivered to your inbox.</p>
              <FooterSubscribe />
            </div>

            {/* Right: Credits mini-teaser */}
            <div 
              className="rounded-2xl p-6"
              style={{ 
                background: "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(99, 102, 241, 0.08) 100%)",
                border: "1px solid rgba(99, 102, 241, 0.2)",
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(59, 130, 246, 0.2)" }}
                >
                  <Coins className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-white font-bold">Pay with credits</h4>
                  <p className="text-white/40 text-xs">Keep your work forever</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {creditPoints.map((point) => (
                  <div key={point} className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                    <span className="text-white/60 text-xs">{point}</span>
                  </div>
                ))}
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-blue-400 hover:text-blue-300 p-0 h-auto font-medium text-sm"
                onClick={() => navigate("/pricing")}
              >
                See Pricing
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Sparkles className="w-7 h-7 text-amber-400" />
              <span className="text-2xl font-black bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Seeksy</span>
            </Link>
            <p className="text-white/40 text-sm mb-6 max-w-xs">The all-in-one platform for modern creators.</p>
            <div className="flex gap-3">
              {socialLinks.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all">
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h4 className="text-white font-semibold text-sm mb-4">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}><Link to={link.href} className="text-white/40 hover:text-white text-sm transition-colors">{link.label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-sm">© {new Date().getFullYear()} Seeksy. All rights reserved.</p>
          <span className="text-white/30 text-sm">Made with ❤️ for creators</span>
        </div>
      </div>
    </footer>
  );
}
