import React from 'react';
import './SimpleHeader.css';

const LOGO_URL = '/authentic-internet-logo.png';

const SimpleHeader: React.FC = () => {
  return (
    <header className="simple-header">
      <div className="simple-header-content">
        <img 
          src={LOGO_URL} 
          alt="Authentic Internet" 
          className="simple-header-logo" 
        />
      </div>
    </header>
  );
};

export default SimpleHeader;

