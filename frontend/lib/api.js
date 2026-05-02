import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Add token to all requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('skillswap_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 responses (expired token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('skillswap_token');
      localStorage.removeItem('skillswap_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// User API
export const userAPI = {
  getUser: (id) => api.get(`/users/${id}`),
  updateProfile: (data) => api.put('/users/profile', data),
  getUsers: (params) => api.get('/users', { params }),
  getLeaderboard: () => api.get('/users/leaderboard'),
  getUserReviews: (id) => api.get(`/users/${id}/reviews`),
  blockUser: (id) => api.post(`/users/${id}/block`),
};

// Match API
export const matchAPI = {
  findMatches: () => api.get('/matches'),
  getRecommendations: () => api.get('/matches/recommendations'),
};

// Session API
export const sessionAPI = {
  createSession: (data) => api.post('/sessions', data),
  getSessions: (params) => api.get('/sessions', { params }),
  updateStatus: (id, status) => api.patch(`/sessions/${id}/status`, { status }),
  createReview: (id, data) => api.post(`/sessions/${id}/review`, data),
};

// Conversation API
export const conversationAPI = {
  getOrCreate: (participantId) => api.post('/conversations', { participantId }),
  getAll: () => api.get('/conversations'),
  getMessages: (id, page) => api.get(`/conversations/${id}/messages`, { params: { page } }),
};

// Admin API
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getAllUsers: (params) => api.get('/admin/users', { params }),
  updateUserRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
};

export default api;
