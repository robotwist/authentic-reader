import { useState } from 'react';
import '../styles/SubjectGuide.css';

interface Source {
  id: number;
  name: string;
  reliability: number; // 1-10 scale
  bias: string; // "left", "center", "right"
  organizations: string[];
}

interface Topic {
  id: number;
  name: string;
  subtopics: string[];
  relatedTopics: number[];
  sources: number[];
}

interface SubjectGuideProps {
  topics: Topic[];
  sources: Source[];
  title: string;
}

const SubjectGuide = ({ topics, sources, title }: SubjectGuideProps) => {
  const [expandedTopic, setExpandedTopic] = useState<number | null>(null);
  const [showSourceDetails, setShowSourceDetails] = useState(false);

  const toggleTopicExpansion = (topicId: number) => {
    if (expandedTopic === topicId) {
      setExpandedTopic(null);
    } else {
      setExpandedTopic(topicId);
    }
  };

  const getSourceById = (id: number): Source | undefined => {
    return sources.find(source => source.id === id);
  };

  const getTopicById = (id: number): Topic | undefined => {
    return topics.find(topic => topic.id === id);
  };

  const getBiasColor = (bias: string): string => {
    switch (bias) {
      case 'left':
        return 'var(--bias-left-color, #6988c4)';
      case 'center':
        return 'var(--bias-center-color, #7aa37a)';
      case 'right':
        return 'var(--bias-right-color, #c47979)';
      default:
        return 'var(--text-light)';
    }
  };

  return (
    <div className="subject-guide">
      <div className="subject-guide-header">
        <h2>{title}</h2>
        <p>Explore topics, their connections, and information sources</p>
        <div className="guide-controls">
          <button
            className={`source-toggle ${showSourceDetails ? 'active' : ''}`}
            onClick={() => setShowSourceDetails(!showSourceDetails)}
          >
            {showSourceDetails ? 'Hide Source Details' : 'Show Source Details'}
          </button>
        </div>
      </div>

      <div className="topics-container">
        {topics.map(topic => (
          <div
            key={topic.id}
            className={`topic-card ${expandedTopic === topic.id ? 'expanded' : ''}`}
            onClick={() => toggleTopicExpansion(topic.id)}
          >
            <div className="topic-header">
              <h3>{topic.name}</h3>
              <span className="expand-icon">
                {expandedTopic === topic.id ? '−' : '+'}
              </span>
            </div>

            {expandedTopic === topic.id && (
              <div className="topic-details">
                {topic.subtopics.length > 0 && (
                  <div className="subtopics">
                    <h4>Sub-topics</h4>
                    <ul>
                      {topic.subtopics.map((subtopic, index) => (
                        <li key={index}>{subtopic}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {topic.relatedTopics.length > 0 && (
                  <div className="related-topics">
                    <h4>Related Topics</h4>
                    <div className="related-topics-list">
                      {topic.relatedTopics.map(topicId => {
                        const relatedTopic = getTopicById(topicId);
                        return relatedTopic ? (
                          <span
                            key={topicId}
                            className="related-topic-chip"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTopicExpansion(topicId);
                            }}
                          >
                            {relatedTopic.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {topic.sources.length > 0 && (
                  <div className="topic-sources">
                    <h4>Sources Covering This Topic</h4>
                    <div className="sources-list">
                      {topic.sources.map(sourceId => {
                        const source = getSourceById(sourceId);
                        return source ? (
                          <div key={sourceId} className="source-item">
                            <span 
                              className="source-name" 
                              style={{ borderLeftColor: getBiasColor(source.bias) }}
                            >
                              {source.name}
                            </span>
                            
                            {showSourceDetails && (
                              <div className="source-details">
                                <div className="source-reliability">
                                  <span className="detail-label">Reliability:</span>
                                  <div className="reliability-bar">
                                    <div 
                                      className="reliability-fill" 
                                      style={{ width: `${source.reliability * 10}%` }}
                                    ></div>
                                  </div>
                                </div>
                                
                                <div className="source-bias">
                                  <span className="detail-label">Bias:</span>
                                  <span 
                                    className={`bias-indicator bias-${source.bias}`}
                                  >
                                    {source.bias}
                                  </span>
                                </div>
                                
                                {source.organizations.length > 0 && (
                                  <div className="source-orgs">
                                    <span className="detail-label">Connected to:</span>
                                    <div className="org-chips">
                                      {source.organizations.map((org, index) => (
                                        <span key={index} className="org-chip">{org}</span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubjectGuide; 