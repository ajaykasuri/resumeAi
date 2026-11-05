import React from 'react';
import ClassicTemplate from './templates/ClassicTemplate';
import SidebarTemplate from './templates/SidebarTemplate';
import MinimalTemplate from './templates/MinimalTemplate';
import GridTemplate from './templates/GridTemplate';
import TechTemplate from './templates/TechTemplate';
import CreativeTemplate from './templates/CreativeTemplate';
import ExecutiveTemplate from './templates/ExecutiveTemplate';
import FreshGraduateTemplate from './templates/FreshGraduateTemplate';

const TEMPLATE_MAP = {
  'executive-pro': ClassicTemplate,
  'modern-slate': SidebarTemplate,
  'minimal-edge': MinimalTemplate,
  'corporate-blue': GridTemplate,
  'tech-resume': TechTemplate,
  'creative-canvas': CreativeTemplate,
  'elegant-serif': ExecutiveTemplate,
  'fresh-graduate': FreshGraduateTemplate,
};

export default function ResumePreviewRouter({ sections = [], customization = {}, templateSlug = 'executive-pro' }) {
  const TemplateComponent = TEMPLATE_MAP[templateSlug] || ClassicTemplate;
  
  return (
    <TemplateComponent 
      sections={sections} 
      customization={customization}
    />
  );
}
