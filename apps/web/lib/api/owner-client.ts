// API Client for Owner endpoints
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const csrfHeaders = async (): Promise<Record<string, string>> => {
  let token = document.cookie.split('; ').find(value => value.startsWith('aurelia_csrf='))?.split('=')[1];
  if (!token) { await fetch(`${API_URL}/api/auth/csrf`, { credentials: 'include' }); token = document.cookie.split('; ').find(value => value.startsWith('aurelia_csrf='))?.split('=')[1]; }
  return token ? { 'X-CSRF-Token': token } : {};
};

class OwnerAPIClient {
  private baseURL = `${API_URL}/api`;

  private async fetchWithAuth(url: string, options: RequestInit = {}) {
    const csrf = !['GET', 'HEAD', 'OPTIONS'].includes((options.method || 'GET').toUpperCase()) ? await csrfHeaders() : {};
    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');
    Object.entries(csrf).forEach(([name, value]) => headers.set(name, value));
    const response = await fetch(`${this.baseURL}${url}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Dashboard
  async getDashboardStats() {
    return this.fetchWithAuth('/owner/dashboard/stats');
  }

  // Books
  async getBooks(page = 1, limit = 10, filters?: any) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    return this.fetchWithAuth(`/owner/books?${params.toString()}`);
  }

  async getBook(id: string) {
    return this.fetchWithAuth(`/owner/books/${id}`);
  }

  async createBook(data: any) {
    return this.fetchWithAuth('/owner/books', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateBook(id: string, data: any) {
    return this.fetchWithAuth(`/owner/books/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async publishBook(id: string) {
    return this.fetchWithAuth(`/owner/books/${id}/publish`, { method: 'POST' });
  }

  async unpublishBook(id: string) {
    return this.fetchWithAuth(`/owner/books/${id}/unpublish`, { method: 'POST' });
  }

  async archiveBook(id: string) {
    return this.fetchWithAuth(`/owner/books/${id}/archive`, { method: 'POST' });
  }

  async restoreBook(id: string) {
    return this.fetchWithAuth(`/owner/books/${id}/restore`, { method: 'POST' });
  }

  async deleteBook(id: string) {
    return this.fetchWithAuth(`/owner/books/${id}`, { method: 'DELETE' });
  }

  // Upload book files
  async uploadBookFile(bookId: string, file: File, fileType: 'pdf' | 'epub' | 'cover' | 'preview') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileType', fileType);
    
    return fetch(`${this.baseURL}/owner/books/${bookId}/upload`, {
      method: 'POST',
      body: formData,
      headers: await csrfHeaders(),
      credentials: 'include',
    }).then(r => {
      if (!r.ok) throw new Error('Upload failed');
      return r.json();
    });
  }

  // Authors
  async getAuthors(page = 1, limit = 10, search?: string) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.append('search', search);
    return this.fetchWithAuth(`/owner/authors?${params.toString()}`);
  }

  async getAuthor(id: string) {
    return this.fetchWithAuth(`/owner/authors/${id}`);
  }

  async createAuthor(data: any) {
    return this.fetchWithAuth('/owner/authors', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateAuthor(id: string, data: any) {
    return this.fetchWithAuth(`/owner/authors/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async archiveAuthor(id: string) {
    return this.fetchWithAuth(`/owner/authors/${id}/archive`, { method: 'POST' });
  }

  async deleteAuthor(id: string) {
    return this.fetchWithAuth(`/owner/authors/${id}`, { method: 'DELETE' });
  }

  // Categories
  async getCategories(page = 1, limit = 10, search?: string) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.append('search', search);
    return this.fetchWithAuth(`/owner/categories?${params.toString()}`);
  }

  async getCategory(id: string) {
    return this.fetchWithAuth(`/owner/categories/${id}`);
  }

  async createCategory(data: any) {
    return this.fetchWithAuth('/owner/categories', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateCategory(id: string, data: any) {
    return this.fetchWithAuth(`/owner/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteCategory(id: string) {
    return this.fetchWithAuth(`/owner/categories/${id}`, { method: 'DELETE' });
  }

  // Orders
  async getOrders(page = 1, limit = 10, filters?: any) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (filters?.paymentStatus) params.append('paymentStatus', filters.paymentStatus);
    if (filters?.orderStatus) params.append('orderStatus', filters.orderStatus);
    return this.fetchWithAuth(`/owner/orders?${params.toString()}`);
  }

  async getOrder(id: string) {
    return this.fetchWithAuth(`/owner/orders/${id}`);
  }

  // Users
  async getUsers(page = 1, limit = 10, search?: string) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.append('search', search);
    return this.fetchWithAuth(`/owner/users?${params.toString()}`);
  }

  async getUser(id: string) {
    return this.fetchWithAuth(`/owner/users/${id}`);
  }

  async updateUserRole(id: string, role: string) {
    return this.fetchWithAuth(`/owner/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  async grantLibraryAccess(userId: string, bookId: string) {
    return this.fetchWithAuth(`/owner/users/${userId}/library/${bookId}`, { method: 'POST' });
  }

  async revokeLibraryAccess(userId: string, bookId: string) {
    return this.fetchWithAuth(`/owner/users/${userId}/library/${bookId}`, { method: 'DELETE' });
  }

  // Library
  async getLibraryAccess(page = 1, limit = 10) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    return this.fetchWithAuth(`/owner/library?${params.toString()}`);
  }

  async extendLibraryAccess(id: string, expiryDate: Date) {
    return this.fetchWithAuth(`/owner/library/${id}/extend`, {
      method: 'POST',
      body: JSON.stringify({ expiryDate }),
    });
  }

  // Reviews
  async getReviews(approved?: boolean, page = 1, limit = 10) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (approved !== undefined) params.append('approved', String(approved));
    return this.fetchWithAuth(`/owner/reviews?${params.toString()}`);
  }

  async approveReview(id: string) {
    return this.fetchWithAuth(`/owner/reviews/${id}/approve`, { method: 'POST' });
  }

  async rejectReview(id: string, reason?: string) {
    return this.fetchWithAuth(`/owner/reviews/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async archiveReview(id: string) {
    return this.fetchWithAuth(`/owner/reviews/${id}/archive`, { method: 'POST' });
  }

  // Lessons
  async getLessons(page = 1, limit = 10) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    return this.fetchWithAuth(`/owner/lessons?${params.toString()}`);
  }

  async getLesson(id: string) {
    return this.fetchWithAuth(`/owner/lessons/${id}`);
  }

  async createLesson(data: any) {
    return this.fetchWithAuth('/owner/lessons', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateLesson(id: string, data: any) {
    return this.fetchWithAuth(`/owner/lessons/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async publishLesson(id: string) {
    return this.fetchWithAuth(`/owner/lessons/${id}/publish`, { method: 'POST' });
  }

  async deleteLesson(id: string) {
    return this.fetchWithAuth(`/owner/lessons/${id}`, { method: 'DELETE' });
  }

  // Assessments
  async getAssessments(page = 1, limit = 10) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    return this.fetchWithAuth(`/owner/assessments?${params.toString()}`);
  }

  async getAssessment(id: string) {
    return this.fetchWithAuth(`/owner/assessments/${id}`);
  }

  async createAssessment(data: any) {
    return this.fetchWithAuth('/owner/assessments', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateAssessment(id: string, data: any) {
    return this.fetchWithAuth(`/owner/assessments/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async publishAssessment(id: string) {
    return this.fetchWithAuth(`/owner/assessments/${id}/publish`, { method: 'POST' });
  }

  async deleteAssessment(id: string) {
    return this.fetchWithAuth(`/owner/assessments/${id}`, { method: 'DELETE' });
  }

  // CMS
  async getCMSContent(type: string, language: string) {
    return this.fetchWithAuth(`/owner/cms?type=${type}&language=${language}`);
  }

  async updateCMSContent(id: string, content: any) {
    return this.fetchWithAuth(`/owner/cms/${id}`, { method: 'PUT', body: JSON.stringify({ content }) });
  }

  async publishCMS(id: string) {
    return this.fetchWithAuth(`/owner/cms/${id}/publish`, { method: 'POST' });
  }

  // Media
  async uploadMedia(file: File, type: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return fetch(`${this.baseURL}/owner/media/upload`, {
      method: 'POST',
      body: formData,
      headers: await csrfHeaders(),
      credentials: 'include',
    }).then(r => r.json());
  }

  async getMedia(page = 1, limit = 10, type?: string) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (type) params.append('type', type);
    return this.fetchWithAuth(`/owner/media?${params.toString()}`);
  }

  async deleteMedia(id: string) {
    return this.fetchWithAuth(`/owner/media/${id}`, { method: 'DELETE' });
  }
  // Learning Content: Reading, Writing, Listening and Speaking
  async getLearningContent(page = 1, limit = 20, filters?: any) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    for (const key of ['type', 'status', 'visibility', 'search']) if (filters?.[key]) params.append(key, String(filters[key]));
    return this.fetchWithAuth(`/owner/learning-content?${params.toString()}`);
  }
  async createLearningContent(data: any) {
    return this.fetchWithAuth('/owner/learning-content', { method: 'POST', body: JSON.stringify(data) });
  }
  async updateLearningContent(id: string, data: any) {
    return this.fetchWithAuth(`/owner/learning-content/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  }
  async publishLearningContent(id: string) {
    return this.fetchWithAuth(`/owner/learning-content/${id}/publish`, { method: 'POST' });
  }
  async archiveLearningContent(id: string) {
    return this.fetchWithAuth(`/owner/learning-content/${id}/archive`, { method: 'POST' });
  }

  // Audit Logs
  async getAuditLogs(page = 1, limit = 10, filters?: any) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (filters?.action) params.append('action', filters.action);
    if (filters?.userId) params.append('userId', filters.userId);
    return this.fetchWithAuth(`/owner/audit-logs?${params.toString()}`);
  }

  // Settings
  async getSettings() {
    return this.fetchWithAuth('/owner/settings');
  }

  async updateSettings(data: any) {
    return this.fetchWithAuth('/owner/settings', { method: 'PUT', body: JSON.stringify(data) });
  }
}

export const ownerAPI = new OwnerAPIClient();
