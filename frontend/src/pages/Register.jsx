import { useState } from 'react';
import api from '../services/api';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
    const [formData, setFormData] = useState({
        tenantName: '',
        subdomain: '',
        adminEmail: '',
        adminFullName: '',
        adminPassword: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.adminPassword !== formData.confirmPassword) {
            setError("Passwords don't match");
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/register-tenant', formData);
            alert('Registration successful! Please login.');
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Register Organization</h2>
                {error && <div style={{ color: 'red', marginBottom: '1rem', background: '#fee2e2', padding: '0.5rem', borderRadius: '4px' }}>{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div>
                        <label>Organization Name</label>
                        <input name="tenantName" value={formData.tenantName} onChange={handleChange} required />
                    </div>
                    <div>
                        <label>Subdomain</label>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <input name="subdomain" value={formData.subdomain} onChange={handleChange} required style={{ marginBottom: 0 }} />
                            <span style={{ marginLeft: '5px', color: '#666', marginBottom: '1rem' }}>.saasA.com</span>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label>Admin Name</label>
                            <input name="adminFullName" value={formData.adminFullName} onChange={handleChange} required />
                        </div>
                        <div>
                            <label>Admin Email</label>
                            <input type="email" name="adminEmail" value={formData.adminEmail} onChange={handleChange} required />
                        </div>
                    </div>
                    <div>
                        <label>Password</label>
                        <input type="password" name="adminPassword" value={formData.adminPassword} onChange={handleChange} required minLength={8} />
                    </div>
                    <div>
                        <label>Confirm Password</label>
                        <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />
                    </div>
                    <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                </form>
                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                    <Link to="/login">Already have an account? Login</Link>
                </div>
            </div>
        </div>
    );
}
