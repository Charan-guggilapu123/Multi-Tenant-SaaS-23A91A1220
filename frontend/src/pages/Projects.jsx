import { useEffect, useState } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';

export default function Projects() {
    const [projects, setProjects] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newProject, setNewProject] = useState({ name: '', description: '' });

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const res = await api.get('/projects');
            setProjects(res.data.data.projects);
        } catch (e) {
            console.error(e);
        }
    };

    const createProject = async (e) => {
        e.preventDefault();
        try {
            await api.post('/projects', newProject);
            setShowModal(false);
            setNewProject({ name: '', description: '' });
            fetchProjects();
        } catch (e) {
            alert(e.response?.data?.message || 'Error creating project');
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>All Projects</h1>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Project</button>
            </div>

            <div className="project-section">
                <div className="project-list">
                    {projects.map(p => (
                        <div key={p.id} className="project-item">
                            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                <h3 className="project-title">{p.name}</h3>
                                <p className="project-description">{p.description}</p>
                            </div>
                            <div className="project-footer">
                                <span className="time-badge">{p.taskCount} tasks</span>
                                <span className="deadline">Status: {p.status}</span>
                            </div>
                            <Link to={`/projects/${p.id}`} className="btn-submit" style={{ width: '100%', marginTop: '1rem', textAlign: 'center' }}>View Details →</Link>
                        </div>
                    ))}
                </div>
            </div>

            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="card" style={{ width: '400px' }}>
                        <h2>New Project</h2>
                        <form onSubmit={createProject}>
                            <label>Name</label>
                            <input value={newProject.name} onChange={e => setNewProject({ ...newProject, name: e.target.value })} required />
                            <label>Description</label>
                            <textarea value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })} />
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
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
