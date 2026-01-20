# Seeksy Sales Rate Desk - Technical Overview

## Purpose

The Sales Rate Desk is an internal admin tool that transforms Seeksy's financial models into a usable pricing and proposal system for the sales team. It bridges the gap between financial projections and day-to-day sales operations, enabling the team to:

- **Quote consistent pricing** based on financial scenarios
- **Build proposals** quickly with recommended CPMs
- **Understand inventory health** across all ad placements
- **Leverage AI insights** for sales questions

## Architecture

### Built on Existing Financial Models

The Rate Desk does **not** create a separate financial system. Instead, it:

1. **Reads from existing tables:**
   - `ad_financial_scenarios` - Base, Conservative, Aggressive scenarios
   - `ad_financial_assumptions` - CPM rates, revenue shares, growth rates
   - `ad_financial_projections` - Monthly forecast data
   - `ad_financial_model_summaries` - AI-generated scenario summaries

2. **Extends with operational data:**
   - `ad_inventory_units` - Sellable ad placements with pricing
   - `ad_rate_cards` - Quarterly CPM recommendations (optional)

3. **Provides sales-focused UI:**
   - Real-time pricing calculator
   - Proposal builder
   - Inventory health monitoring
   - AI assistant for pricing questions

## Database Tables

### `ad_inventory_units`

Represents each sellable ad placement across Seeksy's platform.

**Fields:**
- `id` (UUID) - Primary key
- `name` (text) - Display name (e.g., "Podcast Midroll")
- `slug` (text, unique) - URL-safe identifier
- `type` (enum) - podcast | livestream | event | creator_page | newsletter | other
- `placement` (enum) - pre | mid | post | display | sponsored_segment | sponsorship_package
- `target_cpm` (numeric) - Baseline CPM target ($)
- `floor_cpm` (numeric) - Minimum acceptable CPM ($)
- `ceiling_cpm` (numeric) - Maximum premium CPM ($)
- `expected_monthly_impressions` (numeric) - Forecasted monthly volume
- `seasonality_factor` (numeric, default 1.0) - Seasonal adjustment multiplier
- `is_active` (boolean) - Whether unit is available for sale
- `created_at`, `updated_at` (timestamps)

**Seeded Units:**
- Podcast Midroll, Pre-roll, Post-roll
- Livestream Sponsorship, Mid-break
- Event Sponsorship
- Creator Page Display
- Newsletter Sponsored

### `ad_rate_cards` (Optional)

Stores quarterly CPM recommendations for specific scenarios.

**Fields:**
- `id` (UUID) - Primary key
- `inventory_unit_id` (FK) - References `ad_inventory_units`
- `year` (int) - Calendar year
- `quarter` (int) - 1-4
- `scenario_slug` (enum) - base | conservative | aggressive
- `recommended_cpm` (numeric) - Recommended CPM for this period
- `bulk_discount_cpm` (numeric) - Discounted rate for large buys
- `min_commit_impressions` (numeric) - Minimum commitment threshold
- `notes` (text) - Sales notes
- `created_at`, `updated_at` (timestamps)

**Unique constraint:** `(inventory_unit_id, year, quarter, scenario_slug)`

## Sales Pricing Engine

Location: `src/lib/ads/salesPricingEngine.ts`

### Core Logic

The engine calculates recommended CPMs using a multi-factor approach:

1. **Type Multipliers**
   ```typescript
   const TYPE_CPM_MULTIPLIERS = {
     podcast: 1.0,       // Baseline
     livestream: 1.2,    // +20% (real-time engagement premium)
     event: 1.4,         // +40% (high-intent audience)
     creator_page: 0.8,  // -20% (display, lower engagement)
     newsletter: 0.9,    // -10% (email placement)
   };
   ```

2. **Scenario Adjustments**
   ```typescript
   const SCENARIO_MULTIPLIERS = {
     conservative: 0.85,  // -15% (market uncertainty)
     base: 1.0,           // Baseline
     aggressive: 1.15,    // +15% (growth optimism)
   };
   ```

3. **CPM Calculation**
   ```typescript
   recommended_cpm = target_cpm 
                     × type_multiplier 
                     × scenario_multiplier 
                     × seasonality_factor
   
   // Constrained by floor and ceiling
   recommended_cpm = max(floor_cpm, min(ceiling_cpm, recommended_cpm))
   ```

4. **Revenue Projection**
   ```typescript
   potential_revenue = (monthly_impressions / 1000) × recommended_cpm
   ```

5. **Health Status**
   - **Underpriced**: recommended_cpm < target_cpm × 0.9
   - **Healthy**: within 10% of target
   - **Premium**: recommended_cpm > target_cpm × 1.2

### Key Functions

**`getRateDeskView(options)`**

Returns complete rate desk data:
```typescript
interface RateDeskView {
  scenario: {
    slug: string;
    name: string;
    description: string | null;
  };
  summary: {
    total_sellable_impressions_30d: number;
    total_sellable_impressions_90d: number;
    total_sellable_impressions_12m: number;
    potential_gross_spend_30d: number;
    potential_gross_spend_90d: number;
    potential_gross_spend_12m: number;
    seeksy_revenue_30d: number;
    seeksy_revenue_90d: number;
    seeksy_revenue_12m: number;
    average_recommended_cpm: number;
  };
  inventory: InventoryUnitWithPricing[];
}
```

**Helper Functions:**
- `formatCurrency(amount)` - Formats as USD
- `formatNumber(num)` - Formats with K/M suffixes

## Admin UI Components

### Page: `AdminRateDesk.tsx`

Location: `/admin/advertising/rate-desk`

#### Top Section: Filters & Summary

**Scenario Selector:**
- Conservative
- Base
- Aggressive

**Time Window:**
- Next 30 Days
- Next Quarter (90 days)
- Next 12 Months

**Filter by Type:**
- All, Podcast, Livestream, Event, Creator Page, Newsletter

**Summary Cards:**
1. **Sellable Impressions** - Total available inventory
2. **Potential Gross Spend** - Total advertiser budget
3. **Seeksy Revenue** - Platform share (30%)
4. **Average Recommended CPM** - Across all inventory

#### Main Inventory Table

**Columns:**
- Inventory Unit (name + type + placement)
- Monthly Impressions
- Recommended CPM
- Floor / Ceiling CPM (range)
- Potential Revenue (for selected window)
- Status Badge (Underpriced | Healthy | Premium)
- Add to Proposal button

**Features:**
- Sortable by any column
- Filter by inventory type
- Real-time updates when scenario changes
- Color-coded health status

#### Proposal Builder Panel

**Line Items:**
- Each added inventory unit becomes editable line item
- Edit CPM and impressions inline
- Real-time total calculation
- Remove items individually

**Totals:**
- **Proposal Subtotal** - Sum of all line items
- **Seeksy Revenue (30%)** - Platform share
- **Creator Payouts (70%)** - Creator earnings

**Actions:**
- **Copy Summary** - Text format to clipboard
- **Download CSV** - Structured proposal export

**CSV Format:**
```
Item,Type,Placement,CPM,Impressions,Total
"Podcast Midroll","podcast","mid",25.00,50000,1250.00
...

Subtotal,,,,5000.00
Seeksy Revenue,,,,1500.00
Creator Payouts,,,,3500.00
```

#### AI Assistant Card

**Purpose:** Connect sales team to CFO AI for pricing insights

**Example Questions:**
- "What CPM should we quote for a $50K quarterly buy in the Aggressive scenario?"
- "Which inventory is underpriced in the Base scenario?"
- "If we sell 80% of March impressions, how much Seeksy revenue is generated?"
- "What's our average CPM across all livestream placements?"

**Implementation:** Uses existing Seeksy AI Chat Widget with enhanced context

## AI Integration

### Enhanced CFO AI Context

The `cfo-ai-assistant` edge function now includes Rate Desk data in its system prompt:

**Additional Context:**
```
** SALES RATE DESK - AD INVENTORY OVERVIEW **

Total Active Inventory Units: 8
Total Monthly Sellable Impressions: 450K
Average Target CPM: $25.75
Potential Monthly Gross Ad Spend: $11.6K
Potential Quarterly Revenue: $34.8K
Potential Annual Revenue: $0.14M

Inventory Breakdown by Type:
  - podcast: 3 units, 185K impressions/month, $20.00 avg CPM
  - livestream: 2 units, 60K impressions/month, $32.50 avg CPM
  - event: 1 unit, 15K impressions/month, $45.00 avg CPM
  - creator_page: 1 unit, 100K impressions/month, $18.00 avg CPM
  - newsletter: 1 unit, 40K impressions/month, $22.00 avg CPM

CPM Ranges by Placement:
  - Podcast Midroll (podcast): Floor $18 - Target $25 - Ceiling $40
  ...

When users ask about:
- "What CPM should we quote for...?" - Reference target CPM ranges and adjust based on scenario
- "Which inventory is underpriced?" - Compare target CPM to floor CPM
- "How much revenue if we sell X% of impressions?" - Calculate with platform share
```

**AI Response Patterns:**

For pricing questions:
```
Q: "What CPM should we quote for a $50K quarterly buy in Aggressive scenario?"
A: "In the Aggressive scenario, our CPMs are 15% above baseline. For a $50K quarterly buy:
   - Podcast Midroll: $28.75 CPM (target $25 × 1.15)
   - Livestream Sponsorship: $46.00 CPM (target $40 × 1.15)
   
   At these rates, $50K would purchase approximately 1.3M impressions across mix."
```

For inventory health:
```
Q: "Which inventory is underpriced in Base scenario?"
A: "In Base scenario, Creator Page Display is underpriced at $18 CPM (floor $12), 
   operating at minimum acceptable rate. Consider raising to $22-24 for healthier margin."
```

For revenue forecasting:
```
Q: "If we sell 80% of March impressions, how much Seeksy revenue?"
A: "March total inventory: 450K impressions
   80% sold: 360K impressions
   Average CPM: $25.75
   Gross spend: $9,270
   Seeksy revenue (30%): $2,781"
```

## Security & Access Control

### RLS Policies

Both new tables use admin-only Row Level Security:

**`ad_inventory_units`:**
- SELECT: Admins only
- INSERT: Admins only
- UPDATE: Admins only
- DELETE: Admins only

**`ad_rate_cards`:**
- SELECT: Admins only
- INSERT: Admins only
- UPDATE: Admins only
- DELETE: Admins only

### Navigation

**Sidebar:**
- Under **Advertising** section (Admin only)
- Item: "Sales Rate Desk"
- Icon: TrendingUp
- Route: `/admin/advertising/rate-desk`

**Access Check:**
```typescript
EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_roles.user_id = auth.uid()
  AND user_roles.role IN ('admin', 'super_admin')
)
```

## Usage Workflow

### Daily Sales Operations

1. **Morning Pricing Check**
   - Sales lead opens Rate Desk
   - Selects current scenario (Base)
   - Reviews inventory health
   - Notes any underpriced units

2. **Quote Generation**
   - Advertiser requests pricing for specific placements
   - Sales rep filters by type (e.g., Podcast)
   - Adds relevant units to proposal
   - Adjusts CPM/impressions if needed
   - Downloads CSV or copies summary
   - Sends to advertiser

3. **Deal Sizing**
   - Advertiser has budget target ($50K)
   - Sales rep uses AI: "What CPM for $50K quarterly buy?"
   - AI provides impression breakdown
   - Rep builds proposal matching budget

4. **Health Monitoring**
   - Weekly review of inventory status
   - Identify underpriced units
   - Adjust floor/target/ceiling CPMs in database
   - Re-run Rate Desk view to see new recommendations

### Scenario Planning

**Conservative Scenario:**
- Used during economic uncertainty
- All CPMs reduced 15%
- More cautious impression forecasts
- Lower revenue projections

**Base Scenario:**
- Default operational scenario
- Reflects current market conditions
- Balanced risk/reward

**Aggressive Scenario:**
- Growth-focused pricing
- CPMs increased 15%
- Optimistic impression forecasts
- Used when market is strong

## Integration Points

### Connects To:

1. **Ad Financial Model** (`/admin/financial-models/ads`)
   - Pulls scenarios and assumptions
   - Uses projected CPM rates
   - Aligns revenue forecasts

2. **Combined Revenue Model** (`/admin/financial-models/combined`)
   - Ad inventory feeds into total platform revenue
   - Rate Desk actuals vs projections

3. **CFO Dashboard** (`/cfo-dashboard`)
   - Sales team pricing decisions flow to financial reporting
   - Actual deals vs Rate Desk recommendations

4. **CFO AI Assistant**
   - Enhanced with Rate Desk context
   - Answers sales pricing questions
   - Provides real-time inventory insights

### Does Not Connect To:

- **Advertiser Module** - Rate Desk is internal only
- **Campaign Management** - Separate operational system
- **Creator Payouts** - Calculations happen at deal close, not in Rate Desk

## Future Enhancements

### Short Term
- Add bulk discount calculator
- Integrate historical deal data
- Add "similar deal" recommendations
- Export to Google Sheets

### Medium Term
- Connect to CRM for deal tracking
- Add win/loss analysis by CPM range
- Seasonality auto-adjustments
- Real-time market CPM benchmarks

### Long Term
- AI-powered pricing recommendations
- Dynamic CPM optimization
- A/B test pricing strategies
- Competitive intelligence integration

## Troubleshooting

### Common Issues

**"No inventory units showing"**
- Check `ad_inventory_units` table has `is_active = true` records
- Verify admin RLS policies are correctly configured
- Ensure user has admin role in `user_roles` table

**"CPMs seem incorrect"**
- Review scenario multipliers in `salesPricingEngine.ts`
- Check `ad_financial_assumptions` for base CPM rates
- Verify type multipliers match business strategy

**"AI not answering Rate Desk questions"**
- Confirm `cfo-ai-assistant` edge function deployed
- Check Rate Desk context is included in system prompt
- Verify inventory units are being fetched in edge function

**"Proposal totals don't match"**
- Ensure platform share (30%) is correctly applied
- Check for rounding in CPM or impression edits
- Verify line item calculations: `(impressions / 1000) × CPM`

## Technical Stack

**Frontend:**
- React + TypeScript
- Tailwind CSS + shadcn/ui components
- TanStack Query for data fetching

**Backend:**
- Supabase (PostgreSQL)
- Row Level Security (RLS)
- Supabase Edge Functions (Deno)

**AI:**
- Google Gemini 2.5 Flash (via Lovable AI)
- Context-aware financial assistant
- Real-time inventory data integration

## Maintenance

### Regular Updates

**Weekly:**
- Review inventory health status
- Adjust CPM targets based on market conditions
- Update seasonality factors for upcoming months

**Monthly:**
- Add new inventory units as platform expands
- Review and adjust scenario multipliers
- Update rate cards for upcoming quarter

**Quarterly:**
- Full audit of all CPM ranges
- Align Rate Desk with updated financial models
- Review AI assistant response accuracy

---

**Last Updated:** 2025-11-28  
**Version:** 1.0  
**Owner:** Seeksy Finance & Sales Teams
