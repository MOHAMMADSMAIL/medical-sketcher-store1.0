// Owner types for dashboard
export interface OwnerStats {
  totalBooks: number;
  publishedBooks: number;
  draftBooks: number;
  comingSoonBooks: number;
  totalUsers: number;
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  totalDownloads: number;
  pendingReviews: number;
  assessmentAttempts: number;
}

export interface Book {
  id: string;
  titleEn: string;
  titleAr: string;
  titleDe: string;
  slug: string;
  descriptionEn: string;
  descriptionAr: string;
  descriptionDe: string;
  authorId: string;
  author?: Author;
  categoryId: string;
  category?: Category;
  level: string;
  price: number;
  currency: string;
  isFree: boolean;
  status: 'draft' | 'published' | 'coming_soon' | 'archived';
  coverImage: string;
  pdfFile?: string;
  epubFile?: string;
  previewPages?: string[];
  maxDownloads?: number;
  downloadExpiration?: Date;
  seoTitle: string;
  seoDescription: string;
  createdAt: Date;
  updatedAt: Date;
  sales?: number;
}

export interface Author {
  id: string;
  nameEn: string;
  nameAr: string;
  nameDe: string;
  descriptionEn?: string;
  descriptionAr?: string;
  descriptionDe?: string;
  image?: string;
  books?: Book[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  nameEn: string;
  nameAr: string;
  nameDe: string;
  descriptionEn?: string;
  descriptionAr?: string;
  descriptionDe?: string;
  books?: Book[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  user?: User;
  items: OrderItem[];
  totalAmount: number;
  currency: string;
  orderStatus: 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentProvider?: string;
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  bookId: string;
  book?: Book;
  quantity: number;
  price: number;
  createdAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'owner' | 'admin';
  registeredAt: Date;
  lastLogin?: Date;
  orders?: Order[];
  library?: LibraryAccess[];
  downloads?: number;
  isActive: boolean;
}

export interface LibraryAccess {
  id: string;
  userId: string;
  user?: User;
  bookId: string;
  book?: Book;
  accessSource: 'purchase' | 'gift' | 'admin_grant';
  accessStatus: 'active' | 'expired' | 'revoked';
  grantedAt: Date;
  expiresAt?: Date;
  maxDownloads?: number;
  downloadCount: number;
  lastDownloadAt?: Date;
}

export interface Review {
  id: string;
  userId: string;
  user?: User;
  bookId?: string;
  book?: Book;
  lessonId?: string;
  rating: number;
  text: string;
  status: 'pending' | 'approved' | 'rejected' | 'archived';
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Lesson {
  id: string;
  titleEn: string;
  titleAr: string;
  titleDe: string;
  dialogue?: string;
  vocabulary?: string;
  grammarFocus?: string;
  exercises?: string;
  audio?: string;
  images?: string[];
  level: string;
  bookId: string;
  book?: Book;
  lessonOrder: number;
  status: 'draft' | 'published' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

export interface Assessment {
  id: string;
  titleEn: string;
  titleAr: string;
  titleDe: string;
  level: string;
  bookId: string;
  book?: Book;
  questions: AssessmentQuestion[];
  attemptCount: number;
  averageScore?: number;
  isPublished: boolean;
  allowRetakes: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssessmentQuestion {
  id: string;
  assessmentId: string;
  content: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: AssessmentOption[];
  correctAnswer: string;
  explanation?: string;
  questionOrder: number;
  createdAt: Date;
}

export interface AssessmentOption {
  id: string;
  questionId: string;
  content: string;
  isCorrect: boolean;
}

export interface CMSContent {
  id: string;
  type: 'hero' | 'pathway' | 'learning_method' | 'faq' | 'story' | 'homepage' | 'terms' | 'privacy';
  language: 'en' | 'ar' | 'de';
  content: Record<string, any>;
  isDraft: boolean;
  versions: CMSVersion[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CMSVersion {
  id: string;
  contentId: string;
  content: Record<string, any>;
  version: number;
  createdAt: Date;
}

export interface MediaFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: Date;
  usedIn?: string[];
  url: string;
  status: 'active' | 'archived' | 'deleted';
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface OwnerSettings {
  id: string;
  ownerId: string;
  name: string;
  email: string;
  storeName: string;
  defaultCurrency: string;
  maxDownloadsDefault?: number;
  downloadExpirationDays?: number;
  notificationsEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
