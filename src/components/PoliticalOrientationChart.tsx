import React, { useState } from 'react';
import { FiInfo, FiTarget, FiTrendingUp, FiShield, FiUsers, FiGlobe } from 'react-icons/fi';
import '../styles/PoliticalOrientationChart.css';

interface PoliticalProfile {
  economicAxis: {
    position: number; // -100 to +100
    confidence: number;
    factors: any[];
  };
  socialAxis: {
    position: number; // -100 to +100
    confidence: number;
    factors: any[];
  };
  foreignPolicyAxis: {
    position: number; // -100 to +100
    confidence: number;
    factors: any[];
  };
  environmentalAxis: {
    position: number; // -100 to +100
    confidence: number;
    factors: any[];
  };
  overallBias: {
    direction: string;
    intensity: number;
    confidence: number;
  };
}

interface Source {
  id: string;
  name: string;
  politicalProfile: PoliticalProfile;
  description: string;
  reliability: string;
  biasRating: string;
}

interface PoliticalOrientationChartProps {
  sources: Source[];
  selectedSource?: Source;
  onSourceSelect?: (source: Source) => void;
}

const PoliticalOrientationChart: React.FC<PoliticalOrientationChartProps> = ({
  sources,
  selectedSource,
  onSourceSelect
}) => {
  const [hoveredSource, setHoveredSource] = useState<Source | null>(null);
  const [showExplanations, setShowExplanations] = useState(false);

  const getAxisLabel = (axis: string) => {
    switch (axis) {
      case 'economic':
        return {
          left: 'Economic Left (Progressive)',
          right: 'Economic Right (Conservative)',
          description: 'Views on economic policy, regulation, and wealth distribution'
        };
      case 'social':
        return {
          left: 'Social Libertarian',
          right: 'Social Authoritarian',
          description: 'Views on personal freedoms, social issues, and government control'
        };
      case 'foreignPolicy':
        return {
          left: 'Isolationist',
          right: 'Interventionist',
          description: 'Views on international relations and foreign policy'
        };
      case 'environmental':
        return {
          left: 'Anti-Regulation',
          right: 'Pro-Regulation',
          description: 'Views on environmental protection and regulation'
        };
      default:
        return { left: '', right: '', description: '' };
    }
  };

  const getQuadrantLabel = (economicPos: number, socialPos: number) => {
    if (economicPos > 20 && socialPos > 20) return 'Libertarian Right';
    if (economicPos > 20 && socialPos < -20) return 'Authoritarian Right';
    if (economicPos < -20 && socialPos > 20) return 'Libertarian Left';
    if (economicPos < -20 && socialPos < -20) return 'Authoritarian Left';
    if (Math.abs(economicPos) <= 20 && Math.abs(socialPos) <= 20) return 'Centrist';
    return 'Mixed';
  };

  const getPositionColor = (position: number) => {
    const absPos = Math.abs(position);
    if (absPos < 20) return '#3b82f6'; // Blue for center
    if (absPos < 50) return '#f59e0b'; // Orange for moderate
    return '#ef4444'; // Red for extreme
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.8) return '#10b981'; // Green for high confidence
    if (confidence > 0.6) return '#f59e0b'; // Orange for medium confidence
    return '#ef4444'; // Red for low confidence
  };

  return (
    <div className="political-orientation-chart">
      <div className="chart-header">
        <h2>Multi-Dimensional Political Orientation</h2>
        <p className="chart-subtitle">
          Understanding political bias across multiple axes for informed analysis
        </p>
        <button 
          onClick={() => setShowExplanations(!showExplanations)}
          className="explanation-toggle"
        >
          <FiInfo />
          {showExplanations ? 'Hide' : 'Show'} Explanations
        </button>
      </div>

      {showExplanations && (
        <div className="explanations-panel">
          <div className="explanation-grid">
            <div className="explanation-card">
              <h3><FiTarget /> Economic Axis</h3>
              <p><strong>Left (-100):</strong> Progressive economic policies, wealth redistribution, strong regulation</p>
              <p><strong>Right (+100):</strong> Free market capitalism, minimal regulation, lower taxes</p>
              <p className="explanation-detail">
                Based on coverage of economic issues, business regulation, tax policy, 
                and wealth distribution topics.
              </p>
            </div>

            <div className="explanation-card">
              <h3><FiUsers /> Social Axis</h3>
              <p><strong>Libertarian (-100):</strong> Personal freedoms, limited government control, individual rights</p>
              <p><strong>Authoritarian (+100):</strong> Strong government control, traditional values, social order</p>
              <p className="explanation-detail">
                Based on coverage of social issues, civil liberties, cultural topics, 
                and government intervention in personal matters.
              </p>
            </div>

            <div className="explanation-card">
              <h3><FiGlobe /> Foreign Policy Axis</h3>
              <p><strong>Isolationist (-100):</strong> Limited international involvement, focus on domestic issues</p>
              <p><strong>Interventionist (+100):</strong> Active international engagement, global leadership</p>
              <p className="explanation-detail">
                Based on coverage of international relations, military intervention, 
                trade policy, and global cooperation.
              </p>
            </div>

            <div className="explanation-card">
              <h3><FiTrendingUp /> Environmental Axis</h3>
              <p><strong>Anti-Regulation (-100):</strong> Minimal environmental regulation, business-friendly policies</p>
              <p><strong>Pro-Regulation (+100):</strong> Strong environmental protection, climate action</p>
              <p className="explanation-detail">
                Based on coverage of environmental issues, climate change, 
                regulation, and sustainability topics.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="chart-container">
        <div className="chart-grid">
          {/* Economic vs Social 2D Chart */}
          <div className="chart-section">
            <h3>Economic vs Social Orientation</h3>
            <div className="chart-2d">
              <div className="chart-axes">
                <div className="axis-label y-axis">
                  <span>Social Libertarian</span>
                  <span>Social Authoritarian</span>
                </div>
                <div className="axis-label x-axis">
                  <span>Economic Left</span>
                  <span>Economic Right</span>
                </div>
              </div>
              
              <div className="chart-area">
                {sources.map((source) => {
                  const x = ((source.politicalProfile.economicAxis.position + 100) / 200) * 100;
                  const y = ((100 - source.politicalProfile.socialAxis.position) / 200) * 100;
                  
                  return (
                    <div
                      key={source.id}
                      className={`source-point ${selectedSource?.id === source.id ? 'selected' : ''}`}
                      style={{
                        left: `${x}%`,
                        top: `${y}%`,
                        backgroundColor: getPositionColor(source.politicalProfile.economicAxis.position),
                        borderColor: getConfidenceColor(source.politicalProfile.economicAxis.confidence)
                      }}
                      onMouseEnter={() => setHoveredSource(source)}
                      onMouseLeave={() => setHoveredSource(null)}
                      onClick={() => onSourceSelect?.(source)}
                    >
                      <div className="point-label">{source.name}</div>
                    </div>
                  );
                })}
              </div>

              <div className="quadrant-labels">
                <div className="quadrant top-left">Libertarian Left</div>
                <div className="quadrant top-right">Libertarian Right</div>
                <div className="quadrant bottom-left">Authoritarian Left</div>
                <div className="quadrant bottom-right">Authoritarian Right</div>
                <div className="quadrant center">Centrist</div>
              </div>
            </div>
          </div>

          {/* Foreign Policy vs Environmental 2D Chart */}
          <div className="chart-section">
            <h3>Foreign Policy vs Environmental Orientation</h3>
            <div className="chart-2d">
              <div className="chart-axes">
                <div className="axis-label y-axis">
                  <span>Pro-Regulation</span>
                  <span>Anti-Regulation</span>
                </div>
                <div className="axis-label x-axis">
                  <span>Isolationist</span>
                  <span>Interventionist</span>
                </div>
              </div>
              
              <div className="chart-area">
                {sources.map((source) => {
                  const x = ((source.politicalProfile.foreignPolicyAxis.position + 100) / 200) * 100;
                  const y = ((100 - source.politicalProfile.environmentalAxis.position) / 200) * 100;
                  
                  return (
                    <div
                      key={source.id}
                      className={`source-point ${selectedSource?.id === source.id ? 'selected' : ''}`}
                      style={{
                        left: `${x}%`,
                        top: `${y}%`,
                        backgroundColor: getPositionColor(source.politicalProfile.foreignPolicyAxis.position),
                        borderColor: getConfidenceColor(source.politicalProfile.foreignPolicyAxis.confidence)
                      }}
                      onMouseEnter={() => setHoveredSource(source)}
                      onMouseLeave={() => setHoveredSource(null)}
                      onClick={() => onSourceSelect?.(source)}
                    >
                      <div className="point-label">{source.name}</div>
                    </div>
                  );
                })}
              </div>

              <div className="quadrant-labels">
                <div className="quadrant top-left">Pro-Regulation Isolationist</div>
                <div className="quadrant top-right">Pro-Regulation Interventionist</div>
                <div className="quadrant bottom-left">Anti-Regulation Isolationist</div>
                <div className="quadrant bottom-right">Anti-Regulation Interventionist</div>
                <div className="quadrant center">Centrist</div>
              </div>
            </div>
          </div>
        </div>

        {/* Source Details Panel */}
        {(hoveredSource || selectedSource) && (
          <div className="source-details">
            <h3>{(hoveredSource || selectedSource)?.name}</h3>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Economic Position:</span>
                <span className="detail-value">
                  {Math.round((hoveredSource || selectedSource)?.politicalProfile.economicAxis.position || 0)}
                  <span className="confidence" style={{ color: getConfidenceColor((hoveredSource || selectedSource)?.politicalProfile.economicAxis.confidence || 0) }}>
                    ({(hoveredSource || selectedSource)?.politicalProfile.economicAxis.confidence || 0}% confidence)
                  </span>
                </span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Social Position:</span>
                <span className="detail-value">
                  {Math.round((hoveredSource || selectedSource)?.politicalProfile.socialAxis.position || 0)}
                  <span className="confidence" style={{ color: getConfidenceColor((hoveredSource || selectedSource)?.politicalProfile.socialAxis.confidence || 0) }}>
                    ({(hoveredSource || selectedSource)?.politicalProfile.socialAxis.confidence || 0}% confidence)
                  </span>
                </span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Foreign Policy:</span>
                <span className="detail-value">
                  {Math.round((hoveredSource || selectedSource)?.politicalProfile.foreignPolicyAxis.position || 0)}
                  <span className="confidence" style={{ color: getConfidenceColor((hoveredSource || selectedSource)?.politicalProfile.foreignPolicyAxis.confidence || 0) }}>
                    ({(hoveredSource || selectedSource)?.politicalProfile.foreignPolicyAxis.confidence || 0}% confidence)
                  </span>
                </span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Environmental:</span>
                <span className="detail-value">
                  {Math.round((hoveredSource || selectedSource)?.politicalProfile.environmentalAxis.position || 0)}
                  <span className="confidence" style={{ color: getConfidenceColor((hoveredSource || selectedSource)?.politicalProfile.environmentalAxis.confidence || 0) }}>
                    ({(hoveredSource || selectedSource)?.politicalProfile.environmentalAxis.confidence || 0}% confidence)
                  </span>
                </span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Overall Bias:</span>
                <span className="detail-value">
                  {(hoveredSource || selectedSource)?.politicalProfile.overallBias.direction} 
                  ({(hoveredSource || selectedSource)?.politicalProfile.overallBias.intensity * 100}% intensity)
                </span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Reliability:</span>
                <span className="detail-value">
                  <FiShield style={{ color: getConfidenceColor((hoveredSource || selectedSource)?.politicalProfile.overallBias.confidence || 0) }} />
                  {(hoveredSource || selectedSource)?.reliability}
                </span>
              </div>
            </div>
            
            <p className="source-description">
              {(hoveredSource || selectedSource)?.description}
            </p>
          </div>
        )}
      </div>

      <div className="chart-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#3b82f6' }}></div>
          <span>Centrist (0-20)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#f59e0b' }}></div>
          <span>Moderate (20-50)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#ef4444' }}></div>
          <span>Extreme (50-100)</span>
        </div>
        <div className="legend-item">
          <div className="legend-border" style={{ borderColor: '#10b981' }}></div>
          <span>High Confidence</span>
        </div>
        <div className="legend-item">
          <div className="legend-border" style={{ borderColor: '#f59e0b' }}></div>
          <span>Medium Confidence</span>
        </div>
        <div className="legend-item">
          <div className="legend-border" style={{ borderColor: '#ef4444' }}></div>
          <span>Low Confidence</span>
        </div>
      </div>
    </div>
  );
};

export default PoliticalOrientationChart;
