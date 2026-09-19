export const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3000';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function api<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (typeof document !== 'undefined' && !['GET', 'HEAD', 'OPTIONS'].includes((init.method || 'GET').toUpperCase())) {
    let token = document.cookie.split('; ').find(value => value.startsWith('aurelia_csrf='))?.split('=')[1];
    if (!token) {
      await fetch(`${API_URL}/api/auth/csrf`, { credentials: 'include' });
      token = document.cookie.split('; ').find(value => value.startsWith('aurelia_csrf='))?.split('=')[1];
    }
    if (token) headers.set('X-CSRF-Token', token);
  }
  const response = await fetch(`${API_URL}/api${path}`, { ...init, headers, credentials: 'include' });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(data?.message || `Request failed (${response.status})`, response.status);
  }
  return data as T;
}

export function money(price: number | string, currency = 'USD') {
  const value = Number(price || 0);
  if (currency === 'JD' || currency === 'JOD') return `${value.toFixed(value % 1 ? 2 : 0)} JD`;
  if (currency === 'EUR') return `€${value.toFixed(2)}`;
  return `$${value.toFixed(2)}`;
}

export const COVER_COLORS = ['#566248', '#9c7953', '#343b33', '#747c60', '#8e6b69', '#7d634e'];

export function coverColor(index: number) {
  return COVER_COLORS[index % COVER_COLORS.length];
}

export function ratingOf(reviews?: { rating: number }[]) {
  if (!reviews?.length) return '4.8';
  return (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1);
}
