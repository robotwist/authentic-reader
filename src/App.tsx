import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import SimpleHeader from './components/SimpleHeader';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import DailyBriefingPage from './pages/DailyBriefingPage';
import MethodPage from './pages/MethodPage';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="app">
          <SimpleHeader />
          <main className="main-content" id="main-content">
            <Routes>
              <Route path="/" element={<DailyBriefingPage />} />
              <Route path="/method" element={<MethodPage />} />
              <Route path="*" element={<DailyBriefingPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
