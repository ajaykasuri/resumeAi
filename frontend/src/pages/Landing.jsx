import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  Sparkles, Zap, Shield, Download, LayoutTemplate, Brain,
  ChevronRight, Star, Check, ArrowRight, FileText, Cpu
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import './Landing.css';

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.12 } } };

function AnimatedSection({ children, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div ref={ref} className={className} variants={stagger}
      initial="hidden" animate={inView ? 'visible' : 'hidden'}>
      {children}
    </motion.div>
  );
}

const FEATURES = [
  { icon: <Brain size={22} />, title: 'AI-Powered Generation', desc: 'Describe your role and skills — our AI writes your entire resume with ATS-optimized content.' },
  { icon: <LayoutTemplate size={22} />, title: '8+ Pro Templates', desc: 'Professionally designed templates: minimal, modern, executive, and creative styles.' },
  { icon: <Zap size={22} />, title: 'Real-Time Preview', desc: 'See every edit live. Switch templates without losing a single word.' },
  { icon: <Shield size={22} />, title: 'ATS Optimized', desc: 'Every template passes Applicant Tracking Systems with proper formatting and keywords.' },
  { icon: <Download size={22} />, title: 'Export PDF & DOCX', desc: 'Download print-ready PDFs or editable Word documents. Perfect formatting every time.' },
  { icon: <Sparkles size={22} />, title: 'Smart Suggestions', desc: 'AI-powered improvement tips, keyword optimization, and resume scoring.' },
];

const TEMPLATES = [
  { name: 'Executive Pro', tag: 'Professional', color: '#1a1a2e', accent: '#e94560' },
  { name: 'Modern Slate', tag: 'Modern', color: '#2d3748', accent: '#667eea' },
  { name: 'Minimal Edge', tag: 'Minimal', color: '#000000', accent: '#0070f3' },
  { name: 'Tech Resume', tag: 'Developer', color: '#0f172a', accent: '#06b6d4' },
];

const TESTIMONIALS = [
  { name: 'Priya Sharma', role: 'Software Engineer at Google', text: 'ResumeAI helped me land my dream job at Google. The AI-generated content was spot-on for my role.', rating: 5 },
  { name: 'Arjun Mehta', role: 'Product Manager at Flipkart', text: 'Best resume builder I have used. Clean templates, amazing AI, and got multiple callbacks within a week!', rating: 5 },
  { name: 'Sneha Rao', role: 'Data Scientist at Amazon', text: 'The ATS optimization feature is incredible. My application rate jumped from 5% to 40% response rate.', rating: 5 },
];

const PLANS = [
  { name: 'Free', price: '₹0', period: '/forever', features: ['3 resumes', '4 templates', 'PDF download', 'Basic AI (3/month)'], cta: 'Get Started', highlight: false },
  { name: 'Pro', price: '₹499', period: '/month', features: ['Unlimited resumes', 'All 8+ templates', 'PDF & DOCX', 'Unlimited AI', 'ATS Score', 'Priority support'], cta: 'Start Free Trial', highlight: true },
  { name: 'Team', price: '₹1299', period: '/month', features: ['Everything in Pro', 'Up to 5 members', 'Team templates', 'Analytics', 'Dedicated support'], cta: 'Contact Sales', highlight: false },
];

export default function Landing() {
  return (
    <div className="landing">
      <Navbar />

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-orb orb-1" />
          <div className="hero-orb orb-2" />
          <div className="hero-grid" />
        </div>
        <div className="hero-content">
          <motion.div className="hero-badge"
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
            <Sparkles size={13} />
            <span>Powered by Gemini AI</span>
          </motion.div>

          <motion.h1 className="hero-title"
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7 }}>
            Build Resumes That<br />
            <span className="text-gradient">Get You Hired</span>
          </motion.h1>

          <motion.p className="hero-subtitle"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            AI-powered resume builder with ATS optimization, professional templates,
            and one-click generation. Land your dream job faster.
          </motion.p>

          <motion.div className="hero-actions"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}>
            <Link to="/register" className="btn btn-primary btn-lg">
              <Sparkles size={18} /> Build My Resume Free
            </Link>
            <Link to="/templates" className="btn btn-secondary btn-lg">
              View Templates <ChevronRight size={16} />
            </Link>
          </motion.div>

          <motion.div className="hero-meta"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
            <div className="hero-stat"><span className="stat-num">50K+</span><span className="stat-label">Resumes Built</span></div>
            <div className="hero-divider" />
            <div className="hero-stat"><span className="stat-num">4.9★</span><span className="stat-label">User Rating</span></div>
            <div className="hero-divider" />
            <div className="hero-stat"><span className="stat-num">3x</span><span className="stat-label">More Callbacks</span></div>
          </motion.div>
        </div>

        {/* Hero Preview Cards */}
        <motion.div className="hero-preview"
          initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5, duration: 0.8 }}>
          <div className="preview-card main-card">
            <div className="preview-header">
              <div className="preview-avatar">AK</div>
              <div>
                <div className="preview-name">Aditya Kumar</div>
                <div className="preview-role">Full Stack Developer</div>
              </div>
              <span className="badge badge-success" style={{ marginLeft: 'auto' }}>ATS 94%</span>
            </div>
            <div className="preview-section">
              <div className="preview-label">EXPERIENCE</div>
              <div className="preview-item">Senior Developer · Infosys</div>
              <div className="preview-item">Software Engineer · TCS</div>
            </div>
            <div className="preview-section">
              <div className="preview-label">SKILLS</div>
              <div className="preview-tags">
                {['React', 'Node.js', 'AWS', 'MongoDB', 'TypeScript'].map(s => (
                  <span key={s} className="preview-tag">{s}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="preview-card ai-card">
            <div className="ai-badge"><Cpu size={12} /> AI Writing...</div>
            <div className="ai-lines">
              {[100, 80, 92, 65].map((w, i) => (
                <div key={i} className="ai-line" style={{ width: `${w}%`, animationDelay: `${i * 0.3}s` }} />
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Features ── */}
      <section className="features-section" id="features">
        <div className="section-container">
          <AnimatedSection>
            <motion.div variants={fadeUp} className="section-header">
              <span className="section-eyebrow">Why ResumeAI</span>
              <h2>Everything You Need to<br /><span className="text-gradient">Stand Out</span></h2>
              <p>From AI generation to ATS optimization — every feature designed to land you more interviews.</p>
            </motion.div>
            <div className="features-grid">
              {FEATURES.map((f, i) => (
                <motion.div key={i} variants={fadeUp} className="feature-card card card-hover">
                  <div className="feature-icon">{f.icon}</div>
                  <h4>{f.title}</h4>
                  <p>{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── Templates Showcase ── */}
      <section className="templates-section">
        <div className="section-container">
          <AnimatedSection>
            <motion.div variants={fadeUp} className="section-header">
              <span className="section-eyebrow">Templates</span>
              <h2>Professional Templates<br /><span className="text-gradient">That Get Noticed</span></h2>
              <p>ATS-friendly designs chosen by hiring managers at top companies.</p>
            </motion.div>
            <div className="templates-grid">
              {TEMPLATES.map((t, i) => (
                <motion.div key={i} variants={fadeUp} className="template-preview-card card card-hover"
                  style={{ '--t-primary': t.color, '--t-accent': t.accent }}>
                  <div className="tpl-header" style={{ background: t.color }}>
                    <div className="tpl-name-block">
                      <div className="tpl-avatar" style={{ background: t.accent }}>JD</div>
                      <div>
                        <div className="tpl-person">John Doe</div>
                        <div className="tpl-role" style={{ color: t.accent }}>Senior Developer</div>
                      </div>
                    </div>
                  </div>
                  <div className="tpl-body">
                    {['Experience', 'Education', 'Skills'].map((s) => (
                      <div key={s} className="tpl-section">
                        <div className="tpl-section-title" style={{ color: t.accent }}>{s}</div>
                        <div className="tpl-line" /><div className="tpl-line short" />
                      </div>
                    ))}
                  </div>
                  <div className="tpl-footer">
                    <span className="badge badge-primary">{t.tag}</span>
                    <span className="tpl-template-name">{t.name}</span>
                  </div>
                </motion.div>
              ))}
            </div>
            <motion.div variants={fadeUp} className="text-center" style={{ marginTop: 40 }}>
              <Link to="/templates" className="btn btn-secondary btn-lg">
                View All Templates <ArrowRight size={16} />
              </Link>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── AI Section ── */}
      <section className="ai-section">
        <div className="section-container">
          <div className="ai-inner">
            <AnimatedSection className="ai-text">
              <motion.div variants={fadeUp}>
                <span className="section-eyebrow"><Sparkles size={12} /> AI Resume Generator</span>
                <h2>From Skills to <span className="text-gradient">Full Resume</span><br />in 30 Seconds</h2>
                <p>Just enter your job role and skills. Our AI crafts a complete, ATS-optimized resume — professional summary, experience bullets, project descriptions and more.</p>
                <div className="ai-steps">
                  {['Enter your job role & skills', 'AI generates complete resume content', 'Customize and download'].map((s, i) => (
                    <div key={i} className="ai-step">
                      <div className="step-num">{i + 1}</div>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
                <Link to="/register" className="btn btn-primary btn-lg" style={{ marginTop: 28 }}>
                  <Brain size={18} /> Try AI Generator Free
                </Link>
              </motion.div>
            </AnimatedSection>
            <div className="ai-demo">
              <div className="ai-terminal">
                <div className="terminal-header">
                  <div className="terminal-dots">
                    <span /><span /><span />
                  </div>
                  <span className="terminal-title">AI Resume Generator</span>
                </div>
                <div className="terminal-body">
                  <div className="t-row"><span className="t-key">Role</span><span className="t-val">Full Stack Developer</span></div>
                  <div className="t-row"><span className="t-key">Skills</span><span className="t-val">React, Node.js, AWS</span></div>
                  <div className="t-row"><span className="t-key">Level</span><span className="t-val">Senior (5+ years)</span></div>
                  <div className="t-separator" />
                  <div className="t-generating">
                    <div className="t-spinner" />
                    <span>Generating professional summary...</span>
                  </div>
                  <div className="t-output">
                    <div className="t-output-label">✓ Summary Generated</div>
                    <div className="t-output-text">"Results-driven Full Stack Developer with 5+ years building scalable web applications using React and Node.js..."</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="testimonials-section">
        <div className="section-container">
          <AnimatedSection>
            <motion.div variants={fadeUp} className="section-header">
              <span className="section-eyebrow">Testimonials</span>
              <h2>Loved by <span className="text-gradient">Job Seekers</span></h2>
            </motion.div>
            <div className="testimonials-grid">
              {TESTIMONIALS.map((t, i) => (
                <motion.div key={i} variants={fadeUp} className="testimonial-card card">
                  <div className="stars">{[...Array(t.rating)].map((_, j) => <Star key={j} size={14} fill="currentColor" />)}</div>
                  <p className="testimonial-text">"{t.text}"</p>
                  <div className="testimonial-author">
                    <div className="author-avatar">{t.name[0]}</div>
                    <div>
                      <div className="author-name">{t.name}</div>
                      <div className="author-role">{t.role}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="pricing-section" id="pricing">
        <div className="section-container">
          <AnimatedSection>
            <motion.div variants={fadeUp} className="section-header">
              <span className="section-eyebrow">Pricing</span>
              <h2>Simple, <span className="text-gradient">Transparent Pricing</span></h2>
              <p>Start free. Upgrade when you need more.</p>
            </motion.div>
            <div className="pricing-grid">
              {PLANS.map((plan, i) => (
                <motion.div key={i} variants={fadeUp}
                  className={`pricing-card card ${plan.highlight ? 'pricing-highlight' : ''}`}>
                  {plan.highlight && <div className="popular-badge">Most Popular</div>}
                  <div className="plan-name">{plan.name}</div>
                  <div className="plan-price">
                    <span className="price-amount">{plan.price}</span>
                    <span className="price-period">{plan.period}</span>
                  </div>
                  <ul className="plan-features">
                    {plan.features.map((f, j) => (
                      <li key={j}><Check size={14} className="check-icon" />{f}</li>
                    ))}
                  </ul>
                  <Link to="/register"
                    className={`btn btn-full ${plan.highlight ? 'btn-primary' : 'btn-secondary'}`}>
                    {plan.cta}
                  </Link>
                </motion.div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <div className="cta-inner">
          <div className="cta-orb" />
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            Ready to Land Your <span className="text-gradient">Dream Job?</span>
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
            Join 50,000+ professionals who built winning resumes with ResumeAI.
          </motion.p>
          <motion.div className="cta-actions" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
            <Link to="/register" className="btn btn-primary btn-lg">
              <Sparkles size={18} /> Start Building Free
            </Link>
            <Link to="/login" className="btn btn-secondary btn-lg">
              Continue as Guest
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-brand">
            <div className="footer-logo">
              <div className="logo-icon"><FileText size={16} /></div>
              <span className="logo-text">Resume<span className="logo-accent">AI</span></span>
            </div>
            <p>AI-powered resume builder for modern professionals.</p>
          </div>
          <div className="footer-links">
            <div className="footer-col">
              <h5>Product</h5>
              <Link to="/templates">Templates</Link>
              <a href="/#features">Features</a>
              <a href="/#pricing">Pricing</a>
            </div>
            <div className="footer-col">
              <h5>Company</h5>
              <a href="#">About</a>
              <a href="#">Blog</a>
              <a href="#">Careers</a>
            </div>
            <div className="footer-col">
              <h5>Legal</h5>
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2025 ResumeAI. Built with ❤️ for job seekers everywhere.</span>
        </div>
      </footer>
    </div>
  );
}
