import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Upload, AlertCircle } from "lucide-react";
import { MyPageTheme } from "@/config/myPageThemes";
import { useState } from "react";
import { SocialLinksEditor } from "./SocialLinksEditor";
import { Separator } from "@/components/ui/separator";

interface ProfileSectionProps {
  theme: MyPageTheme;
  onUpdate: (theme: MyPageTheme) => void;
}

const normalizeUsername = (input: string): string => {
  return input
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const isValidUsername = (username: string): boolean => {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(username) && username.length > 0;
};

export function ProfileSection({ theme, onUpdate }: ProfileSectionProps) {
  const [usernameError, setUsernameError] = useState<string>("");
  const [socialLinks, setSocialLinks] = useState<Record<string, any>>(theme.socialLinks || {});

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onUpdate({ ...theme, profileImage: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Profile</h2>
        <p className="text-sm text-muted-foreground">Set up your basic profile information</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="displayName">Display Name</Label>
          <Input
            id="displayName"
            value={theme.displayName}
            onChange={(e) => onUpdate({ ...theme, displayName: e.target.value })}
            placeholder="Your name"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={theme.username}
            onChange={(e) => {
              const normalized = normalizeUsername(e.target.value);
              onUpdate({ ...theme, username: normalized });
              
              if (normalized && !isValidUsername(normalized)) {
                setUsernameError("Username can only contain lowercase letters, numbers, and single hyphens");
              } else {
                setUsernameError("");
              }
            }}
            placeholder="your-username"
            className="mt-1.5"
          />
          {usernameError && (
            <div className="flex items-center gap-1 mt-1 text-xs text-destructive">
              <AlertCircle className="w-3 h-3" />
              <span>{usernameError}</span>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-1">seeksy.io/{theme.username || "your-username"}</p>
        </div>

        <div>
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={theme.bio}
            onChange={(e) => onUpdate({ ...theme, bio: e.target.value })}
            placeholder="Tell your audience about yourself..."
            rows={4}
            className="mt-1.5 resize-none"
          />
        </div>

        <div>
          <Label>Profile Image</Label>
          <div className="mt-1.5">
            <div className="border-2 border-dashed rounded-xl p-6 text-center hover:border-primary transition-colors cursor-pointer">
              <input
                type="file"
                id="profileImage"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              <label htmlFor="profileImage" className="cursor-pointer">
                {theme.profileImage ? (
                  <div className="flex flex-col items-center gap-3">
                    <img
                      src={theme.profileImage}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover ring-4 ring-primary/20"
                    />
                    <p className="text-sm text-muted-foreground">Click to change</p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">Upload profile image</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                  </>
                )}
              </label>
            </div>
          </div>
        </div>

        <div>
          <Label>Image Style</Label>
          <div className="grid grid-cols-3 gap-2 mt-1.5">
            {[
              { value: "circular", label: "Circular" },
              { value: "square", label: "Square" },
              { value: "portrait", label: "Portrait" }
            ].map((style) => (
              <Button
                key={style.value}
                type="button"
                size="sm"
                variant={theme.imageStyle === style.value ? "default" : "outline"}
                onClick={() => onUpdate({ ...theme, imageStyle: style.value as any })}
              >
                {style.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <Separator className="my-8" />

      <SocialLinksEditor 
        links={socialLinks} 
        onChange={(links) => {
          setSocialLinks(links);
          onUpdate({ ...theme, socialLinks: links });
        }} 
      />
    </div>
  );
}
