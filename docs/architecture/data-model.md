# Aurelia Books — Data Model (Prisma Entities)

> Generated from `prisma/schema.prisma`. Rendered directly on GitHub (Mermaid).

```mermaid
erDiagram
    USER ||--o{ SESSION : "has"
    USER ||--o| CART : "owns"
    USER ||--o{ ORDER : "places"
    USER ||--o{ WISHLIST_ITEM : "saves"
    USER ||--o{ REVIEW : "writes"
    USER ||--o{ DOWNLOAD_PERMISSION : "granted"
    USER ||--o{ AUDIT_LOG : "acts in"
    USER ||--o{ ANALYTICS_EVENT : "triggers"
    USER ||--o{ PASSWORD_RESET_TOKEN : "requests"

    CART ||--o{ CART_ITEM : "contains"
    PRODUCT ||--o{ CART_ITEM : "referenced by"
    PRODUCT }o--|| AUTHOR : "written by"
    PRODUCT }o--|| CATEGORY : "classified as"
    PRODUCT ||--o{ ORDER_ITEM : "sold as"
    PRODUCT ||--o{ WISHLIST_ITEM : "wished by"
    PRODUCT ||--o{ REVIEW : "reviewed in"
    PRODUCT ||--o{ DOWNLOAD_PERMISSION : "protected by"
    PRODUCT ||--o{ MEDIA : "has files"

    ORDER ||--o{ ORDER_ITEM : "line items"
    ORDER ||--o{ PAYMENT : "paid via"
    ORDER ||--o{ DOWNLOAD_PERMISSION : "source of"
    ORDER_ITEM }o--|| PRODUCT : "is"

    DOWNLOAD_PERMISSION ||--o{ DOWNLOAD_LOG : "recorded in"

    PAGE ||--o{ SECTION : "composed of"
    PAGE ||--o{ PAGE_VERSION : "versioned"

    LEARNING_CONTENT }o--o| MEDIA : "attached to"
```

## Notes

| Model | Purpose | Security-relevant fields |
|---|---|---|
| `User` | Customers + ADMIN/OWNER roles | `passwordHash` (bcrypt), `role` |
| `Session` | Server-side sessions | `tokenHash` (hashed cookie token) |
| `Product` | Books | `status` (DRAFT/PUBLISHED/COMING_SOON/ARCHIVED), `archivedAt` |
| `Payment` | HyperPay/development payments | `checkoutId`, `transactionId`, `idempotencyKey` |
| `DownloadPermission` | DRM grant per user+product | `revokedAt`, `maxDownloads`, `downloadCount`, `expiresAt` |
| `DownloadLog` | Per-download audit | `ip`, `userAgent`, `status` |
| `AuditLog` | Owner mutation trail | `action`, `entity`, `metadata` |
| `Page`/`Section`/`PageVersion` | CMS (legal pages live here) | `status` (DRAFT/PUBLISHED) |
| `Media` | Stored files metadata | `storageKey` (never the file itself) |

Money columns (`Order.total`, `Payment.amount`, `Product.price`, `OrderItem.price`) are `DECIMAL(65,30)` to match Prisma Decimal semantics.
