import React from 'react';
import '../styles/GridTemplate.css';

function PersonalInfo({ content, customization }) {
  const accent = customization?.accentColor || '#6c63ff';
  const primary = customization?.primaryColor || '#1a1a2e';
  return (
    <div className="gt-header" style={{ background: primary }}>
      <h1 className="gt-name" style={{ color: '#ffffff' }}>{content.name || 'Your Name'}</h1>
      {content.title && <div className="gt-job-title" style={{ color: accent }}>{content.title}</div>}
      <div className="gt-contact-pills">
        {[
          content.email && { label: content.email, icon: '✉' },
          content.phone && { label: content.phone, icon: '☎' },
          content.location && { label: content.location, icon: '📍' },
        ].filter(Boolean).map((item, i) => (
          <span key={i} className="gt-contact-pill" style={{ background: `${accent}15`, color: accent }}>
            {item.icon} {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function ExperienceSection({ content, customization }) {
  if (!content.items?.length) return null;
  return (
    <div className="gt-exp-list">
      {content.items.map((item, i) => (
        <div key={i} className="gt-exp-card" style={{ borderLeft: `3px solid ${customization.accentColor || '#6c63ff'}` }}>
          <div className="gt-exp-date">{item.startDate} – {item.endDate || 'Present'}</div>
          <div className="gt-exp-title">{item.jobTitle}</div>
          <div className="gt-exp-company">{item.company}</div>
          {(item.bullets?.length || item.description) && (
            <ul className="gt-bullets">
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
  if (!content.items?.length) return null;
  return (
    <div className="gt-edu-list">
      {content.items.map((item, i) => (
        <div key={i} className="gt-edu-card">
          <div className="gt-degree">{item.degree}</div>
          <div className="gt-school">{item.institution}</div>
          <div className="gt-edu-date">{item.startYear}{item.endYear ? ` – ${item.endYear}` : ''}</div>
          {item.gpa && <div className="gt-gpa">GPA: {item.gpa}</div>}
        </div>
      ))}
    </div>
  );
}

function SkillsSection({ content, customization }) {
  const accent = customization?.accentColor || '#6c63ff';
  if (!content.categories?.length) return null;
  return (
    <div className="gt-skills-grid">
      {content.categories.map((cat, i) => (
        <div key={i} className="gt-skill-box" style={{ borderTop: `3px solid ${accent}` }}>
          {content.categories.length > 1 && (
            <div className="gt-skill-cat-name" style={{ color: accent }}>{cat.name}</div>
          )}
          <div className="gt-skill-tags">
            {(cat.skills || []).map((skill, j) => (
              <span key={j} className="gt-skill-tag" style={{ backgroundColor: `${accent}20`, color: accent }}>
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
    <div className="gt-proj-grid">
      {content.items.map((item, i) => (
        <div key={i} className="gt-proj-card">
          <div className="gt-proj-name">{item.name}</div>
          {item.description && <p className="gt-proj-desc">{item.description}</p>}
          {item.technologies && (
            <div className="gt-tech-tags">
              {(Array.isArray(item.technologies) ? item.technologies : item.technologies.split(','))
                .map((t, j) => <span key={j} style={{ color: accent }}>{t.trim()}</span>)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function GridTemplate({ sections = [], customization = {} }) {
  const font = customization.font || 'DM Sans';
  const fontSize = customization.fontSize || 10.5;
  const lineHeight = customization.lineHeight || 1.6;

  const personalSection = sections.find(s => s.section_type === 'personal_info');
  const experienceSection = sections.find(s => s.section_type === 'experience' && s.is_visible);
  const educationSection = sections.find(s => s.section_type === 'education' && s.is_visible);
  const skillsSection = sections.find(s => s.section_type === 'skills' && s.is_visible);
  const projectsSection = sections.find(s => s.section_type === 'projects' && s.is_visible);

  return (
    <div
      className="grid-template-root"
      style={{
        fontFamily: `'${font}', sans-serif`,
        fontSize: `${fontSize}pt`,
        lineHeight,
      }}
    >
      {personalSection && (
        <PersonalInfo content={personalSection.content} customization={customization} />
      )}

      {experienceSection && (
        <div className="gt-section">
          <h3 className="gt-section-title" style={{ color: customization.primaryColor || '#1a1a2e' }}>
            WORK EXPERIENCE
          </h3>
          <ExperienceSection content={experienceSection.content} customization={customization} />
        </div>
      )}

      {educationSection && (
        <div className="gt-section">
          <h3 className="gt-section-title" style={{ color: customization.primaryColor || '#1a1a2e' }}>
            EDUCATION
          </h3>
          <EducationSection content={educationSection.content} />
        </div>
      )}

      {skillsSection && (
        <div className="gt-section">
          <h3 className="gt-section-title" style={{ color: customization.primaryColor || '#1a1a2e' }}>
            SKILLS
          </h3>
          <SkillsSection content={skillsSection.content} customization={customization} />
        </div>
      )}

      {projectsSection && (
        <div className="gt-section">
          <h3 className="gt-section-title" style={{ color: customization.primaryColor || '#1a1a2e' }}>
            PROJECTS
          </h3>
          <ProjectsSection content={projectsSection.content} customization={customization} />
        </div>
      )}
    </div>
  );
}
