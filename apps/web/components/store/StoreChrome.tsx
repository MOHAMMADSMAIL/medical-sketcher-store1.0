'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useStore } from './StoreProvider';
import type { Lang } from '@/lib/i18n';

const scenes = [
  '/theme/Duck-ai-image-2026-09-15-22-08__3_.jpeg',
  '/theme/Duck-ai-image-2026-09-15-22-08.jpeg',
  '/theme/medical-sketcher-study-scene.jpg',
  '/theme/Duck-ai-image-2026-09-15-22-08__4_.jpeg',
  '/theme/Duck-ai-image-2026-09-15-22-08__1_.jpeg',
];

const sceneNotes = [
  'Reading along with you',
  'Working on the next chapter',
  'Practising, one page at a time',
  'A little hello from the library',
  'Carrying a fresh stack of ideas',
];

export default function StoreChrome({ children, scene = 0 }: { children: React.ReactNode; scene?: number }) {
  const { lang, setLang, t, rtl, user, cartCount, notice, logout } = useStore();
  const [menu, setMenu] = useState(false);
  const nav = [
    { href: '/', label: t.home },
    { href: '/shop', label: t.shop },
    { href: '/#learn', label: t.learning },
    { href: '/#story', label: t.story },
  ];
  return (
    <div dir={rtl ? 'rtl' : 'ltr'} className="min-h-screen overflow-hidden bg-[#ebe7d9] text-[#1b2119]">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#d6d7bf]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,.9),transparent_37%),linear-gradient(130deg,#b8bd91_0%,#ebe6d3_46%,#c5b896_100%)]" />
        {scenes.map((src, index) => (
          <img key={src} src={src} alt="" className={`curtain-character ${scene === index ? 'curtain-character--visible' : ''}`} />
        ))}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(245,241,231,.58),transparent_42%,rgba(245,241,231,.18))]" />
        <div className="grain absolute inset-0 opacity-35" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#ebe7d9] to-transparent" />
        <div className="absolute bottom-6 right-6 rounded-full border border-white/70 bg-white/35 px-4 py-2 text-[11px] font-medium tracking-wide text-[#3e4937] backdrop-blur-md">✦ {sceneNotes[scene]}</div>
      </div>
      {notice && <div className="fixed top-5 left-1/2 z-50 -translate-x-1/2 rounded-full border border-white/60 bg-[#263024] px-5 py-3 text-sm text-white shadow-xl">✦ {notice}</div>}
      <header className="sticky top-0 z-40 mx-auto flex max-w-[1440px] items-center justify-between border-b border-[#2c3325]/10 bg-[#f5f1e7]/80 px-5 py-4 backdrop-blur-xl lg:px-10">
        <Link className="flex items-center gap-3" href="/">
          <span className="grid h-9 w-9 place-items-center rounded-full border border-[#536044]/40 bg-[#e2ddce] text-sm font-bold text-[#536044]">MS</span>
          <span className="hidden text-sm font-semibold tracking-[.13em] sm:block">MEDICAL<br />SKETCHER</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-[#4e5549] lg:flex">
          {nav.map((item, i) => (
            <Link key={item.label} className={i === 0 ? 'font-semibold text-[#1b2119]' : 'transition hover:text-[#536044]'} href={item.href}>{item.label}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <div className="hidden rounded-full border border-[#2c3325]/10 bg-white/55 p-1 sm:flex">
            {(['EN', 'AR', 'DE'] as Lang[]).map((item) => (
              <button key={item} onClick={() => setLang(item)} className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${lang === item ? 'bg-[#536044] text-white' : 'text-[#576050]'}`}>{item}</button>
            ))}
          </div>
          {(user?.role === 'OWNER' || user?.role === 'ADMIN') && (
            <Link href="/owner" className="hidden rounded-full border border-[#536044]/20 bg-[#e6e5d4] px-3 py-2 text-xs font-semibold text-[#44503a] lg:block">Owner Studio</Link>
          )}
          {user ? (
            <Link href="/account" className="hidden rounded-full border border-[#2c3325]/10 bg-white/60 px-3 py-2 text-xs font-semibold lg:block">{user.name || user.email}</Link>
          ) : (
            <Link href="/login" className="hidden rounded-full border border-[#2c3325]/10 bg-white/60 px-3 py-2 text-xs font-semibold lg:block">{t.signIn}</Link>
          )}
          <Link href="/cart" className="rounded-full border border-[#2c3325]/10 bg-white/60 px-3 py-2 text-sm">{t.cart} <b className="ml-1 rounded-full bg-[#b18a48] px-1.5 py-0.5 text-xs text-white">{cartCount}</b></Link>
          <button aria-label="Open menu" onClick={() => setMenu(!menu)} className="grid h-9 w-9 place-items-center rounded-full border border-[#2c3325]/10 bg-white/60 lg:hidden">☰</button>
        </div>
      </header>
      {menu && (
        <div className="fixed inset-x-4 top-20 z-50 rounded-[2rem] border border-white/70 bg-[#eef0e6]/95 p-6 shadow-2xl backdrop-blur-xl lg:hidden">
          <div className="grid gap-4 text-lg">
            {nav.map((item) => <Link onClick={() => setMenu(false)} href={item.href} key={item.label}>{item.label}</Link>)}
            <Link href="/library" onClick={() => setMenu(false)}>{t.library}</Link>
            <Link href="/wishlist" onClick={() => setMenu(false)}>{t.wishlist}</Link>
            {user ? <button className="text-left" onClick={() => void logout()}>Sign out</button> : <Link href="/login">{t.signIn}</Link>}
            <div className="flex gap-2 pt-2">
              {(['EN', 'AR', 'DE'] as Lang[]).map((item) => (
                <button key={item} onClick={() => { setLang(item); setMenu(false); }} className="rounded-full bg-white px-4 py-2 text-sm">{item}</button>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="relative z-10">{children}</div>
      <footer className="relative z-10 border-t border-[#2c3325]/10 px-5 py-12 lg:px-10">
        <div className="mx-auto grid max-w-[1360px] gap-10 md:grid-cols-4">
          <div>
            <div className="serif text-2xl">Medical Sketcher</div>
            <p className="mt-3 text-sm text-[#606758]">A digital library for beautifully curious minds.</p>
          </div>
          <div className="text-sm leading-8"><b>Explore</b><br /><Link href="/shop">Books</Link><br /><Link href="/#learn">German learning</Link><br /><Link href="/wishlist">Gift a library</Link></div>
          <div className="text-sm leading-8"><b>Your account</b><br /><Link href="/library">{t.library}</Link><br /><Link href="/wishlist">{t.wishlist}</Link><br /><Link href="/orders">{t.orders}</Link></div>
          <div className="text-sm leading-8"><b>Elsewhere</b><br /><a className="underline" target="_blank" rel="noreferrer" href="https://www.instagram.com/medical.sketcher">Instagram ↗</a><br /><span className="text-[#68705f]">Built by <a className="underline" target="_blank" rel="noreferrer" href="https://www.instagram.com/muhammad_allouzi">Muhammad Allouzi</a></span></div>
        </div>
        <div className="mx-auto mt-12 flex max-w-[1360px] justify-between border-t border-[#2c3325]/10 pt-5 text-xs text-[#737968]"><span>Medical Sketcher</span><span>Protected digital editions</span></div>
      </footer>
    </div>
  );
}
