import React from 'react';
import { Link } from 'react-router-dom';
import { FiShield, FiEye, FiActivity, FiCheckCircle, FiAlertTriangle, FiInfo, FiBook, FiTarget, FiTrendingUp } from 'react-icons/fi';
import '../styles/MediaLiteracyGuide.css';

const MediaLiteracyGuide: React.FC = () => {
  return (
    <div className="media-literacy-page">
      <div className="guide-header">
        <h1>Media Literacy Guide</h1>
        <p className="subtitle">Learn to navigate the information landscape with confidence</p>
      </div>

      <div className="guide-content">
        <section className="guide-section">
          <div className="section-header">
            <FiActivity className="section-icon" />
            <h2>Understanding Media Bias</h2>
          </div>
          
          <div className="content-grid">
            <div className="content-card">
              <h3>What is Media Bias?</h3>
              <p>Media bias occurs when news outlets present information in a way that favors certain viewpoints, political parties, or ideologies. This can happen through:</p>
              <ul>
                <li><strong>Selection bias:</strong> Choosing which stories to cover</li>
                <li><strong>Framing bias:</strong> How stories are presented and contextualized</li>
                <li><strong>Source bias:</strong> Which sources and experts are quoted</li>
                <li><strong>Language bias:</strong> Word choice that influences perception</li>
              </ul>
            </div>
            
            <div className="content-card">
              <h3>Political Spectrum</h3>
              <div className="spectrum-visual">
                <div className="spectrum-line">
                  <span className="spectrum-label far-left">Far Left</span>
                  <span className="spectrum-label left">Left</span>
                  <span className="spectrum-label center">Center</span>
                  <span className="spectrum-label right">Right</span>
                  <span className="spectrum-label far-right">Far Right</span>
                </div>
              </div>
              <p>Understanding where news sources fall on the political spectrum helps you:</p>
              <ul>
                <li>Recognize potential bias in reporting</li>
                <li>Seek out diverse perspectives</li>
                <li>Form more balanced opinions</li>
                <li>Avoid echo chambers</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="guide-section">
          <div className="section-header">
            <FiShield className="section-icon" />
            <h2>Evaluating Credibility</h2>
          </div>
          
          <div className="content-grid">
            <div className="content-card">
              <h3>Credibility Factors</h3>
              <div className="factor-list">
                <div className="factor-item">
                  <FiCheckCircle className="factor-icon positive" />
                  <div className="factor-content">
                    <h4>Reputable Sources</h4>
                    <p>Established news organizations with fact-checking processes</p>
                  </div>
                </div>
                
                <div className="factor-item">
                  <FiCheckCircle className="factor-icon positive" />
                  <div className="factor-content">
                    <h4>Expert Citations</h4>
                    <p>Quotes from qualified experts and primary sources</p>
                  </div>
                </div>
                
                <div className="factor-item">
                  <FiCheckCircle className="factor-icon positive" />
                  <div className="factor-content">
                    <h4>Transparency</h4>
                    <p>Clear disclosure of sources and methodology</p>
                  </div>
                </div>
                
                <div className="factor-item">
                  <FiAlertTriangle className="factor-icon negative" />
                  <div className="factor-content">
                    <h4>Sensationalist Language</h4>
                    <p>Emotional or exaggerated language that manipulates</p>
                  </div>
                </div>
                
                <div className="factor-item">
                  <FiAlertTriangle className="factor-icon negative" />
                  <div className="factor-content">
                    <h4>Anonymous Sources</h4>
                    <p>Unnamed sources without proper justification</p>
                  </div>
                </div>
                
                <div className="factor-item">
                  <FiAlertTriangle className="factor-icon negative" />
                  <div className="factor-content">
                    <h4>Lack of Context</h4>
                    <p>Information presented without proper background</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="content-card">
              <h3>Using Our Analysis Tools</h3>
              <div className="tool-guide">
                <div className="tool-item">
                  <div className="tool-header">
                    <FiTarget className="tool-icon" />
                    <h4>Credibility Score</h4>
                  </div>
                  <p>Look for articles with high credibility scores (70%+) for the most reliable information.</p>
                </div>
                
                <div className="tool-item">
                  <div className="tool-header">
                    <FiTrendingUp className="tool-icon" />
                    <h4>Complexity Analysis</h4>
                  </div>
                  <p>Choose articles that match your reading level and background knowledge.</p>
                </div>
                
                <div className="tool-item">
                  <div className="tool-header">
                    <FiEye className="tool-icon" />
                    <h4>Bias Detection</h4>
                  </div>
                  <p>Be aware of detected bias indicators and seek multiple perspectives.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="guide-section">
          <div className="section-header">
            <FiBook className="section-icon" />
            <h2>Critical Reading Strategies</h2>
          </div>
          
          <div className="content-grid">
            <div className="content-card">
              <h3>Before Reading</h3>
              <div className="strategy-list">
                <div className="strategy-item">
                  <span className="strategy-number">1</span>
                  <div className="strategy-content">
                    <h4>Check the Source</h4>
                    <p>Identify the publication and understand its reputation and potential bias</p>
                  </div>
                </div>
                
                <div className="strategy-item">
                  <span className="strategy-number">2</span>
                  <div className="strategy-content">
                    <h4>Read the Headline Critically</h4>
                    <p>Look for sensationalist language or clickbait indicators</p>
                  </div>
                </div>
                
                <div className="strategy-item">
                  <span className="strategy-number">3</span>
                  <div className="strategy-content">
                    <h4>Check the Date</h4>
                    <p>Ensure the information is current and relevant</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="content-card">
              <h3>While Reading</h3>
              <div className="strategy-list">
                <div className="strategy-item">
                  <span className="strategy-number">4</span>
                  <div className="strategy-content">
                    <h4>Identify Claims vs. Facts</h4>
                    <p>Distinguish between verifiable facts and opinions or claims</p>
                  </div>
                </div>
                
                <div className="strategy-item">
                  <span className="strategy-number">5</span>
                  <div className="strategy-content">
                    <h4>Check Sources</h4>
                    <p>Look for citations, links, and references to verify information</p>
                  </div>
                </div>
                
                <div className="strategy-item">
                  <span className="strategy-number">6</span>
                  <div className="strategy-content">
                    <h4>Consider Multiple Perspectives</h4>
                    <p>Seek out different viewpoints on the same topic</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="guide-section">
          <div className="section-header">
            <FiInfo className="section-icon" />
            <h2>Using Our Balanced Feed</h2>
          </div>
          
          <div className="content-grid">
            <div className="content-card">
              <h3>Getting Multiple Perspectives</h3>
              <p>Our balanced feed automatically gathers articles from across the political spectrum:</p>
              <div className="perspective-grid">
                <div className="perspective-item">
                  <div className="perspective-color far-left"></div>
                  <h4>Far Left</h4>
                  <p>Socialist and progressive viewpoints</p>
                </div>
                <div className="perspective-item">
                  <div className="perspective-color left"></div>
                  <h4>Left</h4>
                  <p>Liberal and center-left perspectives</p>
                </div>
                <div className="perspective-item">
                  <div className="perspective-color center"></div>
                  <h4>Center</h4>
                  <p>Neutral and fact-based reporting</p>
                </div>
                <div className="perspective-item">
                  <div className="perspective-color right"></div>
                  <h4>Right</h4>
                  <p>Conservative viewpoints</p>
                </div>
                <div className="perspective-item">
                  <div className="perspective-color far-right"></div>
                  <h4>Far Right</h4>
                  <p>Far-right and alternative perspectives</p>
                </div>
              </div>
            </div>
            
            <div className="content-card">
              <h3>Tips for Balanced Reading</h3>
              <div className="tips-list">
                <div className="tip-item">
                  <h4>Compare Coverage</h4>
                  <p>Read multiple articles on the same topic from different sources</p>
                </div>
                
                <div className="tip-item">
                  <h4>Use Filters Wisely</h4>
                  <p>Don't filter out perspectives you disagree with - challenge your assumptions</p>
                </div>
                
                <div className="tip-item">
                  <h4>Focus on Facts</h4>
                  <p>Look for factual information that appears across multiple sources</p>
                </div>
                
                <div className="tip-item">
                  <h4>Question Everything</h4>
                  <p>Maintain healthy skepticism and verify claims independently</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="guide-section">
          <div className="section-header">
            <FiShield className="section-icon" />
            <h2>Fact-Checking Resources</h2>
          </div>
          
          <div className="content-grid">
            <div className="content-card">
              <h3>Trusted Fact-Checking Sites</h3>
              <div className="resource-list">
                <a href="https://www.snopes.com" target="_blank" rel="noopener noreferrer" className="resource-link">
                  <h4>Snopes</h4>
                  <p>Debunks urban legends and misinformation</p>
                </a>
                
                <a href="https://www.factcheck.org" target="_blank" rel="noopener noreferrer" className="resource-link">
                  <h4>FactCheck.org</h4>
                  <p>Non-partisan fact-checking of political claims</p>
                </a>
                
                <a href="https://www.politifact.com" target="_blank" rel="noopener noreferrer" className="resource-link">
                  <h4>PolitiFact</h4>
                  <p>Truth-o-meter for political statements</p>
                </a>
                
                <a href="https://www.reuters.com/fact-check" target="_blank" rel="noopener noreferrer" className="resource-link">
                  <h4>Reuters Fact Check</h4>
                  <p>International news agency fact-checking</p>
                </a>
              </div>
            </div>
            
            <div className="content-card">
              <h3>Verification Tools</h3>
              <div className="tool-list">
                <div className="tool-item">
                  <h4>Reverse Image Search</h4>
                  <p>Use Google Images or TinEye to verify if images are authentic</p>
                </div>
                
                <div className="tool-item">
                  <h4>WHOIS Lookup</h4>
                  <p>Check website registration information for legitimacy</p>
                </div>
                
                <div className="tool-item">
                  <h4>Archive.org</h4>
                  <p>View previous versions of websites to track changes</p>
                </div>
                
                <div className="tool-item">
                  <h4>Social Media Verification</h4>
                  <p>Check for verified badges and account history</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="guide-footer">
        <div className="footer-content">
          <h3>Ready to Start?</h3>
          <p>Apply these skills to your daily news consumption and become a more informed citizen.</p>
          <Link to="/" className="start-button">
            Explore Balanced Feed
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MediaLiteracyGuide;
