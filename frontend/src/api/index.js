import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL: API_URL.endsWith('/api') ? API_URL.replace('/api', '') : API_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('balansim_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Handle 401s and Refresh Token
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers['Authorization'] = 'Bearer ' + token;
                    return api(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = localStorage.getItem('balansim_refresh_token');
            if (!refreshToken) {
                isRefreshing = false;
                window.location.href = '/login';
                return Promise.reject(error);
            }

            try {
                const res = await axios.post(`${api.defaults.baseURL}/api/auth/refresh`, {
                    refresh_token: refreshToken
                });

                const newToken = res.data.access_token;
                const newRefreshToken = res.data.refresh_token;

                localStorage.setItem('balansim_token', newToken);
                localStorage.setItem('balansim_refresh_token', newRefreshToken);

                api.defaults.headers.common['Authorization'] = 'Bearer ' + newToken;
                originalRequest.headers['Authorization'] = 'Bearer ' + newToken;

                processQueue(null, newToken);
                return api(originalRequest);
            } catch (err) {
                processQueue(err, null);
                localStorage.removeItem('balansim_token');
                localStorage.removeItem('balansim_refresh_token');
                window.location.href = '/login';
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(error);
    }
);

// Auth
export const authAPI = {
    register: (data) => api.post('/api/auth/register', data),
    login: (data) => api.post('/api/auth/login', data),
    sendOTP: (phone) => api.post('/api/auth/phone/send-otp', { phone }),
    telegramAuth: (initData) => api.post('/api/auth/telegram', { init_data: initData }),
    getMe: () => api.get('/api/auth/me'),
    updateMe: (data) => api.put('/api/auth/me', data),
    setPin: (pin) => api.post('/api/auth/pin/set', { pin }),
    verifyPin: (pin) => api.post('/api/auth/pin/verify', { pin }),
    logout: () => api.post('/api/auth/logout'),
};

// Accounts
export const accountsAPI = {
    getAll: () => api.get('/api/accounts/'),
    create: (data) => api.post('/api/accounts/', data),
    update: (id, data) => api.put(`/api/accounts/${id}`, data),
    delete: (id) => api.delete(`/api/accounts/${id}`),
};

// Transactions
export const transactionsAPI = {
    getAll: (params) => api.get('/api/transactions/', { params }),
    getOne: (id) => api.get(`/api/transactions/${id}`),
    create: (data) => api.post('/api/transactions/', data),
    update: (id, data) => api.put(`/api/transactions/${id}`, data),
    delete: (id) => api.delete(`/api/transactions/${id}`),
};

// Categories
export const categoriesAPI = {
    getAll: (type) => api.get('/api/categories/', { params: type ? { type } : {} }),
    create: (data) => api.post('/api/categories/', data),
    update: (id, data) => api.put(`/api/categories/${id}`, data),
    delete: (id) => api.delete(`/api/categories/${id}`),
};

// Debts
export const debtsAPI = {
    getAll: (params) => api.get('/api/debts/', { params }),
    create: (data) => api.post('/api/debts/', data),
    update: (id, data) => api.put(`/api/debts/${id}`, data),
    pay: (id, amount) => api.post(`/api/debts/${id}/pay`, { amount }),
    delete: (id) => api.delete(`/api/debts/${id}`),
};

// Goals
export const goalsAPI = {
    getAll: () => api.get('/api/goals/'),
    create: (data) => api.post('/api/goals/', data),
    update: (id, data) => api.put(`/api/goals/${id}`, data),
    contribute: (id, amount) => api.post(`/api/goals/${id}/contribute`, { amount }),
    delete: (id) => api.delete(`/api/goals/${id}`),
};

// Stats
export const statsAPI = {
    getOverview: () => api.get('/api/stats/overview'),
    getByCategory: (type, period) => api.get('/api/stats/by-category', { params: { type, period } }),
    getCashflow: (period) => api.get('/api/stats/cashflow', { params: { period } }),
};

export default api;
