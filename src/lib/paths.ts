/**
 * Path normalisation.
 *
 * The site builds with `build.format: 'file'`, so Astro.url.pathname during the
 * build is `/services.html` while every internal link, the sitemap and the
 * canonical tag use `/services`. Anything comparing the current path against a
 * link href has to normalise first, or it silently never matches.
 */
export const normalizePath = (pathname: string): string =>
  pathname
    .replace(/\/index\.html$/, '/')
    .replace(/\.html$/, '')
    .replace(/(.+)\/$/, '$1') || '/';

/** True when `href` is the current page or an ancestor of it. */
export const isCurrentPath = (pathname: string, href: string): boolean => {
  const path = normalizePath(pathname);
  return path === href || path.startsWith(`${href}/`);
};
