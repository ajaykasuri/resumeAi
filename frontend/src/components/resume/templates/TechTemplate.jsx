import React from 'react';
import '../styles/TechTemplate.css';

function PersonalInfo({ content, customization }) {
  const accent = customization?.accentColor || '#6c63ff';
  return (
    <div className="techT-header">
      <div className="techT-name-block">
        <h1 className="techT-name">{content.name || 'Your Name'}</h1>
        {content.title && <div className="techT-job-title" style={{ color: accent }}>&lt; {content.title} /&gt;</div>}
      </div>
      <div className="techT-contact">
        {[
          content.email && { label: content.email },
          content.phone && { label: content.phone },
          content.location && { label: content.location },
          content.linkedin && { label: content.linkedin },
          content.website && { label: content.website },
        ].filter(Boolean).map((item, i) => (
          <div key={i} className="techT-contact-item">
            <span style={{ color: accent }}>&gt;</span> {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function ExperienceSection({ content, customization }) {
  const accent = customization?.accentColor || '#6c63ff';
  if (!content.items?.length) return null;
  return (
    <div className="techT-exp-list">
      {content.items.map((item, i) => (
        <div key={i} className="techT-exp-item">
          <div className="techT-exp-header">
            <span style={{ color: accent }}>@</span> <span className="techT-job">{item.jobTitle}</span>
            <span className="techT-company">{item.company}</span>
          </div>
          <div className="techT-exp-date">{item.startDate} → {item.endDate || 'Present'}</div>
          {(item.bullets?.length || item.description) && (
            <ul className="techT-bullets">
              {item.bullets?.length
                ? item.bullets.map((b, j) => <li key={j}><span style={{ color: accent }}>#</span> {b}</li>)
                : <li><span style={{ color: accent }}>#</span> {item.description}</li>
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
    <div className="techT-edu-list">
      {content.items.map((item, i) => (
        <div key={i} className="techT-edu-item">
          <div className="techT-degree">{item.degree}</div>
          <div className="techT-school">{item.institution}</div>
          <div className="techT-edu-date">{item.startYear} – {item.endYear || 'Current'}</div>
        </div>
      ))}
    </div>
  );
}

function SkillsSection({ content, customization }) {
  const accent = customization?.accentColor || '#6c63ff';
  if (!content.categories?.length) return null;
  return (
    <div className="techT-skills">
      {content.categories.map((cat, i) => (
        <div key={i} className="techT-skill-cat">
          <div className="techT-skill-cat-name" style={{ color: accent }}>[ {cat.name} ]</div>
          <div className="techT-skill-tags">
            {(cat.skills || []).map((skill, j) => (
              <span key={j} className="techT-skill-tag" style={{ borderColor: accent, color: accent }}>
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
    <div className="techT-proj-list">
      {content.items.map((item, i) => (
        <div key={i} className="techT-proj-item">
          <div className="techT-proj-name" style={{ color: accent }}>▶ {item.name}</div>
          {item.description && <p className="techT-proj-desc">{item.description}</p>}
          {item.technologies && (
            <div className="techT-tech-tags">
              {(Array.isArray(item.technologies) ? item.technologies : item.technologies.split(','))
                .map((t, j) => <span key={j} style={{ color: accent }}>| {t.trim()}</span>)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function TechTemplate({ sections = [], customization = {} }) {
  const accent = customization.accentColor || '#6c63ff';
  const lineHeight = customization.lineHeight || 1.6;

  const personalSection = sections.find(s => s.section_type === 'personal_info');
  const experienceSection = sections.find(s => s.section_type === 'experience' && s.is_visible);
  const educationSection = sections.find(s => s.section_type === 'education' && s.is_visible);
  const skillsSection = sections.find(s => s.section_type === 'skills' && s.is_visible);
  const projectsSection = sections.find(s => s.section_type === 'projects' && s.is_visible);

  return (
    <div
      className="tech-template-root"
      style={{
        fontFamily: "'JetBrains Mono', 'Courier New', monospace",
        fontSize: '9.5pt',
        lineHeight,
      }}
    >
      {personalSection && (
        <PersonalInfo content={personalSection.content} customization={customization} />
      )}

      {experienceSection && (
        <div className="techT-section">
          <h3 className="techT-section-title" style={{ color: accent }}>$ EXPERIENCE</h3>
          <ExperienceSection content={experienceSection.content} customization={customization} />
        </div>
      )}

      {educationSection && (
        <div className="techT-section">
          <h3 className="techT-section-title" style={{ color: accent }}>$ EDUCATION</h3>
          <EducationSection content={educationSection.content} />
        </div>
      )}

      {skillsSection && (
        <div className="techT-section">
          <h3 className="techT-section-title" style={{ color: accent }}>$ SKILLS</h3>
          <SkillsSection content={skillsSection.content} customization={customization} />
        </div>
      )}

      {projectsSection && (
        <div className="techT-section">
          <h3 className="techT-section-title" style={{ color: accent }}>$ PROJECTS</h3>
          <ProjectsSection content={projectsSection.content} customization={customization} />
        </div>
      )}
    </div>
  );
}
