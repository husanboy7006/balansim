import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('balansim_token'));

    useEffect(() => {
        if (token) {
            authAPI.getMe()
                .then(res => setUser(res.data))
                .catch(() => {
                    localStorage.removeItem('balansim_token');
                    localStorage.removeItem('balansim_refresh_token');
                    setToken(null);
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [token]);

    const setAuthData = (data) => {
        localStorage.setItem('balansim_token', data.access_token);
        localStorage.setItem('balansim_refresh_token', data.refresh_token);
        setToken(data.access_token);
        setUser(data.user);
    };

    const login = async (phone, otp) => {
        const res = await authAPI.login({ phone, otp });
        setAuthData(res.data);
        return res.data;
    };

    const register = async (data) => {
        const res = await authAPI.register(data);
        setAuthData(res.data);
        return res.data;
    };

    const telegramLogin = async () => {
        const tg = window.Telegram?.WebApp;
        if (!tg?.initData) throw new Error('Telegram Mini App ichida emas');
        const res = await authAPI.telegramAuth(tg.initData);
        setAuthData(res.data);
        return res.data;
    };

    const logout = async () => {
        try {
            await authAPI.logout();
        } catch (e) {
            // ignore if already invalid
        }
        localStorage.removeItem('balansim_token');
        localStorage.removeItem('balansim_refresh_token');
        setToken(null);
        setUser(null);
    };

    const updateUser = (updated) => setUser(updated);

    return (
        <AuthContext.Provider value={{ user, loading, login, register, telegramLogin, logout, updateUser, token }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
