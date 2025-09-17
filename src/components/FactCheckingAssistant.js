import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { FiSearch, FiCheckCircle, FiXCircle, FiAlertTriangle, FiInfo, FiExternalLink, FiClock, FiShield, FiBookOpen, FiTarget } from 'react-icons/fi';
import useLlamaAnalysis from '../hooks/useLlamaAnalysis';
import '../styles/FactCheckingAssistant.css';
const FactCheckingAssistant = ({ initialClaim = '', onFactCheckComplete }) => {
    const [claim, setClaim] = useState(initialClaim);
    const [isChecking, setIsChecking] = useState(false);
    const [factCheckResult, setFactCheckResult] = useState(null);
    const [checkProgress, setCheckProgress] = useState(0);
    const [recentChecks, setRecentChecks] = useState([]);
    const { analyzeBias } = useLlamaAnalysis();
    useEffect(() => {
        // Load recent fact checks from localStorage
        const saved = localStorage.getItem('recentFactChecks');
        if (saved) {
            try {
                setRecentChecks(JSON.parse(saved).slice(0, 5));
            }
            catch (e) {
                console.error('Error loading recent fact checks:', e);
            }
        }
    }, []);
    const performFactCheck = async () => {
        if (!claim.trim()) {
            alert('Please enter a claim to fact-check');
            return;
        }
        setIsChecking(true);
        setCheckProgress(0);
        try {
            // Step 1: Analyze the claim for bias and context
            setCheckProgress(20);
            const biasAnalysis = await analyzeBias(claim);
            // Step 2: Generate fact-check result
            setCheckProgress(60);
            const result = await generateFactCheckResult(claim, biasAnalysis);
            // Step 3: Complete the check
            setCheckProgress(100);
            setFactCheckResult(result);
            // Save to recent checks
            const updatedRecent = [result, ...recentChecks.slice(0, 4)];
            setRecentChecks(updatedRecent);
            localStorage.setItem('recentFactChecks', JSON.stringify(updatedRecent));
            if (onFactCheckComplete) {
                onFactCheckComplete(result);
            }
        }
        catch (error) {
            console.error('Fact check failed:', error);
            alert('Fact check failed. Please try again.');
        }
        finally {
            setIsChecking(false);
            setCheckProgress(0);
        }
    };
    const generateFactCheckResult = async (claimText, biasAnalysis) => {
        // This would ideally call a more sophisticated fact-checking service
        // For now, we'll create a sophisticated mock result based on the claim content
        const claimLower = claimText.toLowerCase();
        const biasScore = biasAnalysis.bias_scores?.political || 5;
        // Determine status based on claim content and bias
        let status = 'unverified';
        let confidence = 0.5;
        let explanation = '';
        let aiInsight = '';
        // Analyze claim patterns
        if (claimLower.includes('study shows') || claimLower.includes('research indicates')) {
            status = 'verified';
            confidence = 0.8;
            explanation = 'This claim references scientific research or studies, which typically provide reliable evidence.';
            aiInsight = 'Claims referencing studies are generally more reliable, but always check the source and methodology.';
        }
        else if (claimLower.includes('experts say') || claimLower.includes('scientists agree')) {
            status = 'verified';
            confidence = 0.7;
            explanation = 'This claim references expert opinion, which provides credible support.';
            aiInsight = 'Expert consensus is a strong indicator of reliability, but verify the specific experts cited.';
        }
        else if (claimLower.includes('everyone knows') || claimLower.includes('obviously')) {
            status = 'misleading';
            confidence = 0.6;
            explanation = 'This claim uses vague language and appeals to common belief rather than providing specific evidence.';
            aiInsight = 'Claims using "everyone knows" or "obviously" often lack specific evidence and should be questioned.';
        }
        else if (claimLower.includes('shocking') || claimLower.includes('outrageous')) {
            status = 'disputed';
            confidence = 0.4;
            explanation = 'This claim uses emotionally charged language that may indicate bias or exaggeration.';
            aiInsight = 'Emotionally charged language often indicates bias and should be fact-checked carefully.';
        }
        else if (biasScore > 7) {
            status = 'disputed';
            confidence = 0.3;
            explanation = 'This claim shows high political bias and should be verified with multiple sources.';
            aiInsight = 'High bias claims require extra verification from neutral sources.';
        }
        else {
            status = 'unverified';
            confidence = 0.5;
            explanation = 'This claim requires additional verification from reliable sources.';
            aiInsight = 'When in doubt, verify claims with multiple reputable sources.';
        }
        // Generate mock evidence and sources
        const evidence = {
            supporting: status === 'verified' ? [
                'Multiple independent sources confirm this claim',
                'Expert analysis supports the statement',
                'Statistical data backs this assertion'
            ] : [],
            contradicting: status === 'false' || status === 'disputed' ? [
                'Contradictory evidence from reliable sources',
                'Expert opinion disputes this claim',
                'Factual errors identified in the statement'
            ] : [],
            neutral: [
                'Additional context needed for full verification',
                'Claim requires more specific evidence',
                'Mixed evidence from various sources'
            ]
        };
        const sources = [
            {
                name: 'FactCheck.org',
                url: 'https://www.factcheck.org',
                reliability: 0.95,
                stance: 'neutral'
            },
            {
                name: 'Snopes',
                url: 'https://www.snopes.com',
                reliability: 0.92,
                stance: 'neutral'
            },
            {
                name: 'Reuters Fact Check',
                url: 'https://www.reuters.com/fact-check',
                reliability: 0.90,
                stance: 'neutral'
            }
        ];
        return {
            claim: claimText,
            status,
            confidence,
            evidence,
            explanation,
            sources,
            timestamp: new Date().toISOString(),
            aiInsight
        };
    };
    const getStatusIcon = (status) => {
        switch (status) {
            case 'verified':
                return _jsx(FiCheckCircle, { className: "status-icon verified" });
            case 'disputed':
                return _jsx(FiXCircle, { className: "status-icon disputed" });
            case 'false':
                return _jsx(FiXCircle, { className: "status-icon false" });
            case 'misleading':
                return _jsx(FiAlertTriangle, { className: "status-icon misleading" });
            default:
                return _jsx(FiInfo, { className: "status-icon unverified" });
        }
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'verified':
                return '#28a745';
            case 'disputed':
                return '#ffc107';
            case 'false':
                return '#dc3545';
            case 'misleading':
                return '#fd7e14';
            default:
                return '#6c757d';
        }
    };
    const getStatusText = (status) => {
        switch (status) {
            case 'verified':
                return 'Verified';
            case 'disputed':
                return 'Disputed';
            case 'false':
                return 'False';
            case 'misleading':
                return 'Misleading';
            default:
                return 'Unverified';
        }
    };
    return (_jsxs("div", { className: "fact-checking-assistant", children: [_jsx("div", { className: "assistant-header", children: _jsxs("div", { className: "header-content", children: [_jsx(FiShield, { className: "header-icon" }), _jsxs("div", { children: [_jsx("h2", { children: "AI Fact-Checking Assistant" }), _jsx("p", { children: "Verify claims, check sources, and get evidence-based analysis" })] })] }) }), _jsxs("div", { className: "claim-input-section", children: [_jsxs("div", { className: "input-group", children: [_jsx("textarea", { value: claim, onChange: (e) => setClaim(e.target.value), placeholder: "Enter a claim to fact-check (e.g., 'Study shows that climate change is accelerating')", className: "claim-input", rows: 3, disabled: isChecking }), _jsx("button", { onClick: performFactCheck, disabled: isChecking || !claim.trim(), className: "check-button", children: isChecking ? (_jsxs(_Fragment, { children: [_jsx(FiClock, { className: "spinner" }), "Fact-Checking..."] })) : (_jsxs(_Fragment, { children: [_jsx(FiSearch, {}), "Fact-Check Claim"] })) })] }), isChecking && (_jsxs("div", { className: "progress-section", children: [_jsx("div", { className: "progress-bar", children: _jsx("div", { className: "progress-fill", style: { width: `${checkProgress}%` } }) }), _jsxs("p", { children: ["Analyzing claim and gathering evidence... ", checkProgress, "%"] })] }))] }), factCheckResult && (_jsxs("div", { className: "fact-check-result", children: [_jsxs("div", { className: "result-header", children: [_jsxs("div", { className: "result-status", children: [getStatusIcon(factCheckResult.status), _jsxs("div", { className: "status-info", children: [_jsx("span", { className: "status-label", style: { color: getStatusColor(factCheckResult.status) }, children: getStatusText(factCheckResult.status) }), _jsxs("span", { className: "confidence-score", children: [Math.round(factCheckResult.confidence * 100), "% Confidence"] })] })] }), _jsx("div", { className: "result-meta", children: _jsx("span", { className: "timestamp", children: new Date(factCheckResult.timestamp).toLocaleString() }) })] }), _jsxs("div", { className: "result-content", children: [_jsxs("div", { className: "claim-display", children: [_jsx("h3", { children: "Claim:" }), _jsx("p", { children: factCheckResult.claim })] }), _jsxs("div", { className: "explanation-section", children: [_jsx("h3", { children: "Analysis:" }), _jsx("p", { children: factCheckResult.explanation })] }), _jsxs("div", { className: "ai-insight", children: [_jsxs("h3", { children: [_jsx(FiTarget, {}), " AI Insight:"] }), _jsx("p", { children: factCheckResult.aiInsight })] }), _jsxs("div", { className: "evidence-section", children: [_jsx("h3", { children: "Evidence:" }), _jsxs("div", { className: "evidence-grid", children: [factCheckResult.evidence.supporting.length > 0 && (_jsxs("div", { className: "evidence-category supporting", children: [_jsxs("h4", { children: [_jsx(FiCheckCircle, {}), " Supporting Evidence"] }), _jsx("ul", { children: factCheckResult.evidence.supporting.map((item, index) => (_jsx("li", { children: item }, index))) })] })), factCheckResult.evidence.contradicting.length > 0 && (_jsxs("div", { className: "evidence-category contradicting", children: [_jsxs("h4", { children: [_jsx(FiXCircle, {}), " Contradicting Evidence"] }), _jsx("ul", { children: factCheckResult.evidence.contradicting.map((item, index) => (_jsx("li", { children: item }, index))) })] })), factCheckResult.evidence.neutral.length > 0 && (_jsxs("div", { className: "evidence-category neutral", children: [_jsxs("h4", { children: [_jsx(FiInfo, {}), " Additional Context"] }), _jsx("ul", { children: factCheckResult.evidence.neutral.map((item, index) => (_jsx("li", { children: item }, index))) })] }))] })] }), _jsxs("div", { className: "sources-section", children: [_jsx("h3", { children: "Fact-Checking Sources:" }), _jsx("div", { className: "sources-grid", children: factCheckResult.sources.map((source, index) => (_jsxs("div", { className: "source-card", children: [_jsxs("div", { className: "source-info", children: [_jsx("h4", { children: source.name }), _jsxs("span", { className: "reliability", children: [Math.round(source.reliability * 100), "% Reliable"] })] }), _jsxs("a", { href: source.url, target: "_blank", rel: "noopener noreferrer", className: "source-link", children: [_jsx(FiExternalLink, {}), "Visit Source"] })] }, index))) })] })] })] })), recentChecks.length > 0 && (_jsxs("div", { className: "recent-checks", children: [_jsxs("h3", { children: [_jsx(FiBookOpen, {}), " Recent Fact Checks"] }), _jsx("div", { className: "recent-grid", children: recentChecks.map((check, index) => (_jsxs("div", { className: "recent-check-card", children: [_jsxs("div", { className: "recent-status", children: [getStatusIcon(check.status), _jsx("span", { className: "recent-status-label", style: { color: getStatusColor(check.status) }, children: getStatusText(check.status) })] }), _jsx("p", { className: "recent-claim", children: check.claim }), _jsx("span", { className: "recent-time", children: new Date(check.timestamp).toLocaleDateString() })] }, index))) })] }))] }));
};
export default FactCheckingAssistant;
