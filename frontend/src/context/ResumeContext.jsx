import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { resumeAPI } from '../services/api';
import toast from 'react-hot-toast';

const ResumeContext = createContext(null);

export const DEFAULT_CUSTOMIZATION = {
  primaryColor: '#1a1a2e',
  accentColor: '#6c63ff',
  backgroundColor: '#ffffff',
  textColor: '#1a1a1a',
  font: 'Inter',
  fontSize: 10.5,
  lineHeight: 1.6,
  sectionSpacing: 16,
  templateSlug: 'modern-slate',
};

export const EMPTY_SECTIONS = [
  { id: 'personal_info', section_type: 'personal_info', is_visible: true, sort_order: 1, content: { name: '', email: '', phone: '', location: '', website: '', linkedin: '', github: '', title: '' } },
  { id: 'summary', section_type: 'summary', is_visible: true, sort_order: 2, content: { text: '' } },
  { id: 'experience', section_type: 'experience', is_visible: true, sort_order: 3, content: { items: [] } },
  { id: 'education', section_type: 'education', is_visible: true, sort_order: 4, content: { items: [] } },
  { id: 'skills', section_type: 'skills', is_visible: true, sort_order: 5, content: { categories: [{ name: 'Technical Skills', skills: [] }] } },
  { id: 'projects', section_type: 'projects', is_visible: false, sort_order: 6, content: { items: [] } },
  { id: 'certifications', section_type: 'certifications', is_visible: false, sort_order: 7, content: { items: [] } },
  { id: 'achievements', section_type: 'achievements', is_visible: false, sort_order: 8, content: { items: [] } },
  { id: 'languages', section_type: 'languages', is_visible: false, sort_order: 9, content: { items: [] } },
];

export function ResumeProvider({ children }) {
  const [currentResume, setCurrentResume] = useState(null);
  const [sections, setSections] = useState(EMPTY_SECTIONS);
  const [customization, setCustomization] = useState(DEFAULT_CUSTOMIZATION);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [resumeId, setResumeId] = useState(null);
  const saveTimerRef = useRef(null);
  const sectionsRef = useRef(sections);
  const customizationRef = useRef(customization);

  sectionsRef.current = sections;
  customizationRef.current = customization;

  const loadResume = useCallback(async (id) => {
    try {
      const { data } = await resumeAPI.getById(id);
      const resume = data.data.resume;
      setCurrentResume(resume);
      setResumeId(resume.uuid);
      setSections(resume.sections?.length ? resume.sections : EMPTY_SECTIONS);
      setCustomization({
        ...DEFAULT_CUSTOMIZATION,
        ...(resume.customization || {}),
        templateSlug: resume.customization?.templateSlug || resume.template_slug || DEFAULT_CUSTOMIZATION.templateSlug,
      });
      setIsDirty(false);
      return resume;
    } catch (error) {
      toast.error('Failed to load resume');
      throw error;
    }
  }, []);

  const updateSection = useCallback((sectionId, content) => {
    setSections(prev => prev.map(s =>
      (s.id === sectionId || s.section_type === sectionId) ? { ...s, content } : s
    ));
    setIsDirty(true);
  }, []);

  const updateCustomization = useCallback((updates) => {
    setCustomization(prev => ({ ...prev, ...updates }));
    setIsDirty(true);
  }, []);

  const reorderSections = useCallback((newOrder) => {
    setSections(newOrder.map((s, i) => ({ ...s, sort_order: i + 1 })));
    setCustomization(prev => ({ ...prev, customSectionOrder: true }));
    setIsDirty(true);
  }, []);

  const toggleSection = useCallback((sectionId) => {
    setSections(prev => prev.map(s =>
      s.section_type === sectionId ? { ...s, is_visible: !s.is_visible } : s
    ));
    setIsDirty(true);
  }, []);

  const addCustomSection = useCallback((title) => {
    const newSection = {
      id: `custom_${Date.now()}`,
      section_type: 'custom',
      custom_title: title,
      is_visible: true,
      sort_order: sections.length + 1,
      content: { items: [] },
    };
    setSections(prev => [...prev, newSection]);
    setIsDirty(true);
  }, [sections.length]);

  const applyAIContent = useCallback((aiContent, personalInfo = {}) => {
    const nextSections = sectionsRef.current.map(s => {
      if (s.section_type === 'personal_info') {
        return {
          ...s,
          is_visible: true,
          content: {
            ...s.content,
            ...(personalInfo.name ? { name: personalInfo.name } : {}),
            ...(personalInfo.title ? { title: personalInfo.title } : {}),
          },
        };
      }
      if (s.section_type === 'summary' && aiContent.summary) {
        return { ...s, is_visible: true, content: { text: aiContent.summary } };
      }
      if (s.section_type === 'skills' && aiContent.skills) {
        return { ...s, is_visible: true, content: aiContent.skills };
      }
      if (s.section_type === 'experience' && aiContent.experience?.length) {
        return { ...s, is_visible: true, content: { items: aiContent.experience } };
      }
      if (s.section_type === 'projects' && aiContent.projects?.length) {
        return { ...s, is_visible: true, content: { items: aiContent.projects } };
      }
      if (s.section_type === 'certifications' && aiContent.certifications?.length) {
        return { ...s, is_visible: true, content: { items: aiContent.certifications } };
      }
      return s;
    });
    sectionsRef.current = nextSections;
    setSections(nextSections);
    setIsDirty(true);
    return nextSections;
  }, []);

  const saveResume = useCallback(async (resumeUpdates = {}, sectionsToSave = sections) => {
    if (!resumeId) return false;
    setIsSaving(true);
    try {
      await resumeAPI.updateSections(resumeId, sectionsToSave);
      const updates = {
        customization,
        templateId: customization.templateSlug,
        ...resumeUpdates,
      };
      await resumeAPI.update(resumeId, updates);
      if (sectionsRef.current === sectionsToSave && customizationRef.current === customization) {
        setIsDirty(false);
      }
      return true;
    } catch (error) {
      console.error('Resume save failed:', error);
      toast.error(error.response?.data?.message || 'Resume save failed. Please try again.');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [resumeId, sections, customization]);

  useEffect(() => {
    if (!resumeId || !isDirty) return undefined;
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveResume(), 3000);
    return () => clearTimeout(saveTimerRef.current);
  }, [resumeId, isDirty, sections, customization, saveResume]);

  const resetResume = useCallback(() => {
    clearTimeout(saveTimerRef.current);
    setCurrentResume(null);
    setSections(EMPTY_SECTIONS);
    setCustomization(DEFAULT_CUSTOMIZATION);
    setResumeId(null);
    setIsDirty(false);
  }, []);

  return (
    <ResumeContext.Provider value={{
      currentResume, sections, customization, isSaving, isDirty, resumeId,
      loadResume, updateSection, updateCustomization, reorderSections,
      toggleSection, addCustomSection, applyAIContent, saveResume, resetResume,
      setResumeId, setSections, setCustomization,
    }}>
      {children}
    </ResumeContext.Provider>
  );
}

export const useResume = () => {
  const ctx = useContext(ResumeContext);
  if (!ctx) throw new Error('useResume must be used within ResumeProvider');
  return ctx;
};
