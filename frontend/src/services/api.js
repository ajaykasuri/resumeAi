import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// ── Request Interceptor: attach token ─────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response Interceptor: handle auth errors ──
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ════ Auth ════════════════════════════════════
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  guest: () => api.post('/auth/guest'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// ════ Resumes ════════════════════════════════
export const resumeAPI = {
  getAll: () => api.get('/resumes'),
  getById: (id) => api.get(`/resumes/${id}`),
  create: (data) => api.post('/resumes', data),
  update: (id, data) => api.put(`/resumes/${id}`, data),
  delete: (id) => api.delete(`/resumes/${id}`),
  duplicate: (id) => api.post(`/resumes/${id}/duplicate`),
  updateSections: (id, sections) => api.put(`/resumes/${id}/sections`, { sections }),
  getVersions: (id) => api.get(`/resumes/${id}/versions`),
  createVersion: (id, versionName) => api.post(`/resumes/${id}/versions`, { versionName }),
  restoreVersion: (id, versionId) => api.post(`/resumes/${id}/versions/${versionId}/restore`),
  getShared: (token) => api.get(`/resumes/shared/${token}`),
};

// ════ Templates ═══════════════════════════════
export const templateAPI = {
  getAll: (category) => api.get('/templates', { params: category ? { category } : {} }),
  getBySlug: (slug) => api.get(`/templates/${slug}`),
};

// ════ AI ══════════════════════════════════════
export const aiAPI = {
  generate: (data) => api.post('/ai/generate', data),
  improveSection: (data) => api.post('/ai/improve-section', data),
  atsScore: (data) => api.post('/ai/ats-score', data),
  generateSummary: (data) => api.post('/ai/generate-summary', data),
  rewriteBullet: (data) => api.post('/ai/rewrite-bullet', data),
};

// ════ Downloads ═══════════════════════════════
export const downloadAPI = {
  pdf: (id) => api.get(`/downloads/pdf/${id}`, { responseType: 'blob', timeout: 60000 }),
  previewPDF: (id) => api.get(`/downloads/pdf/${id}?preview=1`, { responseType: 'blob', timeout: 60000 }),
  trackPDF: (id, fileSizeBytes) => api.post(`/downloads/pdf/${id}/track`, { fileSizeBytes }),
  docx: (id) => api.get(`/downloads/docx/${id}`, { responseType: 'blob', timeout: 60000 }),
};

// ════ Analytics ═══════════════════════════════
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
};

export default api;
