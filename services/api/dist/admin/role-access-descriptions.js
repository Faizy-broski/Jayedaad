"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_ACCESS_DESCRIPTIONS = void 0;
// Backs the Super Admin "which role gets what dashboard access" reference.
// Purely descriptive — a small static manifest, mirroring the existing
// ROLE_TOOL_MANIFESTS pattern in chatbot/role-capability.resolver.ts.
// Enforcement never lives here: it's the @Roles()/ScopeGuard decorators
// already on every controller across the codebase. This manifest documents
// what those decorators already do — if a route's roles change, update the
// capability list below to match, don't add a second enforcement path.
exports.ROLE_ACCESS_DESCRIPTIONS = {
    super_admin: {
        role: 'super_admin',
        label: 'Super Admin',
        description: 'Full, unrestricted platform control — bypasses every role check.',
        capabilities: [
            'Create, edit, suspend, and delete any user account, including team members',
            'Create/edit/retire subscription tiers and assign them to agents',
            'Grant or adjust agent credit balances',
            'Full CRUD on taxonomy: property-type categories, property types, amenities',
            'Verify/reject and edit agencies and independent agents; manage their onboarding documents',
            'Full CRUD on developers',
            'Override any listing status (expired/deleted/downgraded/inactive) outside the verification queue',
            'View platform-wide analytics and the full verification audit log',
            'Everything Verification Staff, Agent, Owner, and Buyer can do',
        ],
    },
    verification_staff: {
        role: 'verification_staff',
        label: 'Verification Staff',
        description: "Reviews agents' property-listing submissions — the manual review team.",
        capabilities: [
            'View the pending-verification listing queue',
            'Approve, reject, or request more info on a listing submission',
            "View a listing's or agent's uploaded verification documents ahead of a decision",
        ],
    },
    agent: {
        role: 'agent',
        label: 'Agent',
        description: 'Manages their own listings, profile, and clients.',
        capabilities: [
            'Create and manage their own listings and projects',
            'View their own analytics, credit balance, and subscription usage',
            'Upload their own onboarding documents (independent agents)',
            'Manage assigned leads (notes, status, inbox)',
            'Review other agents',
        ],
    },
    owner: {
        role: 'owner',
        label: 'Owner',
        description: 'A property owner submitting a listing for verification.',
        capabilities: [
            'Submit a property listing for verification',
            'Track their own submissions and verification status',
            'Upload documents for their own listings',
        ],
    },
    buyer: {
        role: 'buyer',
        label: 'Buyer',
        description: 'A platform visitor searching for property.',
        capabilities: [
            'Search and browse verified listings',
            'Save favorites and searches',
            'Contact agents/owners about a listing',
            'Manage their own preferences',
        ],
    },
};
