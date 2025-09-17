import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { FiInfo } from 'react-icons/fi';
import '../styles/AnalysisTooltip.css';
const AnalysisTooltip = ({ title, explanation, icon = _jsx(FiInfo, {}), children, position = 'top', className = '' }) => {
    const [isVisible, setIsVisible] = useState(false);
    return (_jsxs("div", { className: `analysis-tooltip-container ${className}`, onMouseEnter: () => setIsVisible(true), onMouseLeave: () => setIsVisible(false), children: [children, isVisible && (_jsxs("div", { className: `analysis-tooltip analysis-tooltip-${position}`, children: [_jsxs("div", { className: "tooltip-header", children: [icon, _jsx("span", { className: "tooltip-title", children: title })] }), _jsx("div", { className: "tooltip-content", children: explanation }), _jsx("div", { className: "tooltip-arrow" })] }))] }));
};
export default AnalysisTooltip;
