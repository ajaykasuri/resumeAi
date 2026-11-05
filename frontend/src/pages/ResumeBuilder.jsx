import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragOverlay
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
  useSortable, arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Save, Download, Eye, EyeOff, ChevronRight, ChevronLeft,
  GripVertical, Plus, Settings, Palette, LayoutTemplate, Zap,
  FileText, ArrowLeft, Check, Sparkles, ZoomIn, ZoomOut,
  MoreVertical, Layers
} from 'lucide-react';
import { useResume } from '../context/ResumeContext';
import { resumeAPI, downloadAPI } from '../services/api';
import ResumePreview from '../components/resume/ResumePreview';
import { SectionEditor } from '../components/resume/SectionEditors';
import CustomizationPanel from '../components/resume/CustomizationPanel';
import TemplateSelectionPanel from '../components/resume/TemplateSelectionPanel';
import toast from 'react-hot-toast';
import './ResumeBuilder.css';

const SECTION_LABELS = {
  personal_info: 'Personal Info', summary: 'Summary', objective: 'Objective',
  education: 'Education', experience: 'Experience', skills: 'Skills',
  projects: 'Projects', certifications: 'Certifications', achievements: 'Achievements',
  languages: 'Languages', interests: 'Interests', declaration: 'Declaration', custom: 'Custom',
};

const SECTION_ICONS = {
  personal_info: '👤', summary: '📝', objective: '🎯', education: '🎓',
  experience: '💼', skills: '⚡', projects: '🚀', certifications: '🏅',
  achievements: '🏆', languages: '🌐', interests: '❤️', declaration: '📋', custom: '✏️',
};

/* ── Sortable Section Item ─────────────── */
function SortableSectionItem({ section, isActive, onSelect, onToggle }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id || section.section_type });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  const label = section.custom_title || SECTION_LABELS[section.section_type] || section.section_type;
  const icon = SECTION_ICONS[section.section_type] || '📌';

  return (
    <div ref={setNodeRef} style={style} className={`section-nav-item ${isActive ? 'active' : ''} ${!section.is_visible ? 'hidden-section' : ''}`}>
      <div {...attributes} {...listeners} className="section-drag-handle"><GripVertical size={13} /></div>
      <button className="section-nav-btn" onClick={() => onSelect(section)}>
        <span className="section-icon">{icon}</span>
        <span className="section-label">{label}</span>
      </button>
      <button className="section-visibility-btn" onClick={() => onToggle(section.section_type)}
        title={section.is_visible ? 'Hide' : 'Show'}>
        {section.is_visible ? <Eye size={12} /> : <EyeOff size={12} />}
      </button>
    </div>
  );
}

export default function ResumeBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    sections, setSections, customization, setCustomization,
    isSaving, isDirty, loadResume, updateSection, updateCustomization,
    reorderSections, toggleSection, addCustomSection, saveResume, resetResume,
  } = useResume();

  const [activeSectionId, setActiveSectionId] = useState(null);
  const activeSection = sections.find(
    section => (section.id || section.section_type) === activeSectionId
  ) || sections[0] || null;
  const activeSectionIndex = activeSection
    ? sections.findIndex(section => (section.id || section.section_type) === (activeSection.id || activeSection.section_type))
    : -1;
  const [activeTab, setActiveTab] = useState('content');
  const [showTemplateSelection, setShowTemplateSelection] = useState(false);
  const [loading, setLoading] = useState(!!id);
  const [previewScale, setPreviewScale] = useState(0.6);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [resumeTitle, setResumeTitle] = useState('Untitled Resume');
  const [showAddSection, setShowAddSection] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (id) {
      loadResume(id)
        .then(r => { setResumeTitle(r.title || 'Untitled Resume'); setLoading(false); })
        .catch(() => { toast.error('Resume not found'); navigate('/dashboard'); });
    } else {
      resetResume();
      setLoading(false);
    }
  }, [id]);

  const handleDragEnd = useCallback(({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIdx = sections.findIndex(s => (s.id || s.section_type) === active.id);
    const newIdx = sections.findIndex(s => (s.id || s.section_type) === over.id);
    if (oldIdx !== -1 && newIdx !== -1) {
      reorderSections(arrayMove(sections, oldIdx, newIdx));
    }
  }, [sections, reorderSections]);

  const handleSectionContentChange = useCallback((content) => {
    if (!activeSection) return;
    updateSection(activeSection.id || activeSection.section_type, content);
  }, [activeSection, updateSection]);

  const handleSave = async () => {
    if (!id) {
      toast('Create a resume first to save.');
      return;
    }
    const title = resumeTitle.trim();
    if (!title) {
      toast.error('Resume name cannot be empty');
      setResumeTitle('Untitled Resume');
      return;
    }
    if (await saveResume({ title })) {
      setResumeTitle(title);
      toast.success('Resume saved!');
    }
  };

  const openTemplateSelection = () => {
    setShowTemplateSelection(true);
  };

  const closeTemplateSelection = () => {
    setShowTemplateSelection(false);
    setSidebarCollapsed(false);
  };

  const handleTemplateSelect = async (template) => {
    const nextCustomization = {
      ...customization,
      ...(template.config || {}),
      templateSlug: template.slug,
    };
    updateCustomization(nextCustomization);
    if (await saveResume({ customization: nextCustomization, templateId: template.slug })) {
      setActiveTab('content');
      setShowTemplateSelection(false);
      setSidebarCollapsed(false);
    }
  };

  const handleTitleSave = async () => {
    const title = resumeTitle.trim();
    if (!title) {
      toast.error('Resume name cannot be empty');
      setResumeTitle('Untitled Resume');
      return;
    }
    setResumeTitle(title);
    if (!id) return;
    try {
      await resumeAPI.update(id, { title });
    } catch (error) {
      console.error('Resume title update failed:', error);
      toast.error(error.response?.data?.message || 'Failed to save resume name');
    }
  };

  const handleDownloadPDF = async () => {
    if (!id) { toast.error('Save your resume first'); return; }
    setDownloading(true);
    try {
      const { data } = await downloadAPI.pdf(id);
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
      const a = document.createElement('a'); a.href = url; a.download = `${resumeTitle}.pdf`; a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded!');
    } catch { toast.error('PDF download failed. Check backend config.'); }
    finally { setDownloading(false); }
  };

  const handleDownloadDOCX = async () => {
    if (!id) { toast.error('Save your resume first'); return; }
    setDownloading(true);
    try {
      const { data } = await downloadAPI.docx(id);
      const url = URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a'); a.href = url; a.download = `${resumeTitle}.docx`; a.click();
      URL.revokeObjectURL(url);
      toast.success('DOCX downloaded!');
    } catch { toast.error('DOCX download failed'); }
    finally { setDownloading(false); }
  };

  const handleAddSection = (type) => {
    if (type === 'custom') {
      const title = prompt('Section title:');
      if (title) addCustomSection(title);
    } else {
      const existing = sections.find(s => s.section_type === type);
      if (existing) { toggleSection(type); toast.success(`${SECTION_LABELS[type]} section shown`); }
    }
    setShowAddSection(false);
  };

  const getResumeContext = () => {
    const personal = sections.find(s => s.section_type === 'personal_info')?.content;
    const skills = sections.find(s => s.section_type === 'skills')?.content;
    const allSkills = skills?.categories?.flatMap(c => c.skills || []).join(', ') || '';
    return { name: personal?.name, jobRole: personal?.title, skills: allSkills };
  };

  const ADDABLE_SECTIONS = ['projects', 'certifications', 'achievements', 'languages', 'interests', 'declaration', 'publications', 'volunteer', 'custom'];

  if (loading) {
    return (
      <div className="builder-loading">
        <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
        <p>Loading resume editor...</p>
      </div>
    );
  }

  return (
    <div className="builder-root">
      {/* ── Top Bar ── */}
      <header className="builder-topbar">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={15} /> Back
        </button>
        <div className="builder-title-wrap">
          <input className="builder-title-input" value={resumeTitle}
            onChange={e => setResumeTitle(e.target.value)}
            onBlur={handleTitleSave} />
          {isSaving && <span className="saving-indicator"><div className="spinner" style={{ width: 12, height: 12 }} /> Saving...</span>}
          {!isSaving && !isDirty && <span className="saved-indicator"><Check size={12} /> Saved</span>}
        </div>
        <div className="builder-topbar-actions">
          <button className="btn btn-secondary btn-sm" onClick={openTemplateSelection}>
            <LayoutTemplate size={14} /> Template
          </button>
          <div className="zoom-controls">
            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setPreviewScale(p => Math.max(0.4, p - 0.1))}><ZoomOut size={14} /></button>
            <span className="zoom-val">{Math.round(previewScale * 100)}%</span>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setPreviewScale(p => Math.min(1, p + 0.1))}><ZoomIn size={14} /></button>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={handleSave} disabled={isSaving}>
            <Save size={14} /> Save
          </button>
          <div className="download-group">
            <button className="btn btn-primary btn-sm" onClick={handleDownloadPDF} disabled={downloading}>
              <Download size={14} /> {downloading ? 'Exporting...' : 'Download PDF'}
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleDownloadDOCX} disabled={downloading}>
              <Download size={14} /> DOCX
            </button>
          </div>
        </div>
      </header>

      <div className={`builder-body ${showTemplateSelection ? 'template-browse-mode' : ''}`}>
        {/* ── Left Panel ── */}
        {!showTemplateSelection && <aside className={`builder-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <button className="sidebar-collapse-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          {!sidebarCollapsed && (
            <>
              {/* Panel Tabs */}
              <div className="builder-tabs">
                {[
                  { key: 'content', icon: <FileText size={14} />, label: 'Content' },
                  { key: 'sections', icon: <Layers size={14} />, label: 'Sections' },
                  { key: 'design', icon: <Palette size={14} />, label: 'Design' },
                ].map(tab => (
                  <button key={tab.key} className={`builder-tab ${activeTab === tab.key ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.key)}>
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {/* Content Tab */}
              {activeTab === 'content' && activeSection && (
                <div className="builder-editor-panel">
                  <div className="editor-section-header">
                    <span className="editor-section-icon">{SECTION_ICONS[activeSection.section_type] || '📌'}</span>
                    <h3>{activeSection.custom_title || SECTION_LABELS[activeSection.section_type] || 'Section'}</h3>
                    <div className="editor-section-navigation">
                      <span>{activeSectionIndex + 1} / {sections.length}</span>
                      <button
                        className="btn btn-ghost btn-icon btn-sm"
                        aria-label="Previous section"
                        title="Previous section"
                        disabled={activeSectionIndex <= 0}
                        onClick={() => setActiveSectionId(sections[activeSectionIndex - 1].id || sections[activeSectionIndex - 1].section_type)}
                      >
                        <ChevronLeft size={15} />
                      </button>
                      <button
                        className="btn btn-ghost btn-icon btn-sm"
                        aria-label="Next section"
                        title="Next section"
                        disabled={activeSectionIndex < 0 || activeSectionIndex >= sections.length - 1}
                        onClick={() => setActiveSectionId(sections[activeSectionIndex + 1].id || sections[activeSectionIndex + 1].section_type)}
                      >
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  </div>
                  <div className="editor-form">
                    <SectionEditor
                      section={activeSection}
                      onChange={handleSectionContentChange}
                      resumeContext={getResumeContext()}
                    />
                  </div>
                </div>
              )}

              {/* Sections Tab */}
              {activeTab === 'sections' && (
                <div className="builder-sections-panel">
                  <div className="sections-panel-header">
                    <span className="form-label">Drag to reorder</span>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowAddSection(!showAddSection)}>
                      <Plus size={13} /> Add
                    </button>
                  </div>

                  <AnimatePresence>
                    {showAddSection && (
                      <motion.div className="add-section-menu" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                        <div className="form-label" style={{ padding: '8px 12px 4px' }}>Add / Show Section</div>
                        {ADDABLE_SECTIONS.map(type => (
                          <button key={type} className="add-section-item" onClick={() => handleAddSection(type)}>
                            {SECTION_ICONS[type]} {SECTION_LABELS[type] || type}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={sections.map(s => s.id || s.section_type)} strategy={verticalListSortingStrategy}>
                      <div className="section-nav-list">
                        {sections.map(section => (
                          <SortableSectionItem
                            key={section.id || section.section_type}
                            section={section}
                            isActive={activeSection?.section_type === section.section_type}
                            onSelect={(section) => { setActiveSectionId(section.id || section.section_type); setActiveTab('content'); }}
                            onToggle={toggleSection}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              )}

              {/* Design Tab */}
              {activeTab === 'design' && (
                <div className="builder-design-panel">
                  <CustomizationPanel customization={customization} onChange={updateCustomization} />
                </div>
              )}
            </>
          )}
        </aside>}

        {/* ── Preview Panel ── */}
        <main className="builder-preview-area">
          <div className="preview-scroll-container">
            <div
              className="preview-wrapper"
              style={{
                transform: `scale(${previewScale})`,
                transformOrigin: 'top center',
                width: 794,
              }}
            >
              <ResumePreview sections={sections} customization={customization} />
            </div>
          </div>
        </main>
        {showTemplateSelection && (
          <TemplateSelectionPanel
            sections={sections}
            customization={customization}
            onSelect={handleTemplateSelect}
            onClose={closeTemplateSelection}
          />
        )}
      </div>
    </div>
  );
}
