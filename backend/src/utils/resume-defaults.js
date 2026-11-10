/**
 * Pure helpers shared by every export path (no DB access, safe to unit-test).
 * Keep DEFAULT_CUSTOMIZATION and TEMPLATE_LAYOUTS in sync with the frontend:
 *   frontend/src/context/ResumeContext.jsx  (DEFAULT_CUSTOMIZATION)
 *   frontend/src/components/resume/ResumePreview.jsx (TEMPLATE_LAYOUTS)
 */
const DEFAULT_CUSTOMIZATION = {
  primaryColor: '#1a1a2e',
  accentColor: '#6c63ff',
  backgroundColor: '#ffffff',
  textColor: '#1a1a1a',
  font: 'Inter',
  fontSize: 10.5,
  lineHeight: 1.6,
  sectionSpacing: 16,
  templateSlug: 'modern-slate',
};

/** DB template slug -> layout key (identical to the web preview). */
const TEMPLATE_LAYOUTS = {
  'executive-pro': 'classic',
  'modern-slate': 'modern-sidebar',
  'minimal-edge': 'minimal',
  'corporate-blue': 'executive',
  'creative-canvas': 'creative',
  'tech-resume': 'tech',
  'elegant-serif': 'elegant',
  'fresh-graduate': 'timeline',
  // layout keys are also accepted directly
  classic: 'classic',
  'modern-sidebar': 'modern-sidebar',
  minimal: 'minimal',
  executive: 'executive',
  creative: 'creative',
  tech: 'tech',
  elegant: 'elegant',
  timeline: 'timeline',
};

const layoutForSlug = (slug) => TEMPLATE_LAYOUTS[slug] || 'classic';

/** Customization exactly as the builder computes it when it loads a resume. */
function resolveCustomization(resume) {
  return {
    ...DEFAULT_CUSTOMIZATION,
    ...(resume.customization || {}),
    templateSlug:
      resume.customization?.templateSlug || resume.template_slug || DEFAULT_CUSTOMIZATION.templateSlug,
  };
}

/**
 * Web fonts are not installed on the reader's computer, and Word silently swaps unknown fonts
 * for Times New Roman. Map every web font to the closest font that ships with Microsoft Office
 * (Windows + macOS) so the editable .docx looks intentional everywhere.
 */
const WORD_SAFE_FONTS = {
  'Inter': 'Arial', 'Roboto': 'Arial', 'DM Sans': 'Arial', 'Work Sans': 'Arial',
  'Poppins': 'Verdana', 'Syne': 'Arial', 'IBM Plex Sans': 'Arial',
  'Lato': 'Calibri', 'Open Sans': 'Calibri', 'Source Sans 3': 'Calibri', 'Nunito': 'Calibri',
  'Playfair Display': 'Georgia', 'Merriweather': 'Georgia', 'Lora': 'Georgia', 'Source Serif 4': 'Georgia',
  'Cormorant Garamond': 'Garamond',
  'JetBrains Mono': 'Consolas',
};
const wordSafeFont = (font) => WORD_SAFE_FONTS[font] || (font && /^(arial|calibri|georgia|garamond|verdana|consolas|times new roman|cambria|tahoma)$/i.test(font) ? font : 'Calibri');

module.exports = {
  DEFAULT_CUSTOMIZATION, TEMPLATE_LAYOUTS, layoutForSlug, resolveCustomization, WORD_SAFE_FONTS, wordSafeFont,
};
