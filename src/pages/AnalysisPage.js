import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { FiCpu, FiTarget, FiShare2, FiShield } from 'react-icons/fi';
import BiasDetection from '../components/BiasDetection';
import RhetoricalAnalysis from '../components/RhetoricalAnalysis';
import EntityRelationship from '../components/EntityRelationship';
import DarkPatternDetection from '../components/DarkPatternDetection';
import '../styles/AnalysisPage.css';
const AnalysisPage = () => {
    const [activeTab, setActiveTab] = useState('bias');
    const [sampleText, setSampleText] = useState('');
    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };
    const handleSampleTextApply = (text) => {
        setSampleText(text);
    };
    // Sample texts for different analysis types
    const getSampleText = (type) => {
        switch (type) {
            case 'bias':
                return `The radical left's agenda is pushing our country toward socialism, threatening the very foundations of our economy. Their policies would destroy jobs and raise taxes on hardworking Americans. Meanwhile, the extreme right continues to ignore the pressing issues of climate change and social inequality, focusing instead on protecting the interests of large corporations. Both sides are failing to address the needs of everyday citizens who simply want affordable healthcare, good education, and safe communities.`;
            case 'rhetorical':
                return `As we stand at the precipice of a new era, we must ask ourselves: What kind of world do we want to build? The challenges before us are not just technical problems to be solved, but moral choices that will define our generation. Some will say it's impossible to achieve our goals, but I say: nothing worth doing has ever been easy. When we look back at history, we see that every great achievement was once thought impossible until it was done. The time for action is not tomorrow, not next year, but now. Because as Martin Luther King Jr. once said, "We are confronted with the fierce urgency of now." Join me, and together we will create the future our children deserve.`;
            case 'entity':
                return `Apple Inc. CEO Tim Cook announced yesterday that the company will invest $430 billion in the United States over the next five years. The investment will create 20,000 new jobs across the country, including at the company's new campus in North Carolina. Meanwhile, Microsoft's recent acquisition of Nuance Communications for $19.7 billion signals the tech giant's growing focus on healthcare AI. President Biden praised these investments during his meeting with tech leaders at the White House last week, emphasizing the importance of American innovation in competing with China's growing technological capabilities.`;
            case 'darkpattern':
                return `LIMITED TIME OFFER: Only 2 items left in stock! Order in the next 10 minutes to guarantee delivery by Friday. 

OTHER CUSTOMERS ARE ALSO VIEWING THIS ITEM RIGHT NOW.

By clicking "Complete Purchase" you agree to our Terms of Service, Privacy Policy, and to receive marketing emails which you can unsubscribe from at any time.

[ ] Uncheck this box if you do NOT want to receive our exclusive premium offers (recommended).

COMPLETE PURCHASE

* Shipping fees will be calculated at checkout. Premium membership will auto-renew annually at $49.99 unless cancelled 7 days before renewal date.`;
            default:
                return '';
        }
    };
    return (_jsxs("div", { className: "analysis-hub-page", children: [_jsxs("div", { className: "page-header", children: [_jsx("h1", { children: "Advanced Content Analysis" }), _jsx("p", { className: "page-description", children: "Powered by Llama 3, these tools help you understand the hidden aspects of content" })] }), _jsxs("div", { className: "analysis-tabs", children: [_jsxs("button", { className: `tab-button ${activeTab === 'bias' ? 'active' : ''}`, onClick: () => handleTabChange('bias'), children: [_jsx(FiCpu, { className: "tab-icon" }), _jsx("span", { children: "Bias Detection" })] }), _jsxs("button", { className: `tab-button ${activeTab === 'rhetorical' ? 'active' : ''}`, onClick: () => handleTabChange('rhetorical'), children: [_jsx(FiTarget, { className: "tab-icon" }), _jsx("span", { children: "Rhetorical Analysis" })] }), _jsxs("button", { className: `tab-button ${activeTab === 'entity' ? 'active' : ''}`, onClick: () => handleTabChange('entity'), children: [_jsx(FiShare2, { className: "tab-icon" }), _jsx("span", { children: "Entity Relationships" })] }), _jsxs("button", { className: `tab-button ${activeTab === 'darkpattern' ? 'active' : ''}`, onClick: () => handleTabChange('darkpattern'), children: [_jsx(FiShield, { className: "tab-icon" }), _jsx("span", { children: "Dark Pattern Detection" })] })] }), _jsx("div", { className: "sample-text-controls", children: _jsx("button", { className: "sample-text-button", onClick: () => handleSampleTextApply(getSampleText(activeTab)), children: "Load Sample Text" }) }), _jsxs("div", { className: "analysis-content", children: [activeTab === 'bias' && _jsx(BiasDetection, { defaultText: sampleText }), activeTab === 'rhetorical' && _jsx(RhetoricalAnalysis, { defaultText: sampleText }), activeTab === 'entity' && _jsx(EntityRelationship, { defaultText: sampleText }), activeTab === 'darkpattern' && _jsx(DarkPatternDetection, { defaultText: sampleText })] })] }));
};
export default AnalysisPage;
