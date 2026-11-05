import React from 'react';
import { Palette, Type, Sliders } from 'lucide-react';
import './CustomizationPanel.css';

const COLORS = [
  { label: 'Navy', primary: '#1a1a2e', accent: '#e94560' },
  { label: 'Slate', primary: '#2d3748', accent: '#667eea' },
  { label: 'Black', primary: '#000000', accent: '#0070f3' },
  { label: 'Purple', primary: '#4a154b', accent: '#e01e5a' },
  { label: 'Forest', primary: '#1b4332', accent: '#40916c' },
  { label: 'Ocean', primary: '#0f172a', accent: '#06b6d4' },
  { label: 'Wine', primary: '#4a0e0e', accent: '#e63946' },
  { label: 'Gold', primary: '#2c2c2c', accent: '#c9a84c' },
];

const FONTS = ['DM Sans', 'Inter', 'Lato', 'Roboto', 'Open Sans', 'Playfair Display', 'Merriweather', 'Source Serif 4'];

export default function CustomizationPanel({ customization, onChange }) {
  const update = (key, val) => onChange({ ...customization, [key]: val });

  return (
    <div className="cust-panel">
      {/* Color Themes */}
      <div className="cust-section">
        <div className="cust-section-header"><Palette size={15} /><span>Color Theme</span></div>
        <div className="cust-colors">
          {COLORS.map((c) => (
            <button
              key={c.label}
              className={`cust-color-btn ${customization.primaryColor === c.primary ? 'active' : ''}`}
              onClick={() => onChange({ ...customization, primaryColor: c.primary, accentColor: c.accent })}
              title={c.label}
            >
              <div className="color-swatch" style={{ background: c.primary }}>
                <div className="color-accent" style={{ background: c.accent }} />
              </div>
              <span>{c.label}</span>
            </button>
          ))}
        </div>
        <div className="cust-custom-colors">
          <div className="form-group">
            <label className="form-label">Header Color</label>
            <div className="color-input-row">
              <input type="color" className="color-picker" value={customization.primaryColor || '#1a1a2e'}
                onChange={e => update('primaryColor', e.target.value)} />
              <input className="form-input" value={customization.primaryColor || '#1a1a2e'}
                onChange={e => update('primaryColor', e.target.value)} maxLength={7} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Accent Color</label>
            <div className="color-input-row">
              <input type="color" className="color-picker" value={customization.accentColor || '#6c63ff'}
                onChange={e => update('accentColor', e.target.value)} />
              <input className="form-input" value={customization.accentColor || '#6c63ff'}
                onChange={e => update('accentColor', e.target.value)} maxLength={7} />
            </div>
          </div>
        </div>
      </div>

      {/* Font */}
      <div className="cust-section">
        <div className="cust-section-header"><Type size={15} /><span>Typography</span></div>
        <div className="form-group">
          <label className="form-label">Font Family</label>
          <select className="form-select" value={customization.font || 'DM Sans'} onChange={e => update('font', e.target.value)}>
            {FONTS.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
          </select>
        </div>
        <div className="cust-slider-group">
          <div className="form-group">
            <label className="form-label">Font Size: {customization.fontSize || 10.5}pt</label>
            <input type="range" min={9} max={13} step={0.5} className="cust-slider"
              value={customization.fontSize || 10.5} onChange={e => update('fontSize', parseFloat(e.target.value))} />
          </div>
          <div className="form-group">
            <label className="form-label">Line Height: {customization.lineHeight || 1.6}</label>
            <input type="range" min={1.3} max={2} step={0.1} className="cust-slider"
              value={customization.lineHeight || 1.6} onChange={e => update('lineHeight', parseFloat(e.target.value))} />
          </div>
        </div>
      </div>

      {/* Spacing */}
      <div className="cust-section">
        <div className="cust-section-header"><Sliders size={15} /><span>Spacing</span></div>
        <div className="form-group">
          <label className="form-label">Section Spacing: {customization.sectionSpacing || 16}px</label>
          <input type="range" min={8} max={32} step={2} className="cust-slider"
            value={customization.sectionSpacing || 16} onChange={e => update('sectionSpacing', parseInt(e.target.value))} />
        </div>
      </div>
    </div>
  );
}
