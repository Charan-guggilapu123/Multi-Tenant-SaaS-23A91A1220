import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Users() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newUser, setNewUser] = useState({ fullName: '', email: '', password: '', role: 'user' });

    useEffect(() => {
        if (user && user.role !== 'tenant_admin' && user.role !== 'super_admin') {
            navigate('/dashboard');
            return;
        }
        fetchUsers();
    }, [user]);

    const fetchUsers = async () => {
        try {
            if (user?.tenant?.id) {
                const res = await api.get(`/tenants/${user.tenant.id}/users`);
                setUsers(res.data.data.users);
            }
        } catch (e) { console.error(e); }
    };

    const createUser = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/tenants/${user.tenant.id}/users`, newUser);
            setShowModal(false);
            setNewUser({ fullName: '', email: '', password: '', role: 'user' });
            fetchUsers();
        } catch (e) {
            alert(e.response?.data?.message || 'Error creating user');
        }
    };

    const deleteUser = async (id) => {
        if (!confirm("Delete User?")) return;
        try {
            await api.delete(`/users/${id}`);
            fetchUsers();
        } catch (e) { alert(e.response?.data?.message || "Error"); }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Users Management</h1>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add User</button>
            </div>

            <div className="card" style={{ padding: 0 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f9fafb', borderBottom: '1px solid #eee' }}>
                        <tr>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Full Name</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Email</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Role</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '1rem' }}>{u.fullName}</td>
                                <td style={{ padding: '1rem' }}>{u.email}</td>
                                <td style={{ padding: '1rem' }}>{u.role}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{ color: u.isActive ? 'green' : 'red' }}>{u.isActive ? 'Active' : 'Inactive'}</span>
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    {user.id !== u.id && <button style={{ color: 'red', background: 'none', border: 'none' }} onClick={() => deleteUser(u.id)}>Delete</button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="card" style={{ width: '400px' }}>
                        <h2>New User</h2>
                        <form onSubmit={createUser}>
                            <label>Full Name</label>
                            <input value={newUser.fullName} onChange={e => setNewUser({ ...newUser, fullName: e.target.value })} required />
                            <label>Email</label>
                            <input type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} required />
                            <label>Password</label>
                            <input type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} required minLength={8} />
                            <label>Role</label>
                            <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                                <option value="user">User</option>
                                <option value="tenant_admin">Admin</option>
                            </select>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                <button type="button" className="btn" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
