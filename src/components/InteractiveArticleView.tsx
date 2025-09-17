import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiBookmark, FiShare2, FiDownload, FiInfo } from 'react-icons/fi';
import '../styles/InteractiveArticleView.css';

interface ArticleContent {
  title: string;
  content: string;
  source?: string;
  author?: string;
  publishedDate?: string;
  imageUrl?: string;
}

const InteractiveArticleView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<ArticleContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeHighlights, setActiveHighlights] = useState<string[]>(['bias', 'rhetoric', 'fallacy']);
  
  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        
        // This would be replaced with your actual API call
        // For now, we'll simulate loading an article
        setTimeout(() => {
          // Placeholder article data - in production, this would be fetched from your API
          const articleData: ArticleContent = {
            title: "Understanding Media Bias in the Digital Age",
            content: `
              <p>In today's media landscape, <span class="highlight bias" data-type="bias" data-info="Loaded language suggesting media intentionally manipulates">consumers are constantly bombarded</span> with information from countless sources, making it increasingly difficult to distinguish fact from opinion.</p>
              
              <p>Many news organizations <span class="highlight rhetoric" data-type="rhetoric" data-info="Appeal to authority - citing unnamed experts">according to experts</span>, have shifted from objective reporting to opinion-based content that caters to specific audiences. This shift has led to <span class="highlight bias" data-type="bias" data-info="Emotional language to evoke strong reactions">dangerous echo chambers</span> where readers only consume content that confirms their existing beliefs.</p>
              
              <p>The consequences of this trend <span class="highlight fallacy" data-type="fallacy" data-info="Slippery slope fallacy">will inevitably lead to a complete breakdown of societal cohesion</span> if left unchecked. Research shows that media bias affects how people perceive events and <span class="highlight rhetoric" data-type="rhetoric" data-info="Appeal to fear">threatens the very foundations of democracy</span>.</p>
              
              <p>Conservative outlets <span class="highlight bias" data-type="bias" data-info="Generalization about a group">always prioritize</span> economic concerns, while liberal publications <span class="highlight bias" data-type="bias" data-info="Generalization about a group">focus exclusively</span> on social justice issues. This divide creates a scenario where <span class="highlight fallacy" data-type="fallacy" data-info="False dichotomy">Americans must choose between economic prosperity and social progress</span>.</p>
              
              <p>To combat media bias, readers should <span class="highlight rhetoric" data-type="rhetoric" data-info="Appeal to common sense">obviously consume content from multiple sources</span> and develop critical thinking skills. However, this solution <span class="highlight fallacy" data-type="fallacy" data-info="Hasty generalization">cannot work for most Americans who lack the time and education necessary</span> to thoroughly analyze news content.</p>
              
              <p>The rise of fact-checking organizations represents a <span class="highlight bias" data-type="bias" data-info="Subjective claim presented as fact">positive development</span> in countering misinformation, though critics argue these organizations <span class="highlight bias" data-type="bias" data-info="Attribution bias">themselves harbor biases</span>.</p>
              
              <p>What remains clear is that media literacy has become <span class="highlight rhetoric" data-type="rhetoric" data-info="Appeal to importance">one of the most essential skills</span> for navigating the modern information environment. Without it, citizens <span class="highlight fallacy" data-type="fallacy" data-info="Appeal to consequences">will be unable to make informed decisions about the issues that affect their lives</span>.</p>
            `,
            source: "Authentic Reader Analysis",
            author: "Research Team",
            publishedDate: new Date().toDateString(),
            imageUrl: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
          };
          
          setArticle(articleData);
          setLoading(false);
        }, 1500);
        
      } catch (err) {
        setError("Failed to load article. Please try again.");
        setLoading(false);
      }
    };
    
    fetchArticle();
  }, [id]);
  
  const goBack = () => {
    navigate(-1);
  };
  
  const toggleHighlight = (type: string) => {
    setActiveHighlights(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type) 
        : [...prev, type]
    );
  };
  
  if (loading) {
    return (
      <div className="interactive-article-container">
        <div className="loading-container">
          <div className="loader"></div>
          <p>Loading interactive article...</p>
        </div>
      </div>
    );
  }
  
  if (error || !article) {
    return (
      <div className="interactive-article-container">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error || "Unable to load article"}</p>
          <button onClick={goBack} className="back-button">
            <FiArrowLeft /> Go Back
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="interactive-article-container">
      <div className="article-tools">
        <button onClick={goBack} className="tool-button" title="Go back">
          <FiArrowLeft />
        </button>
        <div className="highlight-toggles">
          <button 
            className={`toggle-button ${activeHighlights.includes('bias') ? 'active' : ''} bias`} 
            onClick={() => toggleHighlight('bias')}
            title="Toggle bias highlights"
          >
            Bias
          </button>
          <button 
            className={`toggle-button ${activeHighlights.includes('rhetoric') ? 'active' : ''} rhetoric`} 
            onClick={() => toggleHighlight('rhetoric')}
            title="Toggle rhetorical techniques"
          >
            Rhetoric
          </button>
          <button 
            className={`toggle-button ${activeHighlights.includes('fallacy') ? 'active' : ''} fallacy`} 
            onClick={() => toggleHighlight('fallacy')}
            title="Toggle logical fallacies"
          >
            Fallacies
          </button>
        </div>
        <div className="article-actions">
          <button className="tool-button" title="Save article">
            <FiBookmark />
          </button>
          <button className="tool-button" title="Share article">
            <FiShare2 />
          </button>
          <button className="tool-button" title="Download analysis">
            <FiDownload />
          </button>
        </div>
      </div>
      
      <div className="article-content-wrapper">
        <div className={`article-content ${activeHighlights.join(' ')}`}>
          {article.imageUrl && (
            <div className="article-image">
              <img src={article.imageUrl} alt={article.title} />
            </div>
          )}
          
          <div className="article-meta">
            {article.source && <span className="article-source">{article.source}</span>}
            {article.publishedDate && <span className="article-date">{article.publishedDate}</span>}
          </div>
          
          <h1 className="article-title">{article.title}</h1>
          
          {article.author && <p className="article-author">By {article.author}</p>}
          
          <div 
            className="article-body"
            dangerouslySetInnerHTML={{ __html: article.content }} 
          />
        </div>
        
        <div className="analysis-info-panel">
          <div className="info-header">
            <FiInfo /> <h3>Analysis Information</h3>
          </div>
          <p>
            This interactive view highlights potentially problematic elements in the text. 
            Hover over highlighted sections to see detailed explanations.
          </p>
          <div className="analysis-legend">
            <div className="legend-item">
              <span className="legend-color bias"></span>
              <span className="legend-label">Bias - Potential instances of media bias</span>
            </div>
            <div className="legend-item">
              <span className="legend-color rhetoric"></span>
              <span className="legend-label">Rhetoric - Persuasive techniques</span>
            </div>
            <div className="legend-item">
              <span className="legend-color fallacy"></span>
              <span className="legend-label">Fallacies - Logical reasoning errors</span>
            </div>
          </div>
          <div className="analysis-stats">
            <div className="stat-item">
              <span className="stat-value">7</span>
              <span className="stat-label">Highlighted Items</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">Medium</span>
              <span className="stat-label">Overall Bias Level</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveArticleView; 