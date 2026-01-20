import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Upload } from "lucide-react";
import { SparkIcon } from "@/components/spark/SparkIcon";
import seeksyLogo from "@/assets/Seeksy_Logo_5.png";

export default function LogoManager() {
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-primary" />
          Logos & Mascots
        </h1>
        <p className="text-muted-foreground">
          Manage logos and Spark mascot variants (holiday, default, seasonal)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Platform Logos</CardTitle>
          <CardDescription>Upload and manage logos for different contexts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="h-32 bg-white rounded-lg flex items-center justify-center mb-4 p-4">
                  <img 
                    src={seeksyLogo} 
                    alt="Seeksy Main Logo" 
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <p className="font-medium mb-2">Main Logo</p>
                <Button size="sm" variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="h-32 bg-slate-900 rounded-lg flex items-center justify-center mb-4 p-4">
                  <img 
                    src={seeksyLogo} 
                    alt="Seeksy Dark Mode Logo" 
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <p className="font-medium mb-2">Dark Mode Logo</p>
                <Button size="sm" variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="h-32 bg-gradient-to-br from-background to-muted rounded-lg flex items-center justify-center mb-4 p-4">
                  <SparkIcon variant="holiday" size="xl" pose="waving" />
                </div>
                <p className="font-medium mb-2">Favicon</p>
                <Button size="sm" variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Spark Mascot Variants</CardTitle>
          <CardDescription>View and manage Spark mascot seasonal variants</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="h-24 flex items-center justify-center mb-3">
                  <SparkIcon variant="default" size="lg" pose="idle" />
                </div>
                <p className="font-medium text-sm">Default Spark</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="h-24 flex items-center justify-center mb-3">
                  <SparkIcon variant="holiday" size="lg" pose="waving" />
                </div>
                <p className="font-medium text-sm">Holiday Spark</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="h-24 flex items-center justify-center mb-3">
                  <SparkIcon variant="default" size="lg" pose="happy" />
                </div>
                <p className="font-medium text-sm">Happy Spark</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="h-24 flex items-center justify-center mb-3">
                  <SparkIcon variant="default" size="lg" pose="typing" />
                </div>
                <p className="font-medium text-sm">Typing Spark</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
