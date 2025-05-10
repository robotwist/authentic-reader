import React from 'react';
import '../styles/AboutPage.css';

const AboutPage: React.FC = () => {
  return (
    <div className="about-page">
      <div className="about-header">
        <h1>About Authentic Reader</h1>
        <p className="subtitle">Our mission is to help you read with discernment</p>
      </div>
      
      <div className="about-content">
        <section className="about-section">
          <h2>Our Vision</h2>
          <p>
            In today's information landscape, it's increasingly difficult to distinguish 
            fact from fiction, bias from balance, and manipulation from persuasion. 
            Authentic Reader was created to help readers navigate this complex ecosystem 
            with greater confidence and awareness.
          </p>
          <p>
            We believe that by highlighting the techniques used to influence your thinking 
            and helping you understand the context of what you're reading, we can empower 
            you to make more informed decisions about the content you consume.
          </p>
        </section>
        
        <section className="about-section">
          <h2>How It Works</h2>
          <p>
            Authentic Reader uses advanced machine learning and natural language processing 
            techniques to analyze articles and content from across the web. Our algorithms 
            look for patterns of bias, rhetoric techniques, logical fallacies, and dark patterns 
            in both the content and the design of websites.
          </p>
          <p>
            We present this analysis in a way that helps you understand not just what is being 
            communicated, but how it's being framed and what might be missing from the picture.
          </p>
        </section>
        
        <section className="about-section">
          <h2>Our Technology</h2>
          <div className="tech-stack">
            <div className="tech-item">
              <h3>Multi-dimensional Bias Analysis</h3>
              <p>
                We analyze content across multiple dimensions including political, 
                economic, social, and epistemological axes to provide a more nuanced 
                understanding of perspective.
              </p>
            </div>
            
            <div className="tech-item">
              <h3>Rhetoric and Persuasion Detection</h3>
              <p>
                Our system identifies various rhetoric techniques (ethos, pathos, logos, kairos) 
                used to persuade readers, making these techniques transparent.
              </p>
            </div>
            
            <div className="tech-item">
              <h3>Dark Pattern Recognition</h3>
              <p>
                We detect manipulative design patterns used to influence user behavior on websites, 
                helping you make more conscious choices online.
              </p>
            </div>
            
            <div className="tech-item">
              <h3>The Virgil AI Guide</h3>
              <p>
                Named after Dante's guide through the underworld, our Virgil AI helps explain 
                analysis results in plain language, making complex concepts accessible.
              </p>
            </div>
          </div>
        </section>
        
        <section className="about-section">
          <h2>Privacy First</h2>
          <p>
            We believe in respecting your privacy. Authentic Reader performs analysis client-side 
            when possible, and we do not store the content of articles you analyze unless you 
            explicitly choose to save them. We do not track your reading habits or build profiles 
            of your interests.
          </p>
        </section>
      </div>
    </div>
  );
};

export default AboutPage; 