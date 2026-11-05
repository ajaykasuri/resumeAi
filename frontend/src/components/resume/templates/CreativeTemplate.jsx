import React from 'react';
import '../styles/CreativeTemplate.css';

function PersonalInfo({ content, customization }) {
  const primary = customization?.primaryColor || '#1a1a2e';
  const accent = customization?.accentColor || '#6c63ff';
  return (
    <div className="crT-header" style={{ background: primary }}>
      <div className="crT-name-box" style={{ background: accent }}>
        <h1 className="crT-name" style={{ color: '#ffffff' }}>{content.name || 'Your Name'}</h1>
      </div>
      <div className="crT-subtitle" style={{ color: accent }}>{content.title || 'Professional'}</div>
      <div className="crT-contact-strip">
        {[
          content.email && { label: content.email },
          content.phone && { label: content.phone },
          content.location && { label: content.location },
        ].filter(Boolean).map((item, i) => (
          <span key={i} className="crT-contact-badge">{item.label}</span>
        ))}
      </div>
    </div>
  );
}

function ExperienceSection({ content, customization }) {
  const accent = customization?.accentColor || '#6c63ff';
  if (!content.items?.length) return null;
  return (
    <div className="crT-exp-list">
      {content.items.map((item, i) => (
        <div key={i} className="crT-exp-card" style={{ borderLeftColor: accent }}>
          <div className="crT-exp-year">{item.startDate}</div>
          <div className="crT-exp-title">{item.jobTitle}</div>
          <div className="crT-company">{item.company}</div>
          {(item.bullets?.length || item.description) && (
            <ul className="crT-bullets">
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
    <div className="crT-edu-list">
      {content.items.map((item, i) => (
        <div key={i} className="crT-edu-card" style={{ backgroundColor: `${accent}08`, borderTopColor: accent }}>
          <div className="crT-degree">{item.degree}</div>
          <div className="crT-school">{item.institution}</div>
          <div className="crT-edu-year">{item.startYear}–{item.endYear}</div>
        </div>
      ))}
    </div>
  );
}

function SkillsSection({ content, customization }) {
  const accent = customization?.accentColor || '#6c63ff';
  if (!content.categories?.length) return null;
  return (
    <div className="crT-skills-grid">
      {content.categories.map((cat, i) => (
        <div key={i} className="crT-skill-box" style={{ backgroundColor: `${accent}12` }}>
          <div className="crT-skill-cat-label" style={{ color: accent }}>{cat.name}</div>
          <div className="crT-skill-items">
            {(cat.skills || []).map((skill, j) => (
              <span key={j} className="crT-skill-item">{skill}</span>
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
    <div className="crT-proj-grid">
      {content.items.map((item, i) => (
        <div key={i} className="crT-proj-card">
          <div className="crT-proj-marker" style={{ background: accent }} />
          <div className="crT-proj-name">{item.name}</div>
          {item.description && <p className="crT-proj-desc">{item.description}</p>}
          {item.technologies && (
            <div className="crT-tech-tags">
              {(Array.isArray(item.technologies) ? item.technologies : item.technologies.split(','))
                .map((t, j) => <span key={j} style={{ background: `${accent}20`, color: accent }}>{t.trim()}</span>)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function CreativeTemplate({ sections = [], customization = {} }) {
  const font = customization.font || 'Syne, sans-serif';
  const lineHeight = customization.lineHeight || 1.5;

  const personalSection = sections.find(s => s.section_type === 'personal_info');
  const experienceSection = sections.find(s => s.section_type === 'experience' && s.is_visible);
  const educationSection = sections.find(s => s.section_type === 'education' && s.is_visible);
  const skillsSection = sections.find(s => s.section_type === 'skills' && s.is_visible);
  const projectsSection = sections.find(s => s.section_type === 'projects' && s.is_visible);

  return (
    <div
      className="creative-template-root"
      style={{
        fontFamily: font,
        lineHeight,
      }}
    >
      {personalSection && (
        <PersonalInfo content={personalSection.content} customization={customization} />
      )}

      {experienceSection && (
        <div className="crT-section">
          <h3 className="crT-section-title" style={{ color: customization.primaryColor || '#1a1a2e' }}>
            EXPERIENCE
          </h3>
          <ExperienceSection content={experienceSection.content} customization={customization} />
        </div>
      )}

      {educationSection && (
        <div className="crT-section">
          <h3 className="crT-section-title" style={{ color: customization.primaryColor || '#1a1a2e' }}>
            EDUCATION
          </h3>
          <EducationSection content={educationSection.content} customization={customization} />
        </div>
      )}

      {skillsSection && (
        <div className="crT-section">
          <h3 className="crT-section-title" style={{ color: customization.primaryColor || '#1a1a2e' }}>
            SKILLS
          </h3>
          <SkillsSection content={skillsSection.content} customization={customization} />
        </div>
      )}

      {projectsSection && (
        <div className="crT-section">
          <h3 className="crT-section-title" style={{ color: customization.primaryColor || '#1a1a2e' }}>
            PROJECTS
          </h3>
          <ProjectsSection content={projectsSection.content} customization={customization} />
        </div>
      )}
    </div>
  );
}
