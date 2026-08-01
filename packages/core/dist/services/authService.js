import { getSupabaseClient } from './supabaseClient';
import { httpClient } from './httpClient';
// Thin wrappers around Supabase Auth — apps call these instead of touching
// getSupabaseClient().auth directly, keeping direct @supabase/supabase-js
// usage confined to this package (apps/web's ESLint config blocks importing
// it directly — see .eslintrc.json). useAuthStore (state/useAuthStore.ts)
// updates reactively via configureSupabaseClient()'s onAuthStateChange
// listener, so callers don't need to do anything with these return values
// beyond error handling.
export async function signInWithPassword({ email, password }) {
    const { data, error } = await getSupabaseClient().auth.signInWithPassword({ email, password });
    if (error)
        throw error;
    return data;
}
// name/phone/marketingOptIn/termsAcceptedAt land in auth.users.raw_user_meta_data
// via Supabase's own options.data mechanism — handle_new_user() (see
// supabase/migrations/0015_password_fields_and_otp_purpose.sql) reads them
// from there into profiles at insert time.
export async function signUp({ email, password, name, phone, marketingOptIn, termsAcceptedAt }) {
    const { data, error } = await getSupabaseClient().auth.signUp({
        email,
        password,
        options: {
            data: {
                display_name: name,
                phone,
                marketing_opt_in: marketingOptIn,
                terms_accepted_at: termsAcceptedAt,
            },
        },
    });
    if (error)
        throw error;
    return data;
}
export async function signOut() {
    const { error } = await getSupabaseClient().auth.signOut();
    if (error)
        throw error;
}
// Web: Supabase's client performs the browser redirect to Google itself
// (skipBrowserRedirect defaults to false) — the returned url/promise resolve
// only after the round trip back to redirectTo.
export async function signInWithGoogle(redirectTo) {
    const { data, error } = await getSupabaseClient().auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
    });
    if (error)
        throw error;
    return data;
}
// Mobile: skipBrowserRedirect so Supabase just returns the authorize URL —
// Expo's WebBrowser.openAuthSessionAsync drives the actual browser, since
// there's no window.location for the SDK to redirect in React Native.
export async function getGoogleOAuthUrl(redirectTo) {
    const { data, error } = await getSupabaseClient().auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error)
        throw error;
    if (!data.url)
        throw new Error('Supabase did not return an OAuth URL');
    return data.url;
}
// The Profolio "Change Password" form's save action — Supabase's
// updateUser() has no built-in old-password check, so this re-authenticates
// with the old password first (throws if wrong) before applying the new
// one. Purely a client-side Supabase Auth concern, same as every other
// wrapper in this file — no backend endpoint exists or is needed for this.
export async function changePassword({ email, oldPassword, newPassword, }) {
    const { error: reauthError } = await getSupabaseClient().auth.signInWithPassword({ email, password: oldPassword });
    if (reauthError)
        throw reauthError;
    const { data, error } = await getSupabaseClient().auth.updateUser({ password: newPassword });
    if (error)
        throw error;
    return data;
}
// Mobile-only: after the deep-link redirect hands back an authorization
// code, this exchanges it client-side for a session (no cookie to write,
// unlike web's app/auth/callback/route.ts which uses @supabase/ssr instead).
export async function exchangeCodeForSession(code) {
    const { data, error } = await getSupabaseClient().auth.exchangeCodeForSession(code);
    if (error)
        throw error;
    return data;
}
// Custom OTP verification (services/api/src/auth/otp) — NOT Supabase's
// built-in OTP. These hit our own backend, not Supabase directly.
export async function sendOtpCode() {
    const { data } = await httpClient.post('/auth/otp/send');
    return data;
}
export async function verifyOtpCode(code) {
    const { data } = await httpClient.post('/auth/otp/verify', { code });
    return data;
}
export async function getEmailVerified() {
    const { data } = await httpClient.get('/auth/otp/status');
    return data.emailVerified;
}
// Custom password reset (services/api/src/auth/password-reset) — NOT
// Supabase's built-in reset-link email. Both hit our backend directly since
// the user has no session at this point (that's the whole reason to reset).
export async function requestPasswordReset(email) {
    const { data } = await httpClient.post('/auth/password-reset/request', { email });
    return data;
}
export async function confirmPasswordReset(input) {
    const { data } = await httpClient.post('/auth/password-reset/confirm', input);
    return data;
}
// role/agentId are tamper-proof claims set only via the service-role Admin
// API (see services/api/src/users/users.repository.ts) and mirrored into
// the JWT's app_metadata — the same claims JwtAuthGuard reads server-side,
// read here client-side for role-aware redirects/UI without a network call.
export function getUserRole(user) {
    return user?.app_metadata?.role;
}
export function getUserAgentId(user) {
    return user?.app_metadata?.agent_id;
}
// Pulls a fresh JWT after a server-side app_metadata change (e.g.
// POST /agents/apply flipping role: buyer -> agent) — without this, the
// cached session's role/agentId claims stay stale until next sign-in.
// useAuthStore's onAuthStateChange listener picks up the refreshed session
// automatically, same as any other auth state transition.
export async function refreshSession() {
    const { data, error } = await getSupabaseClient().auth.refreshSession();
    if (error)
        throw error;
    return data;
}
