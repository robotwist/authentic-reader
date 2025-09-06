import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, NavLink } from 'react-router-dom';
import './App.css'
import Header from './components/Header'
import SkipLinks from './components/SkipLinks';
import FeedContainer from './components/FeedContainer'
import UserProfile from './components/UserProfile';
import AdminDashboard from './components/AdminDashboard';
import AnalysisTest from './components/AnalysisTest';
import EnvTest from './components/EnvTest';
import ServerMonitor from './components/ServerMonitor';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import LibraryPage from './pages/LibraryPage';
import SettingsPage from './pages/SettingsPage';
import ArticlePage from './pages/ArticlePage';
import AnalysisPage from './pages/AnalysisPage';
import ArticleFeedPage from './pages/ArticleFeedPage';
import ArticleAnalysisPage from './pages/ArticleAnalysisPage';
import BalancedFeedPage from './pages/BalancedFeedPage';
import MediaLiteracyGuide from './pages/MediaLiteracyGuide';
import PoliticalAnalysisPage from './pages/PoliticalAnalysisPage';
import { UserPreferences } from './types';
import { logger } from './utils/logger';
import NLPBenchmark from './components/NLPBenchmark';
import Summarizer from './components/Summarizer';
import BiasDetection from './components/BiasDetection';
import RhetoricalAnalysis from './components/RhetoricalAnalysis';
import EntityRelationship from './components/EntityRelationship';
import DarkPatternDetection from './components/DarkPatternDetection';
import ComparativeAnalysis from './components/ComparativeAnalysis';
import ComparativeAnalysisPage from './pages/ComparativeAnalysisPage';
import FactCheckingPage from './pages/FactCheckingPage';
import SentimentAnalysisPage from './pages/SentimentAnalysisPage';
import ArticleGeneratorPage from './pages/ArticleGeneratorPage';
import AIAgentOrchestratorPage from './pages/AIAgentOrchestratorPage';
import AutonomousLearningPage from './pages/AutonomousLearningPage';
import CollaborativeAINetworkPage from './pages/CollaborativeAINetworkPage';
import AgenticAIDashboard from './components/AgenticAIDashboard';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import EnhancedBiasDetection from './components/EnhancedBiasDetection';
import JournalistRating from './components/JournalistRating';
import EnhancedArticleView from './components/EnhancedArticleView';
import InteractiveArticleView from './components/InteractiveArticleView';
import ArticleImporter from './components/ArticleImporter';
import Login from './components/Login';
import Register from './components/Register';
import { ThemeProvider } from './contexts/ThemeContext';
import FeedbackDashboard from './components/FeedbackDashboard';
import IntellectualSelfDefensePage from './pages/IntellectualSelfDefensePage';
import PWAInstallBanner from './components/PWAInstallBanner';

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

  // Simplified initialization
  useEffect(() => {
    const setupApp = async () => {
      try {
        // Always apply dark mode
        document.documentElement.classList.add('dark-mode');
        
        // Set initialized immediately for fast loading
        setIsInitialized(true);
        
      } catch (error) {
        console.error('Failed to initialize app:', error);
        // Always set initialized to true to ensure UI renders
        setIsInitialized(true);
      }
    };
    
    setupApp();
  }, []);
  
  // Save user preferences when they change
  useEffect(() => {
    if (isInitialized) {
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
            <SkipLinks />
            <Header />
            <main className="main-content" id="main-content">
              <Routes>
                <Route 
                  path="/" 
                  element={<IntellectualSelfDefensePage />} 
                />
                <Route 
                  path="/feed" 
                  element={<ArticleFeedPage />} 
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
                  path="/feedback" 
                  element={
                    <ProtectedRoute>
                      <FeedbackDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/analytics" 
                  element={
                    <ProtectedRoute>
                      <FeedbackDashboard />
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
                  path="/admin/monitor" 
                  element={
                    <AdminRoute>
                      <ServerMonitor />
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
                  path="/analysis/:id" 
                  element={<ArticleAnalysisPage />} 
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
                <Route path="/analysis/comparative" element={<ComparativeAnalysisPage />} />
<Route path="/fact-check" element={<FactCheckingPage />} />
<Route path="/sentiment-analysis" element={<SentimentAnalysisPage />} />
<Route path="/article-generator" element={<ArticleGeneratorPage />} />
<Route path="/ai-orchestrator" element={<AIAgentOrchestratorPage />} />
<Route path="/autonomous-learning" element={<AutonomousLearningPage />} />
<Route path="/collaborative-network" element={<CollaborativeAINetworkPage />} />
<Route path="/agentic-dashboard" element={<AgenticAIDashboard />} />
                <Route path="/analytics" element={<AnalyticsDashboard />} />
                <Route path="/analysis/enhanced-bias" element={<EnhancedBiasDetection />} />
                <Route path="/journalists" element={<JournalistRating />} />
                <Route path="/intellectual-self-defense" element={<IntellectualSelfDefensePage />} />
                
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
                <Route path="/media-literacy-guide" element={<MediaLiteracyGuide />} />
                <Route path="/political-analysis" element={<PoliticalAnalysisPage />} />
                
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
            <PWAInstallBanner />
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
