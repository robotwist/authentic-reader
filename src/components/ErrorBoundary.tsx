import React, { Component, ErrorInfo, ReactNode } from 'react';
import LogRocket from '../utils/logRocket';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to LogRocket
    LogRocket.captureException(error);
    
    // Get the LogRocket session URL for this error
    const sessionUrl = LogRocket.sessionURL;
    
    // Send error details to our backend API
    if (sessionUrl) {
      fetch('/api/admin/error-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionUrl,
          error: error.toString(),
          userId: (window as any).currentUserId || null
        }),
      }).catch(err => console.error('Failed to send error to backend API:', err));
    }
    
    // Set the error info in state
    this.setState({ errorInfo });
    
    // You can also log to console for development
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Default fallback UI
      return (
        <div className="error-boundary-fallback">
          <h2>Something went wrong.</h2>
          <p>Our team has been notified and is looking into the issue.</p>
          {process.env.NODE_ENV === 'development' && (
            <div>
              <p>{this.state.error?.toString()}</p>
              <pre>{this.state.errorInfo?.componentStack}</pre>
            </div>
          )}
          <button onClick={() => window.location.reload()}>
            Refresh the page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 