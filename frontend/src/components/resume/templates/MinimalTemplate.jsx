import React from 'react';
import '../styles/MinimalTemplate.css';

function PersonalInfo({ content, customization }) {
  return (
    <div className="mt-header">
      <h1 className="mt-name">{content.name || 'Your Name'}</h1>
      {content.title && <div className="mt-job-title">{content.title}</div>}
      <div className="mt-divider" />
      <div className="mt-contact-grid">
        {[
          content.email && { label: content.email },
          content.phone && { label: content.phone },
          content.location && { label: content.location },
          content.linkedin && { label: content.linkedin },
          content.website && { label: content.website },
        ].filter(Boolean).map((item, i) => (
          <span key={i} className="mt-contact-item">{item.label}</span>
        ))}
      </div>
    </div>
  );
}

function SummarySection({ content }) {
  if (!content.text) return null;
  return <p className="mt-summary">{content.text}</p>;
}

function ExperienceSection({ content }) {
  if (!content.items?.length) return null;
  return (
    <div className="mt-exp-list">
      {content.items.map((item, i) => (
        <div key={i} className="mt-exp-item">
          <div className="mt-exp-dates">{item.startDate} – {item.endDate || 'Present'}</div>
          <div className="mt-exp-title">{item.jobTitle}</div>
          <div className="mt-exp-company">{item.company}{item.location ? ` · ${item.location}` : ''}</div>
          {(item.bullets?.length || item.description) && (
            <ul className="mt-bullets">
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
    <div className="mt-edu-list">
      {content.items.map((item, i) => (
        <div key={i} className="mt-edu-item">
          <div className="mt-edu-dates">{item.startYear}{item.endYear ? ` – ${item.endYear}` : ''}</div>
          <div className="mt-degree">{item.degree}</div>
          <div className="mt-institution">{item.institution}{item.location ? ` · ${item.location}` : ''}</div>
          {item.gpa && <div className="mt-gpa">GPA: {item.gpa}</div>}
        </div>
      ))}
    </div>
  );
}

function SkillsSection({ content }) {
  if (!content.categories?.length) return null;
  return (
    <div className="mt-skills-grid">
      {content.categories.map((cat, i) => (
        <div key={i} className="mt-skill-col">
          {content.categories.length > 1 && (
            <div className="mt-skill-cat-label">{cat.name}</div>
          )}
          <div className="mt-skill-list">
            {(cat.skills || []).map((skill, j) => (
              <span key={j} className="mt-skill-item">{skill}</span>
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
    <div className="mt-proj-list">
      {content.items.map((item, i) => (
        <div key={i} className="mt-proj-item">
          <div className="mt-proj-name">{item.name}</div>
          {item.description && <p className="mt-proj-desc">{item.description}</p>}
          {item.technologies && (
            <div className="mt-tech-list">
              {(Array.isArray(item.technologies) ? item.technologies : item.technologies.split(','))
                .map((t, j) => <span key={j}>{t.trim()}</span>)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function MinimalTemplate({ sections = [], customization = {} }) {
  const font = customization.font || 'DM Sans';
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
      className="minimal-template-root"
      style={{
        fontFamily: `'${font}', sans-serif`,
        fontSize: `${fontSize}pt`,
        lineHeight,
      }}
    >
      {personalSection && (
        <PersonalInfo content={personalSection.content} customization={customization} />
      )}

      {summarySection && <SummarySection content={summarySection.content} />}

      {experienceSection && (
        <div className="mt-section">
          <h3 className="mt-section-title">EXPERIENCE</h3>
          <ExperienceSection content={experienceSection.content} />
        </div>
      )}

      {educationSection && (
        <div className="mt-section">
          <h3 className="mt-section-title">EDUCATION</h3>
          <EducationSection content={educationSection.content} />
        </div>
      )}

      {skillsSection && (
        <div className="mt-section">
          <h3 className="mt-section-title">SKILLS</h3>
          <SkillsSection content={skillsSection.content} />
        </div>
      )}

      {projectsSection && (
        <div className="mt-section">
          <h3 className="mt-section-title">PROJECTS</h3>
          <ProjectsSection content={projectsSection.content} />
        </div>
      )}
    </div>
  );
}
