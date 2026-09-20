'use client';
import { useCallback, useEffect, useState } from 'react';
import { useOwnerAuth } from '@/lib/hooks/useOwnerAuth';
import { OwnerLayout } from '@/components/owner/OwnerLayout';
import { ownerAPI } from '@/lib/api/owner-client';
import { API_URL } from '@/lib/api';

const SKILLS = ['LISTENING', 'READING', 'SPEAKING'] as const;
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

type Exam = {
  id: string; title: string; slug: string; skill: string | null; level: string | null;
  language: string; passScore: number; status: string;
  sourceProductId: string | null; audioMediaId: string | null;
  sourceProduct?: { title: string; slug: string } | null;
  _count?: { attempts: number };
};

const emptyForm = { title: '', skill: 'LISTENING', level: 'A1', language: 'de', passScore: '70', sourceProductId: '', audioMediaId: '', questions: '[]' };

async function withCsrf(): Promise<Record<string, string>> {
  let token = document.cookie.split('; ').find((v) => v.startsWith('aurelia_csrf='))?.split('=')[1];
  if (!token) { await fetch(`${API_URL}/api/auth/csrf`, { credentials: 'include' }); token = document.cookie.split('; ').find((v) => v.startsWith('aurelia_csrf='))?.split('=')[1]; }
  return token ? { 'X-CSRF-Token': token } : {};
}

export default function ExamsPage() {
  const { isLoading: authLoading, isOwner, user } = useOwnerAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [products, setProducts] = useState<{ id: string; title: string }[]>([]);
  const [media, setMedia] = useState<{ id: string; label: string }[]>([]);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [examsRes, booksRes, mediaRes] = await Promise.all([
        fetch(`${API_URL}/api/exams/admin/list`, { credentials: 'include' }).then((r) => (r.ok ? r.json() : [])),
        ownerAPI.getBooks(1, 100).catch(() => ({ items: [] })),
        ownerAPI.getMedia(1, 50).catch(() => ({ items: [] })),
      ]);
      setExams(Array.isArray(examsRes) ? examsRes : []);
      setProducts((booksRes.items || []).map((b: any) => ({ id: b.id, title: b.title })));
      setMedia((mediaRes.items || []).map((m: any) => ({ id: m.id, label: `${m.originalName || m.type || 'file'} (${m.mimeType})` })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load exams');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (isOwner) void load(); }, [isOwner, load]);

  const save = async () => {
    try {
      setError('');
      const payload: Record<string, unknown> = {
        title: form.title, skill: form.skill, level: form.level, language: form.language,
        passScore: Number(form.passScore) || 70,
        sourceProductId: form.sourceProductId || null,
        audioMediaId: form.audioMediaId || null,
      };
      try { payload.questions = JSON.parse(form.questions || '[]'); } catch { setError('Questions must be valid JSON'); return; }
      const res = await fetch(`${API_URL}/api/exams/admin${editingId ? `/${editingId}` : ''}`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', ...(await withCsrf()) }, body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Save failed');
      setForm(emptyForm); setEditingId(null); setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  };

  const toggleStatus = async (exam: Exam) => {
    await fetch(`${API_URL}/api/exams/admin/${exam.id}`, {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', ...(await withCsrf()) },
      body: JSON.stringify({ status: exam.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' }),
    });
    load();
  };

  const startEdit = (exam: Exam) => {
    setEditingId(exam.id);
    setForm({
      title: exam.title, skill: exam.skill || 'LISTENING', level: exam.level || 'A1', language: exam.language,
      passScore: String(exam.passScore), sourceProductId: exam.sourceProductId || '', audioMediaId: exam.audioMediaId || '',
      questions: JSON.stringify((exam as any).questions || [], null, 2),
    });
    setShowForm(true);
  };

  if (authLoading) return <div style={{ padding: 40 }}>Loading…</div>;
  if (!isOwner) return <div style={{ padding: 40 }}>Unauthorized</div>;

  const set = (key: keyof typeof emptyForm) => (e: any) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <OwnerLayout user={user}>
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Exams — Listening / Reading / Speaking</h1>
          <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(emptyForm); }} style={btnPrimary}>
            {showForm ? '✕ Cancel' : '+ New exam'}
          </button>
        </div>

        {error && <div role="alert" style={{ color: '#b91c1c', margin: '12px 0' }}>{error}</div>}

        {showForm && (
          <div style={{ ...panel, marginTop: 16 }}>
            <div style={grid2}>
              <label style={label}>Title *<input style={input} value={form.title} onChange={set('title')} /></label>
              <label style={label}>Home section (skill) *
                <select style={input} value={form.skill} onChange={set('skill')}>
                  {SKILLS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label style={label}>CEFR level
                <select style={input} value={form.level} onChange={set('level')}>
                  {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </label>
              <label style={label}>Content language
                <select style={input} value={form.language} onChange={set('language')}>
                  <option value="de">Deutsch (de)</option>
                  <option value="ar">العربية (ar)</option>
                  <option value="en">English (en)</option>
                </select>
              </label>
              <label style={label}>Source book (exam content is built from it)
                <select style={input} value={form.sourceProductId} onChange={set('sourceProductId')}>
                  <option value="">— none yet —</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </label>
              <label style={label}>Pass score (%)<input style={input} type="number" min="0" max="100" value={form.passScore} onChange={set('passScore')} /></label>
              <label style={label}>Audio file (for Listening — upload from Media first)
                <select style={input} value={form.audioMediaId} onChange={set('audioMediaId')}>
                  <option value="">— none —</option>
                  {media.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
              </label>
            </div>
            <label style={{ ...label, marginTop: 10 }}>
              Questions (JSON — built later from the source book)
              <textarea style={{ ...input, minHeight: 120, fontFamily: 'monospace' }} value={form.questions} onChange={set('questions')} />
            </label>
            <p style={{ fontSize: 12, color: '#67705f', margin: '6px 0 12px' }}>
              Question shape: {'[{"id":"q1","prompt":"…","options":["a","b","c"],"answer":"a"}]'} — the answer key never reaches the browser.
            </p>
            <button style={btnPrimary} onClick={save}>{editingId ? 'Save changes' : 'Create exam'}</button>
          </div>
        )}

        <div style={{ ...panel, marginTop: 18 }}>
          {loading ? <p>Loading…</p> : exams.length === 0 ? (
            <p style={{ color: '#67705f' }}>No exams yet. Create one and bind it to a home section — content comes later from the source book.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ textAlign: 'left', borderBottom: '1px solid #e3e5d8' }}>
                <th style={th}>Title</th><th style={th}>Section</th><th style={th}>Level</th><th style={th}>Source book</th><th style={th}>Attempts</th><th style={th}>Status</th><th style={th}>Actions</th>
              </tr></thead>
              <tbody>
                {exams.map((exam) => (
                  <tr key={exam.id} style={{ borderBottom: '1px solid #eef0e5' }}>
                    <td style={td}>{exam.title}</td>
                    <td style={td}>{exam.skill || '—'}</td>
                    <td style={td}>{exam.level || '—'}</td>
                    <td style={td}>{exam.sourceProduct?.title || '—'}</td>
                    <td style={td}>{exam._count?.attempts ?? 0}</td>
                    <td style={td}><span style={{ fontWeight: 700, color: exam.status === 'PUBLISHED' ? '#3f6212' : '#92400e' }}>{exam.status}</span></td>
                    <td style={td}>
                      <button onClick={() => startEdit(exam)} style={btnGhost}>Edit</button>{' '}
                      <button onClick={() => toggleStatus(exam)} style={btnGhost}>{exam.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </OwnerLayout>
  );
}

const btnPrimary = { cursor: 'pointer', background: '#2d3829', color: '#fff', border: 'none', borderRadius: 999, padding: '10px 20px', fontWeight: 600 } as const;
const btnGhost = { cursor: 'pointer', background: 'transparent', border: '1px solid rgba(83,96,68,.35)', borderRadius: 999, padding: '6px 14px', marginRight: 6 } as const;
const panel = { background: '#fffa', border: '1px solid rgba(83,96,68,.18)', borderRadius: 16, padding: 18 } as const;
const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 } as const;
const label = { display: 'grid', gap: 4, fontSize: 13, fontWeight: 600 } as const;
const input = { padding: '9px 11px', borderRadius: 8, border: '1px solid rgba(83,96,68,.25)', background: '#fff', fontWeight: 400 } as const;
const th = { padding: '8px 6px', fontSize: 12, color: '#58684a' } as const;
const td = { padding: '8px 6px', fontSize: 14 } as const;
