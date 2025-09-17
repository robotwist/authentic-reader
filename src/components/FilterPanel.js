import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import '../styles/FilterPanel.css';
const FilterPanel = ({ activeFilters, onFilterChange, contentTypes, categories = [], qualityFilters = { muteOutrage: false, blockDoomscroll: false }, onQualityFilterChange }) => {
    const [outrageMuted, setOutrageMuted] = useState(qualityFilters.muteOutrage);
    const [doomscrollBlocked, setDoomscrollBlocked] = useState(qualityFilters.blockDoomscroll);
    // Add state for API/local analysis mode
    const [useLocalAnalysis, setUseLocalAnalysis] = useState(() => {
        return localStorage.getItem('use_local_fallbacks') === 'true';
    });
    // Update internal state when props change
    useEffect(() => {
        setOutrageMuted(qualityFilters.muteOutrage);
        setDoomscrollBlocked(qualityFilters.blockDoomscroll);
    }, [qualityFilters]);
    const handleTagClick = (tag) => {
        if (activeFilters.includes(tag)) {
            onFilterChange(activeFilters.filter(t => t !== tag));
        }
        else {
            onFilterChange([...activeFilters, tag]);
        }
    };
    const handleSourceClick = (source) => {
        // Create a new array of filters
        let newFilters;
        if (activeFilters.includes(source)) {
            // Remove the source from filters
            newFilters = activeFilters.filter(filter => filter !== source);
        }
        else {
            // Add the source to filters
            newFilters = [...activeFilters, source];
        }
        // Call the parent component's handler with the updated filters
        onFilterChange(newFilters);
    };
    const clearAllFilters = () => {
        onFilterChange([]);
    };
    const handleOutrageMuteChange = () => {
        const newValue = !outrageMuted;
        setOutrageMuted(newValue);
        if (onQualityFilterChange) {
            onQualityFilterChange({
                muteOutrage: newValue,
                blockDoomscroll: doomscrollBlocked
            });
        }
    };
    const handleDoomscrollBlockChange = () => {
        const newValue = !doomscrollBlocked;
        setDoomscrollBlocked(newValue);
        if (onQualityFilterChange) {
            onQualityFilterChange({
                muteOutrage: outrageMuted,
                blockDoomscroll: newValue
            });
        }
    };
    // Use provided categories or fallback to default if empty
    const displayCategories = categories.length > 0 ? categories : [
        'technology',
        'science',
        'health',
        'environment',
        'politics',
        'business'
    ];
    // Handle local analysis toggle
    const handleLocalAnalysisToggle = () => {
        const newValue = !useLocalAnalysis;
        setUseLocalAnalysis(newValue);
        localStorage.setItem('use_local_fallbacks', newValue.toString());
        // Force page reload to apply the setting
        window.location.reload();
    };
    return (_jsxs("div", { className: "filter-panel", children: [_jsxs("div", { className: "filter-section", children: [_jsx("h3", { children: "Content Quality Filters" }), _jsxs("div", { className: "toggle-filter", children: [_jsxs("label", { className: "toggle", children: [_jsx("input", { type: "checkbox", checked: outrageMuted, onChange: handleOutrageMuteChange }), _jsx("span", { className: "slider" })] }), _jsx("span", { children: "Mute outrage bait" })] }), _jsxs("div", { className: "toggle-filter", children: [_jsxs("label", { className: "toggle", children: [_jsx("input", { type: "checkbox", checked: doomscrollBlocked, onChange: handleDoomscrollBlockChange }), _jsx("span", { className: "slider" })] }), _jsx("span", { children: "Block doomscroll traps" })] })] }), contentTypes.length > 0 && (_jsxs("div", { className: "filter-section", children: [_jsx("h3", { children: "Sources" }), _jsx("div", { className: "filter-chips", children: contentTypes.map(source => (_jsx("button", { className: `filter-chip ${activeFilters.includes(source) ? 'active' : ''}`, onClick: () => handleSourceClick(source), "aria-pressed": activeFilters.includes(source), children: source }, source))) })] })), _jsxs("div", { className: "filter-section", children: [_jsx("h3", { children: "Topics" }), _jsx("div", { className: "filter-chips", children: displayCategories.map(tag => (_jsx("button", { className: `filter-chip ${activeFilters.includes(tag) ? 'active' : ''}`, onClick: () => handleTagClick(tag), "aria-pressed": activeFilters.includes(tag), children: tag }, tag))) })] }), activeFilters.length > 0 && (_jsx("button", { className: "clear-filters", onClick: clearAllFilters, children: "Clear all filters" })), _jsxs("div", { className: "filter-group", children: [_jsx("h4", { children: "Analysis Mode" }), _jsxs("label", { className: "toggle-switch", children: [_jsx("input", { type: "checkbox", checked: useLocalAnalysis, onChange: handleLocalAnalysisToggle }), _jsx("span", { className: "toggle-slider" }), _jsx("span", { className: "toggle-label", children: useLocalAnalysis ? 'Local Analysis (Faster)' : 'API Analysis (Better)' })] }), _jsx("p", { className: "toggle-description", children: useLocalAnalysis
                            ? 'Using local analysis for faster performance but less accuracy'
                            : 'Using Hugging Face API for better results but may be slower' })] })] }));
};
export default FilterPanel;
