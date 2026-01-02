import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [theme, setTheme] = useState('dark');

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <Link to="/" style={{ fontSize: '1.5rem', fontWeight: 'bold', textDecoration: 'none', color: 'var(--primary-color)' }}>
                    SaaS Platform {user?.tenant?.name && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>| {user.tenant.name}</span>}
                </Link>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Link to="/dashboard" style={{ textDecoration: 'none', color: 'var(--text-main)' }}>Dashboard</Link>
                    <Link to="/projects" style={{ textDecoration: 'none', color: 'var(--text-main)' }}>Projects</Link>
                    {(user.role === 'tenant_admin' || user.role === 'super_admin') && (
                        <Link to="/users" style={{ textDecoration: 'none', color: 'var(--text-main)' }}>Users</Link>
                    )}
                </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button 
                    className="theme-toggle" 
                    onClick={toggleTheme}
                    title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                    {theme === 'dark' ? '☀️' : '🌙'}
                </button>
                <span>{user.fullName} ({user.role})</span>
                <button className="btn btn-primary" onClick={handleLogout}>Logout</button>
            </div>
        </nav>
    );
}
