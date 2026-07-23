# Jayedaad Platform — Comprehensive Production-Ready Architectural Blueprint & Execution Plan

**Prepared as:** Architectural response to `Jayedaad_Comprehensive_Platform_Specification.md`, `Jayedaad_Dev_Instructions_RBAC_CRM.md`, and `Jayedaad_Requirements_Confirmation.md`
**Scope:** Web (Next.js) + Mobile (React Native, Android/iOS) + Unified REST API + CRM + Role-Aware AI Chatbot
**Delivery window:** Fixed 2 months (8 weeks)

Every section below is written as a direct architectural response to specific, cited requirements in the three source documents — not generic boilerplate. Citations use the shorthand `[Spec §n]`, `[Dev Instr §n]`, `[Reqs §n]` referring to section numbers in the three inputs.

---

## 1. High-Level System Architecture

### 1.1 Guiding constraint
`[Spec §2]` mandates **one REST API as the single source of truth** for web and mobile. `[Spec §9]` and `[Reqs §4.3]` mandate that view/query counts never diverge across Web, Mobile, Agent Portal, and Admin Panel. This rules out any architecture where mobile and web hit different backends, or where counts are computed client-side. The topology below is built around a single stateless API tier fronting a single relational store.

### 1.2 Infrastructure topology

| Layer | Choice | Why |
|---|---|---|
| Web hosting | Vercel (Next.js, SSR/ISR for SEO on property detail pages) | Fast to ship in a 2-month window; built-in preview deployments satisfy staging parity `[Spec §2]` |
| Mobile | Single React Native codebase, distributed via EAS Build → TestFlight (iOS) / Play Internal Testing (Android) | `[Spec §2]` requires exact feature parity from one codebase |
| API tier | Containerized Node.js/TypeScript service (NestJS) on AWS ECS Fargate (or GCP Cloud Run) behind an ALB/API Gateway, horizontally scaled | Single source of truth `[Spec §2]`; stateless containers scale independently for CRM-heavy load `[Dev Instr §1]` |
| Primary datastore | PostgreSQL (RDS/Cloud SQL, Multi-AZ) | Relational integrity needed for FK-linked leads↔listings `[Dev Instr §3.1]` and strict status enums |
| Cache / real-time counters | Redis (ElastiCache/Memorystore) | Backing store for the single-source-of-truth view/query counter described in §1.4 below |
| Object storage | S3 / GCS with a compression pipeline (e.g., Sharp/Lambda@Edge or Cloud Function on upload) | `[Spec §2]` "image upload/storage pipeline with automatic compression" |
| Push notifications | Firebase Cloud Messaging (Android) + APNs, unified behind an internal Notification Service | `[Spec §2]` push for new matches, inquiry replies, status updates |
| Search | Postgres full-text + trigram indexes initially; abstracted behind a `SearchService` interface so it can be swapped for OpenSearch/Elasticsearch post-launch if the CRM/property search performance targets `[Dev Instr §1]` demand it without a rewrite |
| AI Chatbot | Stateless service (calls an LLM provider) sitting behind the same API gateway, sharing the same auth/session context | See §4.3 |
| Auth | JWT (access + refresh), phone OTP for registration `[Spec §2]` | Role claims embedded in JWT drive both RBAC (§3) and chatbot role-switching (§4.3) |
| CI/CD | GitHub Actions → per-environment pipelines (see §5.2) | `[Reqs §11]` Jayedaad owns the GitHub repo outright post-handover |

### 1.3 Text-based data flow diagram

```
                         ┌────────────────────────────┐
                         │   Auth Service (JWT + OTP) │
                         └──────────────┬─────────────┘
                                        │ issues role-bearing JWT
                                        ▼
┌───────────┐   ┌───────────┐   ┌──────────────┐   ┌───────────────┐
│  Next.js  │   │React Native│   │ Agent Portal │   │  Admin/Verify │
│   Web     │   │  Mobile    │   │  (web app,   │   │  Panel (web)  │
│ (Buyer/   │   │(Buyer/     │   │  same RN or  │   │               │
│  Owner)   │   │ Owner)     │   │  Next.js UI) │   │               │
└─────┬─────┘   └─────┬──────┘   └──────┬───────┘   └───────┬───────┘
      │               │                 │                    │
      └───────────────┴────────┬────────┴────────────────────┘
                                ▼
                  ┌──────────────────────────┐
                  │   Single REST API Layer   │   ← RBAC middleware (§3)
                  │        (NestJS)           │      applied on EVERY request
                  └─────────────┬─────────────┘
             ┌──────────────────┼───────────────────────┐
             ▼                  ▼                        ▼
     ┌───────────────┐  ┌───────────────┐      ┌───────────────────┐
     │  PostgreSQL    │  │     Redis      │      │  AI Chatbot Svc   │
     │ (source of     │  │ (view/query    │      │ (role-aware,      │
     │  truth: users, │  │  counters,     │      │  behind same      │
     │  listings,     │  │  session cache)│      │  API gateway)     │
     │  leads, CRM,   │  └───────────────┘      └───────────────────┘
     │  audit logs)   │
     └───────┬────────┘
             │
             ▼
   ┌───────────────────┐        ┌──────────────────────┐
   │  S3/GCS + image    │        │ Push Notification Svc│
   │  compression Δ     │        │ (FCM/APNs), triggered │
   └───────────────────┘        │ off DB events         │
                                 └──────────────────────┘
```

Because every client (Web, Mobile, Agent Portal, Admin Panel) calls the **same** API endpoints for view increments and search-query logging, and those endpoints write through to the same Postgres tables (cached via the same Redis keys), count parity `[Spec §9, Reqs §4.3]` is structural rather than something reconciled after the fact.

---

## 2. Frontend Architecture (Web & Mobile via MVVM/Clean Architecture)

### 2.1 Why Clean Architecture here specifically
`[Spec §2]` requires the mobile app to maintain **exact feature parity** with web. Building two independent codebases invites drift. The answer is a monorepo where business logic (ViewModels + Services) is platform-agnostic and only the View layer differs.

### 2.2 Monorepo folder structure

```
jayedaad/
├── apps/
│   ├── web/                         # Next.js — Views only
│   │   ├── app/(buyer)/search/page.tsx
│   │   ├── app/(agent)/crm/page.tsx
│   │   └── app/(admin)/verification/page.tsx
│   └── mobile/                      # React Native — Views only
│       ├── src/screens/BuyerSearchScreen.tsx
│       ├── src/screens/AgentCRMScreen.tsx
│       └── src/navigation/
├── packages/
│   ├── core/                        # Shared, platform-agnostic
│   │   ├── models/                  # TS types/interfaces (Listing, Lead, User, Subscription)
│   │   ├── viewmodels/              # Custom hooks — the "VM" in MVVM
│   │   │   ├── useLeadInboxViewModel.ts
│   │   │   ├── useListingSearchViewModel.ts
│   │   │   ├── useVerificationQueueViewModel.ts
│   │   │   └── useChatbotViewModel.ts
│   │   ├── services/                # Repositories — API integration only
│   │   │   ├── leadsRepository.ts
│   │   │   ├── listingsRepository.ts
│   │   │   └── httpClient.ts        # single axios/fetch instance, JWT interceptor
│   │   └── state/                   # Zustand stores (UI/local state) + React Query config
│   ├── ui-web/                      # Web-only presentational components (Tailwind/shadcn)
│   └── ui-native/                   # RN-only presentational components (NativeWind/RN Paper)
└── services/
    └── api/                         # NestJS backend (see §3)
```

**Rule enforced by lint/CI:** files under `apps/*` may import from `packages/core` and their own `ui-*` package, but never contain direct `fetch`/`axios` calls or business rules — those live only in `viewmodels/` and `services/`. This is what makes the mobile/web parity requirement `[Spec §2]` enforceable rather than aspirational.

### 2.3 State management

| Concern | Choice | Rationale |
|---|---|---|
| Server state (listings, leads, CRM pipeline, view counts) | **React Query (TanStack Query)** | Built-in caching, background refetch, and optimistic updates — directly serves `[Dev Instr §1]` "minimize clicks for high-frequency actions" (status change, note add) via `useMutation` optimistic updates that feel instant while the API call confirms in the background |
| Local/UI state (modal open/closed, filter drafts, chatbot conversation buffer before send) | **Zustand** | Minimal boilerplate, works identically in RN and web, no Provider-tree overhead |
| Why not Redux Toolkit | Overkill for this split — RTK Query would duplicate React Query's job, and Redux's global-store ceremony isn't needed once server state is offloaded to React Query | — |

**Example ViewModel (shared, used by both `apps/web` and `apps/mobile`):**
```ts
// packages/core/viewmodels/useLeadInboxViewModel.ts
export function useLeadInboxViewModel(filters: LeadFilters) {
  const { data, isLoading } = useQuery({
    queryKey: ['leads', filters],
    queryFn: () => leadsRepository.list(filters), // scoping happens server-side, not here
  });

  const updateStatus = useMutation({
    mutationFn: leadsRepository.updateStatus,
    onMutate: async (input) => {
      // optimistic update for the "minimize clicks" requirement [Dev Instr §1]
    },
  });

  return { leads: data, isLoading, updateStatus };
}
```

---

## 3. Backend & Database Design

### 3.1 API framework choice
**NestJS (Node.js/TypeScript)**, chosen over Python/Django or Go, because:
- Its Guard/Interceptor pipeline maps directly onto the RBAC requirement that access rules live at the API layer, not the UI `[Spec §5, Dev Instr §2]`.
- TypeScript types are shared with the frontend `packages/core/models`, reducing contract drift within the 2-month window.
- Team can move faster on CRUD-heavy CRM screens than in Go, without Django's admin-centric assumptions fighting a custom RBAC model.

### 3.2 Core relational schema (PostgreSQL)

```sql
-- Identity & Roles -----------------------------------------------------
users (id, email, phone, phone_verified_at, password_hash, role ENUM('super_admin','verification_staff','agent','buyer','owner'), created_at)
agent_profiles (id, user_id FK, verification_status ENUM('pending','verified','rejected'), subscription_id FK)

-- Subscriptions ----------------------------------------------------------
subscription_tiers (id, name ENUM('lite','go','pro','ultimate'), listing_quota INT, price, analytics_depth JSONB)
subscriptions (id, agent_id FK, tier_id FK, status, current_period_end)

-- Listings -----------------------------------------------------------------
listings (id, owner_id FK, agent_id FK NULL, title, price, city, area, type,
          status ENUM('pending_verification','verified','rejected'),   -- [Spec §7]
          internal_notes TEXT,                                         -- staff-only, never serialized to public API
          created_at)
listing_media (id, listing_id FK, url, type, compressed_url)

-- Verification audit ------------------------------------------------------
verification_audit_log (id, listing_id FK, reviewer_id FK, action ENUM('approve','reject','request_info'),
                         note TEXT, created_at)   -- one row per action, insert-only [Dev Instr §2.2]

-- CRM / Leads --------------------------------------------------------------
leads (id, listing_id FK, agent_id FK, name, phone, email,
       status ENUM('new','contacted','negotiating','closed','lost'),   -- fixed enum, no free text [Dev Instr §3.1]
       source ENUM('chatbot','contact_form','call_request'), created_at)
lead_status_history (id, lead_id FK, from_status, to_status, changed_by FK, changed_at)
lead_notes (id, lead_id FK, author_id FK, body TEXT, created_at)   -- append-only, never UPDATEd
lead_activity (id, lead_id FK, type ENUM('note','status_change','call','assignment','email','whatsapp'),
               ref_id, created_at)   -- unified timeline feed [Dev Instr §3.1 Date/Time History]
lead_assignments (id, lead_id FK, agent_id FK, assigned_by FK, assigned_at)
tasks (id, lead_id FK NULL, owner_id FK, title, due_at, completed_at)
reminders (id, lead_id FK, remind_at, channel ENUM('in_app','push','email'), fired_at)

-- Analytics (single source of truth) ---------------------------------------
listing_views (id, listing_id FK, viewer_session_id, platform ENUM('web','mobile','agent_portal','admin'), created_at)
search_queries (id, query_text, user_id FK NULL, structured_filters JSONB, created_at)
```

Notes on the design:
- `leads.listing_id` is a **hard foreign key**, satisfying `[Dev Instr §3.1]` "foreign-key reference to the listing, not a free-text note."
- `lead_notes` and `lead_activity` are insert-only tables (no `UPDATE`/`DELETE` grants at the DB-role level for the API's runtime user) — this is what makes "append-only history" `[Spec §4]` a database guarantee, not just an application convention.
- `listing_views` stores one row per view event, from **any** platform, with a `platform` tag purely for analytics breakdowns — the count itself (`COUNT(*) WHERE listing_id = X`) is identical regardless of which client asked, which is what makes cross-platform parity `[Spec §9]` structural rather than reconciled.

### 3.3 Enforcing RBAC & agent data isolation at the query level

`[Dev Instr §2]` is explicit: **enforcement must be server-side, never UI-only**, and agent-scoped queries must filter by `agent_id` "at the query level (not just at the UI render level)."

**Chosen approach: application-layer scoping via a mandatory repository wrapper, with Postgres Row-Level Security (RLS) as defense-in-depth** — not RLS alone, because RLS-only designs are easy to bypass from ad-hoc admin queries or migrations scripts, and are harder to unit-test at the API layer the way `[Dev Instr §4]` requires ("automated tests hitting the API directly").

```ts
// services/api/src/common/guards/scope.guard.ts
@Injectable()
export class ScopeGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const { user } = ctx.switchToHttp().getRequest();
    if (user.role === 'super_admin') return true;          // bypasses scoping [Spec §5]
    if (user.role === 'verification_staff') {
      // blocked entirely from user/account/billing modules at the route level
      return ALLOWED_ROUTES_FOR_STAFF.includes(ctx.getHandler().name);
    }
    return true; // agent/buyer/owner proceed to repository-level filtering below
  }
}

// every CRM repository method requires an explicit scope — no unscoped variant exists
async listLeads(scope: { agentId?: string; role: Role }) {
  const qb = this.db.selectFrom('leads');
  if (scope.role !== 'super_admin') {
    qb.where('agent_id', '=', scope.agentId); // structurally impossible to omit
  }
  return qb.execute();
}
```

Complementary Postgres RLS policy (defense-in-depth, catches any future raw-SQL mistake):
```sql
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY agent_isolation ON leads
  USING (agent_id = current_setting('app.current_agent_id')::uuid
         OR current_setting('app.current_role') = 'super_admin');
```

This two-layer model directly satisfies:
- `[Spec §5]` Super Admin bypasses scoping.
- `[Spec §5]` / `[Dev Instr §2.2]` Verification Staff has zero route-level access to user/account/billing — enforced by `ALLOWED_ROUTES_FOR_STAFF` allowlist, not a hidden nav item.
- `[Dev Instr §2.3]` Agent queries cannot leak cross-agent data even under a coding mistake, because the repository layer has no "unscoped" code path and RLS is a second gate.

### 3.4 Tier-based entitlement layer (independent of core CRM logic)

`[Dev Instr §2.3]` asks for this to be "a permission/entitlement layer that can be adjusted independently... as tiers are finalized" — important since `[Spec §6]` flags tier names/features as **not yet final**.

```ts
interface TierEntitlements {
  listingQuota: number;
  analyticsDepth: 'basic' | 'standard' | 'advanced' | 'full';
  viewCountDetail: 'total_only' | 'breakdown_by_source' | 'full_timeseries';
}
// stored as JSONB on subscription_tiers.analytics_depth, read at request time —
// changing a tier's entitlements is a data change, not a code deploy.
```

An `EntitlementService` sits between the CRM API and the analytics endpoints, checking `subscription.tier.analytics_depth` before deciding how much of the (always-complete) underlying number to expose — the raw count in `listing_views` is never recomputed or duplicated per tier, only the response shape is gated, which is exactly what guarantees the "numbers must never differ" requirement in `[Reqs §4.3]`.

---

## 4. Technical Strategy for Core Modules

### 4.1 The CRM Engine — hitting aggressive performance targets

`[Dev Instr §1]` requires concrete, met-before-sign-off performance targets and minimal clicks for high-frequency actions. Proposed concrete targets and the mechanisms to hit them:

| Action | Target | Mechanism |
|---|---|---|
| Inbox load (first page, 50 leads) | P95 < 400ms | Composite index `(agent_id, status, created_at DESC)`; server-side pagination; React Query cache-first render |
| Lead search/filter | P95 < 500ms | Postgres trigram index on `name/phone/email`; filters compiled to a single indexed query, not N+1 |
| Status update | P95 < 150ms | Single-row `UPDATE` + async-logged `lead_status_history` insert via a DB trigger (not a blocking second round-trip); optimistic UI update (§2.3) makes perceived latency ~0 |
| Note add / call log | P95 < 150ms | Same optimistic-mutation pattern; `lead_activity` insert is the only write |

A dedicated CRM usability review (separate from general QA) is scheduled as its own gate in the roadmap (§6, Week 7) per `[Dev Instr §1]` and `[Dev Instr §4]`.

### 4.2 Manual Verification System — strict API-layer enforcement

`[Spec §7]` / `[Dev Instr §2.2]`: unverified listings must never be reachable via the public API; audit trail cannot be skipped or batched.

- **Public listing endpoints** (`GET /listings`, `GET /listings/:id` when called without a staff/owner JWT) carry a **non-optional** `WHERE status = 'verified'` clause baked into the repository method itself — there is no parameter that can widen it. Owners see their own pending listings only via a separate, authenticated `owner/my-listings` endpoint.
- **Every** verification action (`POST /verification/:id/approve|reject|request-info`) executes inside a DB transaction that (a) updates `listings.status` and (b) inserts into `verification_audit_log` — both writes happen in the same transaction, so an audit entry can never be silently dropped, satisfying "cannot be skipped or batched."
- `internal_notes` on `listings` is excluded from every public/lister-facing serializer at the DTO level (allow-list serialization, not a deny-list), so a future field addition can't accidentally leak it.

### 4.3 Role-Aware AI Chatbot

`[Spec §3]` / `[Reqs §3.1]`: one underlying assistant, capabilities modeled per role.

```
Request → API Gateway (JWT already resolved to { role, agentId? })
        → ChatbotController
             → RoleCapabilityResolver(role)   // returns a tool/function manifest
                 - buyer   → { search_listings, capture_lead, get_expert_contact }
                 - agent   → { rank_listings_for_price_reduction, portfolio_insights, get_expert_contact }
                 - lister  → { intake_documents, intake_photos, get_expert_contact }   // NEVER verify_listing
             → LLM call with role-scoped tool manifest + system prompt
             → response
```

Key architectural point: the **lister flow's tool manifest structurally excludes any verification-decision tool** — `[Spec §3]` / `[Reqs §3.4]` "the bot does NOT verify the listing" is enforced by what tools exist for that role, not by a prompt instruction that could be bypassed.

The **"Reach out to Jayedaad Experts"** affordance `[Spec §3, Reqs §3.5]` is implemented as a global layout-level component (present in the root layout of both `apps/web` and `apps/mobile`, not inside the chatbot widget), calling `tel:` / `https://wa.me/` links directly on tap with zero intermediate confirmation — a platform-wide UI contract, independent of chatbot uptime.

---

## 5. Production Readiness & CI/CD

### 5.1 RBAC testing strategy

`[Dev Instr §4]`: "All access rules verified via automated tests hitting the API directly (not just UI-level checks)."

- A dedicated `tests/rbac/` suite (Jest + Supertest) runs against a real (test) database per CI run, authenticating as each of the 5 roles and asserting:
  - Verification staff → `403` on any `/users`, `/billing`, `/subscriptions` route.
  - Agent A's JWT → `403`/`404` (never `200` with someone else's data) on Agent B's leads/listings.
  - Public/unauthenticated → listings with `status != verified` never appear in any response body.
  - Every verification action produces exactly one new `verification_audit_log` row.
- This suite is a required, non-skippable CI check on every PR touching `services/api`.

### 5.2 CI/CD pipelines & staging/prod parity

| Pipeline | Trigger | Steps |
|---|---|---|
| `web` | PR → Vercel Preview; merge to `main` → Production | Type-check → lint → unit tests → Vercel deploy |
| `api` | PR → ephemeral test DB + RBAC suite; merge to `main` → staged rollout to ECS/Cloud Run | Migration dry-run → RBAC suite (§5.1) → integration tests → canary deploy |
| `mobile` | PR → EAS build (internal) → tag → EAS Build production → TestFlight/Play Internal | Type-check → unit tests → EAS build → store submission |

Staging and production run from the **same** container images and Terraform/IaC definitions with environment-variable-only differences, satisfying `[Spec §2]` infrastructure parity — this also means the CRM usability review (§6) is conducted against a staging environment that is architecturally identical to production, not a divergent "demo" build.

---

## 6. 2-Month Execution Roadmap (Weeks 1–8)

`[Dev Instr §1]`: CRM and verification must not be sequenced as an afterthought; QA/usability need dedicated time.

| Week | Focus | Key deliverables |
|---|---|---|
| **1** | Foundations | Repo/monorepo scaffold, Postgres schema (§3.2) migrated, JWT auth + OTP, RBAC guard skeleton (§3.3) |
| **2** | Verification + Listings core | Listing CRUD, image upload/compression pipeline, verification queue API + audit log (§4.2), public API status filtering |
| **3** | CRM engine core | Leads, lead_activity, lead_notes, status pipeline, agent-scoping middleware (§3.3) — CRM given equal priority per `[Dev Instr §1]`, not deferred |
| **4** | CRM productivity + Agent portal | Reminders, tasks, lead assignment, calendar sync, subscription tiers + quota tracking (§3.4) |
| **5** | Web + Mobile buyer/owner UX | Search, property detail, dashboards (§8 of Spec), consuming ViewModels built in Weeks 2–4 |
| **6** | AI Chatbot + Communications | Role-aware chatbot (§4.3), WhatsApp/Email integration, "Reach out to Experts" global component, push notifications |
| **7** | Analytics + Hardening + Usability Review | Pipeline dashboards with numeric figures (`[Dev Instr §3.4]`), cross-platform view/query parity verification, **dedicated CRM usability review** (separate from general QA, per `[Dev Instr §1, §4]`), RBAC automated test suite finalized |
| **8** | QA, performance sign-off, deployment | Performance targets (§4.1) measured and documented, staging↔prod parity check, app store submissions, production cutover, handover of full admin access to Jayedaad only (`[Reqs §11]`) |

**Sequencing rationale:** backend schema, RBAC, and verification are locked down by end of Week 2 so that every subsequent feature (CRM, chatbot, dashboards) is built against a stable, already-secured data layer — avoiding the common failure mode of retrofitting access control after UI work is done, which is precisely what `[Dev Instr §2]`'s "server-side, not UI-hiding" mandate is designed to prevent.

---

## Traceability Summary

| Source requirement | Addressed in |
|---|---|
| Single REST API / cross-platform parity | §1.1, §1.3 |
| MVVM/Clean Architecture, code sharing | §2 |
| RBAC enforced server-side, not UI | §3.3, §5.1 |
| Agent CRM data isolation | §3.3 |
| Tier-based entitlement/quota gating | §3.4 |
| Append-only notes/activity history | §3.2 |
| Verification audit trail, non-batchable | §3.2, §4.2 |
| Public API hides unverified listings | §4.2 |
| Chatbot role-awareness, lister ≠ verifier | §4.3 |
| "Reach out to Experts" always-on, one-tap | §4.3 |
| CRM performance targets & minimal-click UX | §4.1 |
| Automated RBAC tests at API level | §5.1 |
| Staging/prod parity, mobile store pipelines | §5.2 |
| Dedicated CRM usability review | §6 (Week 7) |
| 2-month, backend/CRM/verification-first sequencing | §6 |
