const {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
} = require('docx');
const { resolveCustomization, layoutForSlug, wordSafeFont } = require('./resume-defaults');
const { loadWordFont, addFontFallback } = require('./word-fonts');

function getSectionTitle(section) {
  if (section.custom_title) return section.custom_title;
  const titles = {
    personal_info: 'Personal Information', summary: 'Professional Summary',
    objective: 'Career Objective', education: 'Education', experience: 'Work Experience',
    skills: 'Skills', projects: 'Projects', certifications: 'Certifications',
    achievements: 'Achievements', languages: 'Languages', interests: 'Interests',
    declaration: 'Declaration', publications: 'Publications', volunteer: 'Volunteer Work',
    awards: 'Awards & Recognition', references: 'References',
  };
  return titles[section.section_type] || 'Section';
}

function getDOCXSectionTitle(section, layout) {
  const titles = {
    executive: {
      summary: 'Executive Profile',
      experience: 'Career History',
      projects: 'Key Initiatives',
      skills: 'Core Competencies',
      certifications: 'Credentials',
    },
    creative: { projects: 'Selected Projects' },
    tech: { summary: 'About', skills: 'Stack' },
    elegant: { summary: 'Profile', skills: 'Expertise', certifications: 'Certified' },
  };
  return titles[layout]?.[section.section_type] || getSectionTitle(section);
}

function hasText(value) {
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) return value.some(hasText);
  return false;
}

function hasSectionItem(items, fields) {
  return Array.isArray(items) && items.some(item =>
    typeof item === 'string'
      ? hasText(item)
      : item && fields.some(field => hasText(item[field]))
  );
}

function hasDOCXSectionContent(section) {
  const content = section.content || {};
  if (section.section_type === 'summary' || section.section_type === 'objective') {
    return hasText(content.text);
  }
  if (section.section_type === 'skills') {
    return (Array.isArray(content.categories) &&
      content.categories.some(category => hasText(category.skills))) ||
      hasText(content.items);
  }
  if (section.section_type === 'experience') {
    return hasSectionItem(content.items, [
      'jobTitle', 'title', 'company', 'location', 'startDate', 'endDate', 'description', 'bullets',
    ]);
  }
  if (section.section_type === 'education') {
    return hasSectionItem(content.items, [
      'degree', 'institution', 'location', 'gpa', 'description', 'startYear', 'endYear',
    ]);
  }
  if (section.section_type === 'projects') {
    return hasSectionItem(content.items, [
      'name', 'title', 'description', 'technologies', 'link', 'highlights',
    ]);
  }
  return hasText(content.text) || hasSectionItem(content.items, [
    'name', 'title', 'degree', 'language', 'skill', 'company', 'institution', 'issuer',
    'date', 'startDate', 'endDate', 'technologies', 'level', 'link', 'description', 'highlights',
  ]);
}


/**
 * Build an editable .docx for a resume (same data/slug mapping as the web preview).
 * @param {object} resume  result of getResumeWithSections()
 * @returns {Promise<Buffer>}
 */
async function buildResumeDocx(resume) {
    const personal = resume.sections.find(s => s.section_type === 'personal_info')?.content || {};
    const name = personal.name || resume.title || 'Resume';
    // Same defaults + slug->layout mapping as the web preview (see utils/resume-defaults.js)
    const customization = resolveCustomization(resume);
    const customOrderEnabled = customization.customSectionOrder === true;
    const templateLayout = layoutForSlug(customization.templateSlug);
    const colorValue = (value, fallback) =>
      /^#[\da-f]{6}$/i.test(value || '') ? value.slice(1) : fallback;
    const primaryColor = colorValue(customization.primaryColor, '1a1a2e');
    const accentColor = colorValue(customization.accentColor, '6c63ff');
    // Embed the real web font in the file; fall back to a Word-safe font only if we don't ship it.
    const embeddedFont = loadWordFont(customization.font);
    const font = embeddedFont ? customization.font : wordSafeFont(customization.font);
    const baseSize = Math.max(16, Math.round((Number(customization.fontSize) || 10) * 2));
    const lineHeight = Math.max(1.1, Math.min(2.5, Number(customization.lineHeight) || 1.5));
    const sectionSpacing = Math.max(120, Math.min(480, Math.round((Number(customization.sectionSpacing) || 16) * 15)));
    const textColor = colorValue(customization.textColor, '333333');
    const sidebarLayout = ['modern-sidebar', 'executive', 'elegant'].includes(templateLayout);
    const sections = resume.sections.filter(section =>
      section.section_type !== 'personal_info' &&
      section.is_visible !== 0 &&
      hasDOCXSectionContent(section)
    );
    const orderedSections = sections.slice().sort((a, b) => a.sort_order - b.sort_order);
    const contacts = [
      personal.email, personal.phone, personal.location,
      personal.linkedin, personal.github, personal.website,
    ].filter(Boolean);

    const textParagraph = (text, options = {}) => {
      if (text === null || text === undefined || text === '') return null;
      const { color, size, bold, italic, alignment, bullet, before, after, paragraphLineHeight } = options;
      const effectiveLineHeight = paragraphLineHeight ||
        ((size || baseSize) >= baseSize + 2 ? Math.min(lineHeight, 1.15) : lineHeight);
      return new Paragraph({
        alignment,
        bullet: bullet ? { level: 0 } : undefined,
        indent: bullet ? { left: 520, hanging: 260 } : undefined,
        spacing: {
          before: before || 0,
          after: after === undefined ? Math.round(sectionSpacing / 4) : after,
          line: Math.round(effectiveLineHeight * 240),
        },
        children: [new TextRun({
          text: String(text), font, size: size || baseSize, bold, italics: italic,
          color: color || textColor,
        })],
      });
    };
    const headingParagraph = (text, sidebar = false) => {
      const border = templateLayout === 'classic'
        ? { bottom: { color: sidebar ? 'FFFFFF' : primaryColor, space: 2, size: 6, style: BorderStyle.SINGLE } }
        : templateLayout === 'modern-sidebar'
          ? { bottom: { color: sidebar ? '51606A' : accentColor, space: 2, size: 6, style: BorderStyle.SINGLE } }
          : templateLayout === 'minimal'
            ? { bottom: { color: 'E2E2E2', space: 2, size: 4, style: BorderStyle.SINGLE } }
            : templateLayout === 'executive'
              ? sidebar
                ? { bottom: { color: accentColor, space: 2, size: 8, style: BorderStyle.SINGLE } }
                : { left: { color: accentColor, space: 4, size: 18, style: BorderStyle.SINGLE } }
              : templateLayout === 'creative'
                ? { bottom: { color: accentColor, space: 2, size: 18, style: BorderStyle.SINGLE } }
                : templateLayout === 'elegant'
                  ? { bottom: { color: accentColor, space: 2, size: 4, style: BorderStyle.SINGLE } }
                  : undefined;
      return new Paragraph({
        spacing: {
          before: Math.round(sectionSpacing * 0.65),
          after: 45,
          line: Math.round(Math.min(lineHeight, 1.15) * 240),
        },
        border,
        indent: templateLayout === 'executive' || templateLayout === 'timeline' ? { left: 120 } : undefined,
        children: [new TextRun({
          text: templateLayout === 'tech' ? `// ${text.toUpperCase()}` : text.toUpperCase(),
          font: templateLayout === 'tech' ? 'Consolas' : font,
          size: baseSize + (templateLayout === 'minimal' ? 1 : 2),
          bold: templateLayout !== 'minimal',
          color: sidebar && templateLayout === 'modern-sidebar'
            ? 'FFFFFF'
            : templateLayout === 'minimal' || templateLayout === 'tech' ? accentColor : primaryColor,
        })],
      });
    };
    const bulletParagraph = (text, sidebar = false) =>
      textParagraph(text, {
        bullet: true,
        color: sidebar && templateLayout === 'modern-sidebar' ? 'FFFFFF' : undefined,
        after: 20,
      });
    const rangeText = (...values) => values.filter(Boolean).join(' – ');

    const sectionParagraphs = (section, sidebar = false, contentWidth = 10106) => {
      const onDark = sidebar && templateLayout === 'modern-sidebar';
      const content = section.content || {};
      const title = getDOCXSectionTitle(section, templateLayout);
      const hideHeading = ['creative', 'timeline'].includes(templateLayout) &&
        section.section_type === 'summary';
      const blocks = hideHeading ? [] : [headingParagraph(title, sidebar)];
      const addText = (text, options) => {
        const paragraph = textParagraph(text, {
          color: sidebar && templateLayout === 'modern-sidebar' ? 'EAF0F2' : undefined,
          ...options,
        });
        if (paragraph) blocks.push(paragraph);
      };
      if (section.section_type === 'summary' || section.section_type === 'objective') {
        addText(content.text);
      } else if (section.section_type === 'experience') {
        for (const item of content.items || []) {
          const itemBlocks = [];
          const bulletBlocks = [];
          const company = [item.company, item.location].filter(Boolean).join('  |  ');
          const jobTitle = item.jobTitle || item.title;
          const titleParagraph = textParagraph(jobTitle, {
            bold: true, italic: templateLayout === 'elegant', size: baseSize + 2,
          });
          if (titleParagraph) itemBlocks.push(titleParagraph);
          const companyParagraph = textParagraph(company, {
            color: sidebar ? 'EAF0F2' : (templateLayout === 'classic' ? textColor : accentColor),
            size: baseSize - 1,
          });
          if (companyParagraph) itemBlocks.push(companyParagraph);
          const bullets = item.bullets?.length ? item.bullets : [item.description].filter(Boolean);
          for (const bullet of bullets) {
            const paragraph = bulletParagraph(bullet, sidebar);
            if (paragraph) bulletBlocks.push(paragraph);
          }
          itemBlocks.push(...bulletBlocks);
          const dates = rangeText(item.startDate, item.endDate || (item.startDate ? 'Present' : ''));
          if (templateLayout === 'minimal' || templateLayout === 'timeline') {
            blocks.push(dateLayoutRow(dates, itemBlocks, templateLayout === 'timeline'));
            continue;
          }
          if (templateLayout === 'classic') {
            blocks.push(dateHeaderRow(company, dates, jobTitle, {
              titleColor: textColor, detailColor: '666666', detailItalic: true, width: contentWidth,
            }));
          } else {
            blocks.push(dateHeaderRow(jobTitle, dates, company, {
              titleColor: primaryColor, detailColor: sidebar ? 'EAF0F2' : accentColor,
              detailItalic: templateLayout === 'elegant', width: contentWidth,
            }));
          }
          blocks.push(...bulletBlocks);
        }
      } else if (section.section_type === 'education') {
        for (const item of content.items || []) {
          const itemBlocks = [];
          const degreeParagraph = textParagraph(item.degree || item.institution, { bold: true, size: baseSize + 2 });
          if (degreeParagraph) itemBlocks.push(degreeParagraph);
          const details = textParagraph([
            item.degree && item.institution ? item.institution : null,
            item.location, item.gpa && `GPA: ${item.gpa}`,
          ].filter(Boolean).join('  |  '), { color: sidebar ? 'EAF0F2' : '666666', size: baseSize - 1 });
          if (details) itemBlocks.push(details);
          const description = textParagraph(item.description);
          if (description) itemBlocks.push(description);
          if (templateLayout === 'minimal' || templateLayout === 'timeline') {
            blocks.push(dateLayoutRow(rangeText(item.startYear, item.endYear), itemBlocks, templateLayout === 'timeline'));
            continue;
          }
          const degreeText = item.degree || item.institution;
          const educationDetail = [
            item.degree && item.institution ? item.institution : null,
            item.location, item.gpa && `GPA: ${item.gpa}`,
          ].filter(Boolean).join('  |  ');
          if (sidebar) {
            // A nested date table is wider than a side column and gets clipped: stack instead.
            addText(degreeText, { bold: true, size: baseSize + 1, color: onDark ? 'FFFFFF' : primaryColor, after: 20 });
            addText(educationDetail, { size: baseSize - 1, color: onDark ? 'EAF0F2' : '666666', after: 20 });
            addText(rangeText(item.startYear, item.endYear), { size: baseSize - 2, color: onDark ? 'C9D6D9' : '666666' });
            continue;
          }
          blocks.push(dateHeaderRow(degreeText, rangeText(item.startYear, item.endYear), educationDetail, {
            titleColor: primaryColor, detailColor: '666666', width: contentWidth,
          }));
          addText(item.description);
        }
      } else if (section.section_type === 'skills') {
        const cats = (content.categories || []).filter(category => (category.skills || []).length);
        // pill chip = a run with a tinted background (flows and wraps like the preview's pills)
        const chips = (skills, fill, color) => skills.flatMap(skill => [
          new TextRun({ text: `\u00A0${skill}\u00A0`, size: baseSize - 2, color, shading: { type: ShadingType.CLEAR, color: 'auto', fill } }),
          new TextRun({ text: '  ', size: baseSize - 2 }),
        ]);
        if (templateLayout === 'creative' && !sidebar) {
          const all = cats.flatMap(category => category.skills);
          if (all.length) blocks.push(new Paragraph({
            spacing: { before: 40, after: 120, line: 380 },
            children: chips(all, tintColor(primaryColor, 0.9), primaryColor),
          }));
        } else if (templateLayout === 'tech' && !sidebar) {
          for (const category of cats) {
            blocks.push(new Paragraph({
              spacing: { before: 30, after: 70, line: 340 },
              children: [
                new TextRun({ text: category.name ? `${category.name}   ` : '', bold: true, color: primaryColor, size: baseSize - 1 }),
                ...chips(category.skills, 'EEF2F6', primaryColor),
              ],
            }));
          }
        } else if (templateLayout === 'timeline' && !sidebar) {
          // 2-column grid, each block capped with an accent rule (as in the preview)
          const half = Math.floor(contentWidth / 2);
          const topRule = { top: { style: BorderStyle.SINGLE, size: 12, color: accentColor }, bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' } };
          const block = (category) => category ? [
            textParagraph(category.name, { bold: true, color: primaryColor, after: 20 }),
            textParagraph(category.skills.join(', '), { size: baseSize - 1, after: 60 }),
          ].filter(Boolean) : [new Paragraph({ children: [new TextRun({ text: ' ' })] })];
          const rows = [];
          for (let i = 0; i < cats.length; i += 2) {
            rows.push(new TableRow({
              children: [cats[i], cats[i + 1]].map((category, index) => new TableCell({
                width: { size: half, type: WidthType.DXA },
                margins: { top: 60, bottom: 100, left: index ? 200 : 0, right: index ? 0 : 200 },
                borders: category ? topRule : markerlessBorders,
                children: block(category),
              })),
            }));
          }
          if (rows.length) blocks.push(new Table({ width: { size: half * 2, type: WidthType.DXA }, columnWidths: [half, half], borders: tableBorders, rows }));
        } else if (templateLayout === 'minimal' && !sidebar) {
          for (const category of cats) {
            blocks.push(dateLayoutRow(category.name || '', [textParagraph(category.skills.join(' / '), { after: 20 })].filter(Boolean), false));
          }
        } else if (templateLayout === 'classic' && !sidebar) {
          for (const category of cats) {
            blocks.push(new Paragraph({
              spacing: { after: 50, line: Math.round(lineHeight * 240) },
              children: [
                ...(category.name ? [new TextRun({ text: `${category.name}: `, bold: true })] : []),
                new TextRun({ text: category.skills.join(', ') }),
              ],
            }));
          }
        } else if (onDark) {
          for (const category of cats) {
            if (category.name) addText(category.name, { bold: true, color: 'FFFFFF', size: baseSize - 1, after: 30 });
            for (const skill of category.skills) {
              blocks.push(new Paragraph({
                spacing: { after: 20 },
                children: [
                  new TextRun({ text: '\u25C6  ', size: baseSize - 6, color: accentColor }),
                  new TextRun({ text: skill, size: baseSize - 1, color: 'EAF0F2' }),
                ],
              }));
            }
          }
        } else {
          for (const category of cats) {
            if (category.name) addText(`${category.name}:`, { bold: true, color: primaryColor });
            addText(category.skills.join(', '));
          }
        }
        if (content.items) addText(Array.isArray(content.items) ? content.items.join(', ') : content.items);
      } else if (section.section_type === 'projects' &&
        ['creative', 'tech'].includes(templateLayout) && Array.isArray(content.items)) {
        for (const item of content.items) blocks.push(projectCard(item));
      } else if (Array.isArray(content.items)) {
        for (const item of content.items) {
          addText(item.name || item.title || item.degree || item.language || item.skill, {
            bold: true, size: baseSize + 2,
          });
          addText([
            item.company, item.institution, item.issuer, item.date,
            item.startDate && rangeText(item.startDate, item.endDate),
            Array.isArray(item.technologies) ? item.technologies.join(', ') : item.technologies,
            item.level, item.link,
          ].filter(Boolean).join('  |  '), { color: onDark ? 'C9D6D9' : '666666', size: baseSize - 2 });
          addText(item.description);
          for (const detail of item.highlights || []) {
            const paragraph = bulletParagraph(detail, sidebar);
            if (paragraph) blocks.push(paragraph);
          }
        }
      } else if (content.text) {
        addText(content.text);
      }
      return blocks;
    };

    const cell = (children, width, background, margins = 180) => new TableCell({
      width: { size: width, type: WidthType.DXA },
      shading: background ? { fill: background } : undefined,
      margins: { top: margins, bottom: margins, left: margins, right: margins },
      children: children.length ? children : [new Paragraph('')],
    });
    const tableBorders = {
      top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    };
    const twoColumnTable = (leftChildren, rightChildren, leftWidth, leftBackground, rightBackground) =>
      new Table({
        width: { size: 10106, type: WidthType.DXA },
        columnWidths: [leftWidth, 10106 - leftWidth],
        borders: tableBorders,
        rows: [new TableRow({
          children: [
            cell(leftChildren, leftWidth, leftBackground, 260),
            cell(rightChildren, 10106 - leftWidth, rightBackground, 300),
          ],
        })],
      });
    const dateHeaderRow = (title, date, detail, options = {}) => {
      const { titleColor = primaryColor, detailColor = '666666', detailItalic = false, width = 10106 } = options;
      const dateWidth = Math.min(2206, Math.max(1800, Math.round(width * 0.28))); // wide enough for 'Jan 2021 – Present'
      const leftWidth = width - dateWidth;
      const left = [
        textParagraph(title, { bold: true, color: titleColor, size: baseSize + 1, after: 20 }),
        textParagraph(detail, { color: detailColor, italic: detailItalic, size: baseSize - 1, after: 40 }),
      ].filter(Boolean);
      return new Table({
        width: { size: width, type: WidthType.DXA },
        columnWidths: [leftWidth, dateWidth],
        borders: tableBorders,
        rows: [new TableRow({
          children: [
            cell(left, leftWidth, undefined, 30),
            cell([textParagraph(date, {
              size: baseSize - 2, color: '666666', alignment: AlignmentType.RIGHT, after: 30,
            })].filter(Boolean), dateWidth, undefined, 30),
          ],
        })],
      });
    };

    const markerlessBorders = {
      top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    };
    const tintColor = (hex, amount = 0.9) => {
      const channels = [0, 2, 4].map(index => parseInt(hex.slice(index, index + 2), 16));
      return channels
        .map(channel => Math.round(channel + (255 - channel) * amount).toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();
    };
    const dateLayoutRow = (date, content, timeline) => {
      if (!timeline) {
        return new Table({
          width: { size: 10106, type: WidthType.DXA },
          columnWidths: [2200, 7906],
          borders: tableBorders,
          rows: [new TableRow({
            children: [
              cell([textParagraph(date, { size: baseSize - 2, color: accentColor, alignment: AlignmentType.LEFT })].filter(Boolean), 2200, undefined, 60),
              cell(content, 7906, undefined, 60),
            ],
          })],
        });
      }
      const markerBorders = {
        left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      };
      return new Table({
        width: { size: 10106, type: WidthType.DXA },
        columnWidths: [2200, 260, 7646],
        borders: tableBorders,
        rows: [new TableRow({
          children: [
            cell([textParagraph(date, { size: baseSize - 2, color: '666666', alignment: AlignmentType.RIGHT })].filter(Boolean), 2200, undefined, 60),
            new TableCell({
              width: { size: 260, type: WidthType.DXA },
              shading: { fill: accentColor },
              margins: { top: 0, bottom: 0, left: 0, right: 0 },
              borders: markerBorders,
              children: [new Paragraph({ children: [new TextRun({ text: ' ' })] })],
            }),
            cell(content, 7646, undefined, 100),
          ],
        })],
      });
    };
    const projectCard = (item) => {
      const projectChildren = [
        textParagraph(item.name || item.title, { bold: true, size: baseSize + 1, color: primaryColor }),
        textParagraph(item.description, { after: 40 }),
        textParagraph([
          Array.isArray(item.technologies) ? item.technologies.join(' · ') : item.technologies,
          item.link,
        ].filter(Boolean).join('  |  '), { size: baseSize - 2, color: accentColor, after: 0 }),
      ].filter(Boolean);
      const fill = templateLayout === 'creative' ? tintColor(accentColor, 0.92) : 'F3F5F7';
      const borders = {
        top: tableBorders.top,
        bottom: tableBorders.bottom,
        right: tableBorders.right,
        left: { style: BorderStyle.SINGLE, size: 18, color: accentColor },
      };
      return new Table({
        width: { size: 10106, type: WidthType.DXA },
        columnWidths: [10106],
        borders: tableBorders,
        rows: [new TableRow({
          children: [new TableCell({
            width: { size: 10106, type: WidthType.DXA },
            shading: { fill },
            margins: { top: 100, bottom: 100, left: 180, right: 180 },
            borders,
            children: projectChildren.length ? projectChildren : [new Paragraph('')],
          })],
        })],
      });
    };
    const skillTagTables = (skills) => {
      const fill = templateLayout === 'creative' ? tintColor(accentColor, 0.88) : 'EEF2F6';
      const rows = [];
      for (let index = 0; index < skills.length; index += 4) {
        const rowSkills = skills.slice(index, index + 4);
        const cellWidth = Math.floor(10106 / rowSkills.length);
        rows.push(new Table({
          width: { size: 10106, type: WidthType.DXA },
          columnWidths: rowSkills.map(() => cellWidth),
          borders: tableBorders,
          rows: [new TableRow({
            children: rowSkills.map(skill => new TableCell({
              width: { size: cellWidth, type: WidthType.DXA },
              shading: { fill },
              margins: { top: 45, bottom: 45, left: 80, right: 80 },
              children: [textParagraph(skill, {
                size: templateLayout === 'tech' ? baseSize - 2 : baseSize - 1,
                color: primaryColor,
                alignment: AlignmentType.CENTER,
                after: 0,
              })].filter(Boolean),
            })),
          })],
        }));
      }
      return rows;
    };

    const identity = [];
    if (personal.title) {
      identity.push(textParagraph(personal.title, templateLayout === 'classic'
        ? { size: baseSize + 3, italic: true, color: textColor, alignment: AlignmentType.CENTER, after: 60 }
        : { size: baseSize + 3, bold: true, color: accentColor, alignment: AlignmentType.CENTER, after: 60 }));
    }
    if (contacts.length) {
      identity.push(textParagraph(contacts.join('  |  '), {
        size: baseSize - 2, color: '666666', alignment: AlignmentType.CENTER, after: 80,
      }));
    }
    // Name size/weight mirror the web preview (its h1 is 2.4em-3.4em depending on the template)
    const NAME_SCALE = { classic: 2.5, minimal: 2.8, executive: 2.7, creative: 2.8, elegant: 3.2, 'modern-sidebar': 2.6, tech: 2.4, timeline: 2.8 };
    const nameSize = Math.round(baseSize * (NAME_SCALE[templateLayout] || 2.4));
    const nameBold = !['minimal', 'elegant'].includes(templateLayout);
    const nameInitials = name.split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
    const nameParagraph = (color = primaryColor, alignment = AlignmentType.CENTER) =>
      textParagraph(name, { size: nameSize, bold: nameBold, color, alignment, after: 40 });
    const headerChildren = [];
    if (templateLayout === 'executive' || templateLayout === 'creative') {
      headerChildren.push(new Table({
        width: { size: 10106, type: WidthType.DXA },
        columnWidths: [10106],
        borders: tableBorders,
        rows: [
          new TableRow({
            children: [cell([
              nameParagraph('FFFFFF', AlignmentType.LEFT),
              ...(personal.title ? [textParagraph(personal.title, {
                size: baseSize + 3, color: accentColor, bold: true, alignment: AlignmentType.LEFT,
              })] : []),
              ...(contacts.length ? [textParagraph(contacts.join('  |  '), {
                size: baseSize - 2, color: 'FFFFFF', alignment: AlignmentType.LEFT, after: 0,
              })] : []),
            ].filter(Boolean), 10106, primaryColor, 360)],
          }),
          new TableRow({
            children: [cell([new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: ' ', size: 2 })] })], 10106, accentColor, 0)],
          }),
        ],
      }));
    } else if (templateLayout === 'modern-sidebar') {
      headerChildren.push(textParagraph(name, {
        size: nameSize, bold: true, color: primaryColor, alignment: AlignmentType.LEFT,
      }));
      if (personal.title) headerChildren.push(textParagraph(personal.title, {
        size: baseSize + 3, bold: true, color: accentColor, alignment: AlignmentType.LEFT, after: 80,
      }));
    } else if (templateLayout === 'tech') {
      headerChildren.push(textParagraph('$ whoami', {
        size: baseSize - 1, color: accentColor, alignment: AlignmentType.LEFT, after: 30,
      }));
      headerChildren.push(textParagraph(name, {
        size: nameSize, bold: true, color: primaryColor, alignment: AlignmentType.LEFT, after: 30,
      }));
      if (personal.title) headerChildren.push(textParagraph(`// ${personal.title}`, {
        size: baseSize, color: '555555', alignment: AlignmentType.LEFT, after: 100,
      }));
      if (contacts.length) headerChildren.push(textParagraph(contacts.join('   |   '), {
        size: baseSize - 2, color: textColor, alignment: AlignmentType.LEFT, after: 150,
      }));
      headerChildren.push(new Paragraph({
        spacing: { before: 0, after: 100, line: 240 },
        border: { bottom: { color: primaryColor, space: 3, size: 12, style: BorderStyle.SINGLE } },
        children: [new TextRun({ text: ' ', size: 2 })],
      }));
    } else if (templateLayout === 'timeline') {
      const identityColumn = [
        textParagraph(name, { size: nameSize, bold: true, color: primaryColor, alignment: AlignmentType.LEFT }),
        personal.title ? textParagraph(personal.title, {
          size: baseSize + 2, bold: true, color: accentColor, alignment: AlignmentType.LEFT,
        }) : null,
      ].filter(Boolean);
      headerChildren.push(twoColumnTable(
        identityColumn,
        contacts.slice(0, 4).map(contact => textParagraph(contact, {
          size: baseSize - 2, color: '555555', alignment: AlignmentType.RIGHT,
        })).filter(Boolean),
        6400, undefined, undefined
      ));
      headerChildren.push(new Paragraph({
        spacing: { before: 20, after: 80, line: 240 },
        border: { bottom: { color: primaryColor, space: 4, size: 18, style: BorderStyle.SINGLE } },
        children: [new TextRun({ text: ' ' })],
      }));
    } else {
      headerChildren.push(nameParagraph(
        primaryColor,
        templateLayout === 'minimal' || templateLayout === 'elegant' ? AlignmentType.LEFT : AlignmentType.CENTER
      ));
      if (templateLayout === 'elegant') {
        headerChildren.push(new Paragraph({
          spacing: { before: 0, after: 60, line: 240 },
          border: { bottom: { color: accentColor, space: 4, size: 24, style: BorderStyle.SINGLE } },
          indent: { right: 7600 },
          children: [new TextRun({ text: ' ', size: 4 })],
        }));
        if (personal.title) headerChildren.push(textParagraph(personal.title, {
          size: baseSize + 3, italic: true, color: '555555', alignment: AlignmentType.LEFT, after: 80,
        }));
      } else if (templateLayout === 'minimal') {
        headerChildren.push(textParagraph(personal.title, {
          size: baseSize + 2, color: accentColor, alignment: AlignmentType.LEFT, after: 60,
        }));
        headerChildren.push(textParagraph(contacts.join('  |  '), {
          size: baseSize - 2, color: '555555', alignment: AlignmentType.LEFT, after: 160,
        }));
      } else {
        headerChildren.push(...identity.filter(Boolean));
      }
    }

    if (customOrderEnabled) {
      for (const section of orderedSections) headerChildren.push(...sectionParagraphs(section));
    } else if (sidebarLayout) {
      const sidebarTypes = new Set(
        templateLayout === 'executive'
          ? ['skills', 'education', 'certifications']
          : ['skills', 'education', 'certifications', 'languages']
      );
      const sidebarSections = orderedSections.filter(section => sidebarTypes.has(section.section_type));
      const mainSections = orderedSections.filter(section => !sidebarTypes.has(section.section_type));
      const SIDE_W = templateLayout === 'modern-sidebar' ? 3200 : 3206; // side column width (DXA)
      const MAIN_W = 10106 - SIDE_W;
      const sidebarChildren = [];
      if (templateLayout === 'modern-sidebar' || templateLayout === 'elegant') {
        if (templateLayout === 'modern-sidebar' && nameInitials) {
          sidebarChildren.push(textParagraph(nameInitials, {
            size: Math.round(baseSize * 2.6), bold: true, color: accentColor, alignment: AlignmentType.LEFT, after: 120,
          }));
        }
        sidebarChildren.push(headingParagraph('Contact', templateLayout === 'modern-sidebar'));
        sidebarChildren.push(...contacts.map(contact => textParagraph(contact, {
          size: baseSize - 2,
          color: templateLayout === 'modern-sidebar' ? 'EAF0F2' : textColor,
          alignment: AlignmentType.LEFT,
        })).filter(Boolean));
      }
      for (const section of sidebarSections) sidebarChildren.push(...sectionParagraphs(section, true, SIDE_W - 520));

      // usable width of the main column once cell padding is removed (nested tables must fit it)
      const mainContentWidth = MAIN_W - 600;
      // Own array: the old code aliased headerChildren, which duplicated every section.
      const mainChildren = templateLayout === 'modern-sidebar' ? [...headerChildren] : [];
      for (const section of mainSections) mainChildren.push(...sectionParagraphs(section, false, mainContentWidth));

      if (templateLayout === 'modern-sidebar') {
        headerChildren.length = 0; // name/title now live inside the main column
        headerChildren.push(twoColumnTable(sidebarChildren, mainChildren, SIDE_W, primaryColor, undefined));
      } else {
        // executive + elegant: full-width header on top, then [main | tinted side panel]
        headerChildren.push(twoColumnTable(
          mainChildren, sidebarChildren, MAIN_W, undefined,
          templateLayout === 'elegant' ? tintColor(accentColor, 0.85) : 'F2F3F6'
        ));
      }
    } else if (templateLayout === 'creative' || templateLayout === 'tech') {
      const bottomColumnTypes = new Set(['education', 'certifications']);
      const mainSections = orderedSections.filter(section => !bottomColumnTypes.has(section.section_type));
      const bottomSections = orderedSections.filter(section => bottomColumnTypes.has(section.section_type));
      for (const section of mainSections) headerChildren.push(...sectionParagraphs(section));
      if (bottomSections.length) {
        const education = bottomSections.find(section => section.section_type === 'education');
        const certifications = bottomSections.find(section => section.section_type === 'certifications');
        headerChildren.push(twoColumnTable(
          education ? sectionParagraphs(education, false, 5053 - 400) : [],
          certifications ? sectionParagraphs(certifications, false, 5053 - 400) : [],
          5053,
          undefined,
          undefined
        ));
        for (const section of bottomSections.filter(section =>
          !['education', 'certifications'].includes(section.section_type)
        )) headerChildren.push(...sectionParagraphs(section));
      }
    } else {
      const sectionBlocks = [];
      for (const section of orderedSections) sectionBlocks.push(...sectionParagraphs(section));
      if (templateLayout === 'classic') {
        headerChildren.push(new Paragraph({
          spacing: { before: 40, after: 140 },
          border: { bottom: { color: primaryColor, space: 4, size: 12, style: BorderStyle.DOUBLE } },
          children: [new TextRun({ text: ' ' })],
        }));
      }
      headerChildren.push(...sectionBlocks);
    }

    const document = new Document({
      fonts: embeddedFont ? [embeddedFont] : [],
      embedFonts: Boolean(embeddedFont),
      styles: {
        default: {
          document: { run: { font, size: baseSize, color: textColor } },
        },
      },
      sections: [{
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: templateLayout === 'minimal'
              ? { top: 900, right: 900, bottom: 900, left: 900 }
              : { top: 720, right: 900, bottom: 720, left: 900 },
          },
        },
        children: headerChildren,
      }],
    });
  return addFontFallback(await Packer.toBuffer(document), embeddedFont && customization.font);
}

module.exports = { buildResumeDocx };
