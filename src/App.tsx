import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, NavLink } from 'react-router-dom';
import './App.css'
import Header from './components/Header'
import FeedContainer from './components/FeedContainer'
import UserProfile from './components/UserProfile';
import AdminDashboard from './components/AdminDashboard';
import AnalysisTest from './components/AnalysisTest';
import EnvTest from './components/EnvTest';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { 
  initializeDB, 
  getAllSources, 
  savePreference, 
  getPreference, 
  saveSources,
  getUserPreferences,
  saveUserPreferences
} from './services/storageService';
import { articlesApi, sourcesApi } from './services/apiService';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import LibraryPage from './pages/LibraryPage';
import SettingsPage from './pages/SettingsPage';
import ArticlePage from './pages/ArticlePage';
import AnalysisPage from './pages/AnalysisPage';
import { UserPreferences } from './types';
import { logger } from './utils/logger';
import NLPBenchmark from './components/NLPBenchmark';
import Summarizer from './components/Summarizer';
import BiasDetection from './components/BiasDetection';
import RhetoricalAnalysis from './components/RhetoricalAnalysis';
import EntityRelationship from './components/EntityRelationship';
import DarkPatternDetection from './components/DarkPatternDetection';
import EnhancedArticleView from './components/EnhancedArticleView';
import InteractiveArticleView from './components/InteractiveArticleView';
import ArticleImporter from './components/ArticleImporter';
import Login from './components/Login';
import Register from './components/Register';
import { ThemeProvider } from './contexts/ThemeContext';

// Default RSS feeds to load on first run
const DEFAULT_SOURCES = [
  { 
    id: 'npr',
    name: 'NPR News',
    url: 'https://feeds.npr.org/1001/rss.xml',
    category: 'news', 
    biasRating: 'center-left',
    reliability: 'high'
  },
  {
    id: 'reuters',
    name: 'Reuters',
    url: 'https://feeds.reuters.com/reuters/topNews',
    category: 'news',
    biasRating: 'center',
    reliability: 'high'
  },
  {
    id: 'bbc',
    name: 'BBC News',
    url: 'http://feeds.bbci.co.uk/news/world/rss.xml',
    category: 'news',
    biasRating: 'center',
    reliability: 'high'
  },
  {
    id: 'techcrunch',
    name: 'TechCrunch',
    url: 'https://techcrunch.com/feed/',
    category: 'technology',
    biasRating: 'center',
    reliability: 'medium'
  }
];

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isLoggedIn, loading } = useAuth();
  
  if (loading) {
    return <div className="loader">
      <div className="loader-spinner"></div>
      <p>Loading...</p>
    </div>;
  }
  
  return isLoggedIn ? children : <Navigate to="/" />;
};

// Admin validation wrapper
const AdminValidator = () => {
  const { isLoggedIn, user, token } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Validate admin status with a backend check
    const validateAdmin = async () => {
      if (isLoggedIn && user?.isAdmin && token) {
        try {
          const response = await fetch('/api/admin/stats', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (!response.ok) {
            console.error('Admin validation failed:', response.status);
            // Clear auth if token is invalid
            localStorage.removeItem('auth_token');
            localStorage.removeItem('current_user');
            navigate('/');
          }
        } catch (error) {
          console.error('Admin validation error:', error);
        }
      }
    };
    
    validateAdmin();
  }, [isLoggedIn, user, token, navigate]);
  
  return null; // This component doesn't render anything
};

// Admin-only route
const AdminRoute = ({ children }: { children: JSX.Element }) => {
  const { isLoggedIn, loading, user } = useAuth();
  
  if (loading) {
    return <div className="loader">
      <div className="loader-spinner"></div>
      <p>Loading...</p>
    </div>;
  }
  
  if (!isLoggedIn) {
    return <Navigate to="/" />;
  }
  
  return user?.isAdmin ? (
    <>
      <AdminValidator />
      {children}
    </>
  ) : (
    <div className="container">
      <h2>Unauthorized</h2>
      <p>You don't have permission to access this page.</p>
    </div>
  );
};

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    textSize: 'medium',
    darkMode: true, // Always use dark mode
    theme: 'default',
    focusMode: false,
    dyslexicFont: false,
    autoSaveHighlights: true,
    notificationsEnabled: true
  });

  // Initialize the application
  useEffect(() => {
    const setupApp = async () => {
      try {
        // Initialize the database with a timeout to prevent hanging
        const dbInitPromise = initializeDB();
        
        // Add a timeout to prevent the initialization from hanging
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Database initialization timed out')), 10000);
        });
        
        try {
          // Race between normal initialization and timeout
          await Promise.race([dbInitPromise, timeoutPromise]);
          console.log('Database initialized successfully');
        } catch (dbError) {
          console.warn('Database initialization failed:', dbError);
          // Continue anyway
        }
        
        // Load sources with error handling
        let sourcesLoaded = false;
        try {
          // Wrap in a timeout to prevent getting stuck
          const sourcesPromise = sourcesApi.getAllSources();
          const sourcesTimeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Sources fetch timed out')), 10000);
          });
          
          // Race between normal fetch and timeout
          const sources = await Promise.race([sourcesPromise, sourcesTimeoutPromise]);
          
          if (sources && sources.length > 0) {
            console.log('Backend is available, using server sources');
            sourcesLoaded = true;
          } else {
            console.warn('No sources returned from backend');
          }
        } catch (error) {
          console.warn('Backend not available or error fetching sources:', error);
        }
        
        // If server sources didn't load, try local storage
        if (!sourcesLoaded) {
          try {
            // Check if we have any sources stored
            const storedSources = await getAllSources();
            
            // If no sources are stored, add the default ones
            if (!storedSources || storedSources.length === 0) {
              console.log('No sources in storage, adding defaults');
              await saveSources(DEFAULT_SOURCES);
            } else {
              console.log('Using sources from local storage');
            }
          } catch (storageError) {
            console.error('Error accessing local storage:', storageError);
            // Continue anyway
          }
        }
        
        // Get user preferences
        try {
          const prefs = await getUserPreferences();
          if (prefs) {
            // Always use dark mode
            setUserPreferences({ ...prefs, darkMode: true });
            console.log('User preferences loaded');
          } else {
            // Create default preferences if none exist
            await saveUserPreferences(userPreferences);
            console.log('Default preferences saved');
          }
          
        } catch (prefsError) {
          console.warn('Error loading preferences:', prefsError);
          // Continue with default preferences
        }
        
      } catch (error) {
        console.error('Failed to initialize app:', error);
        // Log detail for debugging
        if (error instanceof Error) {
          console.error('Error details:', error.message, error.stack);
        }
      } finally {
        // Always set initialized to true to ensure UI renders
        setIsInitialized(true);
      }
    };
    
    setupApp();
    
    // Always apply dark mode
    document.documentElement.classList.add('dark-mode');
  }, []);
  
  // Save user preferences when they change
  useEffect(() => {
    if (isInitialized) {
      saveUserPreferences(userPreferences)
        .then(() => logger.debug('User preferences saved'))
        .catch(err => logger.error('Error saving user preferences:', err));
      
      // Always ensure dark mode is applied
      document.documentElement.classList.add('dark-mode');
    }
  }, [userPreferences, isInitialized]);
  
  // Update user preferences
  const handlePreferenceChange = (key: keyof UserPreferences, value: any) => {
    setUserPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (!isInitialized) {
    return (
      <div className="app-loader">
        <div className="loader-spinner"></div>
        <h2>Authentic Reader</h2>
        <p>Loading your personalized reading experience...</p>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="app dark-mode">
            <Header />
            <main className="main-content">
              <Routes>
                <Route 
                  path="/" 
                  element={
                    <FeedContainer 
                      isInitialized={isInitialized}
                      qualityFilters={userPreferences}
                      onQualityFilterChange={handlePreferenceChange}
                    />
                  } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <UserProfile />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/sources" 
                  element={
                    <div className="container">
                      <h2>My Sources</h2>
                      <p>Source management coming soon...</p>
                    </div>
                  } 
                />
                <Route 
                  path="/saved" 
                  element={
                    <ProtectedRoute>
                      <div className="container">
                        <h2>Saved Articles</h2>
                        <p>Saved articles feature coming soon...</p>
                      </div>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin" 
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/analysis-test" 
                  element={<AnalysisTest />} 
                />
                <Route 
                  path="/env-test" 
                  element={<EnvTest />} 
                />
                <Route 
                  path="/home" 
                  element={<HomePage />} 
                />
                <Route 
                  path="/about" 
                  element={<AboutPage />} 
                />
                <Route 
                  path="/library" 
                  element={
                    <ProtectedRoute>
                      <LibraryPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/article/:id" 
                  element={<ArticlePage />} 
                />
                <Route 
                  path="/settings" 
                  element={
                    <SettingsPage 
                      preferences={userPreferences} 
                      onPreferenceChange={handlePreferenceChange}
                    />
                  } 
                />
                {/* Analysis Routes */}
                <Route path="/analysis" element={<AnalysisPage />} />
                <Route path="/analysis/bias" element={<BiasDetection />} />
                <Route path="/analysis/rhetorical" element={<RhetoricalAnalysis />} />
                <Route path="/analysis/entity" element={<EntityRelationship />} />
                <Route path="/analysis/darkpattern" element={<DarkPatternDetection />} />
                
                {/* Legacy Analysis Routes */}
                <Route path="/benchmark" element={<NLPBenchmark />} />
                <Route path="/summarize" element={<Summarizer />} />
                
                <Route path="/interactive/:id" element={<InteractiveArticleView />} />
                <Route path="/import" element={
                  <ProtectedRoute>
                    <ArticleImporter />
                  </ProtectedRoute>
                } />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                <Route 
                  path="*" 
                  element={
                    <div className="container">
                      <h2>Page Not Found</h2>
                      <p>The page you're looking for doesn't exist.</p>
                    </div>
                  } 
                />
              </Routes>
            </main>
            <footer className="app-footer">
              <div className="footer-content">
                <p>Authentic Reader &copy; {new Date().getFullYear()} - Content that respects your intelligence</p>
                <p>
                  <a href="#privacy">Privacy Policy</a> | 
                  <a href="#terms">Terms of Service</a> | 
                  <a href="#about">About Us</a>
                </p>
              </div>
            </footer>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
