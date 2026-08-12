-- analyticsDepth/viewCountDetail (subscription_tiers.analytics_depth jsonb)
-- were editable per-plan on the admin Plans page and shown as a marketing
-- bullet on the agent Plan page, but no server code ever read them to
-- actually vary analytics behavior — AgentsController.getAnalytics/
-- getDailyAnalytics always returned full breakdown/timeseries data to every
-- tier regardless of this setting. Dead config, removed rather than wired
-- up, per explicit product decision.
alter table public.subscription_tiers drop column analytics_depth;
