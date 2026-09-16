'use client';
import { useEffect, useState } from 'react';
import { useOwnerAuth } from '@/lib/hooks/useOwnerAuth';
import { OwnerLayout } from '@/components/owner/OwnerLayout';
import { ownerAPI } from '@/lib/api/owner-client';
import styles from './Cms.module.css';

const PAGE_TYPES = ['home', 'about', 'legal', 'faq'];
const LANGUAGES = ['en', 'ar', 'de'];

export default function CMSPage() {
  const { isLoading: authLoading, isOwner, user } = useOwnerAuth();
  const [pageType, setPageType] = useState('home');
  const [language, setLanguage] = useState('en');
  const [page, setPage] = useState<any>(null);
  const [contentJson, setContentJson] = useState('{}');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchPage = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const data = await ownerAPI.getCMSContent(pageType, language);
      setPage(data);
      const sectionsObj: Record<string, any> = {};
      (data?.sections || []).forEach((s: any) => { sectionsObj[s.type] = s.content; });
      setContentJson(JSON.stringify(sectionsObj, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load page');
      setPage(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOwner) return;
    fetchPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner, pageType, language]);

  const handleSave = async () => {
    if (!page?.id) return;
    try {
      setSaving(true);
      setError('');
      const parsed = JSON.parse(contentJson);
      await ownerAPI.updateCMSContent(page.id, parsed);
      setSuccess('Saved successfully');
      fetchPage();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON or save failed');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!page?.id) return;
    try {
      await ownerAPI.publishCMS(page.id);
      setSuccess('Published successfully');
      fetchPage();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish');
    }
  };

  if (authLoading) return <div className={styles.loading}>Loading…</div>;
  if (!isOwner) return <div className={styles.loading}>Unauthorized</div>;

  return (
    <OwnerLayout user={user}>
      <div className={styles.container}>
        <h1>CMS Content</h1>

        <div className={styles.toolbar}>
          <select value={pageType} onChange={(e) => setPageType(e.target.value)} className={styles.select}>
            {PAGE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className={styles.select}>
            {LANGUAGES.map((l) => <option key={l} value={l}>{l.toUpperCase()}</option>)}
          </select>
          {page && (
            <span className={`${styles.badge} ${styles[(page.status || 'draft').toLowerCase()]}`}>
              {page.status}
            </span>
          )}
        </div>

        {error && <div className={styles.errorBanner} role="alert">{error}</div>}
        {success && <div className={styles.successBanner}>{success}</div>}

        {loading ? (
          <div className={styles.loading}>Loading content...</div>
        ) : !page ? (
          <div className={styles.empty}>No page found for "{pageType}" / "{language}"</div>
        ) : (
          <div className={styles.editor}>
            <textarea
              value={contentJson}
              onChange={(e) => setContentJson(e.target.value)}
              className={styles.textarea}
              spellCheck={false}
            />
            <div className={styles.editorActions}>
              <button className={styles.saveButton} disabled={saving} onClick={handleSave}>
                {saving ? 'Saving…' : 'Save Content'}
              </button>
              <button className={styles.publishButton} onClick={handlePublish}>
                Publish
              </button>
            </div>
          </div>
        )}
      </div>
    </OwnerLayout>
  );
}
