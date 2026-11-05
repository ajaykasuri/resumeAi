/**
 * Template definitions.
 * - `slug` MUST match the slug stored in your `templates` table.
 * - `config` holds the per-template defaults used by <ResumePreview />.
 * - You can use this array to seed your DB (see seedPayload at the bottom).
 */
export const TEMPLATES = [
  {
    slug: 'classic',
    name: 'Classic Professional',
    category: 'professional',
    is_premium: false,
    description: 'Traditional single-column serif layout. Centered header, ruled section headings. Safe for any industry.',
    config: { primaryColor: '#1f2933', accentColor: '#1f2933', font: 'Source Serif 4', headFont: 'Source Serif 4', serif: true, fontSize: 10, lineHeight: 1.5 },
  },
  {
    slug: 'modern-sidebar',
    name: 'Modern Sidebar',
    category: 'modern',
    is_premium: false,
    description: 'Deep-teal sidebar holds contact, skills and education; the main column is given to experience.',
    config: { primaryColor: '#12404a', accentColor: '#f2a541', font: 'Inter', headFont: 'Inter', serif: false, fontSize: 10, lineHeight: 1.55 },
  },
  {
    slug: 'minimal',
    name: 'Minimal Ledger',
    category: 'minimal',
    is_premium: false,
    description: 'Generous whitespace with a dates-left ledger grid. Light weights, no colour except a single grey.',
    config: { primaryColor: '#111111', accentColor: '#8a8a8a', font: 'Work Sans', headFont: 'Work Sans', serif: false, fontSize: 10, lineHeight: 1.6 },
  },
  {
    slug: 'executive',
    name: 'Executive Brief',
    category: 'executive',
    is_premium: true,
    description: 'Full-width navy masthead with a high-contrast serif name, plus a tinted rail for skills and credentials.',
    config: { primaryColor: '#14213d', accentColor: '#c9a227', font: 'Source Sans 3', headFont: 'Playfair Display', serif: false, fontSize: 10, lineHeight: 1.5 },
  },
  {
    slug: 'creative',
    name: 'Creative Spectrum',
    category: 'creative',
    is_premium: true,
    description: 'Bold gradient banner, pill skills and accent-barred project cards for design-forward roles.',
    config: { primaryColor: '#3b1c8c', accentColor: '#ff5d8f', font: 'Poppins', headFont: 'Poppins', serif: false, fontSize: 9.5, lineHeight: 1.55 },
  },
  {
    slug: 'tech',
    name: 'Terminal Dev',
    category: 'modern',
    is_premium: false,
    description: 'Monospaced headings, tag-style tech stacks and a dense layout built for engineers.',
    config: { primaryColor: '#0f172a', accentColor: '#16a34a', font: 'IBM Plex Sans', headFont: 'JetBrains Mono', serif: false, fontSize: 9.5, lineHeight: 1.5 },
  },
  {
    slug: 'elegant',
    name: 'Elegant Serif',
    category: 'professional',
    is_premium: true,
    description: 'Refined two-column layout with a soft tinted side panel and small-cap headings.',
    config: { primaryColor: '#5b2a3c', accentColor: '#b5838d', font: 'Lora', headFont: 'Cormorant Garamond', serif: true, fontSize: 10, lineHeight: 1.55 },
  },
  {
    slug: 'timeline',
    name: 'Career Timeline',
    category: 'creative',
    is_premium: false,
    description: 'Vertical timeline for experience and education, with a clean four-block skills grid.',
    config: { primaryColor: '#1e293b', accentColor: '#2563eb', font: 'DM Sans', headFont: 'DM Sans', serif: false, fontSize: 10, lineHeight: 1.55 },
  },
];

export const getTemplateDefaults = (slug) =>
  TEMPLATES.find((t) => t.slug === slug)?.config || {};

/** Merge DB config + defaults + user customization into one object */
export const buildCustomization = (template, overrides = {}) => {
  const dbConfig =
    typeof template?.config === 'string' ? JSON.parse(template.config) : template?.config || {};
  return { ...getTemplateDefaults(template?.slug), ...dbConfig, ...overrides };
};

/** Rows you can INSERT into your templates table (config stored as JSON) */
export const seedPayload = TEMPLATES.map((t) => ({ ...t, config: JSON.stringify(t.config) }));

/** Google Fonts <link> — paste into index.html <head> */
export const GOOGLE_FONTS_HREF =
  'https://fonts.googleapis.com/css2?' +
  [
    'family=Source+Serif+4:wght@400;600;700',
    'family=Inter:wght@300;400;500;600;700',
    'family=Work+Sans:wght@300;400;500;600',
    'family=Source+Sans+3:wght@400;600;700',
    'family=Playfair+Display:wght@600;700;800',
    'family=Poppins:wght@400;500;600;700;800',
    'family=IBM+Plex+Sans:wght@400;500;600',
    'family=JetBrains+Mono:wght@500;700',
    'family=Lora:wght@400;500;600;700',
    'family=Cormorant+Garamond:wght@500;600;700',
    'family=DM+Sans:wght@400;500;600;700',
  ].join('&') +
  '&display=swap';