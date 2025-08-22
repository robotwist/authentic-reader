import React, { useState } from 'react';
import { FiInfo, FiHelpCircle } from 'react-icons/fi';
import '../styles/AnalysisTooltip.css';

interface AnalysisTooltipProps {
  title: string;
  explanation: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

const AnalysisTooltip: React.FC<AnalysisTooltipProps> = ({
  title,
  explanation,
  icon = <FiInfo />,
  children,
  position = 'top',
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className={`analysis-tooltip-container ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      
      {isVisible && (
        <div className={`analysis-tooltip analysis-tooltip-${position}`}>
          <div className="tooltip-header">
            {icon}
            <span className="tooltip-title">{title}</span>
          </div>
          <div className="tooltip-content">
            {explanation}
          </div>
          <div className="tooltip-arrow"></div>
        </div>
      )}
    </div>
  );
};

export default AnalysisTooltip;
