import React from 'react';
import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="site-footer">
      <div className="footer-upper">
        <div className="footer-brand">
          <h2 className="footer-brand-name">Authentic Internet</h2>
          <p className="footer-tagline">Restoring trust in the digital commons.</p>
        </div>
      </div>
      <div className="footer-lower">
        <p className="footer-copyright">© 2025 Authentic Internet.</p>
      </div>
    </footer>
  );
};

export default Footer;
