# My Page v2 - Complete Redesign

## Overview

My Page v2 is a complete redesign of the creator profile system with a modern, premium builder interface, real-time preview system, and redesigned public pages.

## Key Features

### 1. Premium Builder Interface
- **Icon-Based Navigation**: Clean, visual navigation with gradient icons
- **Four Main Sections**:
  - Profile: Name, username, bio, profile image
  - Theme: Colors, backgrounds, fonts, card styles
  - Sections: Enable/disable page sections
  - Share: QR code, share links, NFC waitlist

### 2. Advanced Theme System
- **Colors**: Full color picker with hex input
- **Backgrounds**: Solid, gradient, or image
- **Card Styles**: Round, square, shadow, glass effects
- **Typography**: Multiple Google Font options
- **Light/Dark Mode**: Toggle for theme preference

### 3. Premium Phone Preview
- **Multi-Device**: Mobile, tablet, desktop views
- **Live Updates**: Instant preview of all changes
- **Edit/Preview Modes**: 
  - Edit mode: Click sections to jump to settings
  - Preview mode: See as visitors would
- **Device Mockups**: Premium bezeless phone frame

### 4. Modular Sections
All sections can be enabled/disabled:
- Featured Video
- Featured Podcast
- Stream Channel
- Social Links
- Custom Links
- Shop (Shopify)
- Voice Certified Badge
- Book a Meeting (Event Crunch)

### 5. Share System
- **Copy Link**: One-click copy to clipboard
- **Native Share**: Web Share API integration
- **Text Message**: Pre-filled SMS sharing
- **QR Code**: Downloadable QR codes
- **NFC Cards**: Waitlist for physical NFC cards

## File Structure

```
src/
├── config/
│   └── myPageThemes.ts              # Theme configuration
├── components/
│   ├── mypage/
│   │   └── v2/
│   │       ├── MyPageBuilderV2.tsx  # Main builder page
│   │       ├── builder/
│   │       │   ├── BuilderSidebar.tsx
│   │       │   ├── PreviewPane.tsx
│   │       │   └── sections/
│   │       │       ├── ProfileSection.tsx
│   │       │       ├── ThemeSection.tsx
│   │       │       ├── SectionsPanel.tsx
│   │       │       └── ShareSection.tsx
│   │       └── public/
│   │           └── MyPagePreview.tsx
│   └── share/
│       └── ShareMyPageDrawer.tsx
```

## Theme Configuration

Themes are managed through `myPageThemes.ts`:

```typescript
interface MyPageTheme {
  displayName: string;
  username: string;
  bio: string;
  imageStyle: "circular" | "square" | "portrait";
  profileImage: string | null;
  themeColor: string;
  backgroundColor: string;
  backgroundType: "solid" | "gradient" | "image";
  cardStyle: "round" | "square" | "shadow" | "glass";
  titleFont: string;
  mode: "light" | "dark";
  sections: MyPageSection[];
}
```

## Integration Points

### Existing Features (Preserved)
- ✅ Streaming channel
- ✅ Featured video/podcast
- ✅ Shopify shop integration
- ✅ Event Crunch meetings
- ✅ Voice Certification Badge
- ✅ Monetization tracking
- ✅ Social links
- ✅ Custom links

### New Features
- ✅ Premium builder UI
- ✅ Real-time preview
- ✅ Multi-device preview
- ✅ Share drawer
- ✅ NFC waitlist placeholder
- ✅ Theme customization
- ✅ Gradient backgrounds
- ✅ Glass morphism cards

## Routes

- `/profile/edit/v2` - New builder interface
- `/[username]` - Public profile page (existing, with v2 theme support)

## Database Schema

All existing profile tables remain unchanged. Theme settings are stored in:
- `profiles.page_background_color`
- `profiles.theme_color`
- Additional theme settings can be stored in JSON column (future)

## SEO Improvements

- Dynamic OpenGraph images
- Meta tags with credentials
- Lazy loading for heavy sections
- Faster initial load times

## Future Enhancements

1. **NFC Cards**: Physical tap-to-connect cards
2. **Advanced Analytics**: Section-level engagement tracking
3. **A/B Testing**: Test different themes and layouts
4. **Templates**: Pre-built theme templates
5. **Animation Library**: Custom entrance animations
6. **Video Backgrounds**: Full-screen video backgrounds
7. **Custom Domains**: Personal domain mapping

## Migration Path

1. Existing users see v1 builder by default
2. Opt-in to v2 via settings toggle
3. All v1 data compatible with v2
4. One-click upgrade maintains all integrations
5. Rollback option available

## Performance

- Lazy loading for preview components
- Optimized image handling
- Minimal re-renders during editing
- Efficient theme state management

## Accessibility

- Keyboard navigation support
- Screen reader compatible
- High contrast mode support
- Focus indicators
- ARIA labels

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Android)

## Known Limitations

- Image backgrounds require external hosting
- NFC feature not yet implemented
- Advanced animation options coming soon
- Custom CSS injection not available

## Support

For questions or issues:
- Documentation: https://docs.seeksy.io/my-page-v2
- Support: support@seeksy.io
- Community: https://community.seeksy.io
