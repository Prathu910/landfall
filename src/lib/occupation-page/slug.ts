export interface SlugEntry {
  code: string;
  name: string;
}

export function occupationSlug(entry: SlugEntry): string {
  const words = entry.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return words ? `${words}-${entry.code}` : entry.code;
}

export function codeFromSlug(slug: string): string | null {
  const match = /(?:^|-)(\d{6})$/.exec(slug);
  return match ? match[1] : null;
}

export function occupationPath(entry: SlugEntry): string {
  return `/occupations/${occupationSlug(entry)}/`;
}
