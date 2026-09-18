# Aurelia Books — Canonical 1.0 Foundation

هذه النسخة تعيد تنظيم مشروع Aurelia Books وفق الخطة الموجودة في المحادثة: Monorepo واحد، API، Web، أنواع مشتركة، Prisma، اختبارات، تخزين، وDocker. تم فصل `_conversation_source/` كمصدر تاريخي ولم يعد جزءًا من runtime.

## البنية

```text
apps/api/          API server: auth, catalog, checkout, orders, library, wishlist, reviews, CMS, owner analytics
apps/web/          storefront UI: catalog, filters, cart, checkout handoff
packages/types/    shared domain constants
prisma/            canonical PostgreSQL schema and seed reference
storage/           private-file storage location for PDF/EPUB adapters
tests/             smoke coverage
docker-compose.yml local PostgreSQL
```

## الوظائف المتاحة في هذه النسخة

تعمل مسارات الكتالوج، التسجيل والدخول، الحساب، checkout، الطلبات، المكتبة، wishlist، reviews، CMS public pages، وowner analytics. الواجهة تتضمن كتالوجًا وسلة وcheckout demo. مخطط Prisma يعرّف المستخدمين والكتب والمؤلفين والتصنيفات والسلة والطلبات والمراجعات والتنزيلات وCMS وaudit وanalytics.

## تشغيل

```bash
npm run check
PORT=3102 npm start
```

في نافذة ثانية:

```bash
npm test
```

ثم افتح `http://localhost:3102`.

## تنبيه الإنتاج

الـAPI الحالي يعمل دون اعتماد خارجي ويستخدم ذاكرة العملية لتسهيل التشغيل والفحص؛ مخطط Prisma وDocker موجودان كأساس PostgreSQL canonical، لكن ربط Prisma الفعلي، مزود دفع حي، تخزين PDF/EPUB خاص، البريد، ومصادقة إنتاجية يجب تفعيلها بمفاتيح وخدمات حقيقية قبل قبول أموال أو نشر تجاري. لا توجد أسرار حقيقية في الحزمة.
