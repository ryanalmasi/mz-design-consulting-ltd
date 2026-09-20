/**
 * Single source of truth for business details.
 *
 * Everything marked TODO is a placeholder that renders visibly on the site so
 * it cannot ship unnoticed. Search this file for "TODO" to find every item
 * that needs real information — you should not need to touch any other file.
 */

/** Marks a value as not-yet-supplied. Rendered with a visible warning style. */
export const TODO = (hint: string) => ({ __todo: hint }) as const;

export type Maybe<T> = T | { readonly __todo: string };

export const isTodo = <T>(v: Maybe<T>): v is { readonly __todo: string } =>
  typeof v === 'object' && v !== null && '__todo' in v;

/** Returns the real value, or the placeholder text if it is still a TODO. */
export const val = <T>(v: Maybe<T>, fallback = ''): string =>
  isTodo(v) ? fallback || `[${v.__todo}]` : String(v);

export const site = {
  name: 'M&Z Design Consulting',
  legalName: 'M&Z Design Consulting LTD.',
  shortName: 'M&Z',
  origin: 'https://mzdesignconsulting.com',
  tagline: 'Civil engineering for land development, industrial, and municipal projects',
  description:
    'Civil engineering consultants in Alberta and British Columbia. Grading design, earthworks, ' +
    'stormwater management, drainage, road design, and Civil 3D modelling — from feasibility ' +
    'through IFC drawings and construction support.',
  founded: 2010,
} as const;

/**
 * Contact details.
 *
 * TODO: The old site had no phone number or email address anywhere. These are
 * the highest-value items on this list — every one of them is a way for a lead
 * to reach you that currently does not exist.
 */
export const contact = {
  phone: TODO('TODO: phone number'),
  /** E.164, used for the tel: link. e.g. '+17805551234' */
  phoneHref: TODO('TODO: phone number'),
  email: TODO('TODO: email address'),

  address: {
    street: TODO('TODO: street address'),
    city: TODO('TODO: city'),
    region: TODO('TODO: province'),
    postalCode: TODO('TODO: postal code'),
    country: 'CA',
  },

  hours: 'Monday to Friday, 8:00am – 5:00pm MST',
  responseTime: 'within one business day',

  linkedin: TODO('TODO: LinkedIn company URL'),
} as const;

/**
 * Professional registration.
 *
 * TODO: For an engineering consultancy these are the strongest trust signals
 * available, and the old site showed none of them. A Permit to Practice number
 * is what tells a municipal reviewer you can stamp drawings.
 */
export const credentials = {
  apegaPermit: TODO('TODO: APEGA Permit to Practice number'),
  egbcPermit: TODO('TODO: EGBC Permit to Practice number'),
  /** Engineers whose names appear on the About page. */
  engineers: [] as Array<{
    name: string;
    designation: string; // e.g. 'P.Eng.'
    role: string;
    registrations: string[]; // e.g. ['APEGA #12345', 'EGBC #67890']
    bio: string;
  }>,
} as const;

/**
 * Headline figures.
 *
 * These carried over from the old site. `projectsDelivered` and
 * `yearsExperience` should be confirmed before launch — claiming a number you
 * cannot substantiate is a liability in a regulated profession.
 */
export const stats = {
  yearsExperience: 15,
  projectsDelivered: 200,
  disciplines: 9,
  provinces: ['Alberta', 'British Columbia'],
} as const;

export const serviceAreas = [
  { city: 'Calgary', region: 'AB' },
  { city: 'Edmonton', region: 'AB' },
  { city: 'Red Deer', region: 'AB' },
  { city: 'Lethbridge', region: 'AB' },
  { city: 'Grande Prairie', region: 'AB' },
  { city: 'Fort McMurray', region: 'AB' },
  { city: 'Vancouver', region: 'BC' },
  { city: 'Surrey', region: 'BC' },
  { city: 'Kelowna', region: 'BC' },
  { city: 'Kamloops', region: 'BC' },
  { city: 'Prince George', region: 'BC' },
] as const;

export const software = [
  'Autodesk Civil 3D',
  'AutoCAD',
  'HEC-HMS',
  'HEC-RAS',
  'SWMM',
  'Bluebeam Revu',
  'Microsoft Project',
] as const;

export const nav = [
  { label: 'Services', href: '/services' },
  { label: 'Projects', href: '/projects' },
  { label: 'About', href: '/about' },
  { label: 'Insights', href: '/insights' },
  { label: 'Contact', href: '/contact' },
] as const;

/**
 * Contact form delivery.
 *
 * The form POSTs to the Cloudflare Pages Function at functions/api/contact.ts.
 * That function reads its secrets from the Cloudflare dashboard, not from here.
 * See docs/DEPLOYMENT.md.
 *
 * TODO: Turnstile site key is public (safe to commit). The secret key and the
 * Resend API key are set as encrypted environment variables in Cloudflare.
 */
export const forms = {
  endpoint: '/api/contact',
  turnstileSiteKey: TODO('TODO: Cloudflare Turnstile site key'),
} as const;

export const projectTypes = [
  'Site grading',
  'Earthworks & mass haul',
  'Stormwater management',
  'Drainage & culverts',
  'Road & access design',
  'Industrial site development',
  'Municipal infrastructure',
  'Civil 3D modelling & drafting',
  'Construction support',
  'Something else',
] as const;
