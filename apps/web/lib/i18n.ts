export type Lang = 'EN' | 'AR' | 'DE';

export const copy = {
  EN: {
    home: 'Home', shop: 'Shop', learning: 'German for Nurses', story: 'Our story',
    title: 'German that works on the ward.',
    text: 'Visual, practical German for nurses and healthcare professionals — built for your next real conversation.',
    explore: 'Explore the pathway', start: 'Find my level', featured: 'The professional library.',
    featText: 'One focused workbook at a time, built around the language you actually use.',
    levels: 'Find your German level', categories: 'Your next shift starts here.',
    letter: 'A quieter corner of the internet.', subscribe: 'Join the letter', email: 'Your email address',
    added: 'Added to your library cart', cart: 'Cart', view: 'View all books',
    signIn: 'Sign in', register: 'Create account', library: 'Library', wishlist: 'Wishlist', orders: 'Orders',
    account: 'Account', checkout: 'Checkout', emptyCart: 'Your cart is empty.',
    emptyLibrary: 'Your purchased books will appear here.', emptyWishlist: 'Nothing saved yet.',
    pay: 'Confirm development payment', add: 'Add to cart', download: 'Download',
  },
  AR: {
    home: 'الرئيسية', shop: 'المتجر', learning: 'الألمانية للممرضين', story: 'قصتنا',
    title: 'ألمانية تنفعك في القسم.',
    text: 'ألمانية مرئية وعملية للممرضين والعاملين في الرعاية الصحية — مصممة لمحادثتك الحقيقية القادمة.',
    explore: 'اكتشف المسار', start: 'اعرف مستواي', featured: 'المكتبة المهنية.',
    featText: 'كتاب عمل مركز في كل مرة، مبني حول اللغة التي تستخدمها فعلًا.',
    levels: 'اعثر على مستواك في الألمانية', categories: 'مناوبتك القادمة تبدأ هنا.',
    letter: 'ركن أكثر هدوءاً من الإنترنت.', subscribe: 'اشترك في الرسالة', email: 'بريدك الإلكتروني',
    added: 'تمت الإضافة إلى سلة مكتبتك', cart: 'السلة', view: 'عرض كل الكتب',
    signIn: 'تسجيل الدخول', register: 'إنشاء حساب', library: 'المكتبة', wishlist: 'المفضلة', orders: 'الطلبات',
    account: 'الحساب', checkout: 'الدفع', emptyCart: 'سلتك فارغة.',
    emptyLibrary: 'ستظهر هنا الكتب التي اشتريتها.', emptyWishlist: 'لا يوجد شيء محفوظ بعد.',
    pay: 'تأكيد الدفع التجريبي', add: 'أضف إلى السلة', download: 'تنزيل',
  },
  DE: {
    home: 'Start', shop: 'Shop', learning: 'Deutsch für Pflege', story: 'Unsere Geschichte',
    title: 'Deutsch, das auf Station funktioniert.',
    text: 'Visuelles, praktisches Deutsch für Pflegekräfte und Gesundheitsberufe – gemacht für dein nächstes echtes Gespräch.',
    explore: 'Lernweg entdecken', start: 'Mein Niveau finden', featured: 'Die Fachbibliothek.',
    featText: 'Ein fokussiertes Arbeitsbuch nach dem anderen – rund um die Sprache, die du wirklich brauchst.',
    levels: 'Finde dein Deutschniveau', categories: 'Deine nächste Schicht beginnt hier.',
    letter: 'Eine ruhigere Ecke des Internets.', subscribe: 'Brief erhalten', email: 'Deine E-Mail-Adresse',
    added: 'Zum Bibliothekskorb hinzugefügt', cart: 'Warenkorb', view: 'Alle Bücher ansehen',
    signIn: 'Anmelden', register: 'Konto erstellen', library: 'Bibliothek', wishlist: 'Merkliste', orders: 'Bestellungen',
    account: 'Konto', checkout: 'Kasse', emptyCart: 'Dein Warenkorb ist leer.',
    emptyLibrary: 'Gekaufte Bücher erscheinen hier.', emptyWishlist: 'Noch nichts gespeichert.',
    pay: 'Entwicklungskauf bestätigen', add: 'In den Warenkorb', download: 'Download',
  },
};

export function tr(lang: Lang, en: string, ar: string, de: string) {
  return lang === 'AR' ? ar : lang === 'DE' ? de : en;
}
