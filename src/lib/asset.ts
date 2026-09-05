/** Prefix public URLs with Vite's base (GitHub Pages lives at /glimmergrove/). */
export function asset(path: string) {
  const base = import.meta.env.BASE_URL || "/";
  return `${base}${path.replace(/^\//, "")}`;
}
