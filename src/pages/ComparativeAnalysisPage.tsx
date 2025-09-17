import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import ComparativeAnalysis from '../components/ComparativeAnalysis';
import '../styles/ComparativeAnalysisPage.css';

interface Article {
  title: string;
  link: string;
  description: string;
  content: string;
  pubDate: string;
  author: string;
  source: string;
  analysis?: any;
}

const ComparativeAnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load sample articles for demonstration
    loadSampleArticles();
  }, []);

  const loadSampleArticles = async () => {
    try {
      // Try to fetch real articles from the balanced feed
      const response = await fetch('http://localhost:3000/api/balanced-feed');
      if (response.ok) {
        const data = await response.json();
        const realArticles = data.articles?.slice(0, 8) || [];
        
        if (realArticles.length > 0) {
          setArticles(realArticles);
          setLoading(false);
          return;
        }
      }
    } catch (error) {
      console.log('Using sample articles for demonstration');
    }

    // Fallback to sample articles
    const sampleArticles: Article[] = [
      {
        title: "New AI Breakthrough: GPT-5 Achieves Human-Level Reasoning",
        link: "https://example.com/tech1",
        description: "OpenAI announced today that GPT-5 has achieved human-level reasoning capabilities. The new model scored 95% on standardized intelligence tests, surpassing previous benchmarks.",
        content: "OpenAI announced today that GPT-5 has achieved human-level reasoning capabilities. The new model scored 95% on standardized intelligence tests, surpassing previous benchmarks. According to the study, GPT-5 can now solve complex problems that previously required human experts. This breakthrough represents a significant milestone in artificial intelligence development. Researchers say the model demonstrates unprecedented understanding of context and can engage in sophisticated reasoning tasks.",
        pubDate: "2024-01-15T10:00:00Z",
        author: "Tech Reporter",
        source: "Tech News Daily"
      },
      {
        title: "AI Researchers Question GPT-5 Claims",
        link: "https://example.com/tech2",
        description: "Leading AI researchers are disputing claims that GPT-5 has achieved human-level reasoning. Independent testing shows the model scored only 72% on intelligence tests.",
        content: "Leading AI researchers are disputing claims that GPT-5 has achieved human-level reasoning. Independent testing shows the model scored only 72% on intelligence tests, not the 95% claimed. Experts say the methodology used in the original study was flawed and lacked proper controls. This controversy highlights the need for more rigorous AI evaluation standards. The research community is calling for independent verification of these claims.",
        pubDate: "2024-01-16T14:30:00Z",
        author: "Science Writer",
        source: "Science Review"
      },
      {
        title: "GPT-5 Performance Analysis: Mixed Results",
        link: "https://example.com/tech3",
        description: "A comprehensive analysis of GPT-5 shows mixed performance results. The model achieved 85% on reasoning tests, which is impressive but not human-level.",
        content: "A comprehensive analysis of GPT-5 shows mixed performance results. The model achieved 85% on reasoning tests, which is impressive but not human-level. Researchers found that GPT-5 excels at pattern recognition but struggles with abstract reasoning. The study suggests that while AI has made significant progress, human-level intelligence remains elusive. The analysis provides a balanced view of current AI capabilities.",
        pubDate: "2024-01-17T09:15:00Z",
        author: "AI Researcher",
        source: "AI Research Journal"
      },
      {
        title: "Climate Change Study Shows 2.5% Increase in Global Temperatures",
        link: "https://example.com/climate1",
        description: "A new study published in Nature shows that global temperatures have increased by 2.5% over the past decade. Scientists from leading universities confirm these findings.",
        content: "A new study published in Nature shows that global temperatures have increased by 2.5% over the past decade. Scientists from leading universities confirm these findings. The research indicates significant climate change impacts that require immediate attention. The study analyzed data from over 100 weather stations worldwide and found consistent warming trends. These findings support the urgent need for climate action.",
        pubDate: "2024-01-15T16:45:00Z",
        author: "Environmental Scientist",
        source: "Scientific Journal"
      },
      {
        title: "Climate Research Disputes Temperature Claims",
        link: "https://example.com/climate2",
        description: "Recent analysis challenges the claim that global temperatures increased by 2.5%. Independent researchers found only a 1.2% increase.",
        content: "Recent analysis challenges the claim that global temperatures increased by 2.5%. Independent researchers found only a 1.2% increase over the past decade. The study methodology has been questioned by experts who point to potential biases in data collection. This research suggests that climate change impacts may be less severe than previously reported. However, researchers emphasize that climate action remains important.",
        pubDate: "2024-01-16T11:20:00Z",
        author: "Independent Researcher",
        source: "Independent Research"
      },
      {
        title: "Economic Recovery Shows Strong Growth in Q4",
        link: "https://example.com/economy1",
        description: "The latest economic data shows strong recovery with 3.2% GDP growth in the fourth quarter. Experts predict continued positive trends.",
        content: "The latest economic data shows strong recovery with 3.2% GDP growth in the fourth quarter. Experts predict continued positive trends for the coming year. The recovery has been driven by strong consumer spending and business investment. Employment numbers have also shown significant improvement. This economic performance exceeds most analysts' expectations.",
        pubDate: "2024-01-18T08:30:00Z",
        author: "Economic Analyst",
        source: "Financial Times"
      },
      {
        title: "Economic Concerns: Recovery May Be Temporary",
        link: "https://example.com/economy2",
        description: "Some economists warn that the current economic recovery may be temporary. Underlying structural issues remain unaddressed.",
        content: "Some economists warn that the current economic recovery may be temporary. Underlying structural issues remain unaddressed despite positive GDP numbers. Concerns include rising inflation, supply chain disruptions, and labor market imbalances. These factors could undermine long-term economic stability. The recovery may not be as robust as initial reports suggest.",
        pubDate: "2024-01-19T13:45:00Z",
        author: "Economic Policy Expert",
        source: "Economic Review"
      },
      {
        title: "Healthcare Reform Bill Passes with Bipartisan Support",
        link: "https://example.com/healthcare1",
        description: "A major healthcare reform bill has passed with bipartisan support. The legislation aims to reduce costs and improve access.",
        content: "A major healthcare reform bill has passed with bipartisan support. The legislation aims to reduce costs and improve access to healthcare services. The bill includes provisions for prescription drug price controls and expanded insurance coverage. Lawmakers from both parties worked together to craft this compromise legislation. This represents a significant step forward in healthcare policy.",
        pubDate: "2024-01-20T10:15:00Z",
        author: "Political Reporter",
        source: "National News"
      }
    ];

    setArticles(sampleArticles);
    setLoading(false);
  };

  const handleAnalysisComplete = (result: any) => {
    console.log('Comparative analysis completed:', result);
    // You could save the results, show notifications, etc.
  };

  if (loading) {
    return (
      <div className="comparative-analysis-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading articles for comparison...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="comparative-analysis-page">
      <div className="page-header">
        <button onClick={() => navigate('/')} className="back-button">
          <FiArrowLeft /> Back to Home
        </button>
      </div>

      <ComparativeAnalysis 
        articles={articles}
        onAnalysisComplete={handleAnalysisComplete}
      />
    </div>
  );
};

export default ComparativeAnalysisPage;
