import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import '../styles/AdminDashboard.css';

interface User {
  id: number;
  username: string;
  email: string;
  isAdmin: boolean;
}

interface Source {
  id: number;
  name: string;
  url: string;
  category: string;
}

const AdminDashboard: React.FC = () => {
  const { user, token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'sources' | 'monitoring'>('users');
  
  // New user form state
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    isAdmin: false
  });
  
  // New source form state
  const [newSource, setNewSource] = useState({
    name: '',
    url: '',
    category: '',
    description: ''
  });

  // Fetch users and sources on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.isAdmin) {
        setError('You do not have permission to access this page');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch users
        const usersResponse = await fetch('/api/admin/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        // Handle authentication errors
        if (usersResponse.status === 401 || usersResponse.status === 403) {
          const errorData = await usersResponse.json().catch(() => ({ message: 'Authentication failed' }));
          throw new Error(errorData.message || 'Your session has expired. Please log in again.');
        }
        
        if (!usersResponse.ok) {
          throw new Error('Failed to fetch users');
        }
        
        // Check if response is JSON (not HTML)
        const contentType = usersResponse.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Received invalid response format from server');
        }
        
        const usersData = await usersResponse.json();
        setUsers(usersData);
        
        // Fetch sources
        const sourcesResponse = await fetch('/api/sources', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        // Handle authentication errors for sources request too
        if (sourcesResponse.status === 401 || sourcesResponse.status === 403) {
          const errorData = await sourcesResponse.json().catch(() => ({ message: 'Authentication failed' }));
          throw new Error(errorData.message || 'Your session has expired. Please log in again.');
        }
        
        if (!sourcesResponse.ok) {
          throw new Error('Failed to fetch sources');
        }
        
        // Check if response is JSON (not HTML)
        const sourcesContentType = sourcesResponse.headers.get('content-type');
        if (!sourcesContentType || !sourcesContentType.includes('application/json')) {
          throw new Error('Received invalid response format from server');
        }
        
        const sourcesData = await sourcesResponse.json();
        setSources(sourcesData);
        
      } catch (error) {
        console.error('Dashboard error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        setError(errorMessage);
        
        // If there's an authentication error, redirect to login
        if (
          errorMessage.includes('expired') || 
          errorMessage.includes('log in') || 
          errorMessage.includes('Authentication')
        ) {
          // Clear auth session
          localStorage.removeItem('auth_token');
          localStorage.removeItem('current_user');
          window.location.href = '/login'; // Redirect to login page
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user, token]);

  // Handle user form input changes
  const handleUserInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setNewUser({
      ...newUser,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Handle source form input changes
  const handleSourceInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewSource({
      ...newSource,
      [name]: value
    });
  };
  
  // Create a new user
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create user');
      }
      
      const newUserData = await response.json();
      setUsers([...users, newUserData]);
      
      // Reset form
      setNewUser({
        username: '',
        email: '',
        password: '',
        isAdmin: false
      });
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create user');
    }
  };
  
  // Create a new source
  const handleCreateSource = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/sources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newSource)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create source');
      }
      
      const newSourceData = await response.json();
      setSources([...sources, newSourceData]);
      
      // Reset form
      setNewSource({
        name: '',
        url: '',
        category: '',
        description: ''
      });
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create source');
    }
  };
  
  // Delete a user
  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete user');
      }
      
      // Remove user from state
      setUsers(users.filter(user => user.id !== userId));
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete user');
    }
  };
  
  // Delete a source
  const handleDeleteSource = async (sourceId: number) => {
    if (!confirm('Are you sure you want to delete this source?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/sources/${sourceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete source');
      }
      
      // Remove source from state
      setSources(sources.filter(source => source.id !== sourceId));
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete source');
    }
  };
  
  // Toggle user admin status
  const handleToggleAdmin = async (userId: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isAdmin: !currentStatus })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update user');
      }
      
      // Update user in state
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, isAdmin: !currentStatus } 
          : user
      ));
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update user');
    }
  };

  if (loading) {
    return <div className="admin-loading">Loading admin dashboard...</div>;
  }
  
  if (error) {
    return <div className="admin-error">{error}</div>;
  }
  
  if (!user?.isAdmin) {
    return <div className="admin-unauthorized">You do not have permission to access this page.</div>;
  }

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      
      <div className="admin-tabs">
        <button 
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
        <button 
          className={`tab-button ${activeTab === 'sources' ? 'active' : ''}`}
          onClick={() => setActiveTab('sources')}
        >
          Sources
        </button>
        <button 
          className={`tab-button ${activeTab === 'monitoring' ? 'active' : ''}`}
          onClick={() => setActiveTab('monitoring')}
        >
          Monitoring
        </button>
      </div>
      
      {activeTab === 'users' && (
        <div className="admin-section">
          <h2>Users Management</h2>
          
          <form className="admin-form" onSubmit={handleCreateUser}>
            <h3>Create New User</h3>
            
            <div className="form-group">
              <label htmlFor="username">Username:</label>
              <input
                type="text"
                id="username"
                name="username"
                value={newUser.username}
                onChange={handleUserInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input
                type="email"
                id="email"
                name="email"
                value={newUser.email}
                onChange={handleUserInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password:</label>
              <input
                type="password"
                id="password"
                name="password"
                value={newUser.password}
                onChange={handleUserInputChange}
                required
              />
            </div>
            
            <div className="form-group checkbox">
              <input
                type="checkbox"
                id="isAdmin"
                name="isAdmin"
                checked={newUser.isAdmin}
                onChange={handleUserInputChange}
              />
              <label htmlFor="isAdmin">Admin User</label>
            </div>
            
            <button type="submit" className="btn-primary">Create User</button>
          </form>
          
          <div className="admin-list">
            <h3>User List ({users.length})</h3>
            
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Admin</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(userItem => (
                  <tr key={userItem.id}>
                    <td>{userItem.id}</td>
                    <td>{userItem.username}</td>
                    <td>{userItem.email}</td>
                    <td>
                      <input
                        type="checkbox"
                        checked={userItem.isAdmin}
                        onChange={() => handleToggleAdmin(userItem.id, userItem.isAdmin)}
                        disabled={userItem.id === user?.id}
                      />
                    </td>
                    <td>
                      <button 
                        className="btn-delete"
                        onClick={() => handleDeleteUser(userItem.id)}
                        disabled={userItem.id === user?.id}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {activeTab === 'sources' && (
        <div className="admin-section">
          <h2>Sources Management</h2>
          
          <form className="admin-form" onSubmit={handleCreateSource}>
            <h3>Add New Source</h3>
            
            <div className="form-group">
              <label htmlFor="name">Name:</label>
              <input
                type="text"
                id="name"
                name="name"
                value={newSource.name}
                onChange={handleSourceInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="url">URL:</label>
              <input
                type="url"
                id="url"
                name="url"
                value={newSource.url}
                onChange={handleSourceInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="category">Category:</label>
              <select
                id="category"
                name="category"
                value={newSource.category}
                onChange={handleSourceInputChange}
                required
              >
                <option value="">Select category</option>
                <option value="news">News</option>
                <option value="technology">Technology</option>
                <option value="science">Science</option>
                <option value="business">Business</option>
                <option value="entertainment">Entertainment</option>
                <option value="sports">Sports</option>
                <option value="health">Health</option>
                <option value="politics">Politics</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Description:</label>
              <textarea
                id="description"
                name="description"
                value={newSource.description}
                onChange={handleSourceInputChange}
                rows={3}
              />
            </div>
            
            <button type="submit" className="btn-primary">Add Source</button>
          </form>
          
          <div className="admin-list">
            <h3>Source List ({sources.length})</h3>
            
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>URL</th>
                  <th>Category</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sources.map(source => (
                  <tr key={source.id}>
                    <td>{source.id}</td>
                    <td>{source.name}</td>
                    <td>
                      <a href={source.url} target="_blank" rel="noopener noreferrer">
                        {source.url.substring(0, 30)}...
                      </a>
                    </td>
                    <td>{source.category}</td>
                    <td>
                      <button 
                        className="btn-delete"
                        onClick={() => handleDeleteSource(source.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'monitoring' && (
        <div className="admin-section">
          <h2>System Monitoring</h2>
          
          <div className="monitoring-card">
            <h3>Real-time Server Monitoring</h3>
            <p>
              Monitor server performance, response times, memory usage, and application errors
              in real time. Use this dashboard to identify and diagnose issues.
            </p>
            <Link to="/admin/monitor" className="btn-primary">
              Open Monitoring Dashboard
            </Link>
          </div>
          
          <div className="monitoring-features">
            <div className="feature-item">
              <h4>Performance Metrics</h4>
              <p>Track API response times, memory usage, and system load</p>
            </div>
            <div className="feature-item">
              <h4>Error Tracking</h4>
              <p>View application errors and exceptions in real time</p>
            </div>
            <div className="feature-item">
              <h4>API Usage</h4>
              <p>Monitor endpoint usage and success rates</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard; 