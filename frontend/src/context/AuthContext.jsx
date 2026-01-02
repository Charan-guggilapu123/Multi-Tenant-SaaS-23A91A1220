import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const res = await api.get('/auth/me');
            setUser(res.data.data);
        } catch (error) {
            console.error(error);
            localStorage.removeItem('token');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password, subdomain) => {
        const res = await api.post('/auth/login', { email, password, tenantSubdomain: subdomain });
        localStorage.setItem('token', res.data.data.token);
        setUser(res.data.data.user);
        return res.data;
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (e) { }
        localStorage.removeItem('token');
        setUser(null);
    };

    const registerTenant = async (data) => {
        return api.post('/auth/register-tenant', data);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, registerTenant, loading, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};
