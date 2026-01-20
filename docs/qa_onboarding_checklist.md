# QA Onboarding Checklist

This checklist validates the Seeksy onboarding and module installation flow.

---

## Critical Rules Verified

1. **NO "core" widgets** - Every widget has `requiredModuleId` set
2. **Zero-modules behavior** - My Day shows ONLY `MyDayEmptyState`
3. **Quick Actions gated** - Only appears if relevant modules installed
4. **Ask Spark NOT in Quick Actions** - Lives in sidebar nav only
5. **Feature cards bound to modules:**
   - Identity Status → `identity-verification` / `identity`
   - Certified Clips → `ai-clips` / `clips`
   - Media Vault → `media-library` / `studio`
   - Quick Create → `studio` / `podcasts` / `media-library`
   - Book with Mia → `meetings`

---

## Pre-Test Setup

1. Open browser DevTools (F12) → Console tab
2. Look for logs prefixed with `[Seeksy Debug]`
3. Clear any existing workspaces if testing fresh

---

## Test Path 1: New Workspace → Collections Install

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1.1 | Create new workspace | Workspace created, redirected to onboarding |
| 1.2 | Select "Collections" path | Collection browser opens |
| 1.3 | Choose "Creator Studio" collection | Preview shows included modules list |
| 1.4 | Click "Install Collection" | Confirmation shows which modules will be added |
| 1.5 | Confirm installation | Toast: "Collection installed" |
| 1.6 | Navigate to My Day | Only widgets for Creator Studio modules appear |
| 1.7 | Open Customize Dashboard | Only Creator Studio widgets available |
| 1.8 | Check console for `[Seeksy Debug]` | Logs show: installedModuleIds, installed_collections, filtered widgets |

**Pass Criteria:**
- ✅ My Day shows ONLY widgets tied to installed modules (no Quick Create unless module installed)
- ✅ Customize Dashboard shows ONLY widgets tied to installed modules
- ✅ Console logs confirm correct `installed_collections` array

---

## Test Path 2: New Workspace → Individual Apps Install

| Step | Action | Expected Result |
|------|--------|-----------------|
| 2.1 | Create new workspace | Workspace created, redirected to onboarding |
| 2.2 | Select "Individual Apps" path | App browser opens |
| 2.3 | Install "Newsletter" only | Newsletter added to workspace |
| 2.4 | Navigate to sidebar | Newsletter appears as standalone item (NOT under "Marketing" parent) |
| 2.5 | Click Newsletter in sidebar | Navigates to `/newsletter` - NOT "Profile Not Found" |
| 2.6 | Install "Polls & Surveys" | Polls added to workspace |
| 2.7 | Check sidebar | Polls appears as standalone item (NOT under "Events" parent) |
| 2.8 | Click Polls in sidebar | Navigates to `/polls` - loads page correctly |

**Pass Criteria:**
- ✅ Newsletter is standalone in nav, route works
- ✅ Polls is standalone in nav, route works
- ✅ No parent groupings created (Marketing, Events, etc.)

---

## Test Path 3: Module Installation → Recommendations

| Step | Action | Expected Result |
|------|--------|-----------------|
| 3.1 | Install "Studio & Recording" | Module installed |
| 3.2 | Check for recommendations modal | Modal appears: "This Seeksy works well with: [Media Library, Podcasts]" |
| 3.3 | Click "Skip" | Modal closes, only Studio installed |
| 3.4 | Re-install different module | Recommendations modal appears again |
| 3.5 | Select one recommendation and confirm | Selected module added, others skipped |

**Pass Criteria:**
- ✅ Companions are NEVER auto-installed
- ✅ Recommendations always prompted

---

## Test Path 4: Sidebar Behavior

| Step | Action | Expected Result |
|------|--------|-----------------|
| 4.1 | Install multiple modules | All appear in sidebar as flat list |
| 4.2 | Collapse sidebar | Mini-rail visible with icons |
| 4.3 | Look for expand toggle | Toggle/hamburger always visible |
| 4.4 | Refresh page while collapsed | Sidebar remains collapsed but toggle still visible |
| 4.5 | Install "AI Clips" | Nav never becomes unusable |
| 4.6 | Check "Add Seeksy" button | Always visible, opens `/apps` |
| 4.7 | Check "Ask Spark" | In footer above Settings, route loads `/spark` |

**Pass Criteria:**
- ✅ Collapsing sidebar still provides visible expand control
- ✅ Ask Spark in footer → /spark loads
- ✅ Add Seeksy always opens App Store

---

## Test Path 5: Empty Workspace

| Step | Action | Expected Result |
|------|--------|-----------------|
| 5.1 | Create workspace with NO modules | Workspace created |
| 5.2 | Navigate to My Day | Empty state shown with CTA |
| 5.3 | Click "Add your first Seeksy" | Navigates to `/apps` |
| 5.4 | Check sidebar | Shows: My Day, Add Seeksy, Ask Spark, Settings |

**Pass Criteria:**
- ✅ Empty workspace shows helpful empty state
- ✅ Sidebar core items always present

---

## Test Path 6: Route Validation

| Step | Action | Expected Result |
|------|--------|-----------------|
| 6.1 | Install "Broadcast Monitoring" (coming soon) | Module installed |
| 6.2 | Click in sidebar | Redirects to `/coming-soon?module=broadcast-monitoring` |
| 6.3 | Check Coming Soon page | Shows module name, icon, helpful messaging |
| 6.4 | Click "Back to My Day" | Returns to My Day |
| 6.5 | Click "Explore other Seekies" | Opens `/apps` |

**Pass Criteria:**
- ✅ No "Profile Not Found" errors
- ✅ Coming Soon page feels intentional

---

## Debug Console Check

After running tests, verify these `[Seeksy Debug]` logs appear:

```
[Seeksy Debug] Workspace state:
  - installedModuleIds: ["newsletter", "polls", ...]
  - installed_collections: ["creator-studio"] or []
  
[Seeksy Debug] My Day filtered widgets:
  - Available widgets: 5
  - Sections: ["quick-actions", "productivity"]
  
[Seeksy Debug] Sidebar modules:
  - Flat list: ["Newsletter", "Polls & Surveys"]
  - No grouped parents
```

---

## Known Issues to Watch

1. **Stuck collapsed sidebar** - Should auto-recover on refresh
2. **Quick Create appearing without module** - Should not appear unless installed
3. **Profile Not Found on Newsletter** - Fixed with route validation

---

## Test Summary

| Test Path | Status | Notes |
|-----------|--------|-------|
| Collections Install | ⬜ | |
| Individual Apps Install | ⬜ | |
| Module Recommendations | ⬜ | |
| Sidebar Behavior | ⬜ | |
| Empty Workspace | ⬜ | |
| Route Validation | ⬜ | |

**Tested By:** ________________  
**Date:** ________________  
**Build/Commit:** ________________
