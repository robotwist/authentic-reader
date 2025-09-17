import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCpu, FiTarget, FiBarChart2 } from 'react-icons/fi';
import AIAgentOrchestrator from '../components/AIAgentOrchestrator';
import '../styles/AIAgentOrchestratorPage.css';
const AIAgentOrchestratorPage = () => {
    const navigate = useNavigate();
    const [analysisResults, setAnalysisResults] = useState(null);
    const [sampleContent, setSampleContent] = useState(`Artificial intelligence continues to advance at an unprecedented pace, raising important questions about ethics and responsibility. Recent developments in machine learning have demonstrated both the incredible potential and the significant risks associated with AI systems.

Leading researchers emphasize the need for comprehensive ethical frameworks that can guide AI development. "We're at a critical juncture where the decisions we make today will shape the future of AI for decades to come," says Dr. Sarah Chen, a prominent AI ethicist at Stanford University.

The debate centers around several key issues: algorithmic bias, privacy concerns, and the potential for job displacement. While some argue that AI will create more jobs than it eliminates, others point to historical precedents where technological revolutions led to significant economic disruption.

Companies like Google, Microsoft, and OpenAI have established AI ethics boards, but critics argue that self-regulation is insufficient. "We need government oversight to ensure that AI development serves the public interest," argues Professor Michael Rodriguez of the Center for Technology Policy.

The European Union's AI Act represents one of the most comprehensive attempts to regulate AI development. The legislation categorizes AI systems by risk level and imposes different requirements based on potential harm. However, implementation challenges remain significant.

Experts agree that education and public awareness are crucial. "People need to understand both the capabilities and limitations of AI systems," notes Dr. Emily Watson, director of the AI Literacy Initiative. "This knowledge is essential for informed public discourse and policy-making."

The path forward requires collaboration between technologists, policymakers, ethicists, and the public. Only through such cooperation can we ensure that AI development benefits humanity while minimizing potential harms.`);
    const handleAnalysisComplete = (results) => {
        setAnalysisResults(results);
        console.log('Multi-agent analysis complete:', results);
    };
    const handleAgentUpdate = (agent) => {
        console.log('Agent updated:', agent);
    };
    return (_jsxs("div", { className: "ai-agent-orchestrator-page", children: [_jsxs("div", { className: "page-header", children: [_jsxs("button", { onClick: () => navigate('/'), className: "back-button", children: [_jsx(FiArrowLeft, {}), " Back to Home"] }), _jsxs("div", { className: "header-info", children: [_jsx("h1", { children: "AI Agent Orchestrator" }), _jsx("p", { children: "Multi-agent system for comprehensive media analysis and bias detection" })] })] }), _jsxs("div", { className: "content-input-section", children: [_jsxs("h3", { children: [_jsx(FiCpu, {}), " Analysis Content"] }), _jsxs("div", { className: "content-controls", children: [_jsx("textarea", { value: sampleContent, onChange: (e) => setSampleContent(e.target.value), placeholder: "Enter content for multi-agent analysis...", className: "content-textarea", rows: 8 }), _jsxs("div", { className: "content-actions", children: [_jsx("button", { onClick: () => setSampleContent(''), className: "clear-button", children: "Clear Content" }), _jsx("button", { onClick: () => setSampleContent(`Climate change represents one of the most pressing challenges of our time. The scientific consensus is clear: human activities are driving unprecedented changes in Earth's climate system.

Recent studies have shown that global temperatures are rising at an alarming rate, with the past decade being the warmest on record. The Intergovernmental Panel on Climate Change (IPCC) has warned that we have a limited window to take decisive action to prevent catastrophic climate impacts.

However, there are those who argue that the economic costs of climate action are too high. Some critics point to the potential job losses in fossil fuel industries, while others question the effectiveness of proposed solutions like renewable energy and carbon pricing.

The debate often becomes polarized, with environmentalists calling for immediate, aggressive action and some business leaders advocating for a more gradual approach. This polarization can make it difficult for policymakers to find common ground and implement effective solutions.

What's clear is that the transition to a low-carbon economy will require significant investment and policy coordination. The challenge lies in designing policies that achieve environmental goals while maintaining economic competitiveness and social equity.

The role of technology in addressing climate change cannot be overstated. Innovations in renewable energy, energy storage, and carbon capture technologies offer hope for reducing emissions while maintaining economic growth.

International cooperation is also crucial. Climate change is a global problem that requires global solutions. The Paris Agreement represents an important step forward, but much more needs to be done to meet its ambitious goals.

As we move forward, it's essential that we base our decisions on sound science and consider the long-term implications of our choices. The stakes are too high to let political ideology or short-term economic interests drive our response to this critical challenge.`), className: "sample-button", children: "Load Sample Content" })] })] })] }), _jsx(AIAgentOrchestrator, { content: sampleContent, onAnalysisComplete: handleAnalysisComplete, onAgentUpdate: handleAgentUpdate }), analysisResults && (_jsxs("div", { className: "results-section", children: [_jsxs("h3", { children: [_jsx(FiBarChart2, {}), " Analysis Results"] }), _jsxs("div", { className: "results-content", children: [_jsxs("div", { className: "result-card", children: [_jsx("h4", { children: "Overall Assessment" }), _jsx("p", { children: analysisResults.overallAssessment })] }), _jsxs("div", { className: "result-card", children: [_jsx("h4", { children: "Agent Contributions" }), _jsx("div", { className: "agent-contributions", children: analysisResults.agentContributions.map((contribution, index) => (_jsxs("div", { className: "contribution-item", children: [_jsx("strong", { children: contribution.agent }), ": ", contribution.task] }, index))) })] }), _jsxs("div", { className: "result-card", children: [_jsx("h4", { children: "Recommendations" }), _jsx("ul", { className: "recommendations-list", children: analysisResults.recommendations.map((rec, index) => (_jsx("li", { children: rec }, index))) })] }), _jsxs("div", { className: "result-card", children: [_jsx("h4", { children: "Confidence Score" }), _jsxs("div", { className: "confidence-display", children: [_jsxs("span", { className: "confidence-value", children: [Math.round(analysisResults.confidence * 100), "%"] }), _jsx("div", { className: "confidence-bar", children: _jsx("div", { className: "confidence-fill", style: { width: `${analysisResults.confidence * 100}%` } }) })] })] })] })] })), _jsxs("div", { className: "quick-actions", children: [_jsx("h3", { children: "Quick Actions" }), _jsxs("div", { className: "actions-grid", children: [_jsxs("button", { onClick: () => navigate('/analysis'), className: "action-card", children: [_jsx(FiTarget, {}), _jsx("span", { children: "Single Article Analysis" })] }), _jsxs("button", { onClick: () => navigate('/analysis/comparative'), className: "action-card", children: [_jsx(FiBarChart2, {}), _jsx("span", { children: "Comparative Analysis" })] }), _jsxs("button", { onClick: () => navigate('/sentiment-analysis'), className: "action-card", children: [_jsx(FiCpu, {}), _jsx("span", { children: "Sentiment Analysis" })] })] })] })] }));
};
export default AIAgentOrchestratorPage;
