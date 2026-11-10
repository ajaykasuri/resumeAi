import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Shield, Sparkles, Target, Zap } from 'lucide-react';
import { calculateATSScore, calculateJobDescriptionMatch, calculateResumeCompleteness } from '../../utils/helpers';
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

export default function ATSScoreWidget({ sections, jobDescription = '', onJobDescriptionChange }) {
  const [localScore, setLocalScore] = useState(0);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const analysisRequestRef = useRef(0);

  useEffect(() => {
    analysisRequestRef.current += 1;
    setLocalScore(calculateATSScore(sections));
    setAiAnalysis(null);
    setLoading(false);
  }, [sections]);

  const runAIAnalysis = async () => {
    if (jobDescription.trim().length < 40) {
      toast.error('Paste a job description (at least 40 characters) to run a tailored analysis.');
      return;
    }
    const requestId = ++analysisRequestRef.current;
    setLoading(true);
    try {
      const resumeContent = {};
      sections.forEach(s => { resumeContent[s.section_type] = s.content; });
      const { data } = await aiAPI.atsScore({ resumeContent, jobDescription: jobDescription.trim() });
      if (requestId === analysisRequestRef.current) {
        setAiAnalysis(data.data.analysis);
        toast.success('ATS analysis complete!');
      }
    } catch (error) {
      if (requestId === analysisRequestRef.current) {
        toast.error(error.response?.data?.message || 'AI analysis failed');
      }
    } finally {
      if (requestId === analysisRequestRef.current) setLoading(false);
    }
  };

  const score = Math.max(0, Math.min(100, Number(aiAnalysis?.overallScore ?? localScore) || 0));
  const completeness = calculateResumeCompleteness(sections);
  const jobMatch = calculateJobDescriptionMatch(sections, jobDescription);
  const label = score >= 80 ? 'Excellent' : score >= 65 ? 'Good' : score >= 45 ? 'Fair' : 'Needs Work';
  const labelColor = score >= 80 ? 'var(--success)' : score >= 65 ? '#7bc67e' : score >= 45 ? 'var(--warning)' : 'var(--error)';

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
          <div className="ats-score-sub">{aiAnalysis ? 'AI review + resume checks' : 'Based on resume completeness checks'}</div>
        </div>
      </div>

      <div className="insight-score-card">
        <div><strong>{completeness.score}%</strong><span>Resume completeness</span></div>
        <div><strong>{jobMatch.keywordCount ? `${jobMatch.score}%` : '—'}</strong><span>Job match</span></div>
      </div>

      <div className="insight-job-description">
        <label htmlFor="job-description-input">Target job description</label>
        <textarea
          id="job-description-input"
          className="form-textarea"
          rows={5}
          maxLength={5000}
          value={jobDescription}
          onChange={event => {
            analysisRequestRef.current += 1;
            setLoading(false);
            onJobDescriptionChange(event.target.value);
            setAiAnalysis(null);
          }}
          placeholder="Paste the job description to see keyword overlap and tailored suggestions..."
        />
        <span>{jobDescription.length}/5,000 characters · Missing terms are suggestions, not a request to add skills you don't have.</span>
      </div>

      {jobMatch.keywordCount > 0 && (
        <div className="insight-keywords">
          <div className="ats-missing-label"><Target size={13} /> Job keyword match ({jobMatch.matched.length}/{jobMatch.keywordCount})</div>
          {jobMatch.missing.length > 0 ? (
            <div className="ats-missing-tags">
              {jobMatch.missing.slice(0, 10).map(keyword => <span className="ats-missing-tag" key={keyword}>{keyword}</span>)}
            </div>
          ) : <p className="insight-no-missing">All detected job terms appear in your resume.</p>}
        </div>
      )}

      <div className="completeness-checklist">
        <div className="ats-missing-label"><CheckCircle size={13} /> Resume completeness</div>
        {completeness.checks.map(check => (
          <div className={`ats-check-item ${check.complete ? 'ok' : 'warn'}`} key={check.label}>
            {check.complete ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
            <span>{check.label}</span>
            <span className="check-weight">{check.complete ? 'Done' : `${check.weight}%`}</span>
          </div>
        ))}
      </div>

      {/* Breakdown bars */}
      {aiAnalysis?.breakdown && (
        <div className="ats-breakdown">
          {Object.entries(aiAnalysis.breakdown).map(([key, val]) => (
            <div key={key} className="ats-bar-row">
              <span className="ats-bar-label">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
              <div className="ats-bar-track">
                <motion.div className="ats-bar-fill"
                  style={{ background: Number(val) >= 70 ? 'var(--success)' : Number(val) >= 50 ? 'var(--warning)' : 'var(--error)' }}
                  initial={{ width: 0 }} animate={{ width: `${Math.max(0, Math.min(100, Number(val) || 0))}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
              <span className="ats-bar-val">{Math.max(0, Math.min(100, Number(val) || 0))}%</span>
            </div>
          ))}
        </div>
      )}

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
      {aiAnalysis?.strengths?.length > 0 && (
        <div className="ats-suggestions">
          <div className="ats-suggestions-label"><Sparkles size={13} /> What’s working</div>
          {aiAnalysis.strengths.slice(0, 5).map((strength, index) => (
            <div key={index} className="ats-suggestion-item">{strength}</div>
          ))}
        </div>
      )}

      <button className="btn btn-secondary btn-sm btn-full ats-analyze-btn"
        onClick={runAIAnalysis} disabled={loading || jobDescription.trim().length < 40}>
        <Zap size={13} /> {loading ? 'Analysing...' : 'Run AI Analysis'}
      </button>
    </div>
  );
}
