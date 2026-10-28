/**
 * Generate a URL-safe slug from an arbitrary string.
 * Lowercases, replaces non-alphanumeric sequences with hyphens, trims hyphens.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63); // PostgreSQL max identifier safety
}
