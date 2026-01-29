import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Create axios instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }
        
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });
        
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  githubCallback: (code: string) => api.get(`/auth/github/callback?code=${code}`),
  refreshToken: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

// Monitors API
export const monitorsApi = {
  getAll: (params?: { page?: number; limit?: number }) => 
    api.get('/monitors', { params }),
  getById: (id: string) => api.get(`/monitors/${id}`),
  create: (data: any) => api.post('/monitors', data),
  update: (id: string, data: any) => api.patch(`/monitors/${id}`, data),
  delete: (id: string) => api.delete(`/monitors/${id}`),
  pause: (id: string) => api.post(`/monitors/${id}/pause`),
  resume: (id: string) => api.post(`/monitors/${id}/resume`),
  test: (data: any) => api.post('/monitors/test', data),
  getChecks: (id: string, params?: { page?: number; limit?: number }) => 
    api.get(`/monitors/${id}/checks`, { params }),
  getIncidents: (id: string, params?: { page?: number; limit?: number }) => 
    api.get(`/monitors/${id}/incidents`, { params }),
  getStats: (id: string) => api.get(`/monitors/${id}/stats`),
};

// Status Pages API
export const statusPagesApi = {
  getAll: () => api.get('/status-pages'),
  getById: (id: string) => api.get(`/status-pages/${id}`),
  getBySlug: (slug: string) => api.get(`/status/${slug}`),
  create: (data: any) => api.post('/status-pages', data),
  update: (id: string, data: any) => api.patch(`/status-pages/${id}`, data),
  delete: (id: string) => api.delete(`/status-pages/${id}`),
};

// Dashboard API
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
};
