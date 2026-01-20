import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { MyPageTheme } from "@/config/myPageThemes";
import { fontOptions, colorPalette } from "@/config/myPageThemes";
import { Palette, Image as ImageIcon } from "lucide-react";

interface ThemeSectionProps {
  theme: MyPageTheme;
  onUpdate: (theme: MyPageTheme) => void;
}

export function ThemeSection({ theme, onUpdate }: ThemeSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Theme</h2>
        <p className="text-sm text-muted-foreground">Customize your page's look and feel</p>
      </div>

      {/* Theme Color */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Theme Color
        </Label>
        <div className="flex items-center gap-2">
          <Input
            type="color"
            value={theme.themeColor || "#3b82f6"}
            onChange={(e) => {
              const newColor = e.target.value;
              onUpdate({ ...theme, themeColor: newColor });
            }}
            className="w-14 h-14 p-1 rounded-xl cursor-pointer border-2"
          />
          <Input
            type="text"
            value={theme.themeColor || "#3b82f6"}
            onChange={(e) => {
              const newColor = e.target.value;
              onUpdate({ ...theme, themeColor: newColor });
            }}
            className="flex-1 font-mono uppercase"
            placeholder="#3b82f6"
          />
        </div>
        <div className="grid grid-cols-6 gap-2">
          {colorPalette.map((color) => (
            <button
              key={color}
              onClick={() => onUpdate({ ...theme, themeColor: color })}
              className={`w-full aspect-square rounded-lg hover:scale-110 transition-transform ${
                theme.themeColor === color ? "ring-2 ring-primary ring-offset-2" : ""
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* Background */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4" />
          Background
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {["solid", "gradient", "image"].map((type) => (
            <Button
              key={type}
              variant={theme.backgroundType === type ? "default" : "outline"}
              size="sm"
              onClick={() => onUpdate({ ...theme, backgroundType: type as any })}
              className="capitalize"
            >
              {type}
            </Button>
          ))}
        </div>
        
        {theme.backgroundType === "solid" && (
          <Input
            type="color"
            value={theme.backgroundColor}
            onChange={(e) => onUpdate({ ...theme, backgroundColor: e.target.value })}
            className="w-full h-12 rounded-xl cursor-pointer"
          />
        )}
        
        {theme.backgroundType === "gradient" && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                type="color"
                value={theme.backgroundGradient?.from || "#ffffff"}
                onChange={(e) => onUpdate({
                  ...theme,
                  backgroundGradient: { ...theme.backgroundGradient!, from: e.target.value }
                })}
                className="flex-1 h-12 rounded-xl cursor-pointer"
              />
              <Input
                type="color"
                value={theme.backgroundGradient?.to || "#f3f4f6"}
                onChange={(e) => onUpdate({
                  ...theme,
                  backgroundGradient: { ...theme.backgroundGradient!, to: e.target.value }
                })}
                className="flex-1 h-12 rounded-xl cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* Card Style */}
      <div className="space-y-3">
        <Label>Card Style</Label>
        <div className="grid grid-cols-2 gap-2">
          {["round", "square", "shadow", "glass"].map((style) => (
            <Button
              key={style}
              variant={theme.cardStyle === style ? "default" : "outline"}
              size="sm"
              onClick={() => onUpdate({ ...theme, cardStyle: style as any })}
              className="capitalize"
            >
              {style}
            </Button>
          ))}
        </div>
      </div>

      {/* Font */}
      <div className="space-y-3">
        <Label>Font Family</Label>
        <Select
          value={theme.titleFont}
          onValueChange={(value) => onUpdate({ ...theme, titleFont: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {fontOptions.map((font) => (
              <SelectItem key={font.value} value={font.value}>
                {font.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Mode */}
      <div className="flex items-center justify-between">
        <div>
          <Label>Dark Mode</Label>
          <p className="text-xs text-muted-foreground">Toggle light/dark theme</p>
        </div>
        <Switch
          checked={theme.mode === "dark"}
          onCheckedChange={(checked) => onUpdate({ ...theme, mode: checked ? "dark" : "light" })}
        />
      </div>
    </div>
  );
}
