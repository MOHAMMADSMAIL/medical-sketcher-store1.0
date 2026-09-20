'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ImageWithFallback from '@/components/figma/ImageWithFallback';
import StoreChrome from '@/components/store/StoreChrome';
import BookCard, { type Book } from '@/components/store/BookCard';
import { api } from '@/lib/api';
import { tr } from '@/lib/i18n';
import { useStore } from '@/components/store/StoreProvider';

const hero = '/theme/Duck-ai-image-2026-09-15-22-08__5_.jpeg';
const study = '/theme/medical-sketcher-study-scene.jpg';
const reader = '/theme/Duck-ai-image-2026-09-15-22-08__3_.jpeg';
const skills = [['◖', 'Listening', 'Audio lessons & transcripts', 'LISTENING'], ['▤', 'Reading', 'Passages & comprehension', 'READING'], ['◌', 'Speaking', 'Guided speaking practice', 'SPEAKING'], ['✎', 'Writing', 'Prompts & corrections', null]] as const;

export default function HomeView({ products }: { products: Book[] }) {
  const { lang, t, toast, addToCart } = useStore();
  const [level, setLevel] = useState('A1');
  const [faq, setFaq] = useState<number | null>(null);
  const [scene, setScene] = useState(0);
  const [hoverScene, setHoverScene] = useState<number | null>(null);

  useEffect(() => {
    const updateScene = () => {
      const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      setScene(Math.min(4, Math.floor((window.scrollY / max) * 5)));
    };
    updateScene();
    window.addEventListener('scroll', updateScene, { passive: true });
    return () => window.removeEventListener('scroll', updateScene);
  }, []);

  const pathways = [
    ['01', 'Foundation', 'A1 / A2', 'First introductions, everyday care and confident basics.'],
    ['02', 'Confidence', 'B1 / B2', 'Ward routines, handovers and clearer conversations.'],
    ['03', 'Precision', 'C1 / C2', 'Clinical documentation and advanced care communication.'],
  ];
  const shownScene = hoverScene ?? scene;

  return (
    <StoreChrome scene={shownScene}>
      <main id="top">
        <section className="mx-auto max-w-[1360px] px-5 pt-10 lg:px-10">
          <div className="rounded-[2.5rem] border border-white/70 bg-[#f7f5ed]/62 p-7 shadow-[0_18px_70px_rgba(42,48,30,.08)] backdrop-blur-xl lg:p-10">
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.2em] text-[#737d63]">Four ways to practise</p>
                <h2 className="serif mt-3 text-4xl lg:text-5xl">Your language studio.</h2>
              </div>
              <p className="max-w-sm text-sm leading-6 text-[#66705d]">{t.skillsIntro}</p>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {skills.map(([icon, title, description, skillKey]) => (
                skillKey ? (
                  <Link key={title} href={`/exams/${skillKey}`} className="group rounded-[1.5rem] border border-[#566149]/12 bg-white/55 p-5 text-left transition hover:-translate-y-1 hover:bg-[#e6e8d9]">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#d9dcc7] text-xl text-[#45523b]">{icon}</span>
                    <h3 className="serif mt-10 text-2xl">{title}</h3>
                    <p className="mt-2 text-sm text-[#67705f]">{description}</p>
                    <span className="mt-6 block text-sm font-semibold text-[#58684a]">{tr(lang, 'Start the exam', 'ابدأ الامتحان', 'Test starten')} ↗</span>
                  </Link>
                ) : (
                  <button key={title} onClick={() => toast(tr(lang, `${title} practice is being prepared.`, `${title} — التدريب قيد التحضير.`, `${title} – die Übungen entstehen gerade.`))} className="group rounded-[1.5rem] border border-[#566149]/12 bg-white/55 p-5 text-left transition hover:-translate-y-1 hover:bg-[#e6e8d9]">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#d9dcc7] text-xl text-[#45523b]">{icon}</span>
                    <h3 className="serif mt-10 text-2xl">{title}</h3>
                    <p className="mt-2 text-sm text-[#67705f]">{description}</p>
                    <span className="mt-6 block text-sm font-semibold text-[#58684a]">{t.exploreMore} ↗</span>
                  </button>
                )
              ))}
            </div>
          </div>
        </section>

        <section className="relative mx-auto grid min-h-[670px] max-w-[1440px] overflow-hidden px-5 pb-16 pt-16 lg:grid-cols-[.93fr_1.07fr] lg:px-10 lg:pt-24">
          <div className="hero-copy relative z-10 flex flex-col justify-center">
            <p className="mb-6 text-xs font-bold uppercase tracking-[.22em] text-[#667054]">{t.eyebrow}</p>
            <h1 className="serif max-w-xl text-5xl leading-[.98] sm:text-6xl lg:text-8xl">{t.title}</h1>
            <p className="mt-7 max-w-md text-base leading-7 text-[#515a4d]">{t.text}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/shop" className="rounded-full bg-[#283224] px-6 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5">{t.explore} <span className="ml-2">↗</span></Link>
              <a href="#learn" className="rounded-full border border-[#2c3325]/20 bg-white/50 px-6 py-3.5 text-sm font-semibold">{t.start}</a>
            </div>
            <div className="mt-14 flex gap-8 border-t border-[#2c3325]/12 pt-5 text-xs text-[#68705f]">
              <span><b className="block text-lg text-[#273024]">∞</b>{t.statInstant}</span>
              <span><b className="block text-lg text-[#273024]">3</b>{t.statLangs}</span>
              <span><b className="block text-lg text-[#273024]">4.9/5</b>{t.statLove}</span>
            </div>
          </div>
          <div className="relative mt-10 min-h-[410px] lg:mt-0">
            <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-br from-[#d6d2bb] via-[#ede7d6] to-[#bec49f]" />
            <div className="absolute inset-0 opacity-30 grain" />
            <ImageWithFallback src={hero} alt="Medical Sketcher character standing beside a stack of books" className="drift absolute bottom-[-6%] right-[-9%] h-[113%] w-[115%] object-cover object-center mix-blend-multiply" />
            <div className="absolute bottom-7 left-5 max-w-[210px] rounded-[1.35rem] border border-white/70 bg-white/55 p-4 shadow-xl backdrop-blur-md">
              <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#68705f]">{t.promptLabel}</p>
              <p className="serif mt-2 text-lg leading-5">{t.promptText}</p>
            </div>
            <a target="_blank" rel="noreferrer" href="https://www.instagram.com/medical.sketcher" className="instagram-app absolute left-[42%] top-[38%] z-10 grid place-items-center text-center transition hover:-translate-y-1">
              <span className="text-lg leading-none">◎</span><b className="mt-1 block text-[10px]">Instagram</b>
              <span className="mt-1 rounded-full bg-white/80 px-2 py-0.5 text-[9px] font-bold text-[#49573d]">Follow</span>
            </a>
            <div className="absolute right-6 top-7 rotate-[-4deg] rounded-2xl border border-white/70 bg-[#364033] px-4 py-3 text-xs text-white shadow-xl">{t.growNote}</div>
          </div>
        </section>

        <section id="collection" className="border-y border-white/40 bg-[#e8e5d9]/65 px-5 py-20 backdrop-blur-xl lg:px-10">
          <div className="mx-auto max-w-[1360px]">
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.2em] text-[#777c60]">{tr(lang, 'The bookshelf', 'رفّ الكتب', 'Das Bücherregal')}</p>
                <h2 className="serif mt-3 text-4xl lg:text-5xl">{t.featured}</h2>
                <p className="mt-3 text-[#5d6458]">{t.featText}</p>
              </div>
              <Link href="/shop" className="rounded-full border border-[#2c3325]/15 bg-white/50 px-5 py-3 text-sm">{t.view} ↗</Link>
            </div>
            <div className="mt-11 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((book, index) => <BookCard key={book.id} book={book} index={index} onHover={setHoverScene} />)}
            </div>
          </div>
        </section>

        <section id="learn" className="mx-auto grid max-w-[1360px] gap-10 px-5 py-24 lg:grid-cols-[.78fr_1.22fr] lg:px-10">
          <div className="relative min-h-[420px] overflow-hidden rounded-[2.5rem] bg-[#d9d3bb]">
            <ImageWithFallback src={study} alt="Medical Sketcher reading a book" className="absolute inset-0 h-full w-full object-cover mix-blend-multiply" />
            <div className="absolute bottom-5 left-5 rounded-2xl bg-[#f8f5ec]/85 p-4 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-wider text-[#6d745e]">Daily practice</p>
              <p className="serif text-xl">A language is a place<br />you can enter.</p>
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-[#777c60]">Deutsch, made human</p>
            <h2 className="serif mt-4 text-4xl leading-tight lg:text-6xl">A slower, warmer way to learn German.</h2>
            <p className="mt-5 max-w-xl leading-7 text-[#5b6255]">From first conversations to clinical confidence, our study materials are designed to be opened, marked, and used in real life.</p>
            <div className="mt-8 flex flex-wrap gap-2">
              {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((item) => (
                <Link href={`/shop?level=${item}`} onClick={() => setLevel(item)} key={item} className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${level === item ? 'bg-[#536044] text-white' : 'border border-[#536044]/20 bg-white/50 text-[#536044]'}`}>{item}</Link>
              ))}
            </div>
            <div className="mt-8 flex items-center gap-4 rounded-2xl border border-[#b18a48]/20 bg-[#f4eddb] p-4">
              <span className="text-2xl">✦</span>
              <p className="text-sm"><b>{level} collection</b><br /><span className="text-[#68705f]">Vocabulary · grammar · reading practice</span></p>
              <Link href={`/shop?level=${level}`} className="ml-auto rounded-full bg-[#b18a48] px-4 py-2 text-sm text-white">Browse</Link>
            </div>
          </div>
        </section>

        <section className="bg-[#283224] px-5 py-20 text-[#f6f2e6] lg:px-10">
          <div className="mx-auto max-w-[1360px]">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-[#c9cda9]">01 — Pathway</p>
            <h2 className="serif mt-4 max-w-xl text-4xl lg:text-6xl">{t.categories}</h2>
            <p className="mt-4 max-w-2xl leading-7 text-[#cbd0bc]">Build practical German in three calm stages — from first introductions to precise clinical communication.</p>
            <div className="mt-12 grid overflow-hidden rounded-[2rem] border border-white/15 md:grid-cols-3">
              {pathways.map(([number, title, range, text]) => (
                <article key={title} className="group min-h-64 border-b border-white/15 p-7 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
                  <span className="text-xs font-bold tracking-[.18em] text-[#c8d5a9]">{number}</span>
                  <p className="serif mt-10 text-3xl">{title}</p>
                  <p className="mt-2 text-sm font-semibold text-[#c9b379]">{range}</p>
                  <p className="mt-5 max-w-xs text-sm leading-6 text-[#cbd0bc]">{text}</p>
                  <Link href={`/shop?level=${range.slice(0, 2)}`} className="mt-6 inline-block text-sm font-semibold transition group-hover:text-[#d6bd7f]">Start assessment ↗</Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1360px] gap-8 px-5 py-24 lg:grid-cols-[.86fr_1.14fr] lg:px-10">
          <div className="rounded-[2.5rem] border border-white/65 bg-[#f7f5ed]/60 p-7 shadow-[0_18px_70px_rgba(42,48,30,.08)] backdrop-blur-xl lg:p-10">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-[#777c60]">02 — The method</p>
            <h2 className="serif mt-4 text-4xl leading-tight">Visual + practical.</h2>
            <p className="mt-5 max-w-md leading-7 text-[#586152]">Each book turns the German you meet on shift into a clear practice ritual — focused, visual, and useful from the first page.</p>
            <div className="mt-8 grid grid-cols-2 gap-3">
              {[['◌', 'Dialogues'], ['Aa', '10–15 words'], ['⌁', 'Grammar focus'], ['✓', 'Practical exercises']].map(([icon, name]) => (
                <div key={name} className="rounded-2xl border border-[#526047]/12 bg-white/50 p-4"><span className="text-lg text-[#78825f]">{icon}</span><p className="mt-5 text-sm font-semibold">{name}</p></div>
              ))}
            </div>
          </div>
          <div className="rounded-[2.5rem] border border-white/60 bg-[#b9bc9c]/58 p-7 shadow-[0_18px_70px_rgba(42,48,30,.08)] backdrop-blur-xl lg:p-10">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-[#576649]">A moment from a lesson</p>
            <h2 className="serif mt-4 text-4xl">Dialogue</h2>
            <div className="mt-8 space-y-3">
              <div className="ml-auto max-w-[83%] rounded-2xl rounded-br-sm bg-[#31402f] p-4 text-sm leading-6 text-white">Guten Morgen. Ich bin Ihre Pflegekraft. Wie geht es Ihnen heute?</div>
              <div className="max-w-[83%] rounded-2xl rounded-bl-sm border border-white/70 bg-[#f7f4e8]/72 p-4 text-sm leading-6">Guten Morgen. Mir ist ein bisschen schwindelig.</div>
              <div className="ml-auto max-w-[83%] rounded-2xl rounded-br-sm bg-[#d6c38b]/80 p-4 text-sm leading-6 text-[#30372c]">Ich verstehe. Ich helfe Ihnen jetzt, sich langsam hinzusetzen.</div>
            </div>
            <Link href="/shop" className="mt-7 inline-block rounded-full bg-[#31402f] px-5 py-3 text-sm font-semibold text-white">Open the lesson ↗</Link>
          </div>
        </section>

        <section className="border-y border-white/50 bg-[#e8e5d9]/72 px-5 py-20 backdrop-blur-xl lg:px-10">
          <div className="mx-auto max-w-[1360px]">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-[#777c60]">04 — Order flow</p>
            <div className="mt-4 flex flex-wrap items-end justify-between gap-5">
              <h2 className="serif text-4xl lg:text-6xl">Clear from page to practice.</h2>
              <a target="_blank" rel="noreferrer" href="https://ig.me/m/medical.sketcher" className="rounded-full border border-[#536044]/20 bg-white/60 px-5 py-3 text-sm font-semibold">Order on Instagram ↗</a>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[['01', 'Preview', 'Open the free sample and read four pages.'], ['02', 'Message', 'Ask Medical Sketcher anything before your order.'], ['03', 'Receive', 'Complete checkout, then find your book in My Library.']].map(([n, title, text]) => (
                <div key={title} className="rounded-[1.7rem] border border-white/70 bg-[#f8f6ef]/65 p-6 shadow-sm">
                  <span className="text-xs font-bold text-[#9b7335]">{n}</span>
                  <h3 className="serif mt-7 text-2xl">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#646c5a]">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="story" className="mx-auto grid max-w-[1360px] gap-10 px-5 py-24 lg:grid-cols-2 lg:px-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-[#777c60]">The Medical Sketcher method</p>
            <h2 className="serif mt-4 max-w-xl text-5xl leading-tight lg:text-6xl">Not more content.<br />More connection.</h2>
            <p className="mt-6 max-w-md leading-7 text-[#5b6255]">Medical Sketcher began with a simple belief: learning should feel personal, visual and wonderfully doable.</p>
            <Link href="/shop" className="mt-8 inline-block rounded-full border border-[#2c3325]/20 px-5 py-3 text-sm font-semibold">Discover our story ↗</Link>
          </div>
          <div className="relative min-h-[350px] overflow-hidden rounded-[2.5rem] bg-[#e1ddcd]">
            <ImageWithFallback src={reader} alt="Medical Sketcher in a focused study moment" className="absolute inset-0 h-full w-full object-cover mix-blend-multiply" />
          </div>
        </section>

        <section className="mx-auto max-w-[1360px] px-5 pb-24 lg:px-10">
          <div className="rounded-[2.5rem] border border-white/65 bg-[#f5f3ea]/62 p-7 shadow-[0_18px_70px_rgba(42,48,30,.08)] backdrop-blur-xl lg:p-10">
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.2em] text-[#777c60]">06 — Learner voices</p>
                <h2 className="serif mt-3 text-4xl lg:text-5xl">Student feedback</h2>
              </div>
              <span className="rounded-full bg-[#e5dfc8] px-4 py-2 text-xs font-semibold text-[#5b644e]">★★★★★ 4.9 average</span>
            </div>
            <div className="mt-9 grid gap-4 md:grid-cols-3">
              {[['Mariam · A1.1', 'The dialogue cards finally made German feel usable at work, not just something to memorize.'], ['Lina · Pflegekraft', 'Clear structure, beautiful pages, and vocabulary I used on the ward the next day.'], ['Rami · B1', 'I like that every lesson is short and practical. It respects my time after a shift.']].map(([name, quote]) => (
                <figure key={name} className="rounded-2xl border border-[#536044]/12 bg-white/55 p-5">
                  <div className="text-[#b18a48]">★★★★★</div>
                  <blockquote className="serif mt-5 text-xl leading-7">“{quote}”</blockquote>
                  <figcaption className="mt-6 text-xs font-bold uppercase tracking-wide text-[#69705b]">{name}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1360px] gap-10 px-5 pb-24 lg:grid-cols-[.7fr_1.3fr] lg:px-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-[#777c60]">Helpful details</p>
            <h2 className="serif mt-4 text-4xl lg:text-5xl">Questions,<br />answered simply.</h2>
          </div>
          <div className="divide-y divide-[#536044]/15 rounded-[2rem] border border-white/60 bg-[#f7f5ed]/55 px-6 backdrop-blur-xl">
            {[['Can I preview a book first?', 'Yes. Every available workbook includes a free sample so you can open the first pages before you order.'], ['How do I receive my book?', 'After successful checkout, your digital edition appears in My Library with protected download access.'], ['Which level should I start with?', 'Use the level assessment, or start with A1.1 if you are beginning your German journey.'], ['Can I ask a question before buying?', 'Of course. You can message @medical.sketcher directly on Instagram for personal guidance.']].map(([question, answer], i) => (
              <button onClick={() => setFaq(faq === i ? null : i)} key={question} className="w-full py-5 text-left">
                <span className="flex items-center justify-between gap-6 text-base font-semibold"><span>{question}</span><span className="text-xl font-normal text-[#78825f]">{faq === i ? '−' : '+'}</span></span>
                {faq === i && <span className="block max-w-xl pt-3 text-left text-sm leading-6 text-[#626a58]">{answer}</span>}
              </button>
            ))}
          </div>
        </section>

        <section className="px-5 pb-24 lg:px-10">
          <div className="mx-auto flex max-w-[1360px] flex-col items-start justify-between gap-8 rounded-[2.5rem] bg-[#b6b58b] p-8 lg:flex-row lg:items-center lg:p-12">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-[#45503b]">Notes from the library</p>
              <h2 className="serif mt-3 text-4xl lg:text-5xl">{t.letter}</h2>
              <p className="mt-3 text-[#4c5743]">New books, study rituals and one good idea — occasionally.</p>
            </div>
            <form onSubmit={(event) => { event.preventDefault(); void api('/analytics/events', { method: 'POST', body: JSON.stringify({ name: 'newsletter_subscribe' }) }).catch(() => undefined); toast('Welcome to the letter ✦'); }} className="flex w-full max-w-md rounded-full bg-[#f7f4e9] p-1.5 shadow-lg">
              <input required type="email" placeholder={t.email} className="min-w-0 flex-1 bg-transparent px-4 text-sm outline-none" />
              <button className="rounded-full bg-[#283224] px-5 py-3 text-sm font-semibold text-white">{t.subscribe}</button>
            </form>
          </div>
        </section>

        <section className="px-5 pb-20 lg:px-10">
          <div className="mx-auto max-w-[1360px] rounded-[2rem] border border-white/60 bg-[#f6f3e9]/55 px-7 py-8 text-center shadow-[0_12px_40px_rgba(45,54,35,.07)] backdrop-blur-xl">
            <p className="text-[11px] font-bold uppercase tracking-[.22em] text-[#747a66]">Designed &amp; developed with care</p>
            <a target="_blank" rel="noreferrer" href="https://www.instagram.com/muhammad_allouzi" className="serif mt-3 inline-block text-3xl text-[#394432] transition hover:-translate-y-0.5 hover:text-[#9b7335] lg:text-4xl">Muhammad Allouzi <span className="font-sans text-xl">↗</span></a>
            <p className="mt-2 text-sm text-[#69705f]">Visit the developer on Instagram</p>
          </div>
        </section>
      </main>
    </StoreChrome>
  );
}
