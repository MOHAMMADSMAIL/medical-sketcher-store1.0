export type Lang = 'EN' | 'AR' | 'DE';

/**
 * Storefront copy in three voices. Arabic and German are composed to read
 * like a brand, not translated from English word by word — the German uses
 * the informal "du" consistently and the Arabic favours short, warm phrasing.
 */
export const copy = {
  EN: {
    home: 'Home', shop: 'Shop', learning: 'German for Nurses', story: 'Our story',
    title: 'German that works on the ward.',
    text: 'Visual, practical German for nurses and healthcare professionals — built for your next real conversation.',
    explore: 'Explore the pathway', start: 'Find my level', featured: 'The professional library.',
    featText: 'One focused workbook at a time, built around the language you actually use.',
    levels: 'Find your German level', categories: 'Your next shift starts here.',
    letter: 'A quieter corner of the internet.', subscribe: 'Join the newsletter', email: 'Your email address',
    added: 'Added to your library cart', cart: 'Cart', view: 'View all books',
    signIn: 'Sign in', register: 'Create account', library: 'Library', wishlist: 'Wishlist', orders: 'Orders',
    account: 'Account', checkout: 'Checkout', emptyCart: 'Your cart is empty.',
    emptyLibrary: 'Your purchased books will appear here.', emptyWishlist: 'Nothing saved yet.',
    pay: 'Confirm development payment', add: 'Add to cart', download: 'Download',
    // auth (Google + phone)
    continueGoogle: 'Continue with Google', orDivider: 'or', orRegister: 'or register with email',
    emailTab: 'Email', phoneTab: 'Phone', sendCode: 'Send code', verifySignIn: 'Verify & sign in',
    codeSentHint: 'Phone sign-in works for numbers already linked to an account.',
    phoneLabel: 'Phone number', linkPhoneBtn: 'Link',
    phoneOptionalHint: 'Optional — helps us identify your orders and enables phone sign-in.',
    // homepage extras
    skillsIntro: 'Keep every part of language learning in one considered place.',
    exploreMore: 'Explore', eyebrow: 'Digital bookstore · made for curious minds',
    statInstant: 'instant access', statLangs: 'languages', statLove: 'reader love',
    promptLabel: 'Today’s gentle prompt', promptText: '“Learn one word that changes a room.”',
    growNote: '✦ Your library grows with you',
  },
  AR: {
    home: 'الرئيسية', shop: 'المتجر', learning: 'الألمانية للممرضين', story: 'قصتنا',
    title: 'ألمانية تنفعك في القسم.',
    text: 'ألمانية مرئية وعملية للممرضين والعاملين في القطاع الصحي — مصمّمة لمحادثتك الحقيقية القادمة.',
    explore: 'اكتشف المسار', start: 'اعرف مستواك', featured: 'المكتبة المهنية.',
    featText: 'كتاب عمل واحد مركّز في كل مرة، مبني على اللغة التي تستعملها في شغلك فعلاً.',
    levels: 'حدّد مستواك في الألمانية', categories: 'مناوبتك القادمة تبدأ من هنا.',
    letter: 'ركن هادئ بعيد عن ضجيج الإنترنت.', subscribe: 'اشترك بالنشرة', email: 'بريدك الإلكتروني',
    added: 'أضفناه إلى سلة مكتبتك', cart: 'السلة', view: 'استعرض كل الكتب',
    signIn: 'تسجيل الدخول', register: 'إنشاء حساب', library: 'المكتبة', wishlist: 'المفضلة', orders: 'الطلبات',
    account: 'حسابي', checkout: 'إتمام الشراء', emptyCart: 'سلتك فاضية.',
    emptyLibrary: 'الكتب التي اشتريتها بتظهر هنا.', emptyWishlist: 'ما حفظت شي بالمفضلة بعد.',
    pay: 'تأكيد الدفع (وضع تجريبي)', add: 'أضف إلى السلة', download: 'تنزيل',
    continueGoogle: 'المتابعة بحساب Google', orDivider: 'أو', orRegister: 'أو سجّل بالبريد الإلكتروني',
    emailTab: 'البريد الإلكتروني', phoneTab: 'الهاتف', sendCode: 'أرسل الرمز', verifySignIn: 'تحقّق وادخل',
    codeSentHint: 'الدخول بالهاتف متاح للأرقام المرتبطة مسبقاً بحساب قائم.',
    phoneLabel: 'رقم الهاتف', linkPhoneBtn: 'ربط',
    phoneOptionalHint: 'اختياري — يعرّفنا بطلباتك ويتيح لك الدخول برقم هاتفك لاحقاً.',
    skillsIntro: 'كل ما يتعلق بتعلم اللغة، في مكان واحد مدروس.',
    exploreMore: 'استكشف', eyebrow: 'متجر كتب رقمي · لعقول تحب الاستكشاف',
    statInstant: 'وصول فوري', statLangs: 'لغات', statLove: 'محبة القرّاء',
    promptLabel: 'تدريب اليوم اللطيف', promptText: '«تعلّم كلمة تغيّر جو المكان كله.»',
    growNote: '✦ مكتبتك تكبر معك',
  },
  DE: {
    home: 'Start', shop: 'Shop', learning: 'Deutsch für Pflege', story: 'Unsere Geschichte',
    title: 'Deutsch, das auf Station funktioniert.',
    text: 'Visuelles, praktisches Deutsch für Pflegekräfte und Gesundheitsberufe – gemacht für dein nächstes echtes Gespräch.',
    explore: 'Lernweg entdecken', start: 'Mein Niveau finden', featured: 'Die Fachbibliothek.',
    featText: 'Ein fokussiertes Arbeitsbuch nach dem anderen – rund um die Sprache, die du im Alltag wirklich brauchst.',
    levels: 'Finde dein Deutschniveau', categories: 'Deine nächste Schicht beginnt hier.',
    letter: 'Eine ruhige Ecke im Internet.', subscribe: 'Newsletter abonnieren', email: 'Deine E-Mail-Adresse',
    added: 'Zu deinem Bibliothekskorb hinzugefügt', cart: 'Warenkorb', view: 'Alle Bücher ansehen',
    signIn: 'Anmelden', register: 'Konto erstellen', library: 'Bibliothek', wishlist: 'Merkliste', orders: 'Bestellungen',
    account: 'Konto', checkout: 'Kasse', emptyCart: 'Dein Warenkorb ist leer.',
    emptyLibrary: 'Gekaufte Bücher erscheinen hier.', emptyWishlist: 'Deine Merkliste ist noch leer.',
    pay: 'Zahlung bestätigen (Testmodus)', add: 'In den Warenkorb', download: 'Download',
    continueGoogle: 'Mit Google weitermachen', orDivider: 'oder', orRegister: 'oder mit E-Mail registrieren',
    emailTab: 'E-Mail', phoneTab: 'Telefon', sendCode: 'Code senden', verifySignIn: 'Bestätigen & anmelden',
    codeSentHint: 'Die Telefon-Anmeldung funktioniert für Nummern, die bereits mit einem Konto verknüpft sind.',
    phoneLabel: 'Telefonnummer', linkPhoneBtn: 'Verknüpfen',
    phoneOptionalHint: 'Optional – hilft uns, deine Bestellungen zuzuordnen, und ermöglicht später die Anmeldung per Telefon.',
    skillsIntro: 'Alles, was zum Sprachenlernen gehört, an einem durchdachten Ort.',
    exploreMore: 'Entdecken', eyebrow: 'Digitaler Buchladen · für neugierige Köpfe',
    statInstant: 'sofortiger Zugang', statLangs: 'Sprachen', statLove: 'Leserliebe',
    promptLabel: 'Die sanfte Übung für heute', promptText: '„Lerne ein Wort, das den Raum verändert.“',
    growNote: '✦ Deine Bibliothek wächst mit dir',
  },
};

export function tr(lang: Lang, en: string, ar: string, de: string) {
  return lang === 'AR' ? ar : lang === 'DE' ? de : en;
}
