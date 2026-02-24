import axios from 'axios';

const API_BASE_URL = window.__ENV__?.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle token expiration and authorization errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.error('Unauthorized (401):', error.response?.data);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        } else if (error.response?.status === 403) {
            console.error('Forbidden (403):', error.response?.data);
            // User doesn't have permission - could be wrong role
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: (username, password) =>
        api.post('/users/login', { username, password }),
};

// Customer Admin API
export const customerAPI = {
    getAll: () => api.get('/admin/customers'),
    create: (data) => api.post('/admin/customers', data),
    update: (id, data) => api.put(`/admin/customers/${id}`, data),
    delete: (id) => api.delete(`/admin/customers/${id}`),
    updateSubscription: (id, subscriptionType, subscriptionExpiredAt) =>
        api.patch(`/admin/customers/${id}/subscription`, { subscriptionType, subscriptionExpiredAt }),
    invalidateSession: (username) => api.post(`/customers/${username}/invalidate-session`),
};

export default api;

