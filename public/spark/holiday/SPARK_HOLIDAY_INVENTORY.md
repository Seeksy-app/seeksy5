# Seeksy Spark Holiday Pack Inventory

## Overview
The Seeksy Spark Holiday Pack extends the base Spark character with festive seasonal accessories while maintaining consistent proportions, style, and personality traits. All assets follow the established design system with warm gradients, soft glows, and friendly expressions.

---

## 🎄 Character Pose Variants

### Light Mode Variants
Location: `public/spark/holiday/`

| Asset | Filename | Size | Description |
|-------|----------|------|-------------|
| Idle + Santa Hat | `spark_idle_santa.png` | 512x512 | Default resting pose with festive red Santa hat |
| Waving + Santa Hat | `spark_wave_santa.png` | 512x512 | Friendly wave gesture with one arm raised |
| Typing + Santa Hat | `spark_typing_santa.png` | 512x512 | Working/focused pose near keyboard |
| Happy/Excited + Santa Hat | `spark_happy_santa.png` | 512x512 | Celebratory pose with arms raised |

**Style Characteristics:**
- Warm yellow-orange gradient base
- Teal/blue AI accent highlights
- Soft glow aura for depth
- Santa hat: soft red fabric, white fur trim, tilted for personality
- Compatible with light backgrounds
- Transparent background (PNG)

### Dark Mode Variants
Location: `public/spark/holiday/dark/`

| Asset | Filename | Size | Description |
|-------|----------|------|-------------|
| Idle + Santa Hat (Dark) | `spark_idle_santa_dark.png` | 512x512 | Dark mode idle with enhanced glow |
| Waving + Santa Hat (Dark) | `spark_wave_santa_dark.png` | 512x512 | Dark mode wave with luminous effects |
| Typing + Santa Hat (Dark) | `spark_typing_santa_dark.png` | 512x512 | Dark mode typing with cyan accents |
| Happy/Excited + Santa Hat (Dark) | `spark_happy_santa_dark.png` | 512x512 | Dark mode celebration with sparkles |

**Style Characteristics:**
- Deep teal-blue gradient base
- Bright cyan/electric blue AI highlights
- Enhanced luminous glow for dark backgrounds
- Santa hat: vibrant red maintains visibility
- Dramatic lighting with glowing edges
- Transparent background (PNG)

---

## ⭐ Mini Icon Variants

### Holiday Icons
Location: `public/spark/icons/holiday/`

| Asset | Filename | Size | Mode | Description |
|-------|----------|------|------|-------------|
| Icon 32px Light | `spark_icon_32_santa.png` | 32x32 | Light | Simplified idle pose with Santa hat |
| Icon 32px Dark | `spark_icon_32_santa_dark.png` | 32x32 | Dark | Simplified idle with enhanced glow |

**Icon Specifications:**
- Crisp edges optimized for small UI display
- Minimal detail while maintaining character recognition
- Consistent proportions with full-size variants
- Always includes Santa hat
- Transparent background
- Used for: badges, notification indicators, menu items, status icons

---

## 🎨 Design System Guidelines

### Proportions
- Maintain identical silhouette to base Spark character
- Santa hat does not distort character shape
- Consistent head-to-body ratio across all poses
- Hat size proportional to character (approximately 1/3 of total height)

### Santa Hat Style
- **Color:** Soft red (#DC2626 to #991B1B gradient)
- **Trim:** White fur texture with subtle shading
- **Pom-pom:** White, fluffy, at tip of hat
- **Tilt:** 10-15° angle for personality
- **Shading:** Soft shadows on fabric folds
- **Edge Treatment:** Smooth anti-aliasing

### Color Palette

**Light Mode:**
- Base: Warm yellow-orange (#FDE68A → #F59E0B)
- Accents: Teal/cyan (#14B8A6, #06B6D4)
- Glow: Soft amber (#FEF3C7 at 40% opacity)
- Santa Hat: Red (#DC2626) with white trim (#FFFFFF)

**Dark Mode:**
- Base: Deep teal-blue (#0F766E → #0E7490)
- Accents: Bright cyan/electric blue (#22D3EE, #38BDF8)
- Glow: Luminous cyan (#67E8F9 at 60% opacity)
- Santa Hat: Vibrant red (#EF4444) with white trim (#FFFFFF)

### Expression Guidelines
- **Idle:** Warm, welcoming, calm
- **Waving:** Friendly, approachable, cheerful
- **Typing:** Focused but friendly, helpful
- **Happy:** Joyful, celebratory, enthusiastic (but not hyperactive)

All expressions maintain Spark's core personality: helpful, warm, trustworthy AI assistant.

---

## 📁 File Structure

```
public/
└── spark/
    ├── holiday/
    │   ├── spark_idle_santa.png
    │   ├── spark_wave_santa.png
    │   ├── spark_typing_santa.png
    │   ├── spark_happy_santa.png
    │   ├── dark/
    │   │   ├── spark_idle_santa_dark.png
    │   │   ├── spark_wave_santa_dark.png
    │   │   ├── spark_typing_santa_dark.png
    │   │   └── spark_happy_santa_dark.png
    │   └── SPARK_HOLIDAY_INVENTORY.md
    └── icons/
        └── holiday/
            ├── spark_icon_32_santa.png
            └── spark_icon_32_santa_dark.png
```

---

## 🎯 Usage Recommendations

### Primary Use Cases
1. **Chat Widget (December):** Replace standard Spark with `spark_idle_santa.png` / `spark_idle_santa_dark.png`
2. **Loading States:** Use `spark_typing_santa.png` for holiday-themed loading indicators
3. **Success Messages:** Use `spark_happy_santa.png` for completed actions during holidays
4. **Greetings:** Use `spark_wave_santa.png` for welcome screens and onboarding
5. **Navigation Icons:** Use 32px holiday icons for seasonal menu badges

### Activation Period
- **Start:** December 1
- **End:** January 2
- **Auto-Switch Logic:** Recommended to implement theme-based detection in `src/lib/spark/sparkAssets.ts`

### Integration Example
```typescript
// src/lib/spark/sparkAssets.ts
export const isHolidaySeason = (): boolean => {
  const now = new Date();
  const month = now.getMonth();
  const day = now.getDate();
  
  // December 1 - January 2
  return (month === 11) || (month === 0 && day <= 2);
};

export const getSparkAsset = (
  pose: SparkPose = "idle",
  size: SparkSize = "full",
  forceTheme?: "light" | "dark",
  forceHoliday?: boolean
): string => {
  const theme = forceTheme || getCurrentTheme();
  const isHoliday = forceHoliday ?? isHolidaySeason();
  
  if (size === "icon-32") {
    return isHoliday
      ? `/spark/icons/holiday/spark_icon_32_santa${theme === 'dark' ? '_dark' : ''}.png`
      : `/spark/icons/spark-icon-32${theme === 'dark' ? '-dark' : ''}.png`;
  }
  
  const basePath = isHoliday ? '/spark/holiday' : '/spark';
  const darkSuffix = theme === 'dark' ? '_dark' : '';
  const holidaySuffix = isHoliday ? '_santa' : '';
  
  return `${basePath}${theme === 'dark' ? '/dark' : ''}/spark_${pose}${holidaySuffix}${darkSuffix}.png`;
};
```

---

## ✨ Optional Accessory Variants (Future Enhancement)

The following variants can be added in future iterations to expand the holiday pack:

### Candy Cane Variant
- Spark holding a small candy cane in one hand
- Candy cane size: subtle, does not dominate character
- Style: red and white stripes with peppermint twist

### Present Variant
- Spark holding a tiny wrapped gift box
- Gift wrap: festive patterns (stars, snowflakes)
- Ribbon bow on top
- Size: proportional to character hands

### Snowflake Animation
- Small animated snowflakes floating around Spark
- CSS animation: gentle falling motion
- 3-5 snowflakes maximum
- Subtle, non-distracting

---

## 🔧 Technical Specifications

### File Format
- **Format:** PNG with alpha transparency
- **Color Space:** sRGB
- **Bit Depth:** 32-bit (8-bit RGB + 8-bit alpha)

### Optimization
- All assets optimized for web delivery
- Full-size variants: ~80-150KB each
- Icon variants: ~5-10KB each
- Compression: Lossless PNG optimization applied

### Browser Compatibility
- Supports all modern browsers with PNG alpha transparency
- Fallback: Standard Spark assets for browsers without holiday detection
- No special dependencies required

---

## 📊 Asset Summary

**Total Assets Generated:** 10
- 4 Light Mode Character Poses
- 4 Dark Mode Character Poses
- 2 Icon Variants (32px light/dark)

**Total File Size (Estimated):** ~1.2MB
**Storage Location:** `public/spark/holiday/` and `public/spark/icons/holiday/`

---

## 📝 Version History

**v1.0.0** — November 28, 2024
- Initial holiday pack release
- 8 character pose variants (light/dark)
- 2 icon variants (32px)
- Complete documentation

---

## 🎁 Credits

**Design Concept:** Seeksy Design Team  
**Character Design:** Seeksy Spark (Base Character)  
**Holiday Adaptation:** AI-Generated with Flux.dev  
**Documentation:** Seeksy Finance & Strategy Team

---

## 📞 Support

For questions or asset requests, contact:
- **Design Team:** design@seeksy.io
- **Technical Support:** support@seeksy.io

---

**Last Updated:** November 28, 2024  
**Maintained By:** Seeksy Design & Engineering Team
