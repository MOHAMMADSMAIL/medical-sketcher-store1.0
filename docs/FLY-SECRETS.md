# 🔐 قائمة Secrets الـ API على Fly.io — مبنية على الكود الفعلي

> هذه النسخة مصححة ومتحقق منها من مصادر القراءة الفعلية في `apps/api/src` (grep مؤكد).
> القاعدة الحديدة: **لا قيم سرية هنا ولا في المحادثة** — القيم تنتقل يدك → `.env` → حقول Fly Secrets مباشرة.

## تصحيحات على قوائم سابقة (مهم)

| الادعاء السابق | الحقيقة في الكود |
|---|---|
| `DATABASE_URL_SUPABASE` / `DATABASE_URL_POOLED` كـ secrets على Fly | ❌ الـ API لا يقرأ هذين الاسمين. Prisma يقرأ **`DATABASE_URL`** فقط (`prisma/schema.prisma:7`). هذان اسمان محليان لسكربت التحقق فقط |
| `JWT_SECRET` مطلوب | ❌ غير موجود في الكود إطلاقاً — احذفه |
| `AUTH_SECRET` مطلوب | ❌ غير مقروء من الـ API — الجلسات tokens عشوائية + SHA-256 (`auth.service.ts`) |
| `NODE_ENV=production` كـ secret | ⚠️ مضبوط أصلاً في `fly.toml` قسم `[env]` — لا حاجة لإضافته |
| Upstash اختياري | 🔴 **إلزامي بالإنتاج**: بدون `UPSTASH_REDIS_REST_URL/TOKEN` كل طلب يرجع 503 (`rate-limit.ts:20`) |
| HyperPay لاحقاً | 🔴 **شرط إقلاع**: `PAYMENT_PROVIDER=development` مرفوض في production، والمفاتيح الفارغة تُسقط البوت (`payment.provider.ts` fail-fast) |

## الجدول 1 — إلزامية للإقلاع (بدونها الـ API لا يصعد)

| Secret | المصدر / القيمة |
|---|---|
| `DATABASE_URL` | Supabase → Connect → **Session pooler** (5432) — استبدل `[YOUR-PASSWORD]` (رمّز `&`→`%26`, `#`→`%23`, مسافة→`%20`) |
| `STORAGE_PROVIDER` | `supabase` — إلزامي: قرص Fly مؤقت، `local` يعني فقدان الملفات عند كل إعادة نشر |
| `SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → API Keys → service_role → Reveal |
| `SUPABASE_STORAGE_BUCKET` | `books-private` |
| `PAYMENT_PROVIDER` | `hyperpay` |
| `HYPERPAY_BASE_URL` | `https://test.oppwa.com` (TEST — لا تنتقل لـ LIVE إلا بقرارك الصريح) |
| `HYPERPAY_ENTITY_ID` | لوحة HyperPay فقط — **قيم حقيقية، لا placeholders** (قاعدتك) |
| `HYPERPAY_ACCESS_TOKEN` | لوحة HyperPay فقط |
| `PAYMENT_WEBHOOK_SECRET` | قيمة عشوائية قوية تولدها أنت (`openssl rand -hex 32`) — نفس القيمة تُدخل لاحقاً في لوحة HyperPay |
| `WEB_URL` | `https://medical-sketcher-store1-0-web.vercel.app` (CORS + CSRF Origin) |
| `UPSTASH_REDIS_REST_URL` | upstash.com → Redis → REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | upstash.com → Redis → REST Token |

## الجدول 2 — للتشغيل السليم (الإقلاع ينجح بدونها، وظيفة تظل ناقصة)

| Secret | بدونه |
|---|---|
| `OWNER_PASSWORD` + `OWNER_USERNAME` + `OWNER_EMAIL` | حساب المالك يعمل ببيانات seed ضعيفة — **غيّرها قبل الفتح للعامة** |
| `EMAIL_PROVIDER` + `RESEND_API_KEY` + `EMAIL_FROM` | الإيميلات تُطبع بالكونسول فقط (`console` افتراضي). `resend` بدون مفتاح = إسقاط إقلاع |
| `SENTRY_DSN` | الأخطاء تُسجل محلياً مُقنّعة بدون إرسال (`error-monitoring.ts:16`) |
| `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` | زر Google يرجع "Google sign-in is not configured" عند استخدامه فقط |
| `PUBLIC_API_URL` | `https://medical-sketcher-store1-0.fly.dev` — لبناء redirect URI الصحيح لـ Google OAuth |
| `HYPERPAY_PAYMENT_TYPE` | `DB` (افتراضي مقبول — أضفها صراحة للوضوح) |

## فخاخ الأسماء — أسماء شائعة في قوائم خارجية لا يقرؤها الكود (تحقق grep)

إذا أُضيفت بأسماء خاطئة فلا يفشل الإقلاع — بل تسقط وظائف بصمت:

| اسم خاطئ شائع | الاسم الصحيح الذي يقرؤه الكود | نتيجة الاسم الخاطئ |
|---|---|---|
| `UPSTASH_REDIS_URL` / `UPSTASH_REDIS_TOKEN` | `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` (`rate-limit.ts:17-18`) | **503 على كل طلب — الموقع كله معطّل** |
| `HYPERPAY_WEBHOOK_SECRET` | `PAYMENT_WEBHOOK_SECRET` (`payment.controller.ts:13`) | فحص سر الـ webhook يُتخطى بصمت |
| `SUPABASE_ANON_KEY` | لا يُقرأ إطلاقاً | زائد فارغ |
| `SUPABASE_JWT_SECRET` | لا يُقرأ إطلاقاً | زائد فارغ |

واحتياطاً: `SUPABASE_STORAGE_BUCKET` افتراضه `books-private` بالكود، لكن أضفها صراحة.

## Checklist الإضافة (Fly Dashboard → App → Secrets)

```
[ ] DATABASE_URL                (Session pooler بكلمة السر الحقيقية)
[ ] STORAGE_PROVIDER=supabase
[ ] SUPABASE_URL
[ ] SUPABASE_SERVICE_ROLE_KEY
[ ] SUPABASE_STORAGE_BUCKET=books-private
[ ] PAYMENT_PROVIDER=hyperpay
[ ] HYPERPAY_BASE_URL=https://test.oppwa.com
[ ] HYPERPAY_ENTITY_ID          (حقيقي — يتطلب تسجيل HyperPay)
[ ] HYPERPAY_ACCESS_TOKEN       (حقيقي)
[ ] PAYMENT_WEBHOOK_SECRET      (ولّدها أنت)
[ ] WEB_URL=https://medical-sketcher-store1-0-web.vercel.app
[ ] UPSTASH_REDIS_REST_URL
[ ] UPSTASH_REDIS_REST_TOKEN
[ ] OWNER_PASSWORD / OWNER_USERNAME / OWNER_EMAIL
[ ] EMAIL_PROVIDER + RESEND_API_KEY + EMAIL_FROM   (إن جهزت Resend)
[ ] SENTRY_DSN                                     (إن جهزت Sentry)
[ ] GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET + PUBLIC_API_URL  (إن جهزت OAuth)
```

## التحقق بعد الإضافة

```bash
fly secrets list -a medical-sketcher-store1-0
```
تظهر **الأسماء فقط** — Fly لا تعرض القيم أبداً، وهذا هو المتوقع.

## ملاحظتان

1. **ترتيب أولويات التسجيل عندك**: Supabase ✅ → Upstash (دقيقتان، مجاني) → Resend → Sentry → Google OAuth → HyperPay (الأطول: توثيق تاجر). HyperPay هو البند الوحيد الذي يمنع إكمال الجدول 1.
2. `NODE_ENV` و`API_PORT` مضبوطان في `fly.toml` `[env]` — لا تنسخهما كأسرار.
