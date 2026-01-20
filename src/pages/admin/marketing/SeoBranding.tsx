import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Globe, TrendingUp, FileText } from "lucide-react";

export default function SeoBranding() {
  return (
    <div className="px-10 py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Search className="h-8 w-8 text-primary" />
          SEO & Branding
        </h1>
        <p className="text-muted-foreground mt-1">
          Search engine optimization and brand management tools
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-500" />
              Domain Authority
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">42</p>
            <p className="text-sm text-emerald-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +3 this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-500" />
              Indexed Pages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">847</p>
            <p className="text-sm text-muted-foreground">Pages in search</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-amber-500" />
              Organic Keywords
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">1,234</p>
            <p className="text-sm text-muted-foreground">Ranking keywords</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            SEO audits, keyword tracking, meta tag management, and brand asset library
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <Search className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">
            SEO and branding tools are being developed.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
