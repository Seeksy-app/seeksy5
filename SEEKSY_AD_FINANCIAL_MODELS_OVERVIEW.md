# Seeksy Ad Revenue Financial Model — Overview

## Purpose

The Ad Revenue Financial Model is an enterprise-level projection and scenario planning system designed for the Seeksy CFO/Admin team. It provides:

1. **12-36 month projections** based on configurable assumptions
2. **Scenario comparison** (Base / Conservative / Aggressive)
3. **Creator earnings analysis** (how revenue splits between Seeksy and creators)
4. **Investor-ready presentation views** with narratives and charts
5. **CFO AI integration** for natural language queries about financial projections

---

## Database Schema

### Tables

#### 1. `ad_financial_scenarios`
Stores different projection scenarios (Base, Conservative, Aggressive).

```sql
CREATE TABLE ad_financial_scenarios (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Columns:**
- `name`: e.g., "Base Case", "Conservative Case", "Aggressive Case"
- `description`: Short explanation of the scenario
- `created_by`: User who created the scenario
- `is_default`: Whether this is the default scenario

---

#### 2. `ad_financial_assumptions`
Stores the configurable parameters that drive projections for each scenario.

```sql
CREATE TABLE ad_financial_assumptions (
  id UUID PRIMARY KEY,
  scenario_id UUID REFERENCES ad_financial_scenarios(id) ON DELETE CASCADE,
  
  -- Creator growth
  starting_creators INTEGER NOT NULL,
  monthly_creator_growth NUMERIC NOT NULL,
  percent_creators_monetized NUMERIC NOT NULL,
  episodes_per_creator_per_month NUMERIC NOT NULL,
  
  -- Impressions
  listens_per_episode NUMERIC NOT NULL,
  ad_slots_per_listen NUMERIC NOT NULL,
  fill_rate NUMERIC NOT NULL,
  
  -- CPM rates
  cpm_preroll NUMERIC NOT NULL,
  cpm_midroll NUMERIC NOT NULL,
  cpm_postroll NUMERIC NOT NULL,
  share_preroll NUMERIC NOT NULL,
  share_midroll NUMERIC NOT NULL,
  share_postroll NUMERIC NOT NULL,
  
  -- Revenue split
  creator_rev_share NUMERIC NOT NULL,
  platform_variable_cost_pct NUMERIC NOT NULL,
  
  -- Advertiser demand
  starting_campaigns INTEGER NOT NULL,
  monthly_campaign_growth NUMERIC NOT NULL,
  avg_campaign_monthly_budget NUMERIC NOT NULL,
  avg_campaign_duration_months NUMERIC NOT NULL,
  
  projection_months INTEGER DEFAULT 36,
  currency TEXT DEFAULT 'USD',
  assumptions_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Parameters:**
- **Creator Growth:** starting creators, monthly growth rate, % monetized
- **Impressions:** listens per episode, ad slots per listen, fill rate
- **CPM Rates:** preroll, midroll, postroll CPM values and distribution shares
- **Revenue Split:** creator revenue share %, platform variable costs %
- **Advertiser Demand:** starting campaigns, growth rate, avg monthly budget

---

#### 3. `ad_financial_projections`
Stores month-by-month projection results for each scenario.

```sql
CREATE TABLE ad_financial_projections (
  id UUID PRIMARY KEY,
  scenario_id UUID REFERENCES ad_financial_scenarios(id) ON DELETE CASCADE,
  month_index INTEGER NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  creators INTEGER NOT NULL,
  monetized_creators INTEGER NOT NULL,
  episodes INTEGER NOT NULL,
  
  impressions_preroll NUMERIC NOT NULL,
  impressions_midroll NUMERIC NOT NULL,
  impressions_postroll NUMERIC NOT NULL,
  total_impressions NUMERIC NOT NULL,
  
  gross_revenue_preroll NUMERIC NOT NULL,
  gross_revenue_midroll NUMERIC NOT NULL,
  gross_revenue_postroll NUMERIC NOT NULL,
  gross_revenue_total NUMERIC NOT NULL,
  
  active_campaigns INTEGER NOT NULL,
  max_billable_revenue NUMERIC NOT NULL,
  constrained_gross_revenue NUMERIC NOT NULL,
  
  creator_payout NUMERIC NOT NULL,
  platform_variable_costs NUMERIC NOT NULL,
  platform_net_revenue NUMERIC NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Columns:**
- **Growth Metrics:** creators, monetized creators, episodes
- **Impressions:** by slot type (preroll, midroll, postroll) and total
- **Revenue:** gross revenue by slot, constrained by advertiser budgets
- **Payouts:** creator payouts, platform variable costs, net platform revenue

---

#### 4. `ad_financial_model_summaries`
Stores high-level summary text for each scenario (used by CFO AI and Investor View).

```sql
CREATE TABLE ad_financial_model_summaries (
  id UUID PRIMARY KEY,
  scenario_id UUID REFERENCES ad_financial_scenarios(id) ON DELETE CASCADE,
  summary_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose:**
- Provides a narrative summary of each scenario's projections
- Used for quick reference in Investor View and CFO AI queries
- Auto-generated when projections are run

---

## Edge Function: `ad-financial-projection`

### Purpose
Computes month-by-month projections for a given scenario and writes results to `ad_financial_projections`.

### Input
```json
{
  "scenario_id": "uuid",
  "months": 12 | 24 | 36
}
```

### Process
1. Load scenario and assumptions from DB
2. Load recent actuals from `admin_revenue_reports` (baseline)
3. For each month (1..months):
   - Calculate creator growth: `creators_m = starting_creators * (1 + monthly_creator_growth)^(m-1)`
   - Calculate monetized creators and episodes
   - Calculate impressions: `total_listens_m * ad_slots_per_listen * fill_rate`
   - Split impressions by slot type (preroll/midroll/postroll)
   - Calculate gross revenue by CPM: `(impressions / 1000) * CPM`
   - Apply advertiser budget constraint: `min(gross_revenue, active_campaigns * avg_budget)`
   - Calculate creator payouts and platform net revenue
4. Insert all projection rows into `ad_financial_projections`
5. Generate and store summary in `ad_financial_model_summaries`

### Output
```json
{
  "success": true,
  "scenario_id": "uuid",
  "months": 12,
  "total_gross_revenue": 123456,
  "total_platform_revenue": 67890,
  "total_creator_payout": 45678,
  "total_impressions": 9876543,
  "summary": "Base Case Scenario - 12 Month Projection:\n- Total Impressions: 9,876,543\n..."
}
```

---

## UI: `/admin/financial-models/ads`

### Route
`/admin/financial-models/ads`

### Component
`src/pages/admin/AdFinancialModels.tsx`

### 4 Tabs

#### 1. **Assumptions Tab**
- **Purpose:** Edit baseline parameters for projections
- **Features:**
  - Load assumptions from `ad_financial_assumptions`
  - Display recent actuals (last 30 days) from `admin_revenue_reports`
  - Edit form with save/cancel buttons
  - Validation for percentages and numeric inputs

#### 2. **Scenarios Tab**
- **Purpose:** Compare Base / Conservative / Aggressive scenarios
- **Features:**
  - Scenario selector and month horizon (12/24/36)
  - "Run Projection" button (calls `ad-financial-projection` edge function)
  - Line chart: Total Seeksy revenue over time
  - Stacked area chart: Impressions by slot type
  - Summary cards: total revenue, impressions, payouts
  - CSV export for selected scenario

#### 3. **Creator Earnings Tab**
- **Purpose:** Analyze creator payouts vs platform revenue
- **Features:**
  - Line chart: Creator payouts vs Platform revenue
  - Bar chart: Revenue distribution by month
  - Summary cards:
    - Total creator payouts
    - Total Seeksy revenue
    - Effective revenue share %
    - Avg creator earnings per monetized creator
  - Narrative summary from `ad_financial_model_summaries`

#### 4. **Investor View Tab**
- **Purpose:** Presentation-ready view for investors
- **Features:**
  - Clean, high-level charts (12-month revenue curve)
  - Key bullets:
    - Year 1 projected revenue
    - Year 1 creator payouts
    - Seeksy gross margin %
    - Avg monthly growth %
    - Primary drivers (CPM, impressions, conversions)
  - Narrative per scenario (Base/Conservative/Aggressive)
  - "Export PDF" and "Share with Investors" buttons

---

## CFO AI Integration

### Context Enrichment
The CFO AI assistant is enriched with data from:
- `ad_financial_model_summaries` (scenario summaries)
- `ad_financial_projections` (year 1 metrics)

### Example Queries
- "What is our Year 1 revenue in the Base vs Conservative scenarios?"
- "How much of Year 1 revenue comes from AI tools in the Aggressive case?"
- "What's the creator payout vs Seeksy margin in the downside scenario?"

### Implementation
The CFO AI edge function (`cfo-ai-assistant`) loads scenario summaries and includes them in the system prompt, allowing the AI to answer natural language questions about financial projections.

---

## Data Flow

1. **Admin edits assumptions** → Saves to `ad_financial_assumptions`
2. **Admin clicks "Run Projection"** → Calls `ad-financial-projection` edge function
3. **Edge function computes projections** → Writes to `ad_financial_projections` and `ad_financial_model_summaries`
4. **UI loads projections** → Displays charts and summaries
5. **CFO AI queries** → Reads summaries and projections to answer questions

---

## Future Enhancements

1. **Editable scenarios:** Allow admins to create custom scenarios with modified assumptions
2. **Real-time actuals integration:** Continuously update baseline from live revenue data
3. **Multi-revenue stream modeling:** Add AI tools, awards, voice licensing projections
4. **Sensitivity analysis:** Show how changes in key assumptions impact revenue
5. **Investor portal access:** Allow external investors to view selected scenarios

---

## Summary

The Ad Revenue Financial Model provides Seeksy's finance team with:
- **Enterprise-level financial planning** with configurable assumptions
- **Scenario comparison** for risk analysis and sensitivity testing
- **Creator earnings transparency** showing how revenue splits
- **Investor-ready presentations** with clean charts and narratives
- **CFO AI integration** for natural language financial queries

This system enables data-driven decision-making and clear communication with stakeholders about Seeksy's ad revenue growth trajectory.
