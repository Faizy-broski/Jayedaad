// Every render site of AgentOverview (Super Admin CRM's agent picker,
// per-lead attribution label, "Reassign to…" dropdown) used to fall back
// to `agent.id` — a raw UUID — whenever agent_profiles.display_name was
// NULL, a real, reachable state (see 0055_default_signup_role_agent.sql's
// two independently-coalescing display_name expressions, which can leave
// it unset for some signup paths). Centralizes the real fallback order in
// one place instead of three independent copies of the same bug. Distinct
// from getDisplayName.ts (which resolves the SIGNED-IN user's own name off
// raw Supabase user_metadata) — this works off an already-fetched
// AgentOverview/Agency row's own displayName/email fields.
export function resolveAgentDisplayName(agent: { displayName: string | null; email: string | null } | null | undefined): string {
  return agent?.displayName || agent?.email || 'Unnamed agent';
}
