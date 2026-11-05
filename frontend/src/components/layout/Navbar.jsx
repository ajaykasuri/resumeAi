import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Menu, X, Sparkles, LogOut, User, LayoutDashboard, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => { setMobileOpen(false); setProfileOpen(false); }, [location]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <motion.nav
      className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <div className="logo-icon">
            <FileText size={18} />
          </div>
          <span className="logo-text">Resume<span className="logo-accent">AI</span></span>
        </Link>

        {/* Desktop Nav */}
        <div className="navbar-links">
          <Link to="/templates" className={`nav-link ${isActive('/templates') ? 'active' : ''}`}>Templates</Link>
          <a href="/#features" className="nav-link">Features</a>
          <a href="/#pricing" className="nav-link">Pricing</a>
        </div>

        {/* Desktop Actions */}
        <div className="navbar-actions">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className={`btn btn-ghost btn-sm ${isActive('/dashboard') ? 'active' : ''}`}>
                <LayoutDashboard size={15} /> Dashboard
              </Link>
              <div className="profile-menu">
                <button className="profile-btn" onClick={() => setProfileOpen(!profileOpen)}>
                  <div className="avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</div>
                  <span className="profile-name">{user?.name?.split(' ')[0]}</span>
                  <ChevronDown size={14} className={profileOpen ? 'rotated' : ''} />
                </button>
                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      className="profile-dropdown"
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                    >
                      <div className="dropdown-header">
                        <span className="dropdown-name">{user?.name}</span>
                        <span className="dropdown-email">{user?.email}</span>
                      </div>
                      <div className="dropdown-divider" />
                      <Link to="/dashboard" className="dropdown-item">
                        <LayoutDashboard size={15} /> Dashboard
                      </Link>
                      <button className="dropdown-item danger" onClick={handleLogout}>
                        <LogOut size={15} /> Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Log in</Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                <Sparkles size={14} /> Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button className="mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Link to="/templates" className="mobile-link">Templates</Link>
            <a href="/#features" className="mobile-link">Features</a>
            <a href="/#pricing" className="mobile-link">Pricing</a>
            <div className="mobile-divider" />
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="mobile-link">Dashboard</Link>
                <button className="mobile-link danger" onClick={handleLogout}>Sign Out</button>
              </>
            ) : (
              <>
                <Link to="/login" className="mobile-link">Log in</Link>
                <Link to="/register" className="btn btn-primary btn-sm" style={{ margin: '0 16px 8px' }}>
                  Get Started
                </Link>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {profileOpen && <div className="overlay" onClick={() => setProfileOpen(false)} />}
    </motion.nav>
  );
}
