'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api';
import StoreChrome from '@/components/store/StoreChrome';

const SKILL_TITLES: Record<string, string> = {
  LISTENING: 'Listening', READING: 'Reading', SPEAKING: 'Speaking',
};

/** Section entry: shows the exam bound to this home-section skill (if published). */
export default function SectionExamPage() {
  const params = useParams<{ skill: string }>();
  const router = useRouter();
  const skill = (params.skill || '').toUpperCase();
  const [exams, setExams] = useState<any[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/api/exams?skill=${encodeURIComponent(skill)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Could not load the exam for this section'))))
      .then(setExams)
      .catch((e) => setError(e.message));
  }, [skill]);

  return (
    <StoreChrome>
      <main className="mx-auto min-h-screen max-w-[760px] px-5 pb-24 pt-10">
        <p className="text-[11px] uppercase tracking-widest text-[#9b7335]">Section exam</p>
        <h1 className="serif mt-2 text-4xl">{SKILL_TITLES[skill] || skill}</h1>
        {error && <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">{error}</div>}
        {exams && exams.length === 0 && (
          <p className="mt-6 text-[#67705f]">The {SKILL_TITLES[skill] || skill} exam is being prepared — check back soon.</p>
        )}
        <div className="mt-8 grid gap-4">
          {(exams || []).map((exam) => (
            <button key={exam.id} onClick={() => router.push(`/exam/${exam.id}`)}
              className="rounded-2xl border border-[#566149]/15 bg-white/60 p-6 text-left transition hover:-translate-y-1 hover:bg-[#e6e8d9]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="serif text-2xl">Start the exam →</h2>
                  <p className="mt-1 text-sm text-[#67705f]">
                    {exam.title}{exam.level ? ` · ${exam.level}` : ''} · {exam.language}
                    {exam.sourceProduct?.title ? ` · from "${exam.sourceProduct.title}"` : ''}
                  </p>
                </div>
                <span className="rounded-full bg-[#d9dcc7] px-4 py-2 text-sm font-semibold text-[#45523b]">ابدأ الامتحان</span>
              </div>
            </button>
          ))}
        </div>
      </main>
    </StoreChrome>
  );
}
