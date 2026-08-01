// Shared by both web and mobile's agency self-registration signup step
// (auto-derives agencies.slug from the agency name the user typed) — a
// collision surfaces as a plain signup error via the DB's unique constraint,
// same as any other failed registerSelfService call.
export function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
