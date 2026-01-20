import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Rocket, 
  Mic, 
  Shield, 
  DollarSign, 
  Calendar, 
  Sparkles, 
  CreditCard, 
  Plug,
  ArrowRight,
  BookOpen,
  HelpCircle,
  ExternalLink,
  MessageCircle
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Rocket,
  Mic,
  Shield,
  DollarSign,
  Calendar,
  Sparkles,
  CreditCard,
  Plug,
  HelpCircle,
  BookOpen,
};

// Standalone public header for the help center (shows different actions based on auth)
function HelpCenterHeader() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/kb" className="flex items-center gap-2">
            <img src="/seeksy-logo.png" alt="Seeksy" className="h-8 w-auto" />
            <span className="text-lg font-semibold text-gray-700">Help Center</span>
          </Link>
          
          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/kb" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
              Knowledge Base
            </Link>
            <Link to="/support" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
              Support
            </Link>
          </nav>
          
          {/* Actions - Different based on auth status */}
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Button size="sm" className="bg-primary hover:bg-primary/90 rounded-full px-6" asChild>
                <Link to="/">
                  Go to my account
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/auth">
                    Sign In
                  </Link>
                </Button>
                <Button size="sm" className="bg-primary hover:bg-primary/90" asChild>
                  <Link to="/">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Go to App
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default function KnowledgeBase() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: categories = [] } = useQuery({
    queryKey: ["kb-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kb_categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: featuredArticles = [] } = useQuery({
    queryKey: ["kb-featured-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kb_articles")
        .select("*, kb_categories(name, slug)")
        .eq("is_published", true)
        .eq("is_featured", true)
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const { data: searchResults = [] } = useQuery({
    queryKey: ["kb-search", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const { data, error } = await supabase
        .from("kb_articles")
        .select("*, kb_categories(name, slug)")
        .eq("is_published", true)
        .or(`title.ilike.%${searchQuery}%,excerpt.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: searchQuery.length > 2,
  });

  const quickSearches = ["Studio", "Monetization", "Voice Certification", "AI Clips"];

  return (
    <div className="min-h-screen bg-white">
      {/* Standalone Help Center Header */}
      <HelpCenterHeader />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <BookOpen className="h-10 w-10 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              How can we <span className="text-primary">help you?</span>
            </h1>
          </div>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Search our knowledge base to find answers to your questions
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search our knowledge base..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 text-lg bg-white text-gray-900 border border-gray-200 shadow-lg rounded-xl focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Quick Search Tags */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {quickSearches.map((term) => (
              <Badge
                key={term}
                variant="outline"
                className="cursor-pointer border-primary/30 text-primary hover:bg-primary/10 px-4 py-1.5 rounded-full"
                onClick={() => setSearchQuery(term)}
              >
                {term}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Search Results */}
      {searchQuery.length > 2 && searchResults.length > 0 && (
        <div className="container mx-auto px-4 py-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Search Results</h2>
          <div className="grid gap-4">
            {searchResults.map((article: any) => (
              <Card 
                key={article.id} 
                className="cursor-pointer hover:border-primary transition-all hover:shadow-md bg-white"
                onClick={() => navigate(`/kb/${article.kb_categories?.slug}/${article.slug}`)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <Badge variant="secondary" className="mb-2">{article.kb_categories?.name}</Badge>
                    <h3 className="font-semibold text-gray-900">{article.title}</h3>
                    <p className="text-sm text-gray-600">{article.excerpt}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Explore by Topic Section */}
      <div className="bg-primary py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-white mb-8">Explore by topic</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category: any) => {
              const IconComponent = iconMap[category.icon] || HelpCircle;
              return (
                <Card 
                  key={category.id}
                  className="bg-white cursor-pointer hover:shadow-xl transition-all group border-0"
                  onClick={() => navigate(`/kb/${category.slug}`)}
                >
                  <CardContent className="p-6">
                    <div className="mb-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-gray-900 group-hover:text-primary transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      {category.description}
                    </p>
                    <span className="text-sm font-medium text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                      Learn more <ArrowRight className="h-4 w-4" />
                    </span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Popular Articles Section */}
      {featuredArticles.length > 0 && (
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold mb-8 text-gray-900">Popular articles</h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
            {featuredArticles.map((article: any) => {
              const category = categories.find((c: any) => c.id === article.category_id);
              const IconComponent = category ? iconMap[category.icon] || HelpCircle : HelpCircle;
              return (
                <Card 
                  key={article.id}
                  className="bg-gray-900 text-white cursor-pointer hover:bg-gray-800 transition-all group border-0"
                  onClick={() => navigate(`/kb/${article.kb_categories?.slug}/${article.slug}`)}
                >
                  <CardContent className="p-6 text-center">
                    <div className="flex justify-center mb-4">
                      <IconComponent className="h-8 w-8 text-white/80 group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="font-medium text-sm leading-tight">
                      {article.title}
                    </h3>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Contact Support CTA */}
      <div className="bg-gray-50 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <MessageCircle className="h-6 w-6 text-primary" />
            <h3 className="text-xl font-semibold text-gray-900">Can't find what you're looking for?</h3>
          </div>
          <p className="text-gray-600 mb-4">Our support team is here to help</p>
          <Button 
            onClick={() => navigate("/support")}
            size="lg"
            className="bg-primary hover:bg-primary/90"
          >
            Contact Support
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <img src="/seeksy-logo.png" alt="Seeksy" className="h-6 w-auto brightness-200" />
          </Link>
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} Seeksy. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
