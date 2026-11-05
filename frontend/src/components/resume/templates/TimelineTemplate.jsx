import React from 'react';
import '../styles/TimelineTemplate.css';

function PersonalInfo({ content, customization }) {
  const accent = customization?.accentColor || '#6c63ff';
  const primary = customization?.primaryColor || '#1a1a2e';
  return (
    <div className="tlt-header">
      <div className="tlt-name-section" style={{ background: primary }}>
        <h1 className="tlt-name" style={{ color: '#ffffff' }}>{content.name || 'Your Name'}</h1>
        {content.title && <div className="tlt-job-title" style={{ color: accent }}>{content.title}</div>}
      </div>
      <div className="tlt-contact-bar">
        {[
          content.email && { label: content.email },
          content.phone && { label: content.phone },
          content.location && { label: content.location },
          content.linkedin && { label: content.linkedin },
          content.website && { label: content.website },
        ].filter(Boolean).map((item, i) => (
          <span key={i} className="tlt-contact-pill">{item.label}</span>
        ))}
      </div>
    </div>
  );
}

function SummarySection({ content }) {
  if (!content.text) return null;
  return <p className="tlt-summary">{content.text}</p>;
}

function ExperienceSection({ content, customization }) {
  const accent = customization?.accentColor || '#6c63ff';
  if (!content.items?.length) return <p className="tlt-placeholder">No experience added yet.</p>;
  return (
    <div className="tlt-timeline">
      {content.items.map((item, i) => (
        <div key={i} className="tlt-timeline-item">
          <div className="tlt-timeline-marker" style={{ backgroundColor: accent }} />
          <div className="tlt-timeline-content">
            <div className="tlt-timeline-date">{item.startDate} – {item.endDate || 'Present'}</div>
            <div className="tlt-job-title">{item.jobTitle}</div>
            <div className="tlt-company">{item.company} {item.location ? `· ${item.location}` : ''}</div>
            {(item.bullets?.length || item.description) && (
              <ul className="tlt-bullets">
                {item.bullets?.length
                  ? item.bullets.map((b, j) => <li key={j}>{b}</li>)
                  : <li>{item.description}</li>
                }
              </ul>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function EducationSection({ content, customization }) {
  const accent = customization?.accentColor || '#6c63ff';
  if (!content.items?.length) return <p className="tlt-placeholder">No education added yet.</p>;
  return (
    <div className="tlt-edu-list">
      {content.items.map((item, i) => (
        <div key={i} className="tlt-edu-item">
          <div className="tlt-edu-marker" style={{ backgroundColor: accent }} />
          <div className="tlt-edu-content">
            <div className="tlt-degree">{item.degree}</div>
            <div className="tlt-school">{item.institution} {item.location ? `· ${item.location}` : ''}</div>
            <div className="tlt-edu-year">{item.startYear}{item.endYear ? ` – ${item.endYear}` : ''}</div>
            {item.gpa && <div className="tlt-gpa">GPA: {item.gpa}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

function SkillsSection({ content, customization }) {
  const accent = customization?.accentColor || '#6c63ff';
  if (!content.categories?.length) return <p className="tlt-placeholder">No skills added yet.</p>;
  return (
    <div className="tlt-skills">
      {content.categories.map((cat, i) => (
        <div key={i} className="tlt-skill-group">
          {content.categories.length > 1 && (
            <div className="tlt-skill-cat-label">{cat.name}</div>
          )}
          <div className="tlt-skill-tags">
            {(cat.skills || []).map((skill, j) => (
              <span key={j} className="tlt-skill-tag" style={{ borderColor: accent, color: accent }}>
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
  if (!content.items?.length) return <p className="tlt-placeholder">No projects added yet.</p>;
  return (
    <div className="tlt-projects">
      {content.items.map((item, i) => (
        <div key={i} className="tlt-project-item">
          <div className="tlt-proj-marker" style={{ backgroundColor: accent }} />
          <div className="tlt-proj-content">
            <div className="tlt-proj-name">{item.name}</div>
            {item.description && <p className="tlt-proj-desc">{item.description}</p>}
            {item.technologies && (
              <div className="tlt-tech-list">
                {(Array.isArray(item.technologies) ? item.technologies : item.technologies.split(','))
                  .map((t, j) => <span key={j} className="tlt-tech-tag" style={{ color: accent }}>{t.trim()}</span>)}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TimelineTemplate({ sections = [], customization = {} }) {
  const font = customization.font || 'DM Sans';
  const fontSize = customization.fontSize || 10.5;
  const lineHeight = customization.lineHeight || 1.6;
  const accent = customization.accentColor || '#6c63ff';
  const primary = customization.primaryColor || '#1a1a2e';

  const personalSection = sections.find(s => s.section_type === 'personal_info');
  const summarySection = sections.find(s => s.section_type === 'summary' && s.is_visible);
  const experienceSection = sections.find(s => s.section_type === 'experience' && s.is_visible);
  const educationSection = sections.find(s => s.section_type === 'education' && s.is_visible);
  const skillsSection = sections.find(s => s.section_type === 'skills' && s.is_visible);
  const projectsSection = sections.find(s => s.section_type === 'projects' && s.is_visible);

  return (
    <div
      className="timeline-template-root"
      style={{
        fontFamily: `'${font}', sans-serif`,
        fontSize: `${fontSize}pt`,
        lineHeight,
      }}
    >
      {personalSection && (
        <PersonalInfo content={personalSection.content} customization={customization} />
      )}

      {summarySection && summarySection.content.text && (
        <div className="tlt-section">
          <SummarySection content={summarySection.content} />
        </div>
      )}

      {experienceSection && (
        <div className="tlt-section">
          <h3 className="tlt-section-title" style={{ color: primary }}>WORK EXPERIENCE</h3>
          <ExperienceSection content={experienceSection.content} customization={customization} />
        </div>
      )}

      {educationSection && (
        <div className="tlt-section">
          <h3 className="tlt-section-title" style={{ color: primary }}>EDUCATION</h3>
          <EducationSection content={educationSection.content} customization={customization} />
        </div>
      )}

      {skillsSection && (
        <div className="tlt-section">
          <h3 className="tlt-section-title" style={{ color: primary }}>SKILLS</h3>
          <SkillsSection content={skillsSection.content} customization={customization} />
        </div>
      )}

      {projectsSection && (
        <div className="tlt-section">
          <h3 className="tlt-section-title" style={{ color: primary }}>PROJECTS</h3>
          <ProjectsSection content={projectsSection.content} customization={customization} />
        </div>
      )}
    </div>
  );
}
