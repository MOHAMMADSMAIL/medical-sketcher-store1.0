'use client';
import { useEffect, useState } from 'react';
import { useOwnerAuth } from '@/lib/hooks/useOwnerAuth';
import { OwnerLayout } from '@/components/owner/OwnerLayout';
import { ownerAPI } from '@/lib/api/owner-client';
import styles from './Settings.module.css';

export default function SettingsPage() {
  const { isLoading: authLoading, isOwner, user } = useOwnerAuth();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await ownerAPI.getSettings();
      setSettings(data || {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOwner) return;
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner]);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddKey = () => {
    if (!newKey.trim()) return;
    setSettings((prev) => ({ ...prev, [newKey.trim()]: newValue }));
    setNewKey('');
    setNewValue('');
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      await ownerAPI.updateSettings(settings);
      setSuccess('Settings saved');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) return <div className={styles.loading}>Loading…</div>;
  if (!isOwner) return <div className={styles.loading}>Unauthorized</div>;

  return (
    <OwnerLayout user={user}>
      <div className={styles.container}>
        <h1>Site Settings</h1>

        {error && <div className={styles.errorBanner} role="alert">{error}</div>}
        {success && <div className={styles.successBanner}>{success}</div>}

        {loading ? (
          <div className={styles.loading}>Loading settings...</div>
        ) : (
          <div className={styles.panel}>
            {Object.keys(settings).length === 0 ? (
              <div className={styles.empty}>No settings yet — add one below</div>
            ) : (
              Object.entries(settings).map(([key, value]) => (
                <div key={key} className={styles.row}>
                  <label className={styles.key}>{key}</label>
                  <input
                    type="text"
                    value={value ?? ''}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className={styles.value}
                  />
                </div>
              ))
            )}

            <div className={styles.addRow}>
              <input
                type="text"
                placeholder="New key"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                className={styles.keyInput}
              />
              <input
                type="text"
                placeholder="Value"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className={styles.value}
              />
              <button className={styles.addBtn} onClick={handleAddKey}>+ Add</button>
            </div>

            <button className={styles.saveButton} disabled={saving} onClick={handleSave}>
              {saving ? 'Saving…' : 'Save Settings'}
            </button>
          </div>
        )}
      </div>
    </OwnerLayout>
  );
}
