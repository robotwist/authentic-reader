import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import SimpleHeader from './components/SimpleHeader';
import SkipLinks from './components/SkipLinks';
import ErrorBoundary from './components/ErrorBoundary';
import DailyBriefingPage from './pages/DailyBriefingPage';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="app">
          <SkipLinks />
          <SimpleHeader />
          <main className="main-content" id="main-content">
            <Routes>
              <Route path="/" element={<DailyBriefingPage />} />
              <Route path="*" element={<DailyBriefingPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
