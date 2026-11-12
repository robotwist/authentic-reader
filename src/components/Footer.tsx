import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="site-footer">
      <div className="footer-upper">
        <div className="footer-brand">
          <h2 className="footer-brand-name">Authentic Internet</h2>
          <p className="footer-tagline">Restoring trust in the digital commons.</p>
        </div>
        <nav className="footer-links" aria-label="Footer">
          <Link to="/method">How it works</Link>
          <a href="/feed.xml">RSS</a>
          <Link to="/corrections">Corrections</Link>
          <Link to="/method#report">Report an error</Link>
        </nav>
      </div>
      <div className="footer-lower">
        <p className="footer-copyright">© {new Date().getFullYear()} Authentic Internet.</p>
      </div>
    </footer>
  );
};

export default Footer;
