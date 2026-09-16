'use client';

import { useMemo, useState } from 'react';

type Product = { id?: string; title?: string; price?: number | string; author?: { name?: string } | string; category?: { name?: string } | string };
type Lang = 'EN' | 'AR' | 'DE';

const copy = {
  EN: { home: 'Home', shop: 'Shop', learning: 'German Learning', story: 'Our story', title: 'Books for the beautifully curious.', text: 'A considered digital library for minds that keep asking why — from medical sketching to confident German.', explore: 'Explore the collection', start: 'Start learning German', featured: 'Selected for curious minds', featText: 'A small, precise library of books worth returning to.', levels: 'Find your German level', categories: 'A library arranged by appetite', cart: 'Cart', add: 'Add to cart', added: 'Added to your library cart', view: 'View all books' },
  AR: { home: 'الرئيسية', shop: 'المتجر', learning: 'تعلم الألمانية', story: 'قصتنا', title: 'كتب للعقول الجميلة الفضولية.', text: 'مكتبة رقمية مختارة بعناية للعقول التي تواصل السؤال — من الرسم الطبي إلى الألمانية الواثقة.', explore: 'استكشف المجموعة', start: 'ابدأ تعلم الألمانية', featured: 'مختارات للعقول الفضولية', featText: 'مكتبة صغيرة ودقيقة من الكتب التي تستحق العودة إليها.', levels: 'اعثر على مستواك في الألمانية', categories: 'مكتبة مرتبة حسب شغفك', cart: 'السلة', add: 'أضف إلى السلة', added: 'تمت الإضافة إلى سلة مكتبتك', view: 'عرض كل الكتب' },
  DE: { home: 'Start', shop: 'Shop', learning: 'Deutsch lernen', story: 'Unsere Geschichte', title: 'Bücher für die wunderbar Neugierigen.', text: 'Eine sorgfältige digitale Bibliothek für alle, die weiter fragen – von medizinischem Zeichnen bis zu sicherem Deutsch.', explore: 'Kollektion entdecken', start: 'Deutsch lernen', featured: 'Für neugierige Köpfe', featText: 'Eine kleine, präzise Bibliothek voller Bücher, zu denen man zurückkehrt.', levels: 'Finde dein Deutschniveau', categories: 'Eine Bibliothek nach Interessen', cart: 'Warenkorb', add: 'In den Warenkorb', added: 'Zum Bibliothekskorb hinzugefügt', view: 'Alle Bücher ansehen' },
};

const fallback = [
  { id: '1', title: 'The Medical Sketcher', author: 'Medical Sketcher', category: 'Creative study', price: '18', mark: 'MS', color: '#566248', rating: '4.9' },
  { id: '2', title: 'Deutsch im Klinikalltag', author: 'Lena Hofmann', category: 'German · B1', price: '14', mark: 'DE', color: '#9c7953', rating: '4.8' },
  { id: '3', title: 'Anatomy, Gently', author: 'Tariq M. Saleh', category: 'Medicine', price: '21', mark: 'A', color: '#343b33', rating: '5.0' },
  { id: '4', title: 'Small Notes on Care', author: 'Noor Alami', category: 'Personal growth', price: '12', mark: 'N', color: '#8e6b69', rating: '4.7' },
];

export default function HomeClient({ products }: { products: Product[] }) {
  const [lang, setLang] = useState<Lang>('EN');
  const [cart, setCart] = useState(0);
  const [liked, setLiked] = useState<number[]>([]);
  const [level, setLevel] = useState('A1');
  const [notice, setNotice] = useState('');
  const [menu, setMenu] = useState(false);
  const t = copy[lang];
  const items = useMemo(() => (products.length ? products.map((p, i) => ({ ...p, author: typeof p.author === 'string' ? p.author : p.author?.name || 'Medical Sketcher', category: typeof p.category === 'string' ? p.category : p.category?.name || 'Selected reading', price: String(p.price ?? 0), mark: ['MS', 'DE', 'A', 'N'][i % 4], color: ['#566248', '#9c7953', '#343b33', '#8e6b69'][i % 4], rating: ['4.9', '4.8', '5.0', '4.7'][i % 4] })) : fallback), [products]);
  const add = () => { setCart((x) => x + 1); setNotice(t.added); window.setTimeout(() => setNotice(''), 2200); };
  return <div dir={lang === 'AR' ? 'rtl' : 'ltr'} className="store-shell">
    <div className="scene-bg"><div className="scene-gradient"/><img src="/design-assets/Duck-ai-image-2026-09-15-22-08__5_.jpeg" alt=""/><div className="grain"/></div>
    {notice && <div className="notice">✦ {notice}</div>}
    <header className="glass-header"><a className="brand" href="#top"><span className="brand-mark">MS</span><span>MEDICAL<br/>SKETCHER</span></a><nav>{[t.home, t.shop, t.learning, t.story].map((n, i) => <a key={n} href={i === 2 ? '#learn' : '#collection'}>{n}</a>)}</nav><div className="header-actions"><div className="languages">{(['EN', 'AR', 'DE'] as Lang[]).map((l) => <button className={lang === l ? 'selected' : ''} onClick={() => setLang(l)} key={l}>{l}</button>)}</div><button className="cart-pill" onClick={() => setCart(0)}>{t.cart} <b>{cart}</b></button><button className="menu-button" onClick={() => setMenu(!menu)}>☰</button></div></header>
    {menu && <div className="mobile-menu">{[t.home, t.shop, t.learning, t.story].map((n) => <a onClick={() => setMenu(false)} href="#collection" key={n}>{n}</a>)}<div className="mobile-langs">{(['EN', 'AR', 'DE'] as Lang[]).map((l) => <button onClick={() => { setLang(l); setMenu(false); }} key={l}>{l}</button>)}</div></div>}
    <main id="top">
      <section className="hero-section"><div className="hero-copy"><p className="eyebrow">Digital bookstore · made for curious minds</p><h1>{t.title}</h1><p className="hero-text">{t.text}</p><div className="hero-buttons"><a className="button dark" href="#collection">{t.explore} ↗</a><a className="button light" href="#learn">{t.start}</a></div><div className="hero-stats"><span><b>∞</b> instant access</span><span><b>3</b> languages</span><span><b>4.9/5</b> reader love</span></div></div><div className="hero-art"><img src="/design-assets/Duck-ai-image-2026-09-15-22-08__5_.jpeg" alt="Medical Sketcher with books"/><div className="prompt-card"><small>Today’s gentle prompt</small><strong>“Learn one word that changes a room.”</strong></div><div className="art-tag">✦ Your library grows with you</div></div></section>
      <section id="collection" className="collection-section"><div className="section-heading"><div><p className="eyebrow">The bookshelf</p><h2>{t.featured}</h2><p>{t.featText}</p></div><button className="button light">{t.view} ↗</button></div><div className="book-grid">{items.map((p, i) => <article className="book-card" key={p.id || p.title}><div className="book-cover" style={{ background: p.color as string }}><span>{p.mark}</span><button className="heart" onClick={() => setLiked((x) => x.includes(i) ? x.filter((v) => v !== i) : [...x, i])}>{liked.includes(i) ? '♥' : '♡'}</button><small>Digital edition</small></div><div className="book-info"><p className="category">{p.category as string}</p><h3>{p.title}</h3><p className="author">{p.author as string}</p><div className="book-meta"><b>${Number(p.price).toFixed(2)}</b><span>★ {p.rating as string}</span></div><button className="add-button" onClick={add}>{t.add}</button></div></article>)}</div></section>
      <section id="learn" className="learn-section"><div className="learn-image"><img src="/design-assets/medical-sketcher-study-scene.jpg" alt="Study scene"/><div className="image-caption"><small>Daily practice</small><strong>A language is a place<br/>you can enter.</strong></div></div><div className="learn-copy"><p className="eyebrow">Deutsch, made human</p><h2>{t.levels}</h2><p>From first conversations to clinical confidence, our study materials are designed to be opened, marked, and used in real life.</p><div className="levels">{['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((x) => <button className={level === x ? 'active' : ''} onClick={() => setLevel(x)} key={x}>{x}</button>)}</div><div className="level-card">✦ <span><b>{level} collection</b><small>Vocabulary · grammar · reading practice</small></span><button onClick={add}>Browse</button></div></div></section>
      <section className="categories-section"><p className="eyebrow">Browse by feeling</p><h2>{t.categories}</h2><div className="category-grid">{['Classic literature', 'Philosophy', 'History', 'Business', 'German learning', 'Language practice', 'Fiction', 'Study materials'].map((x, i) => <a href="#collection" key={x}><small>0{i + 1}</small><strong>{x}</strong></a>)}</div></section>
      <section className="story-section"><div><p className="eyebrow">The Medical Sketcher method</p><h2>Not more content.<br/>More connection.</h2><p>Medical Sketcher began with a simple belief: learning should feel personal, visual and wonderfully doable.</p><a className="button light" href="#top">Discover our story ↗</a></div><img src="/design-assets/medical-sketcher-method.jpg" alt="The Medical Sketcher method"/></section>
    </main><footer><span>MEDICAL SKETCHER STORE</span><span>© 2026 · A quieter corner of the internet.</span></footer>
  </div>;
}
