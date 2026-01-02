import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function ProjectDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', dueDate: '' });

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const pRes = await api.get(`/projects/${id}`);
            setProject(pRes.data.data);
            const tRes = await api.get(`/projects/${id}/tasks`);
            setTasks(tRes.data.data.tasks);
        } catch (e) {
            if (e.response?.status === 403 || e.response?.status === 404) navigate('/projects');
        }
    };

    const createTask = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/projects/${id}/tasks`, newTask);
            setShowTaskModal(false);
            setNewTask({ title: '', description: '', priority: 'medium', dueDate: '' });
            fetchData();
        } catch (e) {
            alert(e.response?.data?.message || 'Error');
        }
    };

    const updateStatus = async (taskId, newStatus) => {
        try {
            await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
            setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
        } catch (e) { console.error(e); }
    };

    const deleteTask = async (taskId) => {
        if (!confirm("Delete task?")) return;
        try {
            await api.delete(`/tasks/${taskId}`);
            setTasks(tasks.filter(t => t.id !== taskId));
        } catch (e) { alert("Error deleting task"); }
    }

    if (!project) return <div>Loading...</div>;

    return (
        <div className="project-details">
            <button onClick={() => navigate('/projects')} className="back-btn">← Back</button>
            
            <div className="project-detail-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h1 style={{ margin: 0 }}>{project.name}</h1>
                    <span className="badge-status">{project.status}</span>
                </div>
                
                <div className="project-meta">
                    <div className="meta-row">
                        <span className="meta-label">Status:</span>
                        <span className="meta-value">{project.status}</span>
                    </div>
                </div>

                <div className="submission-status">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ margin: '0 0 0.5rem 0' }}>Project Status</h3>
                            <p style={{ margin: 0, color: 'var(--text-muted)' }}>Total Tasks: {tasks.length}</p>
                        </div>
                        <button className="btn btn-primary" onClick={() => setShowTaskModal(true)}>+ Add Task</button>
                    </div>
                </div>
            </div>

            <div className="tabs">
                <button 
                    className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    Overview
                </button>
                <button 
                    className={`tab ${activeTab === 'tasks' ? 'active' : ''}`}
                    onClick={() => setActiveTab('tasks')}
                >
                    Tasks ({tasks.length})
                </button>
            </div>

            {activeTab === 'overview' && (
                <div className="tab-content">
                    <h2>Description</h2>
                    <p style={{ lineHeight: '1.6', color: 'var(--text-main)' }}>{project.description}</p>
                </div>
            )}

            {activeTab === 'tasks' && (
                <div className="tab-content">
                    <h2 style={{ marginBottom: '1rem' }}>All Tasks</h2>
                    {tasks.length === 0 ? (
                        <div className="empty-state">
                            <p>No tasks created yet.</p>
                            <button className="btn btn-primary" onClick={() => setShowTaskModal(true)}>Create First Task</button>
                        </div>
                    ) : (
                        <div className="tasks-list">
                            {tasks.map(t => (
                                <div key={t.id} className="task-card">
                                    <div className="task-header">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{t.title}</h3>
                                            <span className={`priority-badge priority-${t.priority}`}>{t.priority}</span>
                                        </div>
                                        <button onClick={() => deleteTask(t.id)} className="btn-delete">Delete</button>
                                    </div>
                                    <p style={{ margin: '0.5rem 0', color: 'var(--text-muted)' }}>{t.description || 'No description'}</p>
                                    <div className="task-footer">
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                            <span>Status:</span>
                                            <select
                                                value={t.status}
                                                onChange={(e) => updateStatus(t.id, e.target.value)}
                                                className="status-select"
                                            >
                                                <option value="todo">To Do</option>
                                                <option value="in_progress">In Progress</option>
                                                <option value="completed">Completed</option>
                                            </select>
                                        </div>
                                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                            {t.dueDate && <span>Due: {new Date(t.dueDate).toLocaleDateString()}</span>}
                                            <span>Assigned: {t.assignedTo?.fullName || 'Unassigned'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {showTaskModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="card" style={{ width: '500px', maxWidth: '90%' }}>
                        <h2>New Task</h2>
                        <form onSubmit={createTask}>
                            <label>Title</label>
                            <input value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} required />
                            
                            <label>Description</label>
                            <textarea 
                                value={newTask.description} 
                                onChange={e => setNewTask({ ...newTask, description: e.target.value })} 
                                rows="3"
                                placeholder="Describe the task..."
                            />
                            
                            <label>Priority</label>
                            <select value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value })}>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                            
                            <label>Due Date</label>
                            <input type="date" value={newTask.dueDate} onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })} />

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                <button type="button" className="btn" onClick={() => setShowTaskModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
