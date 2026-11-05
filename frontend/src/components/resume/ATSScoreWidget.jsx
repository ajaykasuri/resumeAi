import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, TrendingUp, AlertCircle, CheckCircle, XCircle, Zap } from 'lucide-react';
import { calculateATSScore } from '../../utils/helpers';
import { aiAPI } from '../../services/api';
import toast from 'react-hot-toast';
import './ATSScoreWidget.css';

function ScoreRing({ score, size = 100 }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 75 ? '#00d68f' : score >= 50 ? '#ffb347' : '#ff4d6d';

  return (
    <svg width={size} height={size} className="score-ring-svg">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={8}
        strokeDasharray={`${circ}`}
        strokeDashoffset={circ - fill}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - fill }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />
      <text x={size / 2} y={size / 2 + 6} textAnchor="middle" fill={color} fontSize="1.4rem" fontWeight="800" fontFamily="Syne">{score}</text>
    </svg>
  );
}

export default function ATSScoreWidget({ sections, jobDescription = '' }) {
  const [localScore, setLocalScore] = useState(0);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLocalScore(calculateATSScore(sections));
  }, [sections]);

  const runAIAnalysis = async () => {
    setLoading(true);
    try {
      const resumeContent = {};
      sections.forEach(s => { resumeContent[s.section_type] = s.content; });
      const { data } = await aiAPI.atsScore({ resumeContent, jobDescription });
      setAiAnalysis(data.data.analysis);
      toast.success('ATS analysis complete!');
    } catch {
      toast.error('AI analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const score = aiAnalysis?.overallScore ?? localScore;
  const label = score >= 80 ? 'Excellent' : score >= 65 ? 'Good' : score >= 45 ? 'Fair' : 'Needs Work';
  const labelColor = score >= 80 ? 'var(--success)' : score >= 65 ? '#7bc67e' : score >= 45 ? 'var(--warning)' : 'var(--error)';

  const checks = [
    { label: 'Contact info present', ok: !!sections.find(s => s.section_type === 'personal_info')?.content?.email },
    { label: 'Professional summary', ok: !!(sections.find(s => s.section_type === 'summary')?.content?.text?.length > 30) },
    { label: 'Work experience added', ok: !!(sections.find(s => s.section_type === 'experience')?.content?.items?.length > 0) },
    { label: 'Skills section filled', ok: !!sections.find(s => s.section_type === 'skills')?.content?.categories?.flatMap(c => c.skills || []).length },
    { label: 'Education included', ok: !!(sections.find(s => s.section_type === 'education')?.content?.items?.length > 0) },
    { label: 'LinkedIn profile', ok: !!sections.find(s => s.section_type === 'personal_info')?.content?.linkedin },
  ];

  return (
    <div className="ats-widget">
      <div className="ats-header">
        <Shield size={16} />
        <span>ATS Score</span>
      </div>

      <div className="ats-score-display">
        <ScoreRing score={score} />
        <div className="ats-score-meta">
          <div className="ats-score-label" style={{ color: labelColor }}>{label}</div>
          <div className="ats-score-sub">ATS Compatibility</div>
        </div>
      </div>

      {/* Breakdown bars */}
      {aiAnalysis?.breakdown && (
        <div className="ats-breakdown">
          {Object.entries(aiAnalysis.breakdown).map(([key, val]) => (
            <div key={key} className="ats-bar-row">
              <span className="ats-bar-label">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
              <div className="ats-bar-track">
                <motion.div className="ats-bar-fill"
                  style={{ background: val >= 70 ? 'var(--success)' : val >= 50 ? 'var(--warning)' : 'var(--error)' }}
                  initial={{ width: 0 }} animate={{ width: `${val}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
              <span className="ats-bar-val">{val}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Checklist */}
      <div className="ats-checklist">
        {checks.map((c, i) => (
          <div key={i} className={`ats-check-item ${c.ok ? 'ok' : 'warn'}`}>
            {c.ok ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
            <span>{c.label}</span>
          </div>
        ))}
      </div>

      {/* AI suggestions */}
      {aiAnalysis?.suggestions?.length > 0 && (
        <div className="ats-suggestions">
          <div className="ats-suggestions-label">💡 AI Suggestions</div>
          {aiAnalysis.suggestions.map((s, i) => (
            <div key={i} className="ats-suggestion-item">{s}</div>
          ))}
        </div>
      )}

      {/* Missing keywords */}
      {aiAnalysis?.missingKeywords?.length > 0 && (
        <div className="ats-missing">
          <div className="ats-missing-label">⚠ Missing Keywords</div>
          <div className="ats-missing-tags">
            {aiAnalysis.missingKeywords.slice(0, 8).map((kw, i) => (
              <span key={i} className="ats-missing-tag">{kw}</span>
            ))}
          </div>
        </div>
      )}

      <button className="btn btn-secondary btn-sm btn-full ats-analyze-btn"
        onClick={runAIAnalysis} disabled={loading}>
        <Zap size={13} /> {loading ? 'Analysing...' : 'Run AI Analysis'}
      </button>
    </div>
  );
}
