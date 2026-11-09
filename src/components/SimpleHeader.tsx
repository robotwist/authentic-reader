import React from 'react';
import { Link } from 'react-router-dom';
import './SimpleHeader.css';

const LOGO_URL = '/authentic-internet-logo.png';

const SimpleHeader: React.FC = () => {
  return (
    <header className="simple-header">
      <div className="simple-header-content">
        <Link to="/" className="simple-header-home" aria-label="The Daily Authentic, today's briefing">
          <img src={LOGO_URL} alt="" className="simple-header-logo" />
          <span className="simple-header-title">The Daily Authentic</span>
        </Link>
        <nav className="simple-header-nav" aria-label="Main">
          <Link to="/">Today</Link>
          <Link to="/?view=archive">Archive</Link>
          <Link to="/method">How it works</Link>
        </nav>
      </div>
    </header>
  );
};

export default SimpleHeader;
