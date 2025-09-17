import React from 'react';
import '../styles/SkipLinks.css';

/**
 * Skip Links Component
 * 
 * Provides keyboard navigation shortcuts for accessibility.
 * Allows users to skip directly to main content areas.
 */

const SkipLinks: React.FC = () => {
  return (
    <nav className="skip-links" aria-label="Skip navigation">
      <a 
        href="#main-content" 
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          const element = document.getElementById('main-content');
          if (element) {
            element.focus();
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      >
        Skip to main content
      </a>
      
      <a 
        href="#balanced-feed" 
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          const element = document.getElementById('balanced-feed');
          if (element) {
            element.focus();
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      >
        Skip to balanced feed
      </a>
      
      <a 
        href="#navigation" 
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          const element = document.querySelector('nav[role="navigation"]');
          if (element) {
            (element as HTMLElement).focus();
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      >
        Skip to navigation
      </a>
      
      <a 
        href="#search" 
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          const element = document.querySelector('input[type="search"], .search-input, [role="search"]');
          if (element) {
            (element as HTMLElement).focus();
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      >
        Skip to search
      </a>
      
      <a 
        href="#footer" 
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          const element = document.querySelector('footer');
          if (element) {
            element.focus();
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      >
        Skip to footer
      </a>
    </nav>
  );
};

export default SkipLinks;
