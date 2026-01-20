import { Link } from "react-router-dom";
import { Tv, Twitter, Instagram, Youtube, Mail } from "lucide-react";

export function TVFooter() {
  return (
    <footer className="bg-[#050510] border-t border-white/10">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
                <Tv className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">
                Seeksy TV
              </span>
            </div>
            <p className="text-gray-400 text-sm mb-4 max-w-xs">
              Your destination for creator content. Watch podcasts, livestreams, AI clips, and more from the best creators.
            </p>
            <div className="flex gap-4">
              <a href="https://twitter.com/seeksy" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-amber-400 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://instagram.com/seeksy" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-amber-400 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://youtube.com/@seeksy" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-amber-400 transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
              <a href="mailto:hello@seeksy.io" className="text-gray-400 hover:text-amber-400 transition-colors">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Explore */}
          <div>
            <h4 className="font-semibold text-white mb-4">Explore</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/tv" className="text-gray-400 hover:text-amber-400 transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/tv/browse" className="text-gray-400 hover:text-amber-400 transition-colors">Browse All</Link>
              </li>
              <li>
                <Link to="/tv/clips" className="text-gray-400 hover:text-amber-400 transition-colors">AI Clips</Link>
              </li>
              <li>
                <Link to="/tv/live" className="text-gray-400 hover:text-amber-400 transition-colors">Live Now</Link>
              </li>
              <li>
                <Link to="/tv/trending" className="text-gray-400 hover:text-amber-400 transition-colors">Trending</Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold text-white mb-4">Categories</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/tv?category=podcasts" className="text-gray-400 hover:text-amber-400 transition-colors">Podcasts</Link>
              </li>
              <li>
                <Link to="/tv?category=interviews" className="text-gray-400 hover:text-amber-400 transition-colors">Interviews</Link>
              </li>
              <li>
                <Link to="/tv?category=technology" className="text-gray-400 hover:text-amber-400 transition-colors">Technology</Link>
              </li>
              <li>
                <Link to="/tv?category=business" className="text-gray-400 hover:text-amber-400 transition-colors">Business</Link>
              </li>
              <li>
                <Link to="/tv?category=health" className="text-gray-400 hover:text-amber-400 transition-colors">Health</Link>
              </li>
            </ul>
          </div>

          {/* For Creators */}
          <div>
            <h4 className="font-semibold text-white mb-4">For Creators</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/auth" className="text-gray-400 hover:text-amber-400 transition-colors">Start Creating</Link>
              </li>
              <li>
                <Link to="/studio" className="text-gray-400 hover:text-amber-400 transition-colors">Seeksy Studio</Link>
              </li>
              <li>
                <Link to="/clips" className="text-gray-400 hover:text-amber-400 transition-colors">AI Clips Engine</Link>
              </li>
              <li>
                <Link to="/podcasts" className="text-gray-400 hover:text-amber-400 transition-colors">Podcast Hosting</Link>
              </li>
              <li>
                <Link to="/monetization" className="text-gray-400 hover:text-amber-400 transition-colors">Monetization</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Seeksy. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <Link to="/privacy" className="text-gray-400 hover:text-amber-400 transition-colors">Privacy</Link>
            <Link to="/terms" className="text-gray-400 hover:text-amber-400 transition-colors">Terms</Link>
            <Link to="/cookies" className="text-gray-400 hover:text-amber-400 transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
