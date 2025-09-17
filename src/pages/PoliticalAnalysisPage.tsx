import React, { useState, useEffect } from 'react';
import PoliticalOrientationChart from '../components/PoliticalOrientationChart';
import { FiTarget, FiTrendingUp, FiShield, FiUsers, FiGlobe, FiInfo } from 'react-icons/fi';
import '../styles/PoliticalAnalysisPage.css';

interface PoliticalProfile {
  economicAxis: {
    position: number;
    confidence: number;
    factors: any[];
  };
  socialAxis: {
    position: number;
    confidence: number;
    factors: any[];
  };
  foreignPolicyAxis: {
    position: number;
    confidence: number;
    factors: any[];
  };
  environmentalAxis: {
    position: number;
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

const PoliticalAnalysisPage: React.FC = () => {
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Generate sample political profiles for demonstration
    const sampleSources: Source[] = [
      {
        id: 'npr',
        name: 'NPR News',
        description: 'Center-left public radio news with fact-based reporting',
        reliability: 'high',
        biasRating: 'left',
        politicalProfile: {
          economicAxis: { position: -15, confidence: 0.85, factors: [] },
          socialAxis: { position: 25, confidence: 0.80, factors: [] },
          foreignPolicyAxis: { position: 10, confidence: 0.75, factors: [] },
          environmentalAxis: { position: 30, confidence: 0.80, factors: [] },
          overallBias: { direction: 'left', intensity: 0.3, confidence: 0.85 }
        }
      },
      {
        id: 'foxnews',
        name: 'Fox News',
        description: 'Conservative cable news network with right-leaning editorial stance',
        reliability: 'medium',
        biasRating: 'right',
        politicalProfile: {
          economicAxis: { position: 45, confidence: 0.90, factors: [] },
          socialAxis: { position: -35, confidence: 0.85, factors: [] },
          foreignPolicyAxis: { position: 40, confidence: 0.80, factors: [] },
          environmentalAxis: { position: -25, confidence: 0.75, factors: [] },
          overallBias: { direction: 'right', intensity: 0.7, confidence: 0.85 }
        }
      },
      {
        id: 'reuters',
        name: 'Reuters',
        description: 'International news agency with neutral, fact-based reporting',
        reliability: 'high',
        biasRating: 'center',
        politicalProfile: {
          economicAxis: { position: 5, confidence: 0.90, factors: [] },
          socialAxis: { position: 10, confidence: 0.85, factors: [] },
          foreignPolicyAxis: { position: 15, confidence: 0.80, factors: [] },
          environmentalAxis: { position: 5, confidence: 0.75, factors: [] },
          overallBias: { direction: 'center', intensity: 0.1, confidence: 0.90 }
        }
      },
      {
        id: 'msnbc',
        name: 'MSNBC',
        description: 'Liberal cable news network with progressive editorial stance',
        reliability: 'medium',
        biasRating: 'left',
        politicalProfile: {
          economicAxis: { position: -25, confidence: 0.85, factors: [] },
          socialAxis: { position: 35, confidence: 0.80, factors: [] },
          foreignPolicyAxis: { position: 20, confidence: 0.75, factors: [] },
          environmentalAxis: { position: 40, confidence: 0.80, factors: [] },
          overallBias: { direction: 'left', intensity: 0.6, confidence: 0.80 }
        }
      },
      {
        id: 'wsj',
        name: 'Wall Street Journal',
        description: 'Conservative business newspaper with pro-business editorial stance',
        reliability: 'high',
        biasRating: 'right',
        politicalProfile: {
          economicAxis: { position: 35, confidence: 0.90, factors: [] },
          socialAxis: { position: -20, confidence: 0.75, factors: [] },
          foreignPolicyAxis: { position: 25, confidence: 0.80, factors: [] },
          environmentalAxis: { position: -15, confidence: 0.70, factors: [] },
          overallBias: { direction: 'right', intensity: 0.5, confidence: 0.85 }
        }
      },
      {
        id: 'jacobin',
        name: 'Jacobin',
        description: 'Socialist magazine with far-left political perspective',
        reliability: 'medium',
        biasRating: 'far-left',
        politicalProfile: {
          economicAxis: { position: -70, confidence: 0.95, factors: [] },
          socialAxis: { position: 45, confidence: 0.85, factors: [] },
          foreignPolicyAxis: { position: -30, confidence: 0.80, factors: [] },
          environmentalAxis: { position: 60, confidence: 0.85, factors: [] },
          overallBias: { direction: 'far-left', intensity: 0.9, confidence: 0.90 }
        }
      },
      {
        id: 'breitbart',
        name: 'Breitbart',
        description: 'Far-right news and opinion website with nationalist perspective',
        reliability: 'low',
        biasRating: 'far-right',
        politicalProfile: {
          economicAxis: { position: 60, confidence: 0.90, factors: [] },
          socialAxis: { position: -60, confidence: 0.90, factors: [] },
          foreignPolicyAxis: { position: 50, confidence: 0.85, factors: [] },
          environmentalAxis: { position: -50, confidence: 0.80, factors: [] },
          overallBias: { direction: 'far-right', intensity: 0.9, confidence: 0.85 }
        }
      },
      {
        id: 'bbc',
        name: 'BBC News',
        description: 'British public service broadcaster with center-left editorial stance',
        reliability: 'high',
        biasRating: 'center-left',
        politicalProfile: {
          economicAxis: { position: -10, confidence: 0.85, factors: [] },
          socialAxis: { position: 20, confidence: 0.80, factors: [] },
          foreignPolicyAxis: { position: 15, confidence: 0.75, factors: [] },
          environmentalAxis: { position: 25, confidence: 0.80, factors: [] },
          overallBias: { direction: 'center-left', intensity: 0.2, confidence: 0.85 }
        }
      }
    ];

    setSources(sampleSources);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="political-analysis-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading political analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="political-analysis-page">
      <div className="page-header">
        <h1>Political Orientation Analysis</h1>
        <p className="subtitle">
          Multi-dimensional analysis of news sources across political axes
        </p>
      </div>

      <div className="analysis-intro">
        <div className="intro-content">
          <h2>Understanding Political Bias</h2>
          <p>
            Our political orientation analysis uses a multi-dimensional approach to understand 
            where news sources fall across different political axes. This helps users make 
            informed decisions about the content they consume.
          </p>
          
          <div className="axis-explanation">
            <h3>Our Analysis Axes:</h3>
            <div className="axis-grid">
              <div className="axis-item">
                <FiTarget className="axis-icon" />
                <div className="axis-content">
                  <h4>Economic Axis</h4>
                  <p>Left (Progressive) to Right (Conservative) economic policies</p>
                </div>
              </div>
              
              <div className="axis-item">
                <FiUsers className="axis-icon" />
                <div className="axis-content">
                  <h4>Social Axis</h4>
                  <p>Libertarian (Personal freedoms) to Authoritarian (Government control)</p>
                </div>
              </div>
              
              <div className="axis-item">
                <FiGlobe className="axis-icon" />
                <div className="axis-content">
                  <h4>Foreign Policy Axis</h4>
                  <p>Isolationist (Domestic focus) to Interventionist (Global engagement)</p>
                </div>
              </div>
              
              <div className="axis-item">
                <FiTrendingUp className="axis-icon" />
                <div className="axis-content">
                  <h4>Environmental Axis</h4>
                  <p>Anti-Regulation (Business-friendly) to Pro-Regulation (Environmental protection)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PoliticalOrientationChart
        sources={sources}
        selectedSource={selectedSource}
        onSourceSelect={setSelectedSource}
      />

      <div className="analysis-methodology">
        <h2>Our Methodology</h2>
        <div className="methodology-grid">
          <div className="methodology-card">
            <h3><FiTarget /> Content Analysis</h3>
            <p>
              We analyze the language, topics, and framing used in articles to determine 
              political leanings. This includes keyword analysis, topic selection patterns, 
              and editorial decisions.
            </p>
          </div>
          
          <div className="methodology-card">
            <h3><FiShield /> Source Verification</h3>
            <p>
              We cross-reference our analysis with established media bias ratings and 
              fact-checking organizations to ensure accuracy and transparency.
            </p>
          </div>
          
          <div className="methodology-card">
            <h3><FiTrendingUp /> Confidence Scoring</h3>
            <p>
              Each position comes with a confidence score based on the consistency and 
              clarity of political indicators in the source's content.
            </p>
          </div>
          
          <div className="methodology-card">
            <h3><FiInfo /> Transparency</h3>
            <p>
              We provide detailed explanations of our methodology and allow users to 
              understand how each rating was determined.
            </p>
          </div>
        </div>
      </div>

      <div className="usage-guidelines">
        <h2>How to Use This Analysis</h2>
        <div className="guidelines-content">
          <div className="guideline-item">
            <h3>1. Seek Multiple Perspectives</h3>
            <p>
              Don't rely on a single source. Use this chart to identify sources from 
              different political orientations and compare their coverage of the same events.
            </p>
          </div>
          
          <div className="guideline-item">
            <h3>2. Consider Confidence Levels</h3>
            <p>
              Higher confidence scores indicate more consistent political positioning. 
              Lower confidence may indicate mixed or evolving editorial stances.
            </p>
          </div>
          
          <div className="guideline-item">
            <h3>3. Understand Context</h3>
            <p>
              Political bias doesn't necessarily mean inaccurate reporting. Many sources 
              with clear political leanings still provide factual information, but may 
              frame it differently.
            </p>
          </div>
          
          <div className="guideline-item">
            <h3>4. Fact-Check Claims</h3>
            <p>
              Regardless of a source's political orientation, always verify important 
              claims using multiple sources and fact-checking organizations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoliticalAnalysisPage;
