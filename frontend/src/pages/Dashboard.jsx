import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus, Sparkles, Copy, Trash2, Edit, Eye, Download, FileText,
  LayoutDashboard, TrendingUp, Clock, MoreVertical, Search, Filter,
  BarChart2, Share2, LogOut, User, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { resumeAPI, analyticsAPI } from '../services/api';
import toast from 'react-hot-toast';
import './Dashboard.css';

const STAGGER = { visible: { transition: { staggerChildren: 0.08 } } };
const FADE_UP = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };

function StatCard({ icon, label, value, color }) {
  return (
    <motion.div variants={FADE_UP} className="stat-card card">
      <div className="stat-icon" style={{ background: `${color}18`, color }}>{icon}</div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </motion.div>
  );
}

function ResumeCard({ resume, onDelete, onDuplicate, onEdit }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const statusColors = { draft: '#ffb347', published: '#00d68f', archived: '#9090b0' };

  return (
    <motion.div variants={FADE_UP} className="resume-card card card-hover">
      <div className="resume-card-thumb">
        <FileText size={32} style={{ opacity: 0.2 }} />
        <span className="badge" style={{
          position: 'absolute', top: 10, right: 10,
          background: `${statusColors[resume.status] || '#6c63ff'}18`,
          color: statusColors[resume.status] || '#6c63ff',
          border: `1px solid ${statusColors[resume.status] || '#6c63ff'}40`,
          fontSize: '0.7rem', padding: '3px 8px',
        }}>
          {resume.status}
        </span>
        {resume.ats_score > 0 && (
          <span className="ats-badge">ATS {resume.ats_score}%</span>
        )}
      </div>
      <div className="resume-card-body">
        <div className="resume-card-header">
          <h4 className="resume-title">{resume.title}</h4>
          <div className="resume-menu-wrap">
            <button className="btn btn-ghost btn-icon" onClick={() => setMenuOpen(!menuOpen)}>
              <MoreVertical size={16} />
            </button>
            {menuOpen && (
              <div className="resume-dropdown">
                <button className="dropdown-item" onClick={() => { onEdit(resume.uuid); setMenuOpen(false); }}>
                  <Edit size={14} /> Edit
                </button>
                <button className="dropdown-item" onClick={() => { onDuplicate(resume.uuid); setMenuOpen(false); }}>
                  <Copy size={14} /> Duplicate
                </button>
                {resume.is_public && (
                  <button className="dropdown-item" onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/shared/${resume.share_token}`);
                    toast.success('Share link copied!');
                    setMenuOpen(false);
                  }}>
                    <Share2 size={14} /> Copy Share Link
                  </button>
                )}
                <div className="dropdown-divider" />
                <button className="dropdown-item danger" onClick={() => { onDelete(resume.uuid); setMenuOpen(false); }}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
        <p className="resume-meta">
          {resume.template_name && <span>{resume.template_name}</span>}
          {resume.template_name && resume.updated_at && <span> · </span>}
          {resume.updated_at && <span>{timeAgo(resume.updated_at)}</span>}
        </p>
        <div className="resume-stats">
          <span><Eye size={12} /> {resume.view_count || 0}</span>
          <span><Download size={12} /> {resume.download_count || 0}</span>
        </div>
      </div>
      <div className="resume-card-actions">
        <button className="btn btn-secondary btn-sm flex-1" onClick={() => onEdit(resume.uuid)}>
          <Edit size={13} /> Edit
        </button>
        <Link to={`/builder/${resume.uuid}`} className="btn btn-primary btn-sm flex-1">
          Open
        </Link>
      </div>
      {menuOpen && <div style={{ position: 'fixed', inset: 0, zIndex: 1 }} onClick={() => setMenuOpen(false)} />}
    </motion.div>
  );
}

function timeAgo(dateStr) {
  const now = new Date(), then = new Date(dateStr);
  const diff = (now - then) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [stats, setStats] = useState({ totalResumes: 0, totalDownloads: 0, totalViews: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [resumeRes, analyticsRes] = await Promise.all([
        resumeAPI.getAll(),
        analyticsAPI.getDashboard(),
      ]);
      setResumes(resumeRes.data.data.resumes || []);
      setStats(analyticsRes.data.data.stats || {});
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const createResume = async (type) => {
    setCreating(true);
    try {
      const { data } = await resumeAPI.create({ title: 'Untitled Resume' });
      setShowCreateModal(false);
      if (type === 'ai') {
        navigate(`/ai-generator?resumeId=${data.data.resumeId}`);
      } else {
        navigate(`/builder/${data.data.resumeId}`);
      }
    } catch {
      toast.error('Failed to create resume');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this resume? This cannot be undone.')) return;
    try {
      await resumeAPI.delete(id);
      setResumes(prev => prev.filter(r => r.uuid !== id));
      toast.success('Resume deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handleDuplicate = async (id) => {
    try {
      const { data } = await resumeAPI.duplicate(id);
      toast.success('Resume duplicated!');
      await loadData();
    } catch { toast.error('Failed to duplicate'); }
  };

  const filtered = resumes.filter(r =>
    r.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon"><FileText size={16} /></div>
          <span className="logo-text">Resume<span className="logo-accent">AI</span></span>
        </div>
        <nav className="sidebar-nav">
          <a className="sidebar-item active"><LayoutDashboard size={17} /> Dashboard</a>
          <Link to="/templates" className="sidebar-item"><Filter size={17} /> Templates</Link>
          <Link to="/ai-generator" className="sidebar-item"><Sparkles size={17} /> AI Generator</Link>
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</div>
            <div className="user-detail">
              <div className="user-name">{user?.name || 'Guest'}</div>
              <div className="user-email">{user?.email || 'guest@resumeai.com'}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={() => { logout(); navigate('/'); }} title="Sign out">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">
              Welcome back, <span className="text-gradient">{user?.name?.split(' ')[0] || 'there'}!</span>
            </h1>
            <p className="dashboard-subtitle">Manage and build your professional resumes</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} /> New Resume
          </button>
        </div>

        {/* Stats */}
        <motion.div className="stats-row" variants={STAGGER} initial="hidden" animate="visible">
          <StatCard icon={<FileText size={20} />} label="Total Resumes" value={stats.totalResumes || resumes.length} color="#6c63ff" />
          <StatCard icon={<Download size={20} />} label="Downloads" value={stats.totalDownloads || 0} color="#00d4ff" />
          <StatCard icon={<Eye size={20} />} label="Profile Views" value={stats.totalViews || 0} color="#ff6b9d" />
          <StatCard icon={<TrendingUp size={20} />} label="Avg ATS Score" value={`${resumes.filter(r => r.ats_score > 0).reduce((a, b, _, arr) => a + b.ats_score / arr.length, 0).toFixed(0) || '--'}%`} color="#00d68f" />
        </motion.div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <motion.button className="quick-action-card primary" onClick={() => setShowCreateModal(true)}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <div className="qa-icon"><Plus size={22} /></div>
            <div className="qa-text">
              <div className="qa-title">Create Resume</div>
              <div className="qa-desc">Start from scratch or use a template</div>
            </div>
            <ChevronRight size={18} className="qa-arrow" />
          </motion.button>
          <motion.div className="quick-action-card ai" onClick={() => navigate('/ai-generator')}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ cursor: 'pointer' }}>
            <div className="qa-icon ai"><Sparkles size={22} /></div>
            <div className="qa-text">
              <div className="qa-title">AI Generator</div>
              <div className="qa-desc">Generate a resume with AI in seconds</div>
            </div>
            <ChevronRight size={18} className="qa-arrow" />
          </motion.div>
          <motion.div className="quick-action-card" onClick={() => navigate('/templates')}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ cursor: 'pointer' }}>
            <div className="qa-icon"><Filter size={22} /></div>
            <div className="qa-text">
              <div className="qa-title">Browse Templates</div>
              <div className="qa-desc">Explore 8+ professional designs</div>
            </div>
            <ChevronRight size={18} className="qa-arrow" />
          </motion.div>
        </div>

        {/* Resumes List */}
        <div className="resumes-section">
          <div className="resumes-header">
            <h3>My Resumes</h3>
            <div className="search-box">
              <Search size={15} className="search-icon" />
              <input className="search-input" placeholder="Search resumes..." value={search}
                onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          {loading ? (
            <div className="resume-grid">
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 220, borderRadius: 16 }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><FileText size={40} /></div>
              <h3>No resumes yet</h3>
              <p>{search ? 'No resumes match your search.' : 'Create your first resume to get started.'}</p>
              {!search && (
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                  <Plus size={16} /> Create Resume
                </button>
              )}
            </div>
          ) : (
            <motion.div className="resume-grid" variants={STAGGER} initial="hidden" animate="visible">
              {filtered.map(resume => (
                <ResumeCard key={resume.uuid} resume={resume}
                  onDelete={handleDelete} onDuplicate={handleDuplicate}
                  onEdit={(id) => navigate(`/builder/${id}`)} />
              ))}
            </motion.div>
          )}
        </div>
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <motion.div className="modal create-modal" onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="modal-header">
              <h3 className="modal-title">Create New Resume</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Choose how you'd like to create your resume</p>
            <div className="create-options">
              <button className="create-option" onClick={() => createResume('manual')} disabled={creating}>
                <div className="co-icon"><Edit size={28} /></div>
                <div className="co-title">Manual Builder</div>
                <div className="co-desc">Fill in your details with our powerful editor and live preview</div>
              </button>
              <button className="create-option ai" onClick={() => createResume('ai')} disabled={creating}>
                <div className="co-icon"><Sparkles size={28} /></div>
                <div className="co-title">AI Generator</div>
                <div className="co-desc">Let AI write your entire resume from your job role & skills</div>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
