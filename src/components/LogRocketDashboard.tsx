import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ErrorSession {
  id: string;
  userId: string | null;
  timestamp: string;
  error: string;
  sessionUrl: string;
}

const LogRocketDashboard: React.FC = () => {
  const { user } = useAuth();
  const [errorSessions, setErrorSessions] = useState<ErrorSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Only allow admins to access this dashboard
    if (!user || user.role !== 'admin') {
      return;
    }

    const fetchErrorSessions = async () => {
      try {
        setLoading(true);
        // This would connect to your backend API that stores error sessions
        const response = await fetch('/api/admin/error-sessions');
        
        if (!response.ok) {
          throw new Error('Failed to fetch error sessions');
        }
        
        const data = await response.json();
        setErrorSessions(data);
      } catch (error) {
        console.error('Error fetching LogRocket sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchErrorSessions();
    
    // Set up polling to refresh data every minute
    const intervalId = setInterval(fetchErrorSessions, 60000);
    
    return () => clearInterval(intervalId);
  }, [user]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="logrocket-dashboard access-denied">
        <h2>Access Denied</h2>
        <p>You do not have permission to view this dashboard.</p>
      </div>
    );
  }

  return (
    <div className="logrocket-dashboard">
      <h2>Error Tracking Dashboard</h2>
      
      {loading ? (
        <div className="loading">Loading error sessions...</div>
      ) : errorSessions.length === 0 ? (
        <div className="no-errors">
          <p>No errors recorded yet. That's great news!</p>
        </div>
      ) : (
        <>
          <p>Showing {errorSessions.length} recorded error sessions:</p>
          
          <table className="error-sessions-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>User</th>
                <th>Error</th>
                <th>Session</th>
              </tr>
            </thead>
            <tbody>
              {errorSessions.map((session) => (
                <tr key={session.id}>
                  <td>{new Date(session.timestamp).toLocaleString()}</td>
                  <td>{session.userId || 'Anonymous'}</td>
                  <td className="error-message">{session.error}</td>
                  <td>
                    <a
                      href={session.sessionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="session-link"
                    >
                      View Session
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      
      <div className="dashboard-footer">
        <p>
          <strong>About this dashboard:</strong> This page shows errors captured by LogRocket from 
          user sessions. Click "View Session" to replay the user's actions leading up to the error.
        </p>
      </div>
    </div>
  );
};

export default LogRocketDashboard; 