import React from 'react';
import '../styles/SidebarTemplate.css';

function PersonalInfo({ content, customization }) {
  const primary = customization?.primaryColor || '#1a1a2e';
  return (
    <div className="st-sidebar-header" style={{ background: primary }}>
      <h1 className="st-name" style={{ color: '#ffffff' }}>{content.name || 'Your Name'}</h1>
      {content.title && <div className="st-job-title">{content.title}</div>}
    </div>
  );
}

function SidebarInfo({ content, customization }) {
  const accent = customization?.accentColor || '#6c63ff';
  return (
    <div className="st-sidebar-info">
      <div className="st-contact-section">
        <h4 style={{ color: accent, marginBottom: 8 }}>CONTACT</h4>
        {[
          content.email && { label: content.email, icon: '✉' },
          content.phone && { label: content.phone, icon: '☎' },
          content.location && { label: content.location, icon: '📍' },
          content.linkedin && { label: content.linkedin, icon: 'in' },
          content.website && { label: content.website, icon: '🌐' },
          content.github && { label: content.github, icon: '⌥' },
        ].filter(Boolean).map((item, i) => (
          <div key={i} className="st-sidebar-item" style={{ borderLeftColor: accent }}>
            <span className="st-sidebar-icon">{item.icon}</span>
            <span className="st-sidebar-label">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SkillsSection({ content, customization }) {
  const accent = customization?.accentColor || '#6c63ff';
  if (!content.categories?.length) return null;
  return (
    <div className="st-sidebar-section">
      <h4 style={{ color: accent, marginBottom: 8 }}>SKILLS</h4>
      {content.categories.map((cat, i) => (
        <div key={i} className="st-sidebar-skill-cat">
          {content.categories.length > 1 && (
            <div className="st-sidebar-cat-name">{cat.name}</div>
          )}
          {(cat.skills || []).map((skill, j) => (
            <span key={j} className="st-sidebar-skill">{skill}</span>
          ))}
        </div>
      ))}
    </div>
  );
}

function ExperienceSection({ content }) {
  if (!content.items?.length) return <p className="st-placeholder">No experience added yet.</p>;
  return (
    <div className="st-list">
      {content.items.map((item, i) => (
        <div key={i} className="st-exp-item">
          <div className="st-exp-header">
            <div className="st-item-title">{item.jobTitle}</div>
            <div className="st-company">{item.company}</div>
          </div>
          <div className="st-exp-meta">{item.startDate} – {item.endDate || 'Present'}</div>
          {(item.bullets?.length || item.description) && (
            <ul className="st-bullets">
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

function EducationSection({ content }) {
  if (!content.items?.length) return <p className="st-placeholder">No education added yet.</p>;
  return (
    <div className="st-list">
      {content.items.map((item, i) => (
        <div key={i} className="st-edu-item">
          <div className="st-item-title">{item.degree}</div>
          <div className="st-edu-school">{item.institution}</div>
          <div className="st-exp-meta">{item.startYear}{item.endYear ? ` – ${item.endYear}` : ''}</div>
          {item.gpa && <div className="st-gpa">GPA: {item.gpa}</div>}
        </div>
      ))}
    </div>
  );
}

function ProjectsSection({ content, customization }) {
  const accent = customization?.accentColor || '#6c63ff';
  if (!content.items?.length) return <p className="st-placeholder">No projects added yet.</p>;
  return (
    <div className="st-list">
      {content.items.map((item, i) => (
        <div key={i} className="st-proj-item">
          <div className="st-item-title">{item.name}</div>
          {item.description && <p className="st-proj-desc">{item.description}</p>}
          {item.technologies && (
            <div className="st-tech-list">
              {(Array.isArray(item.technologies) ? item.technologies : item.technologies.split(','))
                .map((t, j) => <span key={j} className="st-tech-tag">{t.trim()}</span>)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function SidebarTemplate({ sections = [], customization = {} }) {
  const font = customization.font || 'DM Sans';
  const fontSize = customization.fontSize || 10.5;
  const lineHeight = customization.lineHeight || 1.6;
  const accent = customization.accentColor || '#6c63ff';

  const personalSection = sections.find(s => s.section_type === 'personal_info');
  const skillsSection = sections.find(s => s.section_type === 'skills' && s.is_visible);
  const otherSections = sections.filter(s => ['personal_info', 'skills'].indexOf(s.section_type) === -1 && s.is_visible);

  return (
    <div
      className="sidebar-template-root"
      style={{
        fontFamily: `'${font}', sans-serif`,
        fontSize: `${fontSize}pt`,
        lineHeight,
      }}
    >
      <div className="st-layout">
        {/* LEFT SIDEBAR */}
        <div className="st-sidebar" style={{ backgroundColor: `${customization.primaryColor || '#1a1a2e'}10` }}>
          {personalSection && (
            <PersonalInfo content={personalSection.content} customization={customization} />
          )}
          
          {personalSection && (
            <SidebarInfo content={personalSection.content} customization={customization} />
          )}

          {skillsSection && (
            <SkillsSection content={skillsSection.content} customization={customization} />
          )}
        </div>

        {/* MAIN CONTENT */}
        <div className="st-main">
          {otherSections.map((section) => (
            <div key={section.id || section.section_type} className="st-section">
              {section.section_type !== 'summary' && (
                <div className="st-section-header">
                  <h3 className="st-section-title" style={{ color: customization.primaryColor || '#1a1a2e' }}>
                    {section.section_type.toUpperCase()}
                  </h3>
                  <div className="st-section-line" style={{ background: accent }} />
                </div>
              )}
              <div className="st-section-content">
                {section.section_type === 'summary' && <p className="st-summary">{section.content.text}</p>}
                {section.section_type === 'experience' && <ExperienceSection content={section.content} />}
                {section.section_type === 'education' && <EducationSection content={section.content} />}
                {section.section_type === 'projects' && <ProjectsSection content={section.content} customization={customization} />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
