export const SITE_NAVIGATION = [
  { href: "/occupations/", label: "Occupations" },
  { href: "/sample/", label: "Sample report" },
  { href: "/states/", label: "States" },
  { href: "/methodology/", label: "Method" },
] as const;

export function isNavigationActive(pathname: string, href: string): boolean {
  const base = href.replace(/\/$/, "");
  return pathname === base || pathname.startsWith(`${base}/`);
}
