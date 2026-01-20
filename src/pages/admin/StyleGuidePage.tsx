import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Check, Copy, Download, Palette, Type, Component, Layout, BookOpen, History } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const styleGuide = {
  brand: {
    name: "Seeksy",
    personality: ["Modern", "Calm", "Capable", "Modular", "Trustworthy"],
  },
  colors: {
    primary: { name: "Seeksy Blue", hex: "#2C6BED", usage: ["Primary CTA", "Links", "Active states", "Key highlights"] },
    ink: { name: "Ink", hex: "#0F172A", usage: ["Headlines", "Nav text", "High-contrast sections"] },
    slate: { name: "Slate", hex: "#64748B", usage: ["Body text", "Secondary labels", "Helper copy"] },
    canvas: { name: "Canvas", hex: "#FFFFFF", usage: ["Default background"] },
    subtle: { name: "Subtle", hex: "#F8FAFC", usage: ["Section backgrounds", "Cards"] },
    border: { name: "Border", hex: "#E2E8F0", usage: ["Dividers", "Input borders"] },
    createSoftBlue: { name: "Create Soft Blue", hex: "#E8F0FF", usage: ["Create section backgrounds"] },
    connectSoftMint: { name: "Connect Soft Mint", hex: "#EAF6F1", usage: ["Connect section backgrounds"] },
    monetizeSoftSand: { name: "Monetize Soft Sand", hex: "#FFF3E1", usage: ["Monetize section backgrounds"] },
    success: { name: "Success", hex: "#16A34A", usage: ["Success states"] },
    warning: { name: "Warning", hex: "#F59E0B", usage: ["Warnings", "CTA gradient"] },
    danger: { name: "Danger", hex: "#DC2626", usage: ["Errors", "Destructive actions"] },
  },
  typography: {
    fontFamily: "Inter",
    fallbacks: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
    scale: [
      { name: "H1", size: "56px", weight: 700, lineHeight: 1.1 },
      { name: "H2", size: "40px", weight: 700, lineHeight: 1.1 },
      { name: "H3", size: "28px", weight: 600, lineHeight: 1.2 },
      { name: "H4", size: "20px", weight: 600, lineHeight: 1.4 },
      { name: "Body", size: "16px", weight: 400, lineHeight: 1.6 },
      { name: "Small", size: "14px", weight: 400, lineHeight: 1.5 },
      { name: "Micro", size: "12px", weight: 400, lineHeight: 1.4 },
    ],
  },
  radii: [
    { name: "sm", value: "10px" },
    { name: "md", value: "16px" },
    { name: "lg", value: "24px" },
    { name: "xl", value: "32px" },
  ],
  spacing: [
    { name: "xs", value: "8px" },
    { name: "sm", value: "12px" },
    { name: "md", value: "16px" },
    { name: "lg", value: "24px" },
    { name: "xl", value: "32px" },
    { name: "2xl", value: "48px" },
    { name: "section", value: "96px" },
  ],
  shadows: {
    card: "0 18px 40px rgba(15, 23, 42, 0.10)",
    floating: "0 30px 70px rgba(15, 23, 42, 0.18)",
  },
};

function ColorSwatch({ name, hex, usage }: { name: string; hex: string; usage: string[] }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(hex);
    setCopied(true);
    toast({ title: "Copied!", description: `${hex} copied to clipboard` });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-border rounded-seeksy-md p-4 bg-card">
      <div
        className="w-full h-20 rounded-seeksy-sm mb-3 shadow-sm"
        style={{ backgroundColor: hex }}
      />
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-foreground">{name}</span>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {hex}
        </button>
      </div>
      <div className="flex flex-wrap gap-1">
        {usage.map((u) => (
          <Badge key={u} variant="secondary" className="text-xs">
            {u}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export default function StyleGuidePage() {
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(styleGuide, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "seeksy-style-guide.json";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: "Style guide JSON downloaded" });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h2 font-bold text-foreground">Style Guide</h1>
          <p className="text-muted-foreground mt-1">
            Seeksy brand tokens, typography, and component library
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportJSON}>
            <Download className="w-4 h-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </div>

      <Tabs defaultValue="tokens" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="tokens" className="gap-2">
            <Palette className="w-4 h-4" />
            Brand Tokens
          </TabsTrigger>
          <TabsTrigger value="typography" className="gap-2">
            <Type className="w-4 h-4" />
            Typography
          </TabsTrigger>
          <TabsTrigger value="components" className="gap-2">
            <Component className="w-4 h-4" />
            Components
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <Layout className="w-4 h-4" />
            Page Templates
          </TabsTrigger>
          <TabsTrigger value="rules" className="gap-2">
            <BookOpen className="w-4 h-4" />
            Usage Rules
          </TabsTrigger>
        </TabsList>

        {/* Brand Tokens Tab */}
        <TabsContent value="tokens" className="space-y-8">
          {/* Colors */}
          <Card>
            <CardHeader>
              <CardTitle>Colors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {Object.entries(styleGuide.colors).map(([key, color]) => (
                  <ColorSwatch key={key} name={color.name} hex={color.hex} usage={color.usage} />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Spacing */}
          <Card>
            <CardHeader>
              <CardTitle>Spacing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {styleGuide.spacing.map((s) => (
                  <div key={s.name} className="flex items-center gap-3 border border-border rounded-seeksy-sm p-3 bg-card">
                    <div
                      className="bg-primary rounded"
                      style={{ width: s.value, height: s.value, minWidth: "8px", minHeight: "8px", maxWidth: "48px", maxHeight: "48px" }}
                    />
                    <div>
                      <div className="font-medium text-sm">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Border Radii */}
          <Card>
            <CardHeader>
              <CardTitle>Border Radii</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {styleGuide.radii.map((r) => (
                  <div key={r.name} className="flex items-center gap-3 border border-border rounded-seeksy-sm p-3 bg-card">
                    <div
                      className="w-12 h-12 bg-primary"
                      style={{ borderRadius: r.value }}
                    />
                    <div>
                      <div className="font-medium text-sm">{r.name}</div>
                      <div className="text-xs text-muted-foreground">{r.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Shadows */}
          <Card>
            <CardHeader>
              <CardTitle>Shadows</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-6">
                <div className="bg-card border border-border p-6 rounded-seeksy-lg" style={{ boxShadow: styleGuide.shadows.card }}>
                  <div className="font-medium">Card Shadow</div>
                  <div className="text-xs text-muted-foreground mt-1 font-mono">{styleGuide.shadows.card}</div>
                </div>
                <div className="bg-card border border-border p-6 rounded-seeksy-lg" style={{ boxShadow: styleGuide.shadows.floating }}>
                  <div className="font-medium">Floating Shadow</div>
                  <div className="text-xs text-muted-foreground mt-1 font-mono">{styleGuide.shadows.floating}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Typography Tab */}
        <TabsContent value="typography" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Type Scale</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="mb-4">
                <Badge variant="outline">Font Family: {styleGuide.typography.fontFamily}</Badge>
              </div>
              {styleGuide.typography.scale.map((t) => (
                <div key={t.name} className="border-b border-border pb-4 last:border-0">
                  <div className="flex items-baseline justify-between mb-2">
                    <span
                      style={{
                        fontSize: t.size,
                        fontWeight: t.weight,
                        lineHeight: t.lineHeight,
                      }}
                      className="text-foreground"
                    >
                      {t.name}
                    </span>
                    <div className="text-xs text-muted-foreground font-mono">
                      {t.size} / {t.weight} / {t.lineHeight}
                    </div>
                  </div>
                  <p
                    style={{
                      fontSize: t.size,
                      fontWeight: t.weight,
                      lineHeight: t.lineHeight,
                    }}
                    className="text-muted-foreground"
                  >
                    The quick brown fox jumps over the lazy dog
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Components Tab */}
        <TabsContent value="components" className="space-y-6">
          {/* Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Buttons</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-4 items-center">
                <Button>Primary Button</Button>
                <Button variant="secondary">Secondary Button</Button>
                <Button variant="outline">Outline Button</Button>
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="destructive">Destructive</Button>
              </div>
              <div className="flex flex-wrap gap-4 items-center">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
              </div>
            </CardContent>
          </Card>

          {/* Inputs */}
          <Card>
            <CardHeader>
              <CardTitle>Form Inputs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-w-md">
              <Input placeholder="Default input" />
              <Input placeholder="Disabled input" disabled />
            </CardContent>
          </Card>

          {/* Cards */}
          <Card>
            <CardHeader>
              <CardTitle>Cards</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="text-lg">Default Card</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Card with standard shadow</p>
                  </CardContent>
                </Card>
                <div className="bg-create rounded-seeksy-xl p-6">
                  <h3 className="font-semibold mb-2">Create Section</h3>
                  <p className="text-sm text-muted-foreground">Soft blue background</p>
                </div>
                <div className="bg-connect rounded-seeksy-xl p-6">
                  <h3 className="font-semibold mb-2">Connect Section</h3>
                  <p className="text-sm text-muted-foreground">Soft mint background</p>
                </div>
                <div className="bg-monetize rounded-seeksy-xl p-6">
                  <h3 className="font-semibold mb-2">Monetize Section</h3>
                  <p className="text-sm text-muted-foreground">Soft sand background</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Badges */}
          <Card>
            <CardHeader>
              <CardTitle>Badges</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Destructive</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Page Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Page Layout Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border border-border rounded-seeksy-md">
                <h4 className="font-semibold mb-2">Hero Section</h4>
                <p className="text-sm text-muted-foreground">
                  Large headline (56px), centered content, generous whitespace. Use subtle background (#F8FAFC).
                </p>
              </div>
              <div className="p-4 border border-border rounded-seeksy-md">
                <h4 className="font-semibold mb-2">Feature Sections</h4>
                <p className="text-sm text-muted-foreground">
                  Use soft accent backgrounds (Create/Connect/Monetize) to categorize sections. 32px border radius.
                </p>
              </div>
              <div className="p-4 border border-border rounded-seeksy-md">
                <h4 className="font-semibold mb-2">CTA Sections</h4>
                <p className="text-sm text-muted-foreground">
                  Pill-shaped buttons (999px radius). Use Seeksy Blue for primary CTAs. Warm gradient only for special moments.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Rules Tab */}
        <TabsContent value="rules" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-success/30 bg-success/5">
              <CardHeader>
                <CardTitle className="text-success flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  Do
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Keep lots of whitespace; center content; use large headline scale.</li>
                  <li>• Use Seeksy Blue as the only strong saturated color.</li>
                  <li>• Use soft accent backgrounds to categorize sections (Create/Connect/Monetize).</li>
                  <li>• Use pill CTAs and soft shadows.</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-danger/30 bg-danger/5">
              <CardHeader>
                <CardTitle className="text-danger flex items-center gap-2">
                  ✕ Don't
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Don't add new saturated colors.</li>
                  <li>• Don't use flip-cards.</li>
                  <li>• Don't mix multiple headline fonts.</li>
                  <li>• Don't use heavy gradients everywhere.</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
