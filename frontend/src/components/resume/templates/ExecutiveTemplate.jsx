import React from 'react';
import '../styles/ExecutiveTemplate.css';

function PersonalInfo({ content, customization }) {
  const primary = customization?.primaryColor || '#1a1a2e';
  const accent = customization?.accentColor || '#6c63ff';
  return (
    <div className="exT-header" style={{ background: primary }}>
      <div className="exT-name-section">
        <h1 className="exT-name" style={{ color: '#ffffff' }}>{content.name || 'Your Name'}</h1>
        {content.title && <div className="exT-job-title" style={{ color: accent }}>{content.title}</div>}
      </div>
      <div className="exT-contact-section">
        {[
          content.email && { label: content.email },
          content.phone && { label: content.phone },
          content.location && { label: content.location },
          content.linkedin && { label: content.linkedin },
          content.website && { label: content.website },
        ].filter(Boolean).map((item, i) => (
          <span key={i} className="exT-contact-item" style={{ borderBottomColor: accent }}>
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function SummarySection({ content, customization }) {
  const accent = customization?.accentColor || '#6c63ff';
  if (!content.text) return null;
  return (
    <div className="exT-summary-box" style={{ backgroundColor: `${accent}08`, borderLeftColor: accent }}>
      <p className="exT-summary">{content.text}</p>
    </div>
  );
}

function ExperienceSection({ content }) {
  if (!content.items?.length) return null;
  return (
    <div className="exT-exp-list">
      {content.items.map((item, i) => (
        <div key={i} className="exT-exp-item">
          <div className="exT-exp-title">{item.jobTitle}</div>
          <div className="exT-company">{item.company} · {item.location}</div>
          <div className="exT-exp-date">{item.startDate} – {item.endDate || 'Present'}</div>
          {(item.bullets?.length || item.description) && (
            <ul className="exT-bullets">
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
    <div className="exT-edu-list">
      {content.items.map((item, i) => (
        <div key={i} className="exT-edu-item">
          <div className="exT-degree">{item.degree}</div>
          <div className="exT-school">{item.institution}</div>
          <div className="exT-edu-date">{item.startYear}–{item.endYear}</div>
        </div>
      ))}
    </div>
  );
}

function SkillsSection({ content, customization }) {
  const accent = customization?.accentColor || '#6c63ff';
  if (!content.categories?.length) return null;
  return (
    <div className="exT-skills-matrix">
      {content.categories.map((cat, i) => (
        <div key={i} className="exT-skill-col">
          <div className="exT-skill-cat-name" style={{ color: accent, borderBottomColor: accent }}>
            {cat.name}
          </div>
          <div className="exT-skill-list">
            {(cat.skills || []).map((skill, j) => (
              <div key={j} className="exT-skill-item">{skill}</div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProjectsSection({ content }) {
  if (!content.items?.length) return null;
  return (
    <div className="exT-proj-list">
      {content.items.map((item, i) => (
        <div key={i} className="exT-proj-item">
          <div className="exT-proj-name">{item.name}</div>
          {item.description && <p className="exT-proj-desc">{item.description}</p>}
          {item.technologies && (
            <div className="exT-tech-list">
              {(Array.isArray(item.technologies) ? item.technologies : item.technologies.split(','))
                .map((t, j) => <span key={j}>{t.trim()}</span>)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function ExecutiveTemplate({ sections = [], customization = {} }) {
  const font = customization.font || 'Cormorant Garamond, serif';
  const fontSize = customization.fontSize || 11.5;
  const lineHeight = customization.lineHeight || 1.6;

  const personalSection = sections.find(s => s.section_type === 'personal_info');
  const summarySection = sections.find(s => s.section_type === 'summary' && s.is_visible);
  const experienceSection = sections.find(s => s.section_type === 'experience' && s.is_visible);
  const educationSection = sections.find(s => s.section_type === 'education' && s.is_visible);
  const skillsSection = sections.find(s => s.section_type === 'skills' && s.is_visible);
  const projectsSection = sections.find(s => s.section_type === 'projects' && s.is_visible);

  return (
    <div
      className="executive-template-root"
      style={{
        fontFamily: font,
        fontSize: `${fontSize}pt`,
        lineHeight,
      }}
    >
      {personalSection && (
        <PersonalInfo content={personalSection.content} customization={customization} />
      )}

      <div className="exT-layout">
        <div className="exT-left-col">
          {summarySection && (
            <div className="exT-summary-section">
              <h3 style={{ color: customization.primaryColor || '#1a1a2e', marginBottom: 8 }}>PROFILE</h3>
              <SummarySection content={summarySection.content} customization={customization} />
            </div>
          )}

          {skillsSection && (
            <div className="exT-skills-section">
              <h3 style={{ color: customization.primaryColor || '#1a1a2e', marginBottom: 8 }}>EXPERTISE</h3>
              <SkillsSection content={skillsSection.content} customization={customization} />
            </div>
          )}
        </div>

        <div className="exT-right-col">
          {experienceSection && (
            <div className="exT-exp-section">
              <h3 style={{ color: customization.primaryColor || '#1a1a2e', marginBottom: 10 }}>EXPERIENCE</h3>
              <ExperienceSection content={experienceSection.content} />
            </div>
          )}

          {educationSection && (
            <div className="exT-edu-section">
              <h3 style={{ color: customization.primaryColor || '#1a1a2e', marginBottom: 8 }}>EDUCATION</h3>
              <EducationSection content={educationSection.content} />
            </div>
          )}

          {projectsSection && (
            <div className="exT-proj-section">
              <h3 style={{ color: customization.primaryColor || '#1a1a2e', marginBottom: 8 }}>PROJECTS</h3>
              <ProjectsSection content={projectsSection.content} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
