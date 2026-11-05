import React from 'react';
import '../styles/ClassicTemplate.css';

const SECTION_LABELS = {
  personal_info: null, summary: 'Professional Summary', objective: 'Career Objective',
  education: 'Education', experience: 'Work Experience', skills: 'Skills',
  projects: 'Projects', certifications: 'Certifications', achievements: 'Achievements',
  languages: 'Languages', interests: 'Interests', declaration: 'Declaration',
  publications: 'Publications', volunteer: 'Volunteer Work', awards: 'Awards', references: 'References', custom: null,
};

function getSectionTitle(section) {
  if (section.custom_title) return section.custom_title;
  return SECTION_LABELS[section.section_type] || section.section_type;
}

function PersonalInfo({ content, customization }) {
  const accent = customization?.accentColor || '#6c63ff';
  const primary = customization?.primaryColor || '#1a1a2e';
  return (
    <div className="ct-header" style={{ background: primary }}>
      <div className="ct-header-content">
        <h1 className="ct-name" style={{ color: '#ffffff' }}>{content.name || 'Your Name'}</h1>
        {content.title && <div className="ct-job-title" style={{ color: accent }}>{content.title}</div>}
      </div>
      <div className="ct-contact">
        {[
          content.email && { label: content.email, icon: '✉' },
          content.phone && { label: content.phone, icon: '☎' },
          content.location && { label: content.location, icon: '📍' },
          content.linkedin && { label: content.linkedin, icon: 'in' },
          content.website && { label: content.website, icon: '🌐' },
          content.github && { label: content.github, icon: '⌥' },
        ].filter(Boolean).map((item, i) => (
          <span key={i} className="ct-contact-item">
            <span className="ct-contact-icon" style={{ color: accent }}>{item.icon}</span>
            <span>{item.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function SummarySection({ content }) {
  if (!content.text) return null;
  return <p className="ct-summary-text">{content.text}</p>;
}

function ExperienceSection({ content }) {
  if (!content.items?.length) return <p className="ct-placeholder">No experience added yet.</p>;
  return (
    <div className="ct-list">
      {content.items.map((item, i) => (
        <div key={i} className="ct-exp-item">
          <div className="ct-exp-header">
            <div>
              <div className="ct-item-title">{item.jobTitle}</div>
              <div className="ct-item-subtitle">{item.company}{item.location ? ` · ${item.location}` : ''}</div>
            </div>
            <div className="ct-dates">{item.startDate} – {item.endDate || 'Present'}</div>
          </div>
          {(item.bullets?.length || item.description) && (
            <ul className="ct-bullets">
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
  if (!content.items?.length) return <p className="ct-placeholder">No education added yet.</p>;
  return (
    <div className="ct-list">
      {content.items.map((item, i) => (
        <div key={i} className="ct-edu-item">
          <div className="ct-exp-header">
            <div>
              <div className="ct-item-title">{item.degree}</div>
              <div className="ct-item-subtitle">{item.institution}{item.location ? ` · ${item.location}` : ''}</div>
            </div>
            <div className="ct-dates">{item.startYear}{item.endYear ? ` – ${item.endYear}` : ''}</div>
          </div>
          {(item.gpa || item.grade) && <div className="ct-edu-meta">GPA: {item.gpa || item.grade}</div>}
          {item.description && <p className="ct-edu-desc">{item.description}</p>}
        </div>
      ))}
    </div>
  );
}

function SkillsSection({ content, customization }) {
  const accent = customization?.accentColor || '#6c63ff';
  if (!content.categories?.length) return <p className="ct-placeholder">No skills added yet.</p>;
  return (
    <div className="ct-skills">
      {content.categories.map((cat, i) => (
        <div key={i} className="ct-skill-cat">
          {content.categories.length > 1 && (
            <div className="ct-skill-cat-name">{cat.name}</div>
          )}
          <div className="ct-skill-tags">
            {(cat.skills || []).map((skill, j) => (
              <span key={j} className="ct-skill-tag" style={{ borderColor: `${accent}40`, color: accent }}>
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
  if (!content.items?.length) return <p className="ct-placeholder">No projects added yet.</p>;
  return (
    <div className="ct-list">
      {content.items.map((item, i) => (
        <div key={i} className="ct-proj-item">
          <div className="ct-exp-header">
            <div className="ct-item-title">{item.name}</div>
            {item.link && (
              <a href={item.link} className="ct-link" style={{ color: accent }} target="_blank" rel="noreferrer">↗ Link</a>
            )}
          </div>
          {item.technologies && (
            <div className="ct-tech-list">
              {(Array.isArray(item.technologies) ? item.technologies : item.technologies.split(','))
                .map((t, j) => <span key={j} className="ct-tech-tag" style={{ color: accent }}>{t.trim()}</span>)}
            </div>
          )}
          {item.description && <p className="ct-proj-desc">{item.description}</p>}
        </div>
      ))}
    </div>
  );
}

function CertificationsSection({ content }) {
  if (!content.items?.length) return <p className="ct-placeholder">No certifications added yet.</p>;
  return (
    <div className="ct-list">
      {content.items.map((item, i) => (
        <div key={i} className="ct-cert-item">
          <div className="ct-exp-header">
            <div>
              <div className="ct-item-title">{item.name}</div>
              <div className="ct-item-subtitle">{item.issuer}</div>
            </div>
            <div className="ct-dates">{item.date}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionContent({ section, customization }) {
  const c = section.content;
  switch (section.section_type) {
    case 'summary': case 'objective': return <SummarySection content={c} />;
    case 'experience': return <ExperienceSection content={c} />;
    case 'education': return <EducationSection content={c} />;
    case 'skills': return <SkillsSection content={c} customization={customization} />;
    case 'projects': return <ProjectsSection content={c} customization={customization} />;
    case 'certifications': return <CertificationsSection content={c} />;
    default: return null;
  }
}

export default function ClassicTemplate({ sections = [], customization = {} }) {
  const primaryColor = customization.primaryColor || '#1a1a2e';
  const accentColor = customization.accentColor || '#6c63ff';
  const font = customization.font || 'DM Sans';
  const fontSize = customization.fontSize || 10.5;
  const lineHeight = customization.lineHeight || 1.6;

  const personalSection = sections.find(s => s.section_type === 'personal_info');
  const otherSections = sections.filter(s => s.section_type !== 'personal_info' && s.is_visible);

  return (
    <div
      className="classic-template-root"
      style={{
        fontFamily: `'${font}', sans-serif`,
        fontSize: `${fontSize}pt`,
        lineHeight,
      }}
    >
      {personalSection && (
        <PersonalInfo content={personalSection.content} customization={customization} />
      )}

      <div className="ct-accent-bar" style={{ background: accentColor }} />

      <div className="ct-body">
        {otherSections.map((section) => {
          const title = getSectionTitle(section);
          return (
            <div key={section.id || section.section_type} className="ct-section">
              {title && (
                <div className="ct-section-header">
                  <h3 className="ct-section-title" style={{ color: primaryColor }}>
                    {title.toUpperCase()}
                  </h3>
                  <div className="ct-section-line" style={{ background: accentColor }} />
                </div>
              )}
              <div className="ct-section-content">
                <SectionContent section={section} customization={customization} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
