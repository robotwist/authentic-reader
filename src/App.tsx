import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import SkipLinks from './components/SkipLinks';
import ErrorBoundary from './components/ErrorBoundary';
import HomePage from './pages/HomePage';
import AnalysisPage from './pages/AnalysisPage';
import DailyBriefingPage from './pages/DailyBriefingPage';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="app dark-mode">
          <SkipLinks />
          <Header />
          <main className="main-content" id="main-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/analysis/:id?" element={<AnalysisPage />} />
              <Route path="/daily-briefing" element={<DailyBriefingPage />} />
            </Routes>
          </main>
          <footer className="app-footer">
            <div className="footer-content">
              <p>Logical Fallacy Analyzer &copy; {new Date().getFullYear()}</p>
            </div>
          </footer>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
