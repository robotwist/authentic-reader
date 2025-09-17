import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// @ts-ignore
import { useState } from 'react';
import '../styles/AnalysisTest.css';
import { analyzeContent } from '../services/contentAnalysisService';
import ArticleAnalysis from './ArticleAnalysis';
const AnalysisTest = () => {
    const [content, setContent] = useState('');
    const [testTitle, setTestTitle] = useState('Test Article');
    const [testSource, setTestSource] = useState('Sample Source');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [error, setError] = useState(null);
    const handleAnalyze = async () => {
        if (!content.trim()) {
            setError('Please enter some content to analyze');
            return;
        }
        setError(null);
        setIsAnalyzing(true);
        try {
            const result = await analyzeContent(content);
            setAnalysisResult(result);
        }
        catch (err) {
            console.error('Analysis error:', err);
            setError('An error occurred during analysis');
        }
        finally {
            setIsAnalyzing(false);
        }
    };
    const handlePasteFromClipboard = async () => {
        try {
            const clipboardText = await navigator.clipboard.readText();
            if (clipboardText) {
                setContent(clipboardText);
            }
        }
        catch (error) {
            console.error('Failed to read clipboard:', error);
            alert('Unable to access clipboard. Please paste content manually.');
        }
    };
    const handleSampleArticle = () => {
        // Emotionally-rich sample article that will trigger multiple analysis features
        const sampleArticle = `
    # The Impending Climate Catastrophe: Why You Should Be Terrified
    
    In an absolutely shocking turn of events, scientists have discovered that we have ONLY FIVE YEARS LEFT before climate change becomes irreversible. This is outrageous and completely unacceptable!
    
    ## The Horrifying Truth
    
    The data is crystal clear - our planet is on the brink of disaster, and nobody seems to care! Politicians continue to ignore the imminent threat while oil companies rake in record profits. It's disgusting how they prioritize money over our children's future.
    
    The liberal agenda has been pushing for climate action for decades, but conservative interests have consistently blocked progress. This is nothing short of criminal negligence that will lead to the suffering of millions.
    
    ## Why You Should Be Afraid
    
    What if I told you that within your lifetime:
    - Coastal cities will be underwater, creating millions of climate refugees
    - Extreme weather will make large portions of Earth uninhabitable
    - Food shortages will lead to global conflict and societal collapse
    - Your children will live in a dystopian world because of today's inaction
    
    The evidence is absolutely clear - this is an emergency situation requiring immediate action. Anyone who denies this is either ignorant or deliberately spreading misinformation.
    
    ## Act Now or Regret Forever
    
    We must demand action immediately before it's too late. This is your last chance to make a difference before we reach the point of no return.
    
    If you're not terrified, you're not paying attention. Share this article now to wake people up to the horrifying reality we face!
    
    The clock is ticking, and we're running out of time. The future of humanity depends on what we do right now.
    `;
        setContent(sampleArticle);
        setTestTitle('The Impending Climate Catastrophe: Why You Should Be Terrified');
        setTestSource('Climate Awareness Network');
    };
    return (_jsxs("div", { className: "analysis-test-container", children: [_jsxs("div", { className: "instruction-panel", children: [_jsx("h2", { children: "Authentic Reader Analysis Test" }), _jsx("p", { children: "This tool allows you to test the content analysis algorithms on any text. The analysis includes:" }), _jsxs("ul", { children: [_jsx("li", { children: "Logical fallacy detection" }), _jsx("li", { children: "Bias analysis" }), _jsx("li", { children: "Doomscroll and outrage bait detection" }), _jsx("li", { children: "Emotional appeals analysis" }), _jsx("li", { children: "Content quality metrics" })] }), _jsx("p", { children: "You can paste your own text below or use our emotionally-charged sample article that triggers multiple analysis features." })] }), _jsxs("div", { className: "test-panel", children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "title", children: "Article Title:" }), _jsx("input", { type: "text", id: "title", value: testTitle, onChange: (e) => setTestTitle(e.target.value) })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "source", children: "Source:" }), _jsx("input", { type: "text", id: "source", value: testSource, onChange: (e) => setTestSource(e.target.value) })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "content", children: "Content:" }), _jsx("textarea", { id: "content", value: content, onChange: (e) => setContent(e.target.value), rows: 15, placeholder: "Paste article content here..." }), error && _jsx("div", { className: "error-message", children: error })] }), _jsxs("div", { className: "button-group", children: [_jsx("button", { className: "sample-button", onClick: handleSampleArticle, children: "Load Sample Article" }), _jsx("button", { className: "analyze-button", onClick: handleAnalyze, disabled: isAnalyzing, children: isAnalyzing ? 'Analyzing...' : 'Analyze Content' })] })] }), analysisResult && (_jsxs("div", { className: "result-panel", children: [_jsx("h2", { children: "Analysis Results" }), _jsxs("div", { className: "result-instructions", children: [_jsx("p", { children: "Click on the tabs below to explore different aspects of the analysis:" }), _jsxs("ul", { children: [_jsxs("li", { children: [_jsx("strong", { children: "Logical Fallacies:" }), " Reasoning errors in the content"] }), _jsxs("li", { children: [_jsx("strong", { children: "Bias Analysis:" }), " Political leaning and framing"] }), _jsxs("li", { children: [_jsx("strong", { children: "Content Metrics:" }), " Statistics and content quality factors"] }), _jsxs("li", { children: [_jsx("strong", { children: "Manipulation:" }), " Doomscroll and outrage bait detection"] }), _jsxs("li", { children: [_jsx("strong", { children: "Emotions:" }), " Detailed emotional content and appeals analysis"] })] })] }), _jsx(ArticleAnalysis, { title: testTitle, source: testSource, author: "Test Author", date: new Date().toISOString(), analysis: analysisResult })] }))] }));
};
export default AnalysisTest;
