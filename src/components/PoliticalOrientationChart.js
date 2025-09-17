import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { FiInfo, FiTarget, FiTrendingUp, FiShield, FiUsers, FiGlobe } from 'react-icons/fi';
import '../styles/PoliticalOrientationChart.css';
const PoliticalOrientationChart = ({ sources, selectedSource, onSourceSelect }) => {
    const [hoveredSource, setHoveredSource] = useState(null);
    const [showExplanations, setShowExplanations] = useState(false);
    const getAxisLabel = (axis) => {
        switch (axis) {
            case 'economic':
                return {
                    left: 'Economic Left (Progressive)',
                    right: 'Economic Right (Conservative)',
                    description: 'Views on economic policy, regulation, and wealth distribution'
                };
            case 'social':
                return {
                    left: 'Social Libertarian',
                    right: 'Social Authoritarian',
                    description: 'Views on personal freedoms, social issues, and government control'
                };
            case 'foreignPolicy':
                return {
                    left: 'Isolationist',
                    right: 'Interventionist',
                    description: 'Views on international relations and foreign policy'
                };
            case 'environmental':
                return {
                    left: 'Anti-Regulation',
                    right: 'Pro-Regulation',
                    description: 'Views on environmental protection and regulation'
                };
            default:
                return { left: '', right: '', description: '' };
        }
    };
    const getQuadrantLabel = (economicPos, socialPos) => {
        if (economicPos > 20 && socialPos > 20)
            return 'Libertarian Right';
        if (economicPos > 20 && socialPos < -20)
            return 'Authoritarian Right';
        if (economicPos < -20 && socialPos > 20)
            return 'Libertarian Left';
        if (economicPos < -20 && socialPos < -20)
            return 'Authoritarian Left';
        if (Math.abs(economicPos) <= 20 && Math.abs(socialPos) <= 20)
            return 'Centrist';
        return 'Mixed';
    };
    const getPositionColor = (position) => {
        const absPos = Math.abs(position);
        if (absPos < 20)
            return '#3b82f6'; // Blue for center
        if (absPos < 50)
            return '#f59e0b'; // Orange for moderate
        return '#ef4444'; // Red for extreme
    };
    const getConfidenceColor = (confidence) => {
        if (confidence > 0.8)
            return '#10b981'; // Green for high confidence
        if (confidence > 0.6)
            return '#f59e0b'; // Orange for medium confidence
        return '#ef4444'; // Red for low confidence
    };
    return (_jsxs("div", { className: "political-orientation-chart", children: [_jsxs("div", { className: "chart-header", children: [_jsx("h2", { children: "Multi-Dimensional Political Orientation" }), _jsx("p", { className: "chart-subtitle", children: "Understanding political bias across multiple axes for informed analysis" }), _jsxs("button", { onClick: () => setShowExplanations(!showExplanations), className: "explanation-toggle", children: [_jsx(FiInfo, {}), showExplanations ? 'Hide' : 'Show', " Explanations"] })] }), showExplanations && (_jsx("div", { className: "explanations-panel", children: _jsxs("div", { className: "explanation-grid", children: [_jsxs("div", { className: "explanation-card", children: [_jsxs("h3", { children: [_jsx(FiTarget, {}), " Economic Axis"] }), _jsxs("p", { children: [_jsx("strong", { children: "Left (-100):" }), " Progressive economic policies, wealth redistribution, strong regulation"] }), _jsxs("p", { children: [_jsx("strong", { children: "Right (+100):" }), " Free market capitalism, minimal regulation, lower taxes"] }), _jsx("p", { className: "explanation-detail", children: "Based on coverage of economic issues, business regulation, tax policy, and wealth distribution topics." })] }), _jsxs("div", { className: "explanation-card", children: [_jsxs("h3", { children: [_jsx(FiUsers, {}), " Social Axis"] }), _jsxs("p", { children: [_jsx("strong", { children: "Libertarian (-100):" }), " Personal freedoms, limited government control, individual rights"] }), _jsxs("p", { children: [_jsx("strong", { children: "Authoritarian (+100):" }), " Strong government control, traditional values, social order"] }), _jsx("p", { className: "explanation-detail", children: "Based on coverage of social issues, civil liberties, cultural topics, and government intervention in personal matters." })] }), _jsxs("div", { className: "explanation-card", children: [_jsxs("h3", { children: [_jsx(FiGlobe, {}), " Foreign Policy Axis"] }), _jsxs("p", { children: [_jsx("strong", { children: "Isolationist (-100):" }), " Limited international involvement, focus on domestic issues"] }), _jsxs("p", { children: [_jsx("strong", { children: "Interventionist (+100):" }), " Active international engagement, global leadership"] }), _jsx("p", { className: "explanation-detail", children: "Based on coverage of international relations, military intervention, trade policy, and global cooperation." })] }), _jsxs("div", { className: "explanation-card", children: [_jsxs("h3", { children: [_jsx(FiTrendingUp, {}), " Environmental Axis"] }), _jsxs("p", { children: [_jsx("strong", { children: "Anti-Regulation (-100):" }), " Minimal environmental regulation, business-friendly policies"] }), _jsxs("p", { children: [_jsx("strong", { children: "Pro-Regulation (+100):" }), " Strong environmental protection, climate action"] }), _jsx("p", { className: "explanation-detail", children: "Based on coverage of environmental issues, climate change, regulation, and sustainability topics." })] })] }) })), _jsxs("div", { className: "chart-container", children: [_jsxs("div", { className: "chart-grid", children: [_jsxs("div", { className: "chart-section", children: [_jsx("h3", { children: "Economic vs Social Orientation" }), _jsxs("div", { className: "chart-2d", children: [_jsxs("div", { className: "chart-axes", children: [_jsxs("div", { className: "axis-label y-axis", children: [_jsx("span", { children: "Social Libertarian" }), _jsx("span", { children: "Social Authoritarian" })] }), _jsxs("div", { className: "axis-label x-axis", children: [_jsx("span", { children: "Economic Left" }), _jsx("span", { children: "Economic Right" })] })] }), _jsx("div", { className: "chart-area", children: sources.map((source) => {
                                                    const x = ((source.politicalProfile.economicAxis.position + 100) / 200) * 100;
                                                    const y = ((100 - source.politicalProfile.socialAxis.position) / 200) * 100;
                                                    return (_jsx("div", { className: `source-point ${selectedSource?.id === source.id ? 'selected' : ''}`, style: {
                                                            left: `${x}%`,
                                                            top: `${y}%`,
                                                            backgroundColor: getPositionColor(source.politicalProfile.economicAxis.position),
                                                            borderColor: getConfidenceColor(source.politicalProfile.economicAxis.confidence)
                                                        }, onMouseEnter: () => setHoveredSource(source), onMouseLeave: () => setHoveredSource(null), onClick: () => onSourceSelect?.(source), children: _jsx("div", { className: "point-label", children: source.name }) }, source.id));
                                                }) }), _jsxs("div", { className: "quadrant-labels", children: [_jsx("div", { className: "quadrant top-left", children: "Libertarian Left" }), _jsx("div", { className: "quadrant top-right", children: "Libertarian Right" }), _jsx("div", { className: "quadrant bottom-left", children: "Authoritarian Left" }), _jsx("div", { className: "quadrant bottom-right", children: "Authoritarian Right" }), _jsx("div", { className: "quadrant center", children: "Centrist" })] })] })] }), _jsxs("div", { className: "chart-section", children: [_jsx("h3", { children: "Foreign Policy vs Environmental Orientation" }), _jsxs("div", { className: "chart-2d", children: [_jsxs("div", { className: "chart-axes", children: [_jsxs("div", { className: "axis-label y-axis", children: [_jsx("span", { children: "Pro-Regulation" }), _jsx("span", { children: "Anti-Regulation" })] }), _jsxs("div", { className: "axis-label x-axis", children: [_jsx("span", { children: "Isolationist" }), _jsx("span", { children: "Interventionist" })] })] }), _jsx("div", { className: "chart-area", children: sources.map((source) => {
                                                    const x = ((source.politicalProfile.foreignPolicyAxis.position + 100) / 200) * 100;
                                                    const y = ((100 - source.politicalProfile.environmentalAxis.position) / 200) * 100;
                                                    return (_jsx("div", { className: `source-point ${selectedSource?.id === source.id ? 'selected' : ''}`, style: {
                                                            left: `${x}%`,
                                                            top: `${y}%`,
                                                            backgroundColor: getPositionColor(source.politicalProfile.foreignPolicyAxis.position),
                                                            borderColor: getConfidenceColor(source.politicalProfile.foreignPolicyAxis.confidence)
                                                        }, onMouseEnter: () => setHoveredSource(source), onMouseLeave: () => setHoveredSource(null), onClick: () => onSourceSelect?.(source), children: _jsx("div", { className: "point-label", children: source.name }) }, source.id));
                                                }) }), _jsxs("div", { className: "quadrant-labels", children: [_jsx("div", { className: "quadrant top-left", children: "Pro-Regulation Isolationist" }), _jsx("div", { className: "quadrant top-right", children: "Pro-Regulation Interventionist" }), _jsx("div", { className: "quadrant bottom-left", children: "Anti-Regulation Isolationist" }), _jsx("div", { className: "quadrant bottom-right", children: "Anti-Regulation Interventionist" }), _jsx("div", { className: "quadrant center", children: "Centrist" })] })] })] })] }), (hoveredSource || selectedSource) && (_jsxs("div", { className: "source-details", children: [_jsx("h3", { children: (hoveredSource || selectedSource)?.name }), _jsxs("div", { className: "details-grid", children: [_jsxs("div", { className: "detail-item", children: [_jsx("span", { className: "detail-label", children: "Economic Position:" }), _jsxs("span", { className: "detail-value", children: [Math.round((hoveredSource || selectedSource)?.politicalProfile.economicAxis.position || 0), _jsxs("span", { className: "confidence", style: { color: getConfidenceColor((hoveredSource || selectedSource)?.politicalProfile.economicAxis.confidence || 0) }, children: ["(", (hoveredSource || selectedSource)?.politicalProfile.economicAxis.confidence || 0, "% confidence)"] })] })] }), _jsxs("div", { className: "detail-item", children: [_jsx("span", { className: "detail-label", children: "Social Position:" }), _jsxs("span", { className: "detail-value", children: [Math.round((hoveredSource || selectedSource)?.politicalProfile.socialAxis.position || 0), _jsxs("span", { className: "confidence", style: { color: getConfidenceColor((hoveredSource || selectedSource)?.politicalProfile.socialAxis.confidence || 0) }, children: ["(", (hoveredSource || selectedSource)?.politicalProfile.socialAxis.confidence || 0, "% confidence)"] })] })] }), _jsxs("div", { className: "detail-item", children: [_jsx("span", { className: "detail-label", children: "Foreign Policy:" }), _jsxs("span", { className: "detail-value", children: [Math.round((hoveredSource || selectedSource)?.politicalProfile.foreignPolicyAxis.position || 0), _jsxs("span", { className: "confidence", style: { color: getConfidenceColor((hoveredSource || selectedSource)?.politicalProfile.foreignPolicyAxis.confidence || 0) }, children: ["(", (hoveredSource || selectedSource)?.politicalProfile.foreignPolicyAxis.confidence || 0, "% confidence)"] })] })] }), _jsxs("div", { className: "detail-item", children: [_jsx("span", { className: "detail-label", children: "Environmental:" }), _jsxs("span", { className: "detail-value", children: [Math.round((hoveredSource || selectedSource)?.politicalProfile.environmentalAxis.position || 0), _jsxs("span", { className: "confidence", style: { color: getConfidenceColor((hoveredSource || selectedSource)?.politicalProfile.environmentalAxis.confidence || 0) }, children: ["(", (hoveredSource || selectedSource)?.politicalProfile.environmentalAxis.confidence || 0, "% confidence)"] })] })] }), _jsxs("div", { className: "detail-item", children: [_jsx("span", { className: "detail-label", children: "Overall Bias:" }), _jsxs("span", { className: "detail-value", children: [(hoveredSource || selectedSource)?.politicalProfile.overallBias.direction, "(", (hoveredSource || selectedSource)?.politicalProfile.overallBias.intensity * 100, "% intensity)"] })] }), _jsxs("div", { className: "detail-item", children: [_jsx("span", { className: "detail-label", children: "Reliability:" }), _jsxs("span", { className: "detail-value", children: [_jsx(FiShield, { style: { color: getConfidenceColor((hoveredSource || selectedSource)?.politicalProfile.overallBias.confidence || 0) } }), (hoveredSource || selectedSource)?.reliability] })] })] }), _jsx("p", { className: "source-description", children: (hoveredSource || selectedSource)?.description })] }))] }), _jsxs("div", { className: "chart-legend", children: [_jsxs("div", { className: "legend-item", children: [_jsx("div", { className: "legend-color", style: { backgroundColor: '#3b82f6' } }), _jsx("span", { children: "Centrist (0-20)" })] }), _jsxs("div", { className: "legend-item", children: [_jsx("div", { className: "legend-color", style: { backgroundColor: '#f59e0b' } }), _jsx("span", { children: "Moderate (20-50)" })] }), _jsxs("div", { className: "legend-item", children: [_jsx("div", { className: "legend-color", style: { backgroundColor: '#ef4444' } }), _jsx("span", { children: "Extreme (50-100)" })] }), _jsxs("div", { className: "legend-item", children: [_jsx("div", { className: "legend-border", style: { borderColor: '#10b981' } }), _jsx("span", { children: "High Confidence" })] }), _jsxs("div", { className: "legend-item", children: [_jsx("div", { className: "legend-border", style: { borderColor: '#f59e0b' } }), _jsx("span", { children: "Medium Confidence" })] }), _jsxs("div", { className: "legend-item", children: [_jsx("div", { className: "legend-border", style: { borderColor: '#ef4444' } }), _jsx("span", { children: "Low Confidence" })] })] })] }));
};
export default PoliticalOrientationChart;
