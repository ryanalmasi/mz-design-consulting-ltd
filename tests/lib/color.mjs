/**
 * Parses the colour string getComputedStyle returns. Usually that is
 * `rgb()`/`rgba()`, but a value that resolved through `color-mix(in srgb, …)`
 * — as the depth-layer grid wash does — can come back as the CSS Color 4
 * `color(srgb r g b [/ a])` function instead, with 0–1 float channels rather
 * than 0–255 integers.
 */
export function parseColor(css) {
  const rgb = css.match(/rgba?\(([^)]+)\)/);
  if (rgb) {
    const parts = rgb[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    const [r, g, b, a = 1] = parts;
    return { r, g, b, a };
  }
  const colorFn = css.match(/color\(srgb ([^)]+)\)/);
  if (colorFn) {
    const parts = colorFn[1].split(/[\s/]+/).filter(Boolean).map(Number);
    const [r, g, b, a = 1] = parts;
    return { r: r * 255, g: g * 255, b: b * 255, a };
  }
  throw new Error(`Unparseable colour: ${css}`);
}

/** Source-over composite of a possibly-translucent fg onto an opaque bg. */
export function composite(fg, bg) {
  const a = fg.a ?? 1;
  return {
    r: fg.r * a + bg.r * (1 - a),
    g: fg.g * a + bg.g * (1 - a),
    b: fg.b * a + bg.b * (1 - a),
    a: 1,
  };
}

/** WCAG 2.x relative luminance. */
export function luminance({ r, g, b }) {
  const channel = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}
