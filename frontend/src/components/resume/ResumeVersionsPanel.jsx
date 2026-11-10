import React, { useCallback, useEffect, useState } from 'react';
import { Clock3, RotateCcw, Save } from 'lucide-react';
import { resumeAPI } from '../../services/api';
import toast from 'react-hot-toast';
import './ResumeVersionsPanel.css';

export default function ResumeVersionsPanel({ resumeId, onSaveCurrent, onRestore }) {
  const [versions, setVersions] = useState([]);
  const [versionName, setVersionName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restoringId, setRestoringId] = useState(null);

  const loadVersions = useCallback(async () => {
    if (!resumeId) {
      setVersions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await resumeAPI.getVersions(resumeId);
      setVersions(data.data.versions || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load version history.');
    } finally {
      setLoading(false);
    }
  }, [resumeId]);

  useEffect(() => { loadVersions(); }, [loadVersions]);

  const createVersion = async event => {
    event.preventDefault();
    const name = versionName.trim();
    if (!name) return;
    setSaving(true);
    try {
      if (!await onSaveCurrent()) return;
      await resumeAPI.createVersion(resumeId, name);
      setVersionName('');
      await loadVersions();
      toast.success('Version saved.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save this version.');
    } finally {
      setSaving(false);
    }
  };

  const restore = async version => {
    if (!window.confirm(`Restore "${version.version_name}"? Your current resume will be replaced.`)) return;
    setRestoringId(version.id);
    try {
      await resumeAPI.restoreVersion(resumeId, version.id);
      await onRestore();
      await loadVersions();
      toast.success('Resume version restored.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to restore this version.');
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="resume-versions-panel">
      <div className="resume-versions-intro">
        <Clock3 size={17} />
        <div>
          <strong>Version history</strong>
          <p>Save named snapshots before making changes. Restore any saved version later.</p>
        </div>
      </div>

      <form className="resume-version-form" onSubmit={createVersion}>
        <label htmlFor="resume-version-name">Save current resume</label>
        <div className="resume-version-form-row">
          <input
            id="resume-version-name"
            className="form-input"
            value={versionName}
            onChange={event => setVersionName(event.target.value)}
            maxLength={120}
            placeholder="e.g. Product Designer application"
            disabled={!resumeId || saving}
          />
          <button type="submit" className="btn btn-primary btn-sm" disabled={!resumeId || !versionName.trim() || saving}>
            <Save size={13} /> {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
        {!resumeId && <span className="resume-version-hint">Save this resume once to enable version history.</span>}
      </form>

      <div className="resume-version-list">
        <h3>Saved versions</h3>
        {loading ? <p className="resume-version-empty">Loading versions...</p> :
          versions.length === 0 ? <p className="resume-version-empty">No saved versions yet.</p> :
            versions.map(version => (
              <div className="resume-version-item" key={version.id}>
                <div>
                  <strong>{version.version_name}</strong>
                  <time>{new Date(version.created_at).toLocaleString()}</time>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => restore(version)}
                  disabled={restoringId !== null}
                >
                  <RotateCcw size={13} /> {restoringId === version.id ? 'Restoring...' : 'Restore'}
                </button>
              </div>
            ))
        }
      </div>
    </div>
  );
}
