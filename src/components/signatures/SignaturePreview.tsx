interface SignaturePreviewProps {
  formData: any;
  signatureId: string;
}

// Size mappings
const PROFILE_IMAGE_SIZES = {
  small: { width: 40, height: 40 },
  medium: { width: 60, height: 60 },
  large: { width: 80, height: 80 },
};

const FONT_SIZES = {
  small: 12,
  medium: 14,
  large: 16,
};

const SOCIAL_ICON_SIZES = {
  small: "text-xs",
  medium: "text-sm",
  large: "text-base",
};

// Social icons using simple text/emoji that work in email
const SOCIAL_ICONS: Record<string, string> = {
  facebook: "📘",
  twitter: "𝕏",
  instagram: "📷",
  linkedin: "💼",
  youtube: "▶️",
  tiktok: "🎵",
  pinterest: "📌",
};

export function SignaturePreview({ formData, signatureId }: SignaturePreviewProps) {
  const fontSize = FONT_SIZES[formData.font_size as keyof typeof FONT_SIZES] || FONT_SIZES.medium;
  const profileSize = PROFILE_IMAGE_SIZES[formData.profile_image_size as keyof typeof PROFILE_IMAGE_SIZES] || PROFILE_IMAGE_SIZES.medium;
  const socialIconClass = SOCIAL_ICON_SIZES[formData.social_icon_size as keyof typeof SOCIAL_ICON_SIZES] || SOCIAL_ICON_SIZES.medium;
  const isSquare = formData.profile_image_shape === 'square';

  return (
    <div 
      className="bg-white rounded-md p-4 border"
      style={{ fontFamily: formData.font_family, fontSize: `${fontSize}px` }}
    >
      {/* Quote */}
      {formData.quote_text && (
        <p className="italic mb-3" style={{ color: formData.secondary_color }}>
          "{formData.quote_text}"
        </p>
      )}

      {/* Profile */}
      <div className="flex items-center gap-3 mb-3">
        {formData.profile_photo_url && (
          <img 
            src={formData.profile_photo_url} 
            alt={formData.profile_name}
            className={`object-cover ${isSquare ? 'rounded-md' : 'rounded-full'}`}
            style={{ 
              width: profileSize.width, 
              height: profileSize.height 
            }}
          />
        )}
        <div>
          {formData.profile_name && (
            <div className="font-bold" style={{ color: formData.primary_color }}>
              {formData.profile_name}
            </div>
          )}
          {formData.profile_title && (
            <div style={{ color: formData.secondary_color }}>
              {formData.profile_title}
            </div>
          )}
        </div>
      </div>

      {/* Company */}
      {(formData.company_name || formData.company_phone || formData.company_website || formData.company_logo_url) && (
        <div className="mb-3" style={{ color: formData.secondary_color }}>
          {formData.company_logo_url && (
            <img 
              src={formData.company_logo_url} 
              alt={formData.company_name || "Company logo"}
              className="h-8 w-auto mb-2"
            />
          )}
          {formData.company_name && <div className="font-semibold">{formData.company_name}</div>}
          {formData.company_phone && <div>{formData.company_phone}</div>}
          {formData.company_website && (
            <div>
              <a href={formData.company_website} style={{ color: formData.link_color }}>
                {formData.company_website.replace(/^https?:\/\//, "")}
              </a>
            </div>
          )}
          {formData.company_address && <div className="text-xs">{formData.company_address}</div>}
        </div>
      )}

      {/* Social */}
      {Object.entries(formData.social_links || {}).filter(([_, url]) => url).length > 0 && (
        <div className="flex gap-3 mb-3 flex-wrap">
          {Object.entries(formData.social_links).filter(([_, url]) => url).map(([platform, url]) => (
            <a 
              key={platform}
              href={url as string}
              className={`hover:underline ${socialIconClass}`}
              style={{ color: formData.link_color }}
              title={platform.charAt(0).toUpperCase() + platform.slice(1)}
            >
              {SOCIAL_ICONS[platform] || platform}
            </a>
          ))}
        </div>
      )}

      {/* Banner */}
      {formData.banner_image_url && (
        <div className="mt-3">
          <img 
            src={formData.banner_image_url} 
            alt={formData.banner_alt_text || "Banner"}
            className="max-w-full rounded"
            style={{ maxWidth: 400 }}
          />
        </div>
      )}
    </div>
  );
}
