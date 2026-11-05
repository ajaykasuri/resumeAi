const PDFDocument = require('pdfkit');
const {
  Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel,
  Table, TableRow, TableCell, WidthType, BorderStyle,
} = require('docx');
const { query, queryOne } = require('../config/database');

async function getResumeWithSections(uuid) {
  const resume = await queryOne(
    `SELECT r.*, t.name as template_name, t.slug as template_slug, t.config as template_config
     FROM resumes r LEFT JOIN templates t ON r.template_id = t.id WHERE r.uuid = ?`,
    [uuid]
  );
  if (!resume) return null;
  const sections = await query(
    'SELECT * FROM resume_sections WHERE resume_id = ? AND is_visible = 1 ORDER BY sort_order ASC',
    [resume.id]
  );
  resume.sections = sections.map(s => ({
    ...s,
    content: typeof s.content === 'string' ? JSON.parse(s.content) : s.content,
  }));
  if (resume.customization && typeof resume.customization === 'string')
    resume.customization = JSON.parse(resume.customization);
  if (resume.template_config && typeof resume.template_config === 'string')
    resume.template_config = JSON.parse(resume.template_config);
  return resume;
}

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

// POST /api/downloads/pdf/:id
const downloadPDF = async (req, res, next) => {
  try {
    const { id } = req.params;
    const resume = await getResumeWithSections(id);
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });

    const customization = resume.customization || {};
    const primaryColor = customization.primaryColor || '#1a1a2e';
    const accentColor = customization.accentColor || '#e94560';

    const doc = new PDFDocument({
      size: 'A4', margins: { top: 40, bottom: 40, left: 50, right: 50 }, bufferPages: true,
    });

    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));

    const personalSection = resume.sections.find(s => s.section_type === 'personal_info');
    const personal = personalSection?.content || {};
    const name = personal.name || resume.title || 'Resume';

    // ── Header ─────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 90).fill(primaryColor);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(24).text(name, 50, 22, { align: 'left' });

    const contactItems = [
      personal.email, personal.phone, personal.location,
      personal.linkedin, personal.website,
    ].filter(Boolean);

    doc.font('Helvetica').fontSize(9).fillColor('#e0e0e0')
      .text(contactItems.join('  |  '), 50, 55, { align: 'left', width: doc.page.width - 100 });

    doc.rect(0, 90, doc.page.width, 4).fill(accentColor);

    let y = 110;

    for (const section of resume.sections) {
      if (section.section_type === 'personal_info') continue;
      const content = section.content;
      const title = getSectionTitle(section);

      if (y > doc.page.height - 80) { doc.addPage(); y = 40; }

      // Section header
      doc.font('Helvetica-Bold').fontSize(11).fillColor(primaryColor).text(title.toUpperCase(), 50, y);
      y += 16;
      doc.moveTo(50, y).lineTo(doc.page.width - 50, y).lineWidth(1.5).strokeColor(accentColor).stroke();
      y += 8;

      // Section content
      if (section.section_type === 'summary' || section.section_type === 'objective') {
        if (content.text) {
          doc.font('Helvetica').fontSize(10).fillColor('#333333')
            .text(content.text, 50, y, { width: doc.page.width - 100, align: 'justify' });
          y += doc.heightOfString(content.text, { width: doc.page.width - 100 }) + 12;
        }
      }

      if (section.section_type === 'experience' && content.items) {
        for (const item of content.items) {
          if (y > doc.page.height - 100) { doc.addPage(); y = 40; }
          doc.font('Helvetica-Bold').fontSize(10.5).fillColor('#1a1a1a').text(item.jobTitle || '', 50, y);
          const dateStr = `${item.startDate || ''} – ${item.endDate || 'Present'}`;
          doc.font('Helvetica').fontSize(9).fillColor('#666666')
            .text(dateStr, 50, y, { align: 'right', width: doc.page.width - 100 });
          y += 14;
          doc.font('Helvetica').fontSize(9.5).fillColor(accentColor)
            .text(`${item.company || ''}${item.location ? '  ·  ' + item.location : ''}`, 50, y);
          y += 14;
          const bullets = item.bullets || (item.description ? [item.description] : []);
          for (const bullet of bullets) {
            if (y > doc.page.height - 60) { doc.addPage(); y = 40; }
            doc.font('Helvetica').fontSize(9.5).fillColor('#333333')
              .text(`• ${bullet}`, 55, y, { width: doc.page.width - 110 });
            y += doc.heightOfString(bullet, { width: doc.page.width - 115 }) + 5;
          }
          y += 8;
        }
      }

      if (section.section_type === 'education' && content.items) {
        for (const item of content.items) {
          if (y > doc.page.height - 80) { doc.addPage(); y = 40; }
          doc.font('Helvetica-Bold').fontSize(10.5).fillColor('#1a1a1a').text(item.degree || '', 50, y);
          doc.font('Helvetica').fontSize(9).fillColor('#666666')
            .text(`${item.startYear || ''} – ${item.endYear || ''}`, 50, y, { align: 'right', width: doc.page.width - 100 });
          y += 14;
          doc.font('Helvetica').fontSize(9.5).fillColor(accentColor).text(item.institution || '', 50, y);
          if (item.gpa) {
            doc.font('Helvetica').fontSize(9).fillColor('#666').text(`GPA: ${item.gpa}`, 200, y);
          }
          y += 20;
        }
      }

      if (section.section_type === 'skills' && content.categories) {
        for (const cat of content.categories) {
          if (y > doc.page.height - 60) { doc.addPage(); y = 40; }
          if (cat.name && content.categories.length > 1) {
            doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#333').text(`${cat.name}:`, 50, y);
            y += 14;
          }
          const skillText = (cat.skills || []).join('  ·  ');
          doc.font('Helvetica').fontSize(9.5).fillColor('#333333').text(skillText, 55, y, { width: doc.page.width - 110 });
          y += doc.heightOfString(skillText, { width: doc.page.width - 110 }) + 8;
        }
      }

      if (section.section_type === 'projects' && content.items) {
        for (const item of content.items) {
          if (y > doc.page.height - 80) { doc.addPage(); y = 40; }
          doc.font('Helvetica-Bold').fontSize(10.5).fillColor('#1a1a1a').text(item.name || '', 50, y);
          if (item.technologies) {
            const techStr = Array.isArray(item.technologies) ? item.technologies.join(', ') : item.technologies;
            doc.font('Helvetica').fontSize(8.5).fillColor(accentColor).text(techStr, 50, y, { align: 'right', width: doc.page.width - 100 });
          }
          y += 14;
          if (item.description) {
            doc.font('Helvetica').fontSize(9.5).fillColor('#333333').text(item.description, 55, y, { width: doc.page.width - 110 });
            y += doc.heightOfString(item.description, { width: doc.page.width - 110 }) + 8;
          }
        }
      }

      if (section.section_type === 'certifications' && content.items) {
        for (const item of content.items) {
          if (y > doc.page.height - 60) { doc.addPage(); y = 40; }
          doc.font('Helvetica-Bold').fontSize(10).fillColor('#1a1a1a').text(item.name || '', 50, y);
          doc.font('Helvetica').fontSize(9).fillColor('#666').text(item.date || '', 50, y, { align: 'right', width: doc.page.width - 100 });
          y += 13;
          doc.font('Helvetica').fontSize(9.5).fillColor('#666666').text(item.issuer || '', 55, y);
          y += 16;
        }
      }

      if ((section.section_type === 'languages' || section.section_type === 'interests') && content.items) {
        const items = content.items.map(i => typeof i === 'string' ? i : `${i.name || ''}${i.level ? ' ('+i.level+')' : ''}`);
        doc.font('Helvetica').fontSize(9.5).fillColor('#333').text(items.join('  ·  '), 50, y, { width: doc.page.width - 100 });
        y += 20;
      }

      y += 6;
    }

    // Footer
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);
      doc.font('Helvetica').fontSize(8).fillColor('#aaaaaa')
        .text(`Page ${i + 1} of ${range.count}`, 0, doc.page.height - 25, { align: 'center' });
    }

    doc.end();

    await new Promise(resolve => doc.on('end', resolve));
    const pdfBuffer = Buffer.concat(chunks);

    // Log download
    await query(
      'INSERT INTO downloads (resume_id, user_id, format, ip_address, file_size_bytes) VALUES (?, ?, "pdf", ?, ?)',
      [resume.id, req.user?.role !== 'guest' ? req.user?.id : null, req.ip, pdfBuffer.length]
    );
    await query('UPDATE resumes SET download_count = download_count + 1 WHERE id = ?', [resume.id]);

    const filename = `${(name || 'resume').replace(/[^a-z0-9]/gi, '_').toLowerCase()}_resume.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer);
  } catch (error) { next(error); }
};

// POST /api/downloads/docx/:id
const downloadDOCX = async (req, res, next) => {
  try {
    const { id } = req.params;
    const resume = await getResumeWithSections(id);
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });

    const personal = resume.sections.find(s => s.section_type === 'personal_info')?.content || {};
    const name = personal.name || resume.title || 'Resume';
    const customization = {
      ...(resume.template_config || {}),
      ...(resume.customization || {}),
    };
    const templateSlug = customization.templateSlug || resume.template_slug || 'executive-pro';
    const templateLayout = {
      'executive-pro': 'classic',
      'modern-slate': 'modern-sidebar',
      'minimal-edge': 'minimal',
      'corporate-blue': 'executive',
      'creative-canvas': 'creative',
      'tech-resume': 'tech',
      'elegant-serif': 'elegant',
      'fresh-graduate': 'timeline',
    }[templateSlug] || 'classic';
    const colorValue = (value, fallback) =>
      /^#[\da-f]{6}$/i.test(value || '') ? value.slice(1) : fallback;
    const primaryColor = colorValue(customization.primaryColor, '1a1a2e');
    const accentColor = colorValue(customization.accentColor, '6c63ff');
    const font = String(customization.font || 'Arial').slice(0, 64);
    const baseSize = Math.max(16, Math.round((Number(customization.fontSize) || 10) * 2));
    const lineHeight = Math.max(1.1, Math.min(2.5, Number(customization.lineHeight) || 1.5));
    const sectionSpacing = Math.max(120, Math.min(480, Math.round((Number(customization.sectionSpacing) || 16) * 15)));
    const textColor = colorValue(customization.textColor, '333333');
    const sidebarLayout = ['modern-sidebar', 'executive', 'elegant'].includes(templateLayout);
    const sections = resume.sections.filter(section =>
      section.section_type !== 'personal_info' && section.is_visible !== 0
    );
    const sectionOrder = {
      classic: ['summary', 'experience', 'education', 'skills', 'projects', 'certifications'],
      'modern-sidebar': ['summary', 'experience', 'projects', 'skills', 'education', 'certifications'],
      minimal: ['summary', 'experience', 'education', 'skills', 'projects', 'certifications'],
      executive: ['summary', 'experience', 'projects', 'skills', 'education', 'certifications'],
      creative: ['summary', 'skills', 'experience', 'projects', 'education', 'certifications'],
      tech: ['summary', 'skills', 'experience', 'projects', 'education', 'certifications'],
      elegant: ['summary', 'experience', 'projects', 'skills', 'education', 'certifications'],
      timeline: ['summary', 'experience', 'education', 'skills', 'projects', 'certifications'],
    }[templateLayout];
    const orderedSections = sections.slice().sort((a, b) => {
      const aIndex = sectionOrder.indexOf(a.section_type);
      const bIndex = sectionOrder.indexOf(b.section_type);
      if (aIndex === -1 && bIndex === -1) return a.sort_order - b.sort_order;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
    const contacts = [
      personal.email, personal.phone, personal.location,
      personal.linkedin, personal.github, personal.website,
    ].filter(Boolean);

    const textParagraph = (text, options = {}) => {
      if (text === null || text === undefined || text === '') return null;
      const { color, size, bold, italic, alignment, bullet, before, after } = options;
      return new Paragraph({
        alignment,
        bullet: bullet ? { indent: 260 } : undefined,
        spacing: {
          before: before || 0,
          after: after === undefined ? Math.round(sectionSpacing / 3) : after,
          line: Math.round(lineHeight * 240),
        },
        children: [new TextRun({
          text: String(text), font, size: size || baseSize, bold, italics: italic,
          color: color || textColor,
        })],
      });
    };
    const headingParagraph = (text, sidebar = false) => {
      const border = templateLayout === 'classic'
        ? { bottom: { color: sidebar ? 'FFFFFF' : primaryColor, space: 3, size: 6, style: BorderStyle.SINGLE } }
        : templateLayout === 'creative'
          ? { bottom: { color: accentColor, space: 4, size: 18, style: BorderStyle.SINGLE } }
          : templateLayout === 'timeline'
            ? { left: { color: accentColor, space: 6, size: 18, style: BorderStyle.SINGLE } }
            : templateLayout === 'elegant'
              ? { bottom: { color: accentColor, space: 4, size: 4, style: BorderStyle.SINGLE } }
            : undefined;
      return new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: sectionSpacing, after: 100, line: Math.round(lineHeight * 240) },
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
      textParagraph(text, { bullet: true, color: sidebar && templateLayout === 'modern-sidebar' ? 'FFFFFF' : undefined });
    const rangeText = (...values) => values.filter(Boolean).join(' – ');

    const sectionParagraphs = (section, sidebar = false) => {
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
              titleColor: textColor, detailColor: '666666', detailItalic: true,
            }));
          } else {
            blocks.push(dateHeaderRow(jobTitle, dates, company, {
              titleColor: primaryColor, detailColor: sidebar ? 'EAF0F2' : accentColor,
              detailItalic: templateLayout === 'elegant',
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
          blocks.push(dateHeaderRow(degreeText, rangeText(item.startYear, item.endYear), educationDetail, {
            titleColor: primaryColor, detailColor: sidebar ? 'EAF0F2' : '666666',
          }));
          addText(item.description);
        }
      } else if (section.section_type === 'skills') {
        for (const category of content.categories || []) {
          const skills = category.skills || [];
          if (category.name) addText(`${category.name}:`, { bold: true, color: primaryColor });
          if (['creative', 'tech'].includes(templateLayout) && skills.length) {
            for (const row of skillTagTables(skills)) blocks.push(row);
          } else {
            addText(skills.join(templateLayout === 'timeline' ? '  ·  ' : ', '));
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
          ].filter(Boolean).join('  |  '), { color: '666666', size: baseSize - 2 });
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
      const { titleColor = primaryColor, detailColor = '666666', detailItalic = false } = options;
      const left = [
        textParagraph(title, { bold: true, color: titleColor, size: baseSize + 1, after: 20 }),
        textParagraph(detail, { color: detailColor, italic: detailItalic, size: baseSize - 1, after: 40 }),
      ].filter(Boolean);
      return new Table({
        width: { size: 10106, type: WidthType.DXA },
        columnWidths: [7900, 2206],
        borders: tableBorders,
        rows: [new TableRow({
          children: [
            cell(left, 7900, undefined, 30),
            cell([textParagraph(date, {
              size: baseSize - 2, color: '666666', alignment: AlignmentType.RIGHT, after: 30,
            })].filter(Boolean), 2206, undefined, 30),
          ],
        })],
      });
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
          columnWidths: [1550, 8556],
          borders: tableBorders,
          rows: [new TableRow({
            children: [
              cell([textParagraph(date, { size: baseSize - 2, color: '666666', alignment: AlignmentType.RIGHT })].filter(Boolean), 1550, undefined, 60),
              cell(content, 8556, undefined, 60),
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
        columnWidths: [1500, 260, 8346],
        borders: tableBorders,
        rows: [new TableRow({
          children: [
            cell([textParagraph(date, { size: baseSize - 2, color: '666666', alignment: AlignmentType.RIGHT })].filter(Boolean), 1500, undefined, 60),
            new TableCell({
              width: { size: 260, type: WidthType.DXA },
              shading: { fill: accentColor },
              margins: { top: 0, bottom: 0, left: 0, right: 0 },
              borders: markerBorders,
              children: [new Paragraph({ children: [new TextRun({ text: ' ' })] })],
            }),
            cell(content, 8346, undefined, 100),
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
      identity.push(textParagraph(personal.title, {
        size: baseSize + 3, bold: true, color: accentColor, alignment: AlignmentType.CENTER, after: 100,
      }));
    }
    if (contacts.length) {
      identity.push(textParagraph(contacts.join('  |  '), {
        size: baseSize - 2, color: '666666', alignment: AlignmentType.CENTER, after: 240,
      }));
    }
    const nameParagraph = (color = primaryColor, alignment = AlignmentType.CENTER) =>
      textParagraph(name, {
        size: baseSize + (templateLayout === 'minimal' ? 16 : 14),
        bold: true, color, alignment, after: 70,
      });
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
        size: baseSize + 14, bold: true, color: primaryColor, alignment: AlignmentType.LEFT,
      }));
      if (personal.title) headerChildren.push(textParagraph(personal.title, {
        size: baseSize + 3, bold: true, color: accentColor, alignment: AlignmentType.LEFT, after: 220,
      }));
    } else if (templateLayout === 'tech') {
      headerChildren.push(textParagraph('$ whoami', {
        size: baseSize - 1, color: accentColor, alignment: AlignmentType.LEFT, after: 30,
      }));
      headerChildren.push(textParagraph(name, {
        size: baseSize + 14, bold: true, color: primaryColor, alignment: AlignmentType.LEFT, after: 30,
      }));
      if (personal.title) headerChildren.push(textParagraph(`// ${personal.title}`, {
        size: baseSize, color: '555555', alignment: AlignmentType.LEFT, after: 100,
      }));
      if (contacts.length) headerChildren.push(textParagraph(contacts.join('   |   '), {
        size: baseSize - 2, color: textColor, alignment: AlignmentType.LEFT, after: 150,
      }));
    } else if (templateLayout === 'timeline') {
      const identityColumn = [
        textParagraph(name, { size: baseSize + 12, bold: true, color: primaryColor, alignment: AlignmentType.LEFT }),
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
        spacing: { before: 60, after: 120 },
        border: { bottom: { color: primaryColor, space: 4, size: 18, style: BorderStyle.SINGLE } },
        children: [new TextRun({ text: ' ' })],
      }));
    } else {
      headerChildren.push(nameParagraph(
        primaryColor,
        templateLayout === 'minimal' ? AlignmentType.LEFT : AlignmentType.CENTER
      ));
      if (templateLayout === 'minimal') {
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

    if (sidebarLayout) {
      const sidebarTypes = new Set(
        templateLayout === 'executive'
          ? ['skills', 'education', 'certifications']
          : ['skills', 'education', 'certifications', 'languages']
      );
      const sidebarSections = orderedSections.filter(section => sidebarTypes.has(section.section_type));
      const mainSections = orderedSections.filter(section => !sidebarTypes.has(section.section_type));
      const sidebarChildren = [];
      if (templateLayout === 'modern-sidebar' || templateLayout === 'elegant') {
        sidebarChildren.push(headingParagraph(
          templateLayout === 'modern-sidebar' ? 'Contact' : 'Contact',
          templateLayout === 'modern-sidebar'
        ));
        sidebarChildren.push(...contacts.map(contact => textParagraph(contact, {
          size: baseSize - 2,
          color: templateLayout === 'modern-sidebar' ? 'EAF0F2' : textColor,
          alignment: AlignmentType.LEFT,
        })).filter(Boolean));
      }
      for (const section of sidebarSections) sidebarChildren.push(...sectionParagraphs(section, true));

      const mainChildren = templateLayout === 'executive' ? [] : headerChildren;
      for (const section of mainSections) mainChildren.push(...sectionParagraphs(section));
      if (templateLayout === 'executive') {
        headerChildren.push(twoColumnTable(
          mainChildren, sidebarChildren, 6900, undefined, 'F2F3F6'
        ));
      } else {
        headerChildren.push(twoColumnTable(
          sidebarChildren, mainChildren, 3200, primaryColor,
          templateLayout === 'elegant' ? tintColor(accentColor, 0.88) : undefined
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
          education ? sectionParagraphs(education) : [],
          certifications ? sectionParagraphs(certifications) : [],
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
      styles: {
        default: {
          document: { run: { font, size: baseSize, color: textColor } },
          heading2: { run: { font, size: baseSize + 2, bold: true, color: primaryColor } },
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
    const docxBuffer = await Packer.toBuffer(document);

    await query(
      'INSERT INTO downloads (resume_id, user_id, format, ip_address) VALUES (?, ?, "docx", ?)',
      [resume.id, req.user?.role !== 'guest' ? req.user?.id : null, req.ip]
    );

    const filename = `${(name || 'resume').replace(/[^a-z0-9]/gi, '_').toLowerCase()}_resume.docx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', docxBuffer.length);
    res.end(docxBuffer);
  } catch (error) { next(error); }
};

module.exports = { downloadPDF, downloadDOCX };
