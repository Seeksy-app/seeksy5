# Multi-Tenant Architecture Guide

## Overview

Seeksy uses a multi-tenant architecture where **every shared table is scoped by `tenant_id`**. This ensures complete data isolation between:

- **Platform (Admin)** - `seeksy_platform`
- **Creators** - `creator`
- **Advertisers** - `advertiser`
- **Board** - `board`
- **Subscribers** - `subscriber`

## Core Concepts

### Tenant Types

| Type | Description | Example Use |
|------|-------------|-------------|
| `seeksy_platform` | Platform-level operations | Admin campaigns, platform settings |
| `creator` | Individual creator workspace | Creator's subscriber lists, episodes |
| `advertiser` | Advertiser organization | Ad campaigns, billing |
| `board` | Board/investor portal | Board documents, reports |
| `subscriber` | End-user account | Subscriber preferences |

### Tenant Roles

| Role | Permissions |
|------|-------------|
| `viewer` | Read-only access |
| `editor` | Read + write access |
| `admin` | Full access including delete and member management |

## Database Pattern

### Required Columns for Tenant-Scoped Tables

```sql
-- Every shared table MUST have:
tenant_id UUID NOT NULL REFERENCES public.tenants(id)

-- Recommended additional columns:
created_by UUID REFERENCES auth.users(id)
updated_by UUID REFERENCES auth.users(id)
```

### Required Index

```sql
CREATE INDEX idx_{table}_tenant ON public.{table}(tenant_id);
```

### RLS Policy Template

```sql
-- Enable RLS
ALTER TABLE public.{table} ENABLE ROW LEVEL SECURITY;

-- Platform admins can do anything
CREATE POLICY "Platform admins manage {table}"
  ON public.{table} FOR ALL
  USING (is_seeksy_platform_admin());

-- Tenant members can view
CREATE POLICY "Tenant members view {table}"
  ON public.{table} FOR SELECT
  USING (has_tenant_role(tenant_id, 'viewer'));

-- Tenant editors can edit
CREATE POLICY "Tenant editors manage {table}"
  ON public.{table} FOR ALL
  USING (has_tenant_role(tenant_id, 'editor'));
```

## App-Level Implementation

### TenantContext

```tsx
import { useTenant } from '@/contexts/TenantContext';

function MyComponent() {
  const { 
    activeTenantId,    // Current tenant scope
    activeTenant,      // Tenant object with name, type, etc.
    switchTenant,      // Change active tenant
    isPlatformAdmin,   // Is user a platform admin?
    requireTenantId,   // Get tenant ID or throw
  } = useTenant();
}
```

### Tenant-Scoped Queries

```tsx
import { useTenantQuery } from '@/hooks/useTenantQuery';

// Automatic tenant filtering
const { data: lists } = useTenantQuery({
  queryKey: ['subscriber-lists'],
  table: 'subscriber_lists',
  selectColumns: '*',
  orderBy: { column: 'created_at', ascending: false },
});
```

### Tenant-Scoped Mutations

```tsx
import { useTenantMutation } from '@/hooks/useTenantQuery';

function CreateList() {
  const { withTenant } = useTenantMutation();

  const handleCreate = async () => {
    const { error } = await supabase
      .from('subscriber_lists')
      .insert(withTenant({
        name: 'My List',
        slug: 'my-list',
      }));
  };
}
```

## Checklist for New Tables

When creating a new shared table:

- [ ] Add `tenant_id UUID NOT NULL REFERENCES tenants(id)`
- [ ] Add index: `CREATE INDEX idx_{table}_tenant ON {table}(tenant_id)`
- [ ] Enable RLS: `ALTER TABLE {table} ENABLE ROW LEVEL SECURITY`
- [ ] Add RLS policies (platform admin, tenant viewer, tenant editor)
- [ ] Use `useTenantQuery` for reads
- [ ] Use `withTenant()` for inserts
- [ ] Add to this documentation

## Tables Currently Tenant-Scoped

| Table | Status |
|-------|--------|
| `tenants` | ✅ Core |
| `tenant_memberships` | ✅ Core |
| `subscriber_lists` | ✅ Migrated |
| `marketing_campaigns` | ✅ Migrated |
| `cta_definitions` | ✅ Migrated |
| `newsletter_subscribers` | ✅ Migrated |
| `campaign_lists` | ✅ Migrated |
| `email_campaigns` | ✅ Migrated |
| `subscriber_list_members` | ✅ Migrated |

## Helper Functions

### `is_seeksy_platform_admin()`
Returns `true` if the current user is an admin of the `seeksy_platform` tenant.

### `has_tenant_role(tenant_id, min_role)`
Returns `true` if the current user has at least `min_role` in the specified tenant.

### `get_user_tenant_ids()`
Returns all tenant IDs the user has membership in.

### `get_user_default_tenant()`
Returns the user's default tenant ID.

## Migration Path for Existing Tables

1. Add nullable `tenant_id` column
2. Backfill with appropriate tenant (usually `seeksy_platform` for platform data)
3. Add index
4. Add RLS policies
5. Update app code to use tenant scope
6. Make `tenant_id` NOT NULL

## Portal → Tenant Mapping

| Portal | Tenant Type | Scope |
|--------|-------------|-------|
| `/admin/*` | `seeksy_platform` | Platform-wide |
| `/creator/*` | `creator` | User's creator workspace |
| `/advertiser/*` | `advertiser` | Advertiser org |
| `/board/*` | `board` | Board org |
| `/s/*` | `subscriber` | Individual subscriber |

## Public Subscribe Flow (CTA-Driven Tenant Assignment)

Anonymous users subscribing to newsletters **MUST** go through the edge function:

```tsx
import { useNewsletterSubscribe, PLATFORM_CTA_IDS } from '@/hooks/useNewsletterSubscribe';

function SubscribeForm() {
  const { subscribe, isLoading } = useNewsletterSubscribe();
  
  const handleSubmit = async (email: string) => {
    // CTA ID determines tenant - NEVER accept tenant_id from client
    const result = await subscribe({
      email,
      source: 'footer',
      ctaId: PLATFORM_CTA_IDS.FOOTER // Bound to seeksy_platform tenant
    });
  };
}
```

### Security Rules
- ❌ **NEVER** accept `tenant_id` from client
- ✅ Tenant is derived from `cta_definitions.tenant_id` in edge function
- ✅ Edge function uses service_role to bypass RLS for inserts
- ✅ Client-side direct INSERT is blocked by RLS

### GTM Events
- `subscription_completed` fires BEFORE API call (non-blocking analytics)
- Payload includes: `email_domain`, `source`, `cta_id`, `page_path`, `timestamp`

---

## New Table Checklist

When creating a new tenant-scoped table:

- [ ] Add `tenant_id UUID NOT NULL REFERENCES tenants(id)`
- [ ] Add index: `CREATE INDEX idx_{table}_tenant ON {table}(tenant_id)`
- [ ] Add unique constraint where appropriate (e.g., `UNIQUE(tenant_id, email)`)
- [ ] Enable RLS: `ALTER TABLE {table} ENABLE ROW LEVEL SECURITY`
- [ ] Add platform admin policy
- [ ] Add tenant member policies (viewer/editor)
- [ ] Use `useTenantQuery` or `useTenantMutation` in app code
- [ ] Never insert without `tenant_id`
- [ ] Test: verify tenant isolation works

---

## Anti-Patterns to Avoid

❌ **Don't** query shared tables without tenant filter  
❌ **Don't** insert without `tenant_id`  
❌ **Don't** use `user_id` for shared data (use `tenant_id` + `created_by`)  
❌ **Don't** create portal-specific tables when one tenant-scoped table works  
❌ **Don't** accept `tenant_id` from anonymous clients (use CTA-driven assignment)

✅ **Do** use `requireTenantId()` to fail fast if no tenant  
✅ **Do** use RLS as the enforcement layer, UI checks as convenience  
✅ **Do** use one table with tenant scope for shared engines  
✅ **Do** route public subscriptions through edge functions
