# تقرير تفعيل Aurelia Books

## ما تمت مراجعته

تم فتح مستودع GitHub عبر متصفح المستخدم قبل التنفيذ، ثم استنساخه وفحص `README.md` و`prisma/schema.prisma` وملفات `apps/api/src` وملفات البيئة وDocker. الحالة الأصلية كانت تستخدم SQLite في المخطط، ومزود دفع تطويرياً، وتخزيناً محلياً.

## الاختيار المعماري

أوصي باستخدام **Supabase** في المرحلة الأولى لأنه يقدم PostgreSQL مُداراً ومتوافقاً مباشرة مع Prisma، مع Storage خاص في نفس المشروع والفوترة، وروابط موقعة مؤقتة للملفات المدفوعة. هذا يبسط الإدارة مقارنة بتوزيع قاعدة البيانات على مزود وملفات الكتب على مزود آخر. الخطة المجانية مناسبة للتجربة فقط، لكنها قد توقف المشروع غير النشط وتملك حدوداً صغيرة للملفات والخروج؛ للإنتاج التجاري ينبغي استخدام Pro أو مزود منفصل عند زيادة حجم الكتب أو التنزيلات.

البديل الأفضل عند نمو الملفات والتنزيلات هو **PostgreSQL مُدار + Cloudflare R2 أو Amazon S3**. ذلك عادةً أفضل من ناحية تكلفة التخزين/الخروج والتحكم في CDN، لكنه يضيف حساباً وفوترة وإعدادات IAM ونسخاً احتياطية منفصلة. واجهة `StorageProvider` الحالية تجعل استبداله لاحقاً ممكناً.

## التعديلات المنفذة

| المجال | التنفيذ |
|---|---|
| قاعدة البيانات | تغيير datasource Prisma إلى PostgreSQL مع الحفاظ على النماذج الحالية: المستخدمون، المصادقة، الكتب، المؤلفون، التصنيفات، السلة، الطلبات، المكتبة، wishlist، المراجعات، CMS، audit وanalytics. |
| الدفع | إضافة `checkoutId`, `resultCode`, `resultDescription`, `paidAt` إلى Payment. تنفيذ HyperPay checkout creation والتحقق من النتيجة، وتحديث Order والصلاحيات داخل transaction وبشكل قابل للتكرار. |
| التخزين | إضافة Supabase private bucket adapter مع رفع server-side وروابط تنزيل موقعة منتهية الصلاحية. لا يتم تخزين محتوى PDF/EPUB داخل PostgreSQL؛ يخزن `Media.storageKey` والبيانات الوصفية فقط. |
| المسارات | الإبقاء على المسارات الحالية للدفع والتحميل والرفع؛ تم تحديث التنفيذ الداخلي فقط. |
| seed | إضافة `scripts/seed-storage.ts` لرفع ملفات `storage/books/*.txt` التجريبية إلى bucket وربطها بجدول Media. |
| البيئة | تحديث `.env.example` بكل متغيرات PostgreSQL وSupabase وHyperPay. |

## التحقق

نجح `npm run check` لكل monorepo، ونجحت `npm test` الحالية، ونجح `prisma generate` و`prisma validate` باستخدام PostgreSQL URL تجريبي. لم يتم تشغيل `prisma migrate dev` على قاعدة خارجية لأن بيانات الاتصال الحقيقية لم تُقدّم في المستودع أو الجلسة؛ تشغيله يتطلب URL فعلياً.

## خطوات التفعيل بالترتيب

1. أنشئ مشروعاً في Supabase، ثم أنشئ bucket باسم `books-private` واجعله **Private**. لا تضع `SUPABASE_SERVICE_ROLE_KEY` في الواجهة أو GitHub.
2. انسخ `.env.example` إلى `.env` واملأ `DATABASE_URL` من اتصال PostgreSQL الخاص بـSupabase مع `sslmode=require`، ثم املأ `SUPABASE_URL` و`SUPABASE_SERVICE_ROLE_KEY`.
3. أنشئ حساب HyperPay، ثم ضع بيانات بيئة الاختبار: `HYPERPAY_BASE_URL=https://test.oppwa.com` و`HYPERPAY_ENTITY_ID` و`HYPERPAY_ACCESS_TOKEN`. للإنتاج استخدم endpoint وبيانات الإنتاج التي يوفرها HyperPay بعد اعتماد الحساب.
4. ثبّت الحزم ثم ولّد عميل Prisma:

```bash
npm install
npm run db:generate
```

5. نفّذ migration على قاعدة Supabase:

```bash
npm run db:migrate
```

6. أدخل بيانات المستخدمين والكتب والصفحة التجريبية:

```bash
npm run db:seed
```

7. ارفع ملفات الكتب التجريبية إلى التخزين الخاص واربطها بجدول `Media`:

```bash
npm run storage:seed
```

8. شغّل الفحوصات والخدمات:

```bash
npm run check
npm run dev
```

9. اضبط HyperPay ليعيد النتيجة إلى واجهة المتجر، واجعل الخادم قابلاً للوصول عبر HTTPS. مسار التحديث الخلفي المتاح هو `POST /api/payments/webhook` مع `paymentId` أو `checkoutId`; يقوم الخادم بإعادة التحقق من HyperPay قبل منح صلاحيات التحميل. لا تعتبر callback من المتصفح وحدها دليلاً على الدفع.

10. قبل قبول أموال حقيقية، اختبر حالات النجاح والفشل والتكرار، وتحقق من أن ملفات bucket غير عامة وأن مفتاح الخدمة لا يظهر في `apps/web` أو سجلات CI.

## حدود مهمة

لم يتم وضع أسرار حقيقية أو إنشاء مشروع Supabase/HyperPay نيابةً عن المالك. لذلك لا يمكن إثبات اتصال حي أو تنفيذ migration خارجي من هذه الجلسة. كما أن HyperPay يتطلب تفعيل حساب التاجر والبيانات الصحيحة من لوحة HyperPay؛ الكود جاهز للتفعيل عند إدخالها.

## مصادر رسمية

- [HyperPay Integration Guide](https://www.hyperpay.com/integration-guide/)
- [Supabase signed URLs](https://supabase.com/docs/reference/javascript/storage-from-createsignedurl)
- [Supabase Pricing](https://supabase.com/pricing)
