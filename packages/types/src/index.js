export const ORDER_STATUS = Object.freeze(['PENDING','PAID','FULFILLED','CANCELLED']);
export const PRODUCT_STATUS = Object.freeze(['DRAFT','PUBLISHED','COMING_SOON']);
export const ROLES = Object.freeze(['USER','OWNER']);
export const money = value => Number(Number(value).toFixed(2));
