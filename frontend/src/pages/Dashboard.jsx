import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function Dashboard() {
    const { user } = useAuth();
    const [tenantStats, setTenantStats] = useState(null);
    const [projects, setProjects] = useState([]);
    const [myTasks, setMyTasks] = useState([]);

    useEffect(() => {
        if (!user) return;
        fetchData();
    }, [user]);

    const fetchData = async () => {
        try {
            // 1. Tenant Stats
            if (user?.tenant?.id) {
                const tRes = await api.get(`/tenants/${user.tenant.id}`);
                setTenantStats(tRes.data.data.stats);
            }

            // 2. Recent Projects
            const pRes = await api.get('/projects?limit=5');
            setProjects(pRes.data.data.projects);

            // 3. My Tasks (dashboard section)
            const tRes = await api.get('/tasks/my');
            setMyTasks(tRes.data.data.tasks || []);

        } catch (e) { console.error(e); }
    };

    return (
        <div>
            <h1>Dashboard</h1>

            {tenantStats && (
                <div className="stats-grid" style={{ marginBottom: '2rem' }}>
                    <div className="stat-card stat-preferences">
                        <h3>Total Users</h3>
                        <p className="stat-number">{tenantStats.totalUsers}</p>
                    </div>
                    <div className="stat-card stat-projects">
                        <h3>Total Projects</h3>
                        <p className="stat-number">{tenantStats.totalProjects}</p>
                    </div>
                    <div className="stat-card stat-tasks">
                        <h3>Total Tasks</h3>
                        <p className="stat-number">{tenantStats.totalTasks}</p>
                    </div>
                </div>
            )}

            <div className="project-section">
                <h2 style={{ marginBottom: '1rem' }}>Active Projects</h2>
                <div className="project-list">
                    {projects.map(p => (
                        <div key={p.id} className="project-item">
                            <div className="project-header">
                                <h3 className="project-title">{p.name}</h3>
                                <span className="time-badge">{p.taskCount} tasks</span>
                            </div>
                            <p className="project-description">{p.description?.substring(0, 150)}...</p>
                            <div className="project-footer">
                                <span className="deadline">Status: {p.status}</span>
                                <Link to={`/projects/${p.id}`} className="btn-submit">View Details →</Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <h2 style={{ marginTop: '2rem' }}>My Tasks</h2>
            {myTasks.length === 0 ? (
                <p>No tasks assigned to you yet.</p>
            ) : (
                <div className="grid-cards">
                    {myTasks.map(t => (
                        <div key={t.id} className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0 }}>{t.title}</h3>
                                <span className={`badge badge-${t.status}`} style={{ background: '#e5e7eb', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{t.status}</span>
                            </div>
                            <p style={{ marginTop: '0.5rem' }}>{t.description}</p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontSize: '0.9rem' }}>
                                <span>Project: <Link to={`/projects/${t.project.id}`}>{t.project.name}</Link></span>
                                <span className={`badge badge-${t.priority}`} style={{ background: '#eef2ff', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>Priority: {t.priority}</span>
                            </div>
                            {t.dueDate && <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>Due: {new Date(t.dueDate).toLocaleDateString()}</div>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
