/**
 * Embeds the template's web font INSIDE the .docx so Word shows the same typeface as the PDF.
 * (Word only uses fonts installed on the reader's computer unless they are embedded in the file.)
 *
 * Font files live in backend/assets/fonts (built by scripts/build-word-fonts.py from the same
 * @fontsource packages the frontend uses; SIL Open Font License allows embedding).
 */
const fs = require('fs');
const path = require('path');
const { unzipSync, zipSync, strFromU8, strToU8 } = require('fflate');
const { CharacterSet } = require('docx');
const { wordSafeFont } = require('./resume-defaults');

const FONT_DIR = path.join(__dirname, '../../assets/fonts');
const cache = new Map(); // family -> font option | null

const slugOf = (family) => String(family || '').toLowerCase().trim().replace(/\s+/g, '-');
const SERIF = new Set(['Playfair Display', 'Merriweather', 'Lora', 'Source Serif 4', 'Cormorant Garamond']);
const MONO = new Set(['JetBrains Mono']);
const familyClass = (family) => (SERIF.has(family) ? 'roman' : MONO.has(family) ? 'modern' : 'swiss');

const read = (slug, style) => {
  const file = path.join(FONT_DIR, `${slug}-${style}.ttf`);
  return fs.existsSync(file) ? fs.readFileSync(file) : undefined;
};

/** @returns {{name,data,bold,italic,boldItalic,characterSet}|null} null when we ship no files for that font */
function loadWordFont(family) {
  if (!family) return null;
  if (cache.has(family)) return cache.get(family);
  const slug = slugOf(family);
  const data = read(slug, 'regular');
  const option = data ? {
    name: family, data,
    bold: read(slug, 'bold'), italic: read(slug, 'italic'), boldItalic: read(slug, 'bolditalic'),
    characterSet: CharacterSet.ANSI,
  } : null;
  cache.set(family, option);
  return option;
}

/**
 * Adds a fallback to the font table: if a viewer ignores embedded fonts (Word online, Google Docs,
 * very old Word) it substitutes the closest Office font instead of Times New Roman.
 */
async function addFontFallback(buffer, family) {
  if (!family) return buffer;
  try {
    const files = unzipSync(new Uint8Array(buffer));
    const entry = files['word/fontTable.xml'];
    if (!entry) return buffer;
    let xml = strFromU8(entry);
    const escaped = family.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(<w:font w:name="${escaped}">)([\\s\\S]*?)(</w:font>)`);
    if (!re.test(xml)) return buffer;
    xml = xml.replace(re, (match, open, inner, close) => {
      let body = inner;
      if (!/<w:altName/.test(body)) body = `<w:altName w:val="${wordSafeFont(family)}"/>${body}`;
      if (!/<w:family/.test(body)) {
        body = /<w:charset[^>]*\/>/.test(body)
          ? body.replace(/(<w:charset[^>]*\/>)/, `$1<w:family w:val="${familyClass(family)}"/>`)
          : body.replace(/(<w:altName[^>]*\/>)/, `$1<w:family w:val="${familyClass(family)}"/>`);
      }
      return `${open}${body}${close}`;
    });
    files['word/fontTable.xml'] = strToU8(xml);
    return Buffer.from(zipSync(files, { level: 6 }));
  } catch (error) {
    console.warn('DOCX font fallback skipped:', error.message);
    return buffer;
  }
}

module.exports = { loadWordFont, addFontFallback };
