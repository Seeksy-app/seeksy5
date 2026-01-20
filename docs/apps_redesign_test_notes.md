# Apps Redesign - Test Path & QA Notes

## Feature Flag

The new apps page is behind a feature flag for safe testing.

### Enabling the new apps page

**Option 1: Browser Console**
```javascript
window.SeeksyApps.enable()
// Then reload the page
```

**Option 2: URL Parameter**
```
/apps?new_apps=true
```

**Option 3: localStorage (manual)**
```javascript
localStorage.setItem('seeksy_use_new_apps', 'true')
// Then reload
```

### Disabling (rollback)
```javascript
window.SeeksyApps.disable()
// Or visit /apps-legacy directly
```

---

## Test Paths

### 1. Basic Routing Test
- [ ] Visit `/apps` with flag disabled → Legacy page loads
- [ ] Visit `/apps?new_apps=true` → New apps page loads
- [ ] Visit `/apps-legacy` → Always shows legacy page
- [ ] Enable flag via console → `/apps` shows new page after reload

### 2. Spark AI Guide Flow
- [ ] New page shows "AI Guide" tab by default
- [ ] Spark avatar animates subtly (not distracting)
- [ ] 6 intent cards are visible
- [ ] Hovering an intent shows suggested modules
- [ ] Clicking an intent selects it (checkmark appears)
- [ ] "Skip, I'll browse manually" switches to Collections tab

### 3. Intent → Install Flow
- [ ] Select an intent → Click action button
- [ ] IntentConfirmationModal opens
- [ ] Required modules have "Required" badge and can't be unchecked
- [ ] Optional modules can be toggled
- [ ] Already-installed modules show "Already installed"
- [ ] Click "Install X modules" → Progress bar shows
- [ ] After install completes → Celebration screen with "Go to My Day"
- [ ] Click "Go to My Day" → Navigates to `/` (My Day)

### 4. Collections Tab
- [ ] Collections grid displays with animated cards
- [ ] Hover shows particle effects (performance acceptable)
- [ ] Click expands to show included modules
- [ ] "Preview" opens CollectionPreviewModal
- [ ] "Install" starts installation flow
- [ ] Installed collections show checkmark badge

### 5. All Modules Tab
- [ ] Category filter buttons work
- [ ] Search filters modules correctly
- [ ] Clear search button (X) works
- [ ] Module cards show correct states (installed, new, AI)
- [ ] Click module → Relationship graph updates on right
- [ ] Relationship graph shows Required vs Enhanced modules
- [ ] "Add" button installs module

### 6. Relationship Graph
- [ ] Shows "Select a Seeksy" when no module selected
- [ ] Selecting "Social Analytics" shows Social Connect as required
- [ ] Selecting "Studio" shows Media Library, AI Post-Production as enhanced
- [ ] Install buttons in graph work correctly
- [ ] Already-installed modules show green checkmark

### 7. Post-Install Verification
- [ ] After installing modules, visit `/` (My Day)
- [ ] Only widgets for installed modules appear
- [ ] Sidebar shows installed modules
- [ ] No "Profile Not Found" errors

### 8. Edge Cases
- [ ] Works on laptop width (1280px)
- [ ] Works on tablet width (768px)
- [ ] Back button from modal doesn't break state
- [ ] Rapidly clicking install doesn't cause duplicates
- [ ] Empty state when no modules match search

---

## Debug Commands

```javascript
// Check current flag state
window.SeeksyApps.isEnabled()

// View installed modules
window.SeeksyDebug?.enable()
// Then look in console for "SEEKSY_DEBUG" logs

// Check workspace modules
// (Use React DevTools to inspect WorkspaceContext)
```

---

## Known Limitations

1. Module relationship graph only visible on lg+ screens
2. Particle effects on collection cards may cause performance dip on low-end devices
3. Some module routes may show "Coming Soon" if not yet implemented

---

## Rollback Plan

If issues are found:
1. Run `window.SeeksyApps.disable()` in console
2. Or direct users to `/apps-legacy`
3. Flag can be removed entirely by reverting AppsRouter.tsx to always use legacy
