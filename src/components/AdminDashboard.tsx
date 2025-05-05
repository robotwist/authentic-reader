import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
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
  const [activeTab, setActiveTab] = useState<'users' | 'sources'>('users');
  
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
        
        // Fetch users
        const usersResponse = await fetch('/api/admin/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!usersResponse.ok) {
          throw new Error('Failed to fetch users');
        }
        
        const usersData = await usersResponse.json();
        setUsers(usersData);
        
        // Fetch sources
        const sourcesResponse = await fetch('/api/sources', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!sourcesResponse.ok) {
          throw new Error('Failed to fetch sources');
        }
        
        const sourcesData = await sourcesResponse.json();
        setSources(sourcesData);
        
      } catch (error) {
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
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
    </div>
  );
};

export default AdminDashboard; 