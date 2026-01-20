import { useRef, useState, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eraser, Check, PenTool, Type } from "lucide-react";

interface SignaturePadProps {
  title: string;
  onSign: (signatureDataUrl: string) => void;
  existingSignature?: string;
  disabled?: boolean;
}

const SIGNATURE_FONTS = [
  { id: 'dancing', name: 'Dancing Script', family: "'Dancing Script', cursive" },
  { id: 'great-vibes', name: 'Great Vibes', family: "'Great Vibes', cursive" },
  { id: 'allura', name: 'Allura', family: "'Allura', cursive" },
  { id: 'pacifico', name: 'Pacifico', family: "'Pacifico', cursive" },
];

export function SignaturePad({ title, onSign, existingSignature, disabled }: SignaturePadProps) {
  const sigRef = useRef<SignatureCanvas>(null);
  const typeCanvasRef = useRef<HTMLCanvasElement>(null);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [typedName, setTypedName] = useState("");
  const [selectedFont, setSelectedFont] = useState(SIGNATURE_FONTS[0].id);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  // Load Google Fonts
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Great+Vibes&family=Allura&family=Pacifico&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    
    // Wait for fonts to load
    document.fonts.ready.then(() => {
      setFontsLoaded(true);
    });
    
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // Update typed signature preview
  useEffect(() => {
    if (!typeCanvasRef.current || !typedName || !fontsLoaded) return;
    
    const canvas = typeCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const font = SIGNATURE_FONTS.find(f => f.id === selectedFont);
    if (!font) return;

    // Clear canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw signature
    ctx.fillStyle = '#1a1a1a';
    ctx.font = `48px ${font.family}`;
    ctx.textBaseline = 'middle';
    
    // Center the text
    const textWidth = ctx.measureText(typedName).width;
    const x = Math.max(10, (canvas.width - textWidth) / 2);
    ctx.fillText(typedName, x, canvas.height / 2);
  }, [typedName, selectedFont, fontsLoaded]);

  const handleClear = () => {
    sigRef.current?.clear();
    setHasDrawn(false);
  };

  const handleSaveDrawn = () => {
    if (sigRef.current && !sigRef.current.isEmpty()) {
      const dataUrl = sigRef.current.toDataURL("image/png");
      onSign(dataUrl);
    }
  };

  const handleSaveTyped = () => {
    if (!typeCanvasRef.current || !typedName) return;
    const dataUrl = typeCanvasRef.current.toDataURL("image/png");
    onSign(dataUrl);
  };

  if (existingSignature) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            {title} - Signed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md p-2 bg-muted/30">
            <img 
              src={existingSignature} 
              alt="Signature" 
              className="max-h-24 mx-auto"
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (disabled) {
    return (
      <Card className="opacity-60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md p-4 bg-muted/30 text-center text-muted-foreground text-sm">
            Awaiting previous signature
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Tabs defaultValue="draw" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="draw" className="flex items-center gap-1.5">
              <PenTool className="h-3.5 w-3.5" />
              Draw
            </TabsTrigger>
            <TabsTrigger value="type" className="flex items-center gap-1.5">
              <Type className="h-3.5 w-3.5" />
              Type
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="draw" className="space-y-3 mt-3">
            <div className="border rounded-md bg-white">
              <SignatureCanvas
                ref={sigRef}
                canvasProps={{
                  className: "w-full h-32",
                  style: { width: "100%", height: "128px" }
                }}
                onEnd={() => setHasDrawn(true)}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClear}
                disabled={!hasDrawn}
              >
                <Eraser className="h-4 w-4 mr-1" />
                Clear
              </Button>
              <Button 
                size="sm" 
                onClick={handleSaveDrawn}
                disabled={!hasDrawn}
              >
                <Check className="h-4 w-4 mr-1" />
                Apply Signature
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="type" className="space-y-3 mt-3">
            <div className="space-y-2">
              <Label htmlFor="typed-name">Type your name</Label>
              <Input
                id="typed-name"
                placeholder="Enter your full name"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Choose font style</Label>
              <Select value={selectedFont} onValueChange={setSelectedFont}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SIGNATURE_FONTS.map(font => (
                    <SelectItem key={font.id} value={font.id}>
                      <span style={{ fontFamily: font.family }}>{font.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="border rounded-md bg-white overflow-hidden">
                <canvas
                  ref={typeCanvasRef}
                  width={400}
                  height={100}
                  className="w-full h-24"
                  style={{ 
                    display: 'block',
                    backgroundColor: 'white'
                  }}
                />
              </div>
            </div>
            
            <Button 
              size="sm" 
              onClick={handleSaveTyped}
              disabled={!typedName.trim()}
              className="w-full"
            >
              <Check className="h-4 w-4 mr-1" />
              Apply Signature
            </Button>
          </TabsContent>
        </Tabs>
        
        <p className="text-xs text-muted-foreground">
          By signing, you agree to the terms of this agreement.
        </p>
      </CardContent>
    </Card>
  );
}
