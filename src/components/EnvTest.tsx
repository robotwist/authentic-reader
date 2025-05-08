import React from 'react';
import { HF_CONFIG } from '../config/huggingFaceConfig';
import { logger } from '../utils/logger';

/**
 * A test component to verify that environment variables are being loaded correctly
 */
const EnvTest: React.FC = () => {
  logger.debug('EnvTest component rendered');
  
  // Check different environment variable sources
  const envSources = {
    'import.meta.env.VITE_HF_API_TOKEN': import.meta.env?.VITE_HF_API_TOKEN || 'Not available',
    'window.env?.REACT_APP_HF_API_TOKEN': window.env?.REACT_APP_HF_API_TOKEN || 'Not available',
    'HF_CONFIG.API_TOKEN (from config)': HF_CONFIG.API_TOKEN,
    'window.env object exists': typeof window.env !== 'undefined' ? 'Yes' : 'No',
    'import.meta.env object exists': typeof import.meta.env !== 'undefined' ? 'Yes' : 'No'
  };

  return (
    <div className="env-test" style={{ 
      margin: '20px', 
      padding: '20px', 
      border: '1px solid var(--border-color, #ddd)', 
      borderRadius: '5px',
      backgroundColor: 'var(--card-background, white)',
      color: 'var(--text-color, #333)'
    }}>
      <h2 style={{ color: 'var(--heading-color, #333)' }}>Environment Variables Test</h2>
      <div style={{ marginBottom: '20px' }}>
        <p>This component helps verify if environment variables are loaded correctly.</p>
        <p><strong>Note:</strong> API tokens are masked for security, showing only first and last 4 characters.</p>
      </div>
      
      <div>
        <h3 style={{ color: 'var(--heading-color, #444)' }}>Environment Variable Sources</h3>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ 
                border: '1px solid var(--border-color, #ddd)', 
                padding: '8px', 
                textAlign: 'left',
                backgroundColor: 'var(--table-header-bg, #f5f5f5)',
                color: 'var(--text-color, #333)'
              }}>Source</th>
              <th style={{ 
                border: '1px solid var(--border-color, #ddd)', 
                padding: '8px', 
                textAlign: 'left',
                backgroundColor: 'var(--table-header-bg, #f5f5f5)',
                color: 'var(--text-color, #333)'
              }}>Value</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(envSources).map(([source, value]) => (
              <tr key={source}>
                <td style={{ 
                  border: '1px solid var(--border-color, #ddd)', 
                  padding: '8px',
                  backgroundColor: 'var(--table-cell-bg, transparent)'
                }}>{source}</td>
                <td style={{ 
                  border: '1px solid var(--border-color, #ddd)', 
                  padding: '8px',
                  backgroundColor: 'var(--table-cell-bg, transparent)'
                }}>
                  {typeof value === 'string' && value.includes('hf_') 
                    ? `${value.substring(0, 6)}...${value.substring(value.length - 4)}`
                    : value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EnvTest; 