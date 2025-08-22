import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import FactCheckingAssistant from '../components/FactCheckingAssistant';
import '../styles/FactCheckingPage.css';

const FactCheckingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleFactCheckComplete = (result: any) => {
    console.log('Fact check completed:', result);
    // You could save the results, show notifications, etc.
  };

  return (
    <div className="fact-checking-page">
      <div className="page-header">
        <button onClick={() => navigate('/')} className="back-button">
          <FiArrowLeft /> Back to Home
        </button>
      </div>

      <FactCheckingAssistant 
        onFactCheckComplete={handleFactCheckComplete}
      />
    </div>
  );
};

export default FactCheckingPage;
