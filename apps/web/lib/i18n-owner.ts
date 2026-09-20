'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Owner-dashboard i18n (separate from the storefront copy so the two can
 * evolve independently). Phrasing is written to sound like a product, not
 * a dictionary: Arabic and German are composed for meaning and tone, not
 * translated word for word.
 */

export type OwnerLang = 'EN' | 'AR' | 'DE';

const STORAGE_KEY = 'owner_lang';

type Dict = {
  studio: string;
  adminTitle: string;
  logout: string;
  visitSite: string;
  lang: string;
  nav: Record<string, string>;
};

const dictionaries: Record<OwnerLang, Dict> = {
  EN: {
    studio: 'Owner Studio',
    adminTitle: 'Medical Sketcher Admin',
    logout: 'Log out',
    visitSite: 'Visit public website',
    lang: 'Language',
    nav: {
      '/owner': 'Dashboard',
      '/owner/books': 'Products',
      '/owner/authors': 'Authors',
      '/owner/categories': 'Categories',
      '/owner/orders': 'Orders',
      '/owner/users': 'Users',
      '/owner/library': 'Library',
      '/owner/reviews': 'Reviews',
      '/owner/lessons': 'Lessons',
      '/owner/assessments': 'Assessments',
      '/owner/exams': 'Exams',
      '/owner/cms': 'CMS',
      '/owner/media': 'Media',
      '/owner/analytics': 'Analytics',
      '/owner/audit': 'Audit Logs',
      '/owner/settings': 'Settings',
    },
  },
  AR: {
    studio: 'استوديو المالك',
    adminTitle: 'إدارة Medical Sketcher',
    logout: 'تسجيل الخروج',
    visitSite: 'فتح الموقع العام',
    lang: 'اللغة',
    nav: {
      '/owner': 'لوحة التحكم',
      '/owner/books': 'المنتجات',
      '/owner/authors': 'المؤلفون',
      '/owner/categories': 'الأقسام',
      '/owner/orders': 'الطلبات',
      '/owner/users': 'المستخدمون',
      '/owner/library': 'المكتبة',
      '/owner/reviews': 'المراجعات',
      '/owner/lessons': 'الدروس',
      '/owner/assessments': 'التقييمات',
      '/owner/exams': 'الامتحانات',
      '/owner/cms': 'إدارة المحتوى',
      '/owner/media': 'الوسائط',
      '/owner/analytics': 'الإحصاءات',
      '/owner/audit': 'سجل التدقيق',
      '/owner/settings': 'الإعدادات',
    },
  },
  DE: {
    studio: 'Owner Studio',
    adminTitle: 'Medical Sketcher Verwaltung',
    logout: 'Abmelden',
    visitSite: 'Öffentliche Website ansehen',
    lang: 'Sprache',
    nav: {
      '/owner': 'Übersicht',
      '/owner/books': 'Produkte',
      '/owner/authors': 'Autoren',
      '/owner/categories': 'Kategorien',
      '/owner/orders': 'Bestellungen',
      '/owner/users': 'Nutzer',
      '/owner/library': 'Bibliothek',
      '/owner/reviews': 'Rezensionen',
      '/owner/lessons': 'Lektionen',
      '/owner/assessments': 'Einstufungen',
      '/owner/exams': 'Prüfungen',
      '/owner/cms': 'Inhalte',
      '/owner/media': 'Medien',
      '/owner/analytics': 'Statistik',
      '/owner/audit': 'Protokoll',
      '/owner/settings': 'Einstellungen',
    },
  },
};

const langs: OwnerLang[] = ['EN', 'AR', 'DE'];

export function useOwnerLang() {
  const [lang, setLangState] = useState<OwnerLang>('EN');

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) as OwnerLang | null;
    if (saved && langs.includes(saved)) setLangState(saved);
  }, []);

  const setLang = useCallback((next: OwnerLang) => {
    setLangState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const t = dictionaries[lang];
  return { lang, setLang, t, langs, dir: lang === 'AR' ? ('rtl' as const) : ('ltr' as const) };
}
