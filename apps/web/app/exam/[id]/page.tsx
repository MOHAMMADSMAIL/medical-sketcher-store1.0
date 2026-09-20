'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_URL, api } from '@/lib/api';
import StoreChrome from '@/components/store/StoreChrome';

type Question = { id: string; prompt: string; options?: string[] };
type Exam = {
  id: string; title: string; skill: string | null; level: string | null; language: string;
  passScore: number; questions: Question[];
  audioMedia: { id: string; url: string; mimeType: string } | null;
  sourceProduct: { id: string; title: string; slug: string } | null;
};
type Result = { score: number; passed: boolean; correct: number; total: number; passScore: number };

export default function ExamPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [exam, setExam] = useState<Exam | null>(null);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/exams/${params.id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Exam not found or not published yet'))))
      .then(setExam)
      .catch((e) => setError(e.message));
  }, [params.id]);

  const submit = async () => {
    try {
      setSubmitting(true); setError('');
      const result = await api<Result>(`/exams/${exam!.id}/attempts`, {
        method: 'POST',
        body: JSON.stringify({ answers: Object.entries(answers).map(([id, answer]) => ({ id, answer })) }),
      });
      setResult(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit');
    } finally { setSubmitting(false); }
  };

  return (
    <StoreChrome>
      <main className="mx-auto min-h-screen max-w-[760px] px-5 pb-24 pt-10">
        {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">{error}</div>}
        {!exam && !error && <p className="text-[#67705f]">Loading exam…</p>}
        {exam && (
          <>
            <p className="text-[11px] uppercase tracking-widest text-[#9b7335]">{exam.skill || 'Practice'} exam{exam.level ? ` · ${exam.level}` : ''} · {exam.language}</p>
            <h1 className="serif mt-2 text-4xl">{exam.title}</h1>
            {exam.sourceProduct && <p className="mt-2 text-sm text-[#67705f]">Built from: <Link className="underline" href={`/shop/${exam.sourceProduct.slug}`}>{exam.sourceProduct.title}</Link></p>}

            {exam.audioMedia && (
              <audio controls className="mt-6 w-full" src={`${API_URL}${exam.audioMedia.url}`} />
            )}

            {result ? (
              <div className={`mt-8 rounded-2xl border p-6 ${result.passed ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
                <h2 className="serif text-2xl">{result.passed ? 'Passed 🎉' : 'Not passed yet'}</h2>
                <p className="mt-2">Score: <b>{result.score}%</b> ({result.correct}/{result.total}) · pass mark {result.passScore}%</p>
                <button onClick={() => { setResult(null); setAnswers({}); }} className="mt-4 rounded-xl bg-[#2d3829] px-5 py-2.5 text-sm font-semibold text-white">Retry</button>
              </div>
            ) : (
              <>
                <div className="mt-8 grid gap-5">
                  {(exam.questions || []).map((q, i) => (
                    <fieldset key={q.id} className="rounded-2xl border border-[#566149]/15 bg-white/60 p-5">
                      <legend className="px-2 text-sm font-semibold text-[#45523b]">Q{i + 1}</legend>
                      <p className="font-medium">{q.prompt}</p>
                      <div className="mt-3 grid gap-2">
                        {(q.options || []).map((opt) => (
                          <label key={opt} className="flex cursor-pointer items-center gap-2 rounded-xl border border-transparent px-3 py-2 hover:bg-[#e6e8d9]">
                            <input type="radio" name={q.id} value={opt} checked={answers[q.id] === opt} onChange={() => setAnswers((a) => ({ ...a, [q.id]: opt }))} />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  ))}
                  {!exam.questions?.length && <p className="text-[#67705f]">This exam has no questions yet — content is being prepared from the source book.</p>}
                </div>
                {!!exam.questions?.length && (
                  <button disabled={submitting} onClick={submit} className="mt-8 w-full rounded-xl bg-[#2d3829] py-3 text-sm font-semibold text-white hover:bg-[#536044] disabled:opacity-60">
                    {submitting ? 'Submitting…' : 'Submit answers'}
                  </button>
                )}
                <p className="mt-3 text-xs text-[#9b7335]">Sign in as a customer to record your score{exam.passScore ? ` (pass mark ${exam.passScore}%)` : ''}.</p>
              </>
            )}
          </>
        )}
      </main>
    </StoreChrome>
  );
}
