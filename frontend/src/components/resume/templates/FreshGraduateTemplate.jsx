import React from 'react';
import '../styles/FreshGraduateTemplate.css';

function PersonalInfo({ content, customization }) {
  const primary = customization?.primaryColor || '#1a1a2e';
  const accent = customization?.accentColor || '#6c63ff';
  return (
    <div className="fgT-header" style={{ background: primary }}>
      <h1 className="fgT-name" style={{ color: '#ffffff' }}>{content.name || 'Your Name'}</h1>
      {content.title && <div className="fgT-job-title" style={{ color: accent }}>{content.title}</div>}
      <div className="fgT-contact-row">
        {[
          content.email && { label: content.email, icon: '📧' },
          content.phone && { label: content.phone, icon: '📱' },
          content.location && { label: content.location, icon: '📍' },
        ].filter(Boolean).map((item, i) => (
          <span key={i} className="fgT-contact-item">
            {item.icon} {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function SummarySection({ content }) {
  if (!content.text) return null;
  return <p className="fgT-summary">{content.text}</p>;
}

function ExperienceSection({ content, customization }) {
  const accent = customization?.accentColor || '#6c63ff';
  if (!content.items?.length) return null;
  return (
    <div className="fgT-exp-list">
      {content.items.map((item, i) => (
        <div key={i} className="fgT-exp-card" style={{ backgroundColor: `${accent}08`, borderTopColor: accent }}>
          <div className="fgT-exp-title">{item.jobTitle}</div>
          <div className="fgT-company-row">
            <span className="fgT-company">{item.company}</span>
            <span className="fgT-date">{item.startDate} – {item.endDate || 'Present'}</span>
          </div>
          {(item.bullets?.length || item.description) && (
            <ul className="fgT-bullets">
              {item.bullets?.length
                ? item.bullets.map((b, j) => <li key={j}>{b}</li>)
                : <li>{item.description}</li>
              }
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

function EducationSection({ content, customization }) {
  const accent = customization?.accentColor || '#6c63ff';
  if (!content.items?.length) return null;
  return (
    <div className="fgT-edu-list">
      {content.items.map((item, i) => (
        <div key={i} className="fgT-edu-card">
          <div className="fgT-degree" style={{ color: accent }}>{item.degree}</div>
          <div className="fgT-school">{item.institution}</div>
          <div className="fgT-edu-date">{item.startYear} – {item.endYear}</div>
          {item.gpa && <div className="fgT-gpa">GPA: {item.gpa}</div>}
        </div>
      ))}
    </div>
  );
}

function SkillsSection({ content, customization }) {
  const accent = customization?.accentColor || '#6c63ff';
  if (!content.categories?.length) return null;
  return (
    <div className="fgT-skills-cloud">
      {content.categories.map((cat, i) => (
        <div key={i} className="fgT-skill-section">
          {content.categories.length > 1 && (
            <div className="fgT-skill-cat-label" style={{ color: accent }}>{cat.name}</div>
          )}
          <div className="fgT-skill-bubble-list">
            {(cat.skills || []).map((skill, j) => (
              <span key={j} className="fgT-skill-bubble" style={{ backgroundColor: `${accent}20`, color: accent }}>
                {skill}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProjectsSection({ content, customization }) {
  const accent = customization?.accentColor || '#6c63ff';
  if (!content.items?.length) return null;
  return (
    <div className="fgT-proj-gallery">
      {content.items.map((item, i) => (
        <div key={i} className="fgT-proj-showcase" style={{ borderLeftColor: accent }}>
          <div className="fgT-proj-name" style={{ color: accent }}>{item.name}</div>
          {item.description && <p className="fgT-proj-desc">{item.description}</p>}
          {item.technologies && (
            <div className="fgT-tech-badges">
              {(Array.isArray(item.technologies) ? item.technologies : item.technologies.split(','))
                .map((t, j) => <span key={j} style={{ backgroundColor: `${accent}15`, color: accent }}>{t.trim()}</span>)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function FreshGraduateTemplate({ sections = [], customization = {} }) {
  const font = customization.font || 'Nunito, sans-serif';
  const fontSize = customization.fontSize || 10.5;
  const lineHeight = customization.lineHeight || 1.7;

  const personalSection = sections.find(s => s.section_type === 'personal_info');
  const summarySection = sections.find(s => s.section_type === 'summary' && s.is_visible);
  const experienceSection = sections.find(s => s.section_type === 'experience' && s.is_visible);
  const educationSection = sections.find(s => s.section_type === 'education' && s.is_visible);
  const skillsSection = sections.find(s => s.section_type === 'skills' && s.is_visible);
  const projectsSection = sections.find(s => s.section_type === 'projects' && s.is_visible);

  return (
    <div
      className="fresh-graduate-template-root"
      style={{
        fontFamily: font,
        fontSize: `${fontSize}pt`,
        lineHeight,
      }}
    >
      {personalSection && (
        <PersonalInfo content={personalSection.content} customization={customization} />
      )}

      {summarySection && (
        <div className="fgT-section">
          <SummarySection content={summarySection.content} />
        </div>
      )}

      {experienceSection && (
        <div className="fgT-section">
          <h3 className="fgT-section-title" style={{ color: customization.primaryColor || '#1a1a2e' }}>
            EXPERIENCE
          </h3>
          <ExperienceSection content={experienceSection.content} customization={customization} />
        </div>
      )}

      {educationSection && (
        <div className="fgT-section">
          <h3 className="fgT-section-title" style={{ color: customization.primaryColor || '#1a1a2e' }}>
            EDUCATION
          </h3>
          <EducationSection content={educationSection.content} customization={customization} />
        </div>
      )}

      {skillsSection && (
        <div className="fgT-section">
          <h3 className="fgT-section-title" style={{ color: customization.primaryColor || '#1a1a2e' }}>
            SKILLS
          </h3>
          <SkillsSection content={skillsSection.content} customization={customization} />
        </div>
      )}

      {projectsSection && (
        <div className="fgT-section">
          <h3 className="fgT-section-title" style={{ color: customization.primaryColor || '#1a1a2e' }}>
            PROJECTS
          </h3>
          <ProjectsSection content={projectsSection.content} customization={customization} />
        </div>
      )}
    </div>
  );
}
