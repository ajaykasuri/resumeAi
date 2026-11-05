import React from 'react';
import { getTemplateDefaults,buildCustomization  } from '../../../src/Templateconfigs'; // adjust path

/* ────────────────────────────────────────────────
   Data helpers — turn the `sections` array into one object
──────────────────────────────────────────────── */
const find = (sections, type) =>
  (sections || []).find((s) => s.section_type === type && s.is_visible !== false)?.content || null;

const range = (a, b) => [a, b].filter(Boolean).join(' – ');
const groups = (sk) => (!sk ? [] : sk.categories ? sk.categories : [{ name: '', skills: sk.items || [] }]);
const flat = (sk) => groups(sk).flatMap((g) => g.skills || []);
const list = (x) => (Array.isArray(x) ? x : x ? String(x).split(',').map((s) => s.trim()) : []);
const initials = (n = '') => n.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
const contacts = (p) => [p.email, p.phone, p.location, p.linkedin, p.github, p.website].filter(Boolean);

function normalize(sections) {
  return {
    p: find(sections, 'personal_info') || {},
    summary: find(sections, 'summary')?.text || '',
    exp: find(sections, 'experience')?.items || [],
    edu: find(sections, 'education')?.items || [],
    skills: find(sections, 'skills'),
    proj: find(sections, 'projects')?.items || [],
    cert: find(sections, 'certifications')?.items || [],
  };
}

/* ────────────────────────────────────────────────
   Tiny shared pieces
──────────────────────────────────────────────── */
const Bullets = ({ items = [], style }) =>
  items.length ? (
    <ul style={{ margin: '4px 0 0', paddingLeft: '1.15em', ...style }}>
      {items.map((b, i) => <li key={i} style={{ marginBottom: 2 }}>{b}</li>)}
    </ul>
  ) : null;

const Pill = ({ children, bg, color, style }) => (
  <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, background: bg, color, fontSize: '0.88em', margin: '0 5px 5px 0', ...style }}>
    {children}
  </span>
);

const Split = ({ left, right, style }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, ...style }}>
    <div>{left}</div>
    <div style={{ whiteSpace: 'nowrap', fontSize: '0.92em', opacity: 0.75 }}>{right}</div>
  </div>
);

/* ════════════════════════════════════════════════
   1 · CLASSIC — centered serif header, ruled headings
════════════════════════════════════════════════ */
function Classic({ d, t }) {
  const H = (txt) => (
    <h3 style={{ fontFamily: t.head, fontSize: '1.02em', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: t.primary, borderBottom: `1px solid ${t.primary}`, paddingBottom: 3, margin: '20px 0 9px' }}>{txt}</h3>
  );
  return (
    <div style={{ padding: '54px 58px' }}>
      <header style={{ textAlign: 'center', paddingBottom: 14, borderBottom: `3px double ${t.primary}` }}>
        <h1 style={{ fontFamily: t.head, fontSize: '2.7em', fontWeight: 700, color: t.primary, margin: 0, letterSpacing: '0.02em' }}>{d.p.name}</h1>
        <div style={{ fontStyle: 'italic', fontSize: '1.15em', margin: '4px 0 8px' }}>{d.p.title}</div>
        <div style={{ fontSize: '0.9em', color: '#444' }}>{contacts(d.p).join('   |   ')}</div>
      </header>

      {d.summary && <>{H('Professional Summary')}<p style={{ margin: 0, textAlign: 'justify' }}>{d.summary}</p></>}

      {d.exp.length > 0 && H('Experience')}
      {d.exp.map((e, i) => (
        <div key={i} style={{ marginBottom: 11 }}>
          <Split left={<b>{e.company}{e.location && `, ${e.location}`}</b>} right={range(e.startDate, e.endDate)} />
          <div style={{ fontStyle: 'italic' }}>{e.jobTitle}</div>
          <Bullets items={e.bullets} />
        </div>
      ))}

      {d.edu.length > 0 && H('Education')}
      {d.edu.map((e, i) => (
        <div key={i} style={{ marginBottom: 6 }}>
          <Split left={<b>{e.institution}{e.location && `, ${e.location}`}</b>} right={range(e.startYear, e.endYear)} />
          <div>{e.degree}{e.gpa && ` — GPA ${e.gpa}`}</div>
        </div>
      ))}

      {d.skills && H('Skills')}
      {groups(d.skills).map((g, i) => (
        <div key={i} style={{ marginBottom: 3 }}>
          {g.name && <b>{g.name}: </b>}{(g.skills || []).join(', ')}
        </div>
      ))}

      {d.proj.length > 0 && H('Projects')}
      {d.proj.map((x, i) => (
        <div key={i} style={{ marginBottom: 7 }}>
          <b>{x.name}</b>{x.link && <span style={{ opacity: 0.7 }}> — {x.link}</span>}
          <div>{x.description}</div>
          <div style={{ fontStyle: 'italic', fontSize: '0.92em' }}>{list(x.technologies).join(', ')}</div>
        </div>
      ))}

      {d.cert.length > 0 && H('Certifications')}
      {d.cert.map((c, i) => (
        <Split key={i} left={<><b>{c.name}</b>, {c.issuer}</>} right={c.date} style={{ marginBottom: 3 }} />
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════
   2 · MODERN SIDEBAR — dark left rail + main column
════════════════════════════════════════════════ */
function ModernSidebar({ d, t }) {
  const SH = (txt) => (
    <h4 style={{ fontSize: '0.95em', fontWeight: 700, color: t.accent, margin: '24px 0 8px', paddingBottom: 5, borderBottom: '1px solid rgba(255,255,255,0.2)' }}>{txt}</h4>
  );
  const MH = (txt) => (
    <h3 style={{ fontSize: '1.2em', fontWeight: 700, color: t.primary, margin: '24px 0 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
      {txt}<span style={{ flex: 1, height: 2, background: `linear-gradient(90deg, ${t.accent}, transparent)` }} />
    </h3>
  );
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '256px 1fr', minHeight: 1123 }}>
      <aside style={{ background: t.primary, color: '#e8f0f1', padding: '44px 24px' }}>
        <div style={{ width: 84, height: 84, borderRadius: '50%', background: t.accent, color: t.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2em', fontWeight: 700 }}>
          {initials(d.p.name)}
        </div>
        {SH('Contact')}
        {contacts(d.p).map((c, i) => <div key={i} style={{ fontSize: '0.9em', marginBottom: 6, wordBreak: 'break-word' }}>{c}</div>)}

        {SH('Skills')}
        {groups(d.skills).map((g, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <div style={{ fontWeight: 600, fontSize: '0.88em', color: '#fff', marginBottom: 4 }}>{g.name}</div>
            {(g.skills || []).map((s, j) => (
              <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88em', marginBottom: 3 }}>
                <span style={{ width: 5, height: 5, borderRadius: 1, background: t.accent, transform: 'rotate(45deg)' }} />{s}
              </div>
            ))}
          </div>
        ))}

        {d.edu.length > 0 && SH('Education')}
        {d.edu.map((e, i) => (
          <div key={i} style={{ fontSize: '0.9em', marginBottom: 8 }}>
            <b style={{ color: '#fff' }}>{e.degree}</b>
            <div>{e.institution}</div>
            <div style={{ opacity: 0.7 }}>{range(e.startYear, e.endYear)}{e.gpa && ` · ${e.gpa}`}</div>
          </div>
        ))}

        {d.cert.length > 0 && SH('Certifications')}
        {d.cert.map((c, i) => (
          <div key={i} style={{ fontSize: '0.88em', marginBottom: 7 }}>
            <b style={{ color: '#fff' }}>{c.name}</b>
            <div style={{ opacity: 0.7 }}>{c.issuer} · {c.date}</div>
          </div>
        ))}
      </aside>

      <main style={{ padding: '48px 40px 40px 36px' }}>
        <h1 style={{ fontFamily: t.head, fontSize: '2.7em', fontWeight: 800, color: t.primary, margin: 0, lineHeight: 1.05 }}>{d.p.name}</h1>
        <div style={{ fontSize: '1.2em', color: t.accent, fontWeight: 600, marginTop: 6 }}>{d.p.title}</div>

        {d.summary && <p style={{ marginTop: 16, color: '#333' }}>{d.summary}</p>}

        {d.exp.length > 0 && MH('Experience')}
        {d.exp.map((e, i) => (
          <div key={i} style={{ marginBottom: 14 }}>
            <Split left={<b style={{ fontSize: '1.05em' }}>{e.jobTitle}</b>} right={range(e.startDate, e.endDate)} />
            <div style={{ color: t.accent, fontWeight: 600 }}>{e.company}{e.location && ` · ${e.location}`}</div>
            <Bullets items={e.bullets} />
          </div>
        ))}

        {d.proj.length > 0 && MH('Projects')}
        {d.proj.map((x, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <b>{x.name}</b>
            <div>{x.description}</div>
            <div style={{ marginTop: 3 }}>{list(x.technologies).map((s) => <Pill key={s} bg="#e6f0f1" color={t.primary}>{s}</Pill>)}</div>
          </div>
        ))}
      </main>
    </div>
  );
}

/* ════════════════════════════════════════════════
   3 · MINIMAL — whitespace, dates-left ledger
════════════════════════════════════════════════ */
function Minimal({ d, t }) {
  const H = (txt) => (
    <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', margin: '30px 0 12px' }}>
      <h3 style={{ margin: 0, fontSize: '0.88em', fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: t.accent }}>{txt}</h3>
      <div style={{ borderTop: '1px solid #e2e2e2', marginTop: 7 }} />
    </div>
  );
  const Row = ({ when, children }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', marginBottom: 13 }}>
      <div style={{ fontSize: '0.88em', color: t.accent, paddingTop: 2 }}>{when}</div>
      <div>{children}</div>
    </div>
  );
  return (
    <div style={{ padding: '70px 64px' }}>
      <h1 style={{ fontFamily: t.head, fontSize: '3em', fontWeight: 300, letterSpacing: '-0.02em', color: t.primary, margin: 0 }}>{d.p.name}</h1>
      <div style={{ fontSize: '1.15em', color: t.accent, fontWeight: 400, margin: '2px 0 14px' }}>{d.p.title}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 22px', fontSize: '0.9em', color: '#555' }}>
        {contacts(d.p).map((c, i) => <span key={i}>{c}</span>)}
      </div>

      {d.summary && <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', marginTop: 32 }}><span /><p style={{ margin: 0, fontSize: '1.05em', fontWeight: 300 }}>{d.summary}</p></div>}

      {d.exp.length > 0 && H('Experience')}
      {d.exp.map((e, i) => (
        <Row key={i} when={range(e.startDate, e.endDate)}>
          <b style={{ fontWeight: 600 }}>{e.jobTitle}</b>, {e.company}
          <Bullets items={e.bullets} style={{ listStyle: 'none', paddingLeft: 0 }} />
        </Row>
      ))}

      {d.edu.length > 0 && H('Education')}
      {d.edu.map((e, i) => (
        <Row key={i} when={range(e.startYear, e.endYear)}><b style={{ fontWeight: 600 }}>{e.degree}</b>, {e.institution}</Row>
      ))}

      {d.skills && H('Skills')}
      {groups(d.skills).map((g, i) => <Row key={i} when={g.name}>{(g.skills || []).join(' / ')}</Row>)}

      {d.proj.length > 0 && H('Projects')}
      {d.proj.map((x, i) => (
        <Row key={i} when={x.link}><b style={{ fontWeight: 600 }}>{x.name}</b><div style={{ color: '#555' }}>{x.description}</div></Row>
      ))}

      {d.cert.length > 0 && H('Certifications')}
      {d.cert.map((c, i) => <Row key={i} when={c.date}>{c.name}, {c.issuer}</Row>)}
    </div>
  );
}

/* ════════════════════════════════════════════════
   4 · EXECUTIVE — navy masthead + tinted rail
════════════════════════════════════════════════ */
function Executive({ d, t }) {
  const H = (txt) => (
    <h3 style={{ fontFamily: t.head, fontSize: '1.3em', fontWeight: 700, color: t.primary, margin: '22px 0 8px', paddingLeft: 10, borderLeft: `4px solid ${t.accent}` }}>{txt}</h3>
  );
  const RH = (txt) => (
    <h4 style={{ fontFamily: t.head, fontSize: '1.1em', color: t.primary, margin: '22px 0 8px', paddingBottom: 4, borderBottom: `2px solid ${t.accent}` }}>{txt}</h4>
  );
  return (
    <div>
      <header style={{ background: t.primary, color: '#fff', padding: '42px 50px 30px' }}>
        <h1 style={{ fontFamily: t.head, fontSize: '3em', fontWeight: 700, margin: 0, letterSpacing: '0.01em' }}>{d.p.name}</h1>
        <div style={{ color: t.accent, fontSize: '1.15em', fontWeight: 600, margin: '4px 0 12px' }}>{d.p.title}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 22px', fontSize: '0.88em', opacity: 0.88 }}>
          {contacts(d.p).map((c, i) => <span key={i}>{c}</span>)}
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 232px' }}>
        <main style={{ padding: '10px 30px 40px 50px' }}>
          {d.summary && <>{H('Executive Profile')}<p style={{ margin: 0 }}>{d.summary}</p></>}
          {d.exp.length > 0 && H('Career History')}
          {d.exp.map((e, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <Split left={<b style={{ fontSize: '1.05em' }}>{e.jobTitle}</b>} right={range(e.startDate, e.endDate)} />
              <div style={{ fontStyle: 'italic', color: '#555' }}>{e.company}, {e.location}</div>
              <Bullets items={e.bullets} />
            </div>
          ))}
          {d.proj.length > 0 && H('Key Initiatives')}
          {d.proj.map((x, i) => (
            <div key={i} style={{ marginBottom: 8 }}><b>{x.name}</b> — {x.description}</div>
          ))}
        </main>

        <aside style={{ background: '#f2f3f6', padding: '10px 24px 40px', minHeight: 900 }}>
          {d.skills && RH('Core Competencies')}
          {groups(d.skills).map((g, i) => (
            <div key={i} style={{ marginBottom: 8, fontSize: '0.92em' }}>
              <b style={{ color: t.primary }}>{g.name}</b>
              <div>{(g.skills || []).join(' · ')}</div>
            </div>
          ))}
          {d.edu.length > 0 && RH('Education')}
          {d.edu.map((e, i) => (
            <div key={i} style={{ fontSize: '0.92em' }}>
              <b>{e.degree}</b><div>{e.institution}</div>
              <div style={{ opacity: 0.7 }}>{range(e.startYear, e.endYear)}</div>
            </div>
          ))}
          {d.cert.length > 0 && RH('Credentials')}
          {d.cert.map((c, i) => (
            <div key={i} style={{ fontSize: '0.9em', marginBottom: 7 }}>
              <b>{c.name}</b><div style={{ opacity: 0.7 }}>{c.issuer}, {c.date}</div>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   5 · CREATIVE — gradient banner, pills, accent cards
════════════════════════════════════════════════ */
function Creative({ d, t }) {
  const H = (txt) => (
    <h3 style={{ fontSize: '1.25em', fontWeight: 700, color: t.primary, margin: '24px 0 10px', display: 'inline-block', padding: '2px 0', borderBottom: `4px solid ${t.accent}` }}>{txt}</h3>
  );
  return (
    <div>
      <header style={{ background: `linear-gradient(120deg, ${t.primary} 0%, ${t.accent} 140%)`, color: '#fff', padding: '46px 48px 34px', borderBottomRightRadius: 80 }}>
        <h1 style={{ fontFamily: t.head, fontSize: '3.1em', fontWeight: 800, margin: 0, lineHeight: 1, letterSpacing: '-0.02em' }}>{d.p.name}</h1>
        <div style={{ fontSize: '1.25em', fontWeight: 500, margin: '8px 0 16px', opacity: 0.95 }}>{d.p.title}</div>
        <div>{contacts(d.p).map((c, i) => <Pill key={i} bg="rgba(255,255,255,0.18)" color="#fff">{c}</Pill>)}</div>
      </header>

      <div style={{ padding: '6px 48px 44px' }}>
        {d.summary && <p style={{ margin: '20px 0 0', fontSize: '1.05em', color: '#333' }}>{d.summary}</p>}

        {d.skills && H('Skills')}
        <div>{flat(d.skills).map((s) => <Pill key={s} bg={`${t.primary}14`} color={t.primary} style={{ fontWeight: 500 }}>{s}</Pill>)}</div>

        {d.exp.length > 0 && H('Experience')}
        {d.exp.map((e, i) => (
          <div key={i} style={{ marginBottom: 14 }}>
            <Split left={<><b style={{ fontSize: '1.05em' }}>{e.jobTitle}</b> <span style={{ color: t.accent, fontWeight: 600 }}>@ {e.company}</span></>} right={range(e.startDate, e.endDate)} />
            <Bullets items={e.bullets} />
          </div>
        ))}

        {d.proj.length > 0 && H('Selected Projects')}
        {d.proj.map((x, i) => (
          <div key={i} style={{ borderLeft: `5px solid ${t.accent}`, background: '#faf8ff', padding: '9px 14px', marginBottom: 9, borderRadius: '0 10px 10px 0' }}>
            <b>{x.name}</b>
            <div>{x.description}</div>
            <div style={{ fontSize: '0.88em', color: t.primary, marginTop: 2 }}>{list(x.technologies).join('  •  ')}</div>
          </div>
        ))}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
          <div>
            {d.edu.length > 0 && H('Education')}
            {d.edu.map((e, i) => (
              <div key={i}><b>{e.degree}</b><div>{e.institution}</div><div style={{ opacity: 0.7 }}>{range(e.startYear, e.endYear)}</div></div>
            ))}
          </div>
          <div>
            {d.cert.length > 0 && H('Certifications')}
            {d.cert.map((c, i) => (
              <div key={i} style={{ marginBottom: 6 }}><b>{c.name}</b><div style={{ opacity: 0.7 }}>{c.issuer} · {c.date}</div></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   6 · TECH — monospace headings, tag stacks, dense
════════════════════════════════════════════════ */
function Tech({ d, t }) {
  const mono = { fontFamily: t.head };
  const H = (txt) => (
    <h3 style={{ ...mono, fontSize: '1em', fontWeight: 700, color: t.accent, margin: '18px 0 8px' }}>
      <span style={{ opacity: 0.5 }}>## </span>{txt}
    </h3>
  );
  return (
    <div style={{ padding: '44px 48px' }}>
      <header style={{ borderBottom: `2px solid ${t.primary}`, paddingBottom: 14 }}>
        <div style={{ ...mono, fontSize: '0.85em', color: t.accent }}>$ whoami</div>
        <h1 style={{ ...mono, fontSize: '2.4em', fontWeight: 700, color: t.primary, margin: '2px 0' }}>{d.p.name}</h1>
        <div style={{ ...mono, fontSize: '1em', color: '#555' }}>// {d.p.title}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 18px', marginTop: 10, fontSize: '0.88em' }}>
          {contacts(d.p).map((c, i) => <span key={i}>{c}</span>)}
        </div>
      </header>

      {d.summary && <>{H('About')}<p style={{ margin: 0 }}>{d.summary}</p></>}

      {d.skills && H('Stack')}
      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', rowGap: 4, fontSize: '0.92em' }}>
        {groups(d.skills).map((g, i) => (
          <React.Fragment key={i}>
            <span style={{ ...mono, color: t.primary, fontWeight: 700, fontSize: '0.9em' }}>{g.name}</span>
            <span>{(g.skills || []).map((s) => <Pill key={s} bg="#eef2f6" color={t.primary} style={{ borderRadius: 4, ...mono, fontSize: '0.8em', padding: '1px 7px' }}>{s}</Pill>)}</span>
          </React.Fragment>
        ))}
      </div>

      {d.exp.length > 0 && H('Experience')}
      {d.exp.map((e, i) => (
        <div key={i} style={{ marginBottom: 11 }}>
          <Split left={<><b>{e.jobTitle}</b> <span style={{ color: t.accent }}>@{e.company}</span></>} right={<span style={mono}>{range(e.startDate, e.endDate)}</span>} />
          <Bullets items={e.bullets} />
        </div>
      ))}

      {d.proj.length > 0 && H('Projects')}
      {d.proj.map((x, i) => (
        <div key={i} style={{ marginBottom: 8, padding: '7px 10px', background: '#f6f8fa', border: '1px solid #e1e6eb', borderRadius: 4 }}>
          <Split left={<b style={mono}>{x.name}</b>} right={<span style={mono}>{x.link}</span>} />
          <div>{x.description}</div>
          <div style={{ ...mono, fontSize: '0.8em', color: t.accent, marginTop: 2 }}>[{list(x.technologies).join(', ')}]</div>
        </div>
      ))}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          {d.edu.length > 0 && H('Education')}
          {d.edu.map((e, i) => <div key={i}><b>{e.degree}</b><div>{e.institution} · {range(e.startYear, e.endYear)}</div></div>)}
        </div>
        <div>
          {d.cert.length > 0 && H('Certifications')}
          {d.cert.map((c, i) => <div key={i} style={{ marginBottom: 4 }}><b>{c.name}</b><div style={{ opacity: 0.7 }}>{c.issuer} · {c.date}</div></div>)}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   7 · ELEGANT — two-column, tinted panel, small caps
════════════════════════════════════════════════ */
function Elegant({ d, t }) {
  const H = (txt) => (
    <h3 style={{ fontFamily: t.head, fontVariant: 'small-caps', fontSize: '1.35em', fontWeight: 700, letterSpacing: '0.06em', color: t.primary, margin: '22px 0 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
      {txt}<span style={{ flex: 1, borderTop: `1px solid ${t.accent}` }} />
    </h3>
  );
  return (
    <div style={{ padding: '48px 0 0' }}>
      <header style={{ padding: '0 52px 22px' }}>
        <h1 style={{ fontFamily: t.head, fontSize: '3.4em', fontWeight: 600, color: t.primary, margin: 0, lineHeight: 1 }}>{d.p.name}</h1>
        <div style={{ width: 64, height: 3, background: t.accent, margin: '12px 0 10px' }} />
        <div style={{ fontStyle: 'italic', fontSize: '1.2em', color: '#555' }}>{d.p.title}</div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 238px', minHeight: 900 }}>
        <main style={{ padding: '0 28px 40px 52px' }}>
          {d.summary && <>{H('Profile')}<p style={{ margin: 0 }}>{d.summary}</p></>}
          {d.exp.length > 0 && H('Experience')}
          {d.exp.map((e, i) => (
            <div key={i} style={{ marginBottom: 13 }}>
              <b style={{ fontSize: '1.05em' }}>{e.jobTitle}</b>
              <div style={{ color: t.accent, fontStyle: 'italic' }}>{e.company}, {e.location} · {range(e.startDate, e.endDate)}</div>
              <Bullets items={e.bullets} />
            </div>
          ))}
          {d.proj.length > 0 && H('Projects')}
          {d.proj.map((x, i) => (
            <div key={i} style={{ marginBottom: 8 }}><b>{x.name}</b><div>{x.description}</div></div>
          ))}
        </main>

        <aside style={{ background: `${t.accent}26`, padding: '4px 24px 40px' }}>
          <h4 style={{ fontFamily: t.head, fontVariant: 'small-caps', fontSize: '1.2em', color: t.primary, margin: '18px 0 8px' }}>Contact</h4>
          {contacts(d.p).map((c, i) => <div key={i} style={{ fontSize: '0.88em', marginBottom: 5, wordBreak: 'break-word' }}>{c}</div>)}

          <h4 style={{ fontFamily: t.head, fontVariant: 'small-caps', fontSize: '1.2em', color: t.primary, margin: '22px 0 8px' }}>Expertise</h4>
          {groups(d.skills).map((g, i) => (
            <div key={i} style={{ marginBottom: 8, fontSize: '0.9em' }}>
              <i style={{ color: t.primary }}>{g.name}</i>
              <div>{(g.skills || []).join(', ')}</div>
            </div>
          ))}

          <h4 style={{ fontFamily: t.head, fontVariant: 'small-caps', fontSize: '1.2em', color: t.primary, margin: '22px 0 8px' }}>Education</h4>
          {d.edu.map((e, i) => (
            <div key={i} style={{ fontSize: '0.9em' }}>
              <b>{e.degree}</b><div>{e.institution}</div><div style={{ opacity: 0.7 }}>{range(e.startYear, e.endYear)}</div>
            </div>
          ))}

          <h4 style={{ fontFamily: t.head, fontVariant: 'small-caps', fontSize: '1.2em', color: t.primary, margin: '22px 0 8px' }}>Certified</h4>
          {d.cert.map((c, i) => (
            <div key={i} style={{ fontSize: '0.88em', marginBottom: 6 }}><b>{c.name}</b><div style={{ opacity: 0.7 }}>{c.issuer}, {c.date}</div></div>
          ))}
        </aside>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   8 · TIMELINE — vertical line with dated nodes
════════════════════════════════════════════════ */
function Timeline({ d, t }) {
  const H = (txt) => (
    <h3 style={{ fontSize: '1.15em', fontWeight: 700, color: t.primary, margin: '24px 0 12px' }}>{txt}</h3>
  );
  const Node = ({ when, last, children }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '104px 18px 1fr', columnGap: 6 }}>
      <div style={{ textAlign: 'right', fontSize: '0.86em', color: '#666', paddingTop: 1 }}>{when}</div>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 4, top: 4, width: 10, height: 10, borderRadius: '50%', background: '#fff', border: `3px solid ${t.accent}` }} />
        {!last && <span style={{ position: 'absolute', left: 8, top: 18, bottom: -6, width: 2, background: '#d9dee7' }} />}
      </div>
      <div style={{ paddingBottom: 14 }}>{children}</div>
    </div>
  );
  return (
    <div style={{ padding: '48px 52px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: 18, borderBottom: `3px solid ${t.primary}` }}>
        <div>
          <h1 style={{ fontFamily: t.head, fontSize: '2.8em', fontWeight: 700, color: t.primary, margin: 0, letterSpacing: '-0.02em' }}>{d.p.name}</h1>
          <div style={{ fontSize: '1.2em', color: t.accent, fontWeight: 600 }}>{d.p.title}</div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '0.86em', color: '#555', lineHeight: 1.6 }}>
          {contacts(d.p).slice(0, 4).map((c, i) => <div key={i}>{c}</div>)}
        </div>
      </header>

      {d.summary && <p style={{ marginTop: 16 }}>{d.summary}</p>}

      {d.exp.length > 0 && H('Experience')}
      {d.exp.map((e, i) => (
        <Node key={i} when={range(e.startDate, e.endDate)} last={i === d.exp.length - 1}>
          <b style={{ fontSize: '1.03em' }}>{e.jobTitle}</b>
          <div style={{ color: t.accent, fontWeight: 600 }}>{e.company}</div>
          <Bullets items={e.bullets} />
        </Node>
      ))}

      {d.edu.length > 0 && H('Education')}
      {d.edu.map((e, i) => (
        <Node key={i} when={range(e.startYear, e.endYear)} last={i === d.edu.length - 1}>
          <b>{e.degree}</b><div>{e.institution}{e.gpa && ` · ${e.gpa}`}</div>
        </Node>
      ))}

      {d.skills && H('Skills')}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 28px' }}>
        {groups(d.skills).map((g, i) => (
          <div key={i} style={{ borderTop: `2px solid ${t.accent}`, paddingTop: 5 }}>
            <b style={{ color: t.primary }}>{g.name}</b>
            <div style={{ fontSize: '0.92em' }}>{(g.skills || []).join(', ')}</div>
          </div>
        ))}
      </div>

      {d.proj.length > 0 && H('Projects')}
      {d.proj.map((x, i) => (
        <div key={i} style={{ marginBottom: 8 }}><b>{x.name}</b> <span style={{ color: '#777' }}>{x.link}</span><div>{x.description}</div></div>
      ))}

      {d.cert.length > 0 && H('Certifications')}
      {d.cert.map((c, i) => <div key={i}><b>{c.name}</b> — {c.issuer}, {c.date}</div>)}
    </div>
  );
}

/* ────────────────────────────────────────────────
   Registry + main export
──────────────────────────────────────────────── */
const LAYOUTS = {
  classic: Classic,
  'modern-sidebar': ModernSidebar,
  minimal: Minimal,
  executive: Executive,
  creative: Creative,
  tech: Tech,
  elegant: Elegant,
  timeline: Timeline,
};

const TEMPLATE_LAYOUTS = {
  'executive-pro': 'classic',
  'modern-slate': 'modern-sidebar',
  'minimal-edge': 'minimal',
  'corporate-blue': 'executive',
  'creative-canvas': 'creative',
  'tech-resume': 'tech',
  'elegant-serif': 'elegant',
  'fresh-graduate': 'timeline',
};

const stack = (name, serif) =>
  `'${name}', ${serif ? "Georgia, 'Times New Roman', serif" : "'Helvetica Neue', Arial, sans-serif"}`;

export default function ResumePreview({ sections, customization = {}, templateSlug, layout }) {
  const selectedTemplate = templateSlug || customization.templateSlug || 'classic';
  const key = TEMPLATE_LAYOUTS[selectedTemplate] || layout || customization.layout || selectedTemplate;
  const c = { ...getTemplateDefaults(key), ...customization };
  const Layout = LAYOUTS[key] || Classic;

  const t = {
    primary: c.primaryColor || '#1f2933',
    accent: c.accentColor || '#2563eb',
    head: stack(c.font || c.headFont || 'Inter', c.serif),
  };

  return (
    <div
      style={{
        width: 794,
        minHeight: 1123,
        background: '#fff',
        color: '#222',
        boxSizing: 'border-box',
        fontFamily: stack(c.font || 'Inter', c.serif),
        fontSize: `${c.fontSize || 10}pt`,
        lineHeight: c.lineHeight || 1.5,
        overflow: 'hidden',
      }}
    >
      <Layout d={normalize(sections)} t={t} />
    </div>
  );
}