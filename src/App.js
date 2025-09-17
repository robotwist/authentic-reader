import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import SkipLinks from './components/SkipLinks';
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
import AnalysisPage from './pages/AnalysisPage';
import ArticleFeedPage from './pages/ArticleFeedPage';
import ArticleAnalysisPage from './pages/ArticleAnalysisPage';
import ArticleReaderPage from './pages/ArticleReaderPage';
import ForcesForGoodPage from './pages/ForcesForGoodPage';
import MediaLiteracyGuide from './pages/MediaLiteracyGuide';
import PoliticalAnalysisPage from './pages/PoliticalAnalysisPage';
import NLPBenchmark from './components/NLPBenchmark';
import Summarizer from './components/Summarizer';
import BiasDetection from './components/BiasDetection';
import RhetoricalAnalysis from './components/RhetoricalAnalysis';
import EntityRelationship from './components/EntityRelationship';
import DarkPatternDetection from './components/DarkPatternDetection';
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
import InteractiveArticleView from './components/InteractiveArticleView';
import ArticleImporter from './components/ArticleImporter';
import Login from './components/Login';
import Register from './components/Register';
import { ThemeProvider } from './contexts/ThemeContext';
import FeedbackDashboard from './components/FeedbackDashboard';
import IntellectualSelfDefensePage from './pages/IntellectualSelfDefensePage';
import PWAInstallBanner from './components/PWAInstallBanner';
// Protected route wrapper
const ProtectedRoute = ({ children }) => {
    const { isLoggedIn, loading } = useAuth();
    if (loading) {
        return _jsxs("div", { className: "loader", children: [_jsx("div", { className: "loader-spinner" }), _jsx("p", { children: "Loading..." })] });
    }
    return isLoggedIn ? children : _jsx(Navigate, { to: "/" });
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
                }
                catch (error) {
                    console.error('Admin validation error:', error);
                }
            }
        };
        validateAdmin();
    }, [isLoggedIn, user, token, navigate]);
    return null; // This component doesn't render anything
};
// Admin-only route
const AdminRoute = ({ children }) => {
    const { isLoggedIn, loading, user } = useAuth();
    if (loading) {
        return _jsxs("div", { className: "loader", children: [_jsx("div", { className: "loader-spinner" }), _jsx("p", { children: "Loading..." })] });
    }
    if (!isLoggedIn) {
        return _jsx(Navigate, { to: "/" });
    }
    return user?.isAdmin ? (_jsxs(_Fragment, { children: [_jsx(AdminValidator, {}), children] })) : (_jsxs("div", { className: "container", children: [_jsx("h2", { children: "Unauthorized" }), _jsx("p", { children: "You don't have permission to access this page." })] }));
};
function App() {
    const [isInitialized, setIsInitialized] = useState(false);
    const [userPreferences, setUserPreferences] = useState({
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
            }
            catch (error) {
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
    const handlePreferenceChange = (key, value) => {
        setUserPreferences(prev => ({
            ...prev,
            [key]: value
        }));
    };
    if (!isInitialized) {
        return (_jsxs("div", { className: "app-loader", children: [_jsx("div", { className: "loader-spinner" }), _jsx("h2", { children: "Authentic Reader" }), _jsx("p", { children: "Loading your personalized reading experience..." })] }));
    }
    return (_jsx(ThemeProvider, { children: _jsx(AuthProvider, { children: _jsx(Router, { children: _jsxs("div", { className: "app dark-mode", children: [_jsx(SkipLinks, {}), _jsx(Header, {}), _jsx("main", { className: "main-content", id: "main-content", children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(IntellectualSelfDefensePage, {}) }), _jsx(Route, { path: "/feed", element: _jsx(ArticleFeedPage, {}) }), _jsx(Route, { path: "/profile", element: _jsx(ProtectedRoute, { children: _jsx(UserProfile, {}) }) }), _jsx(Route, { path: "/feedback", element: _jsx(ProtectedRoute, { children: _jsx(FeedbackDashboard, {}) }) }), _jsx(Route, { path: "/analytics", element: _jsx(ProtectedRoute, { children: _jsx(FeedbackDashboard, {}) }) }), _jsx(Route, { path: "/sources", element: _jsxs("div", { className: "container", children: [_jsx("h2", { children: "My Sources" }), _jsx("p", { children: "Source management coming soon..." })] }) }), _jsx(Route, { path: "/saved", element: _jsx(ProtectedRoute, { children: _jsxs("div", { className: "container", children: [_jsx("h2", { children: "Saved Articles" }), _jsx("p", { children: "Saved articles feature coming soon..." })] }) }) }), _jsx(Route, { path: "/admin", element: _jsx(AdminRoute, { children: _jsx(AdminDashboard, {}) }) }), _jsx(Route, { path: "/admin/monitor", element: _jsx(AdminRoute, { children: _jsx(ServerMonitor, {}) }) }), _jsx(Route, { path: "/analysis-test", element: _jsx(AnalysisTest, {}) }), _jsx(Route, { path: "/env-test", element: _jsx(EnvTest, {}) }), _jsx(Route, { path: "/home", element: _jsx(HomePage, {}) }), _jsx(Route, { path: "/about", element: _jsx(AboutPage, {}) }), _jsx(Route, { path: "/library", element: _jsx(ProtectedRoute, { children: _jsx(LibraryPage, {}) }) }), _jsx(Route, { path: "/analysis/:id", element: _jsx(ArticleAnalysisPage, {}) }), _jsx(Route, { path: "/settings", element: _jsx(SettingsPage, { preferences: userPreferences, onPreferenceChange: handlePreferenceChange }) }), _jsx(Route, { path: "/analysis", element: _jsx(AnalysisPage, {}) }), _jsx(Route, { path: "/analysis/bias", element: _jsx(BiasDetection, {}) }), _jsx(Route, { path: "/analysis/rhetorical", element: _jsx(RhetoricalAnalysis, {}) }), _jsx(Route, { path: "/analysis/entity", element: _jsx(EntityRelationship, {}) }), _jsx(Route, { path: "/analysis/darkpattern", element: _jsx(DarkPatternDetection, {}) }), _jsx(Route, { path: "/analysis/comparative", element: _jsx(ComparativeAnalysisPage, {}) }), _jsx(Route, { path: "/fact-check", element: _jsx(FactCheckingPage, {}) }), _jsx(Route, { path: "/sentiment-analysis", element: _jsx(SentimentAnalysisPage, {}) }), _jsx(Route, { path: "/article-generator", element: _jsx(ArticleGeneratorPage, {}) }), _jsx(Route, { path: "/ai-orchestrator", element: _jsx(AIAgentOrchestratorPage, {}) }), _jsx(Route, { path: "/autonomous-learning", element: _jsx(AutonomousLearningPage, {}) }), _jsx(Route, { path: "/collaborative-network", element: _jsx(CollaborativeAINetworkPage, {}) }), _jsx(Route, { path: "/agentic-dashboard", element: _jsx(AgenticAIDashboard, {}) }), _jsx(Route, { path: "/analytics", element: _jsx(AnalyticsDashboard, {}) }), _jsx(Route, { path: "/analysis/enhanced-bias", element: _jsx(EnhancedBiasDetection, {}) }), _jsx(Route, { path: "/journalists", element: _jsx(JournalistRating, {}) }), _jsx(Route, { path: "/intellectual-self-defense", element: _jsx(IntellectualSelfDefensePage, {}) }), _jsx(Route, { path: "/article/:articleId", element: _jsx(ArticleReaderPage, {}) }), _jsx(Route, { path: "/forces-for-good", element: _jsx(ForcesForGoodPage, {}) }), _jsx(Route, { path: "/benchmark", element: _jsx(NLPBenchmark, {}) }), _jsx(Route, { path: "/summarize", element: _jsx(Summarizer, {}) }), _jsx(Route, { path: "/interactive/:id", element: _jsx(InteractiveArticleView, {}) }), _jsx(Route, { path: "/import", element: _jsx(ProtectedRoute, { children: _jsx(ArticleImporter, {}) }) }), _jsx(Route, { path: "/login", element: _jsx(Login, {}) }), _jsx(Route, { path: "/register", element: _jsx(Register, {}) }), _jsx(Route, { path: "/media-literacy-guide", element: _jsx(MediaLiteracyGuide, {}) }), _jsx(Route, { path: "/political-analysis", element: _jsx(PoliticalAnalysisPage, {}) }), _jsx(Route, { path: "*", element: _jsxs("div", { className: "container", children: [_jsx("h2", { children: "Page Not Found" }), _jsx("p", { children: "The page you're looking for doesn't exist." })] }) })] }) }), _jsx(PWAInstallBanner, {}), _jsx("footer", { className: "app-footer", children: _jsxs("div", { className: "footer-content", children: [_jsxs("p", { children: ["Authentic Reader \u00A9 ", new Date().getFullYear(), " - Content that respects your intelligence"] }), _jsxs("p", { children: [_jsx("a", { href: "#privacy", children: "Privacy Policy" }), " |", _jsx("a", { href: "#terms", children: "Terms of Service" }), " |", _jsx("a", { href: "#about", children: "About Us" })] })] }) })] }) }) }) }));
}
export default App;
