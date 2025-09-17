import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import IntellectualSelfDefense from '../components/IntellectualSelfDefense';
import { logger } from '../utils/logger';
import './IntellectualSelfDefensePage.css';
const IntellectualSelfDefensePage = () => {
    const handleArticleSelect = (article) => {
        logger.info('Article selected for deep analysis:', {
            title: article.title,
            source: article.source,
            complexity: article.chomskyAnalysis.intellectualDepth.complexityLevel
        });
    };
    return (_jsxs("div", { className: "daily-deep-dive-page", children: [_jsx("div", { className: "page-content", children: _jsx(IntellectualSelfDefense, { onArticleSelect: handleArticleSelect }) }), _jsx("div", { className: "page-footer", children: _jsxs("div", { className: "footer-content", children: [_jsx("h3", { children: "About Intellectual Self Defense Course" }), _jsx("p", { children: "Inspired by Noam Chomsky's concept of \"intellectual self-defense,\" this course provides daily training in critical thinking and media literacy. We curate 10 high-quality articles each day and subject them to rigorous analysis, examining power structures, linguistic framing, historical context, and critical perspectives to build your analytical skills." }), _jsxs("div", { className: "analysis-framework", children: [_jsx("h4", { children: "Analysis Framework" }), _jsxs("div", { className: "framework-grid", children: [_jsxs("div", { className: "framework-item", children: [_jsx("h5", { children: "Structural Analysis" }), _jsx("p", { children: "Examines power structures, institutional bias, and the manufacturing of consent" })] }), _jsxs("div", { className: "framework-item", children: [_jsx("h5", { children: "Linguistic Analysis" }), _jsx("p", { children: "Analyzes framing, loaded language, presuppositions, and ideological assumptions" })] }), _jsxs("div", { className: "framework-item", children: [_jsx("h5", { children: "Historical Context" }), _jsx("p", { children: "Provides historical precedents, long-term trends, and systemic patterns" })] }), _jsxs("div", { className: "framework-item", children: [_jsx("h5", { children: "Critical Analysis" }), _jsx("p", { children: "Identifies what is not said, alternative perspectives, and power interests" })] })] })] })] }) })] }));
};
export default IntellectualSelfDefensePage;
