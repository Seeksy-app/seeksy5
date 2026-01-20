-- AI Daily Briefs table for trucking call/load analytics
CREATE TABLE IF NOT EXISTS public.ai_daily_briefs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  org_id uuid null,
  date_local date not null,
  timezone text not null default 'America/Chicago',
  total_calls int not null default 0,
  answered_calls int not null default 0,
  missed_calls int not null default 0,
  voicemails int not null default 0,
  avg_call_seconds int not null default 0,
  avg_time_to_qualify_seconds int not null default 0,
  repeat_callers int not null default 0,
  tech_issues_count int not null default 0,
  loads_active int not null default 0,
  loads_with_calls int not null default 0,
  loads_confirmed int not null default 0,
  loads_declined int not null default 0,
  loads_pending int not null default 0,
  executive_summary text not null default '',
  insights jsonb not null default '[]'::jsonb,
  short_term_recs jsonb not null default '[]'::jsonb,
  long_term_index jsonb not null default '{}'::jsonb,
  per_load jsonb not null default '[]'::jsonb,
  flags jsonb not null default '{}'::jsonb,
  source_window jsonb not null default '{}'::jsonb,
  status text not null default 'generated'
);

-- Unique index for org + date combination
CREATE UNIQUE INDEX IF NOT EXISTS ai_daily_briefs_org_date
ON public.ai_daily_briefs(org_id, date_local);

-- Enable RLS
ALTER TABLE public.ai_daily_briefs ENABLE ROW LEVEL SECURITY;

-- RLS policy: users can read their own org's briefs
CREATE POLICY "Users can view their own org briefs"
ON public.ai_daily_briefs
FOR SELECT
USING (auth.uid() = org_id OR org_id IS NULL);

-- RLS policy: users can insert their own org's briefs
CREATE POLICY "Users can insert their own org briefs"
ON public.ai_daily_briefs
FOR INSERT
WITH CHECK (auth.uid() = org_id OR org_id IS NULL);

-- RLS policy: users can update their own org's briefs
CREATE POLICY "Users can update their own org briefs"
ON public.ai_daily_briefs
FOR UPDATE
USING (auth.uid() = org_id OR org_id IS NULL);