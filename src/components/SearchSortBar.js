import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import '../styles/SearchSortBar.css';
const SearchSortBar = ({ onSearch, onSort, currentSort = 'date' }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [selectedSort, setSelectedSort] = useState(currentSort);
    const searchInputRef = useRef(null);
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchQuery(value);
        // Trigger search with a slight delay for better performance
        const timeoutId = setTimeout(() => onSearch(value), 300);
        return () => clearTimeout(timeoutId);
    };
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        onSearch(searchQuery);
    };
    const handleClearSearch = () => {
        setSearchQuery('');
        onSearch('');
        searchInputRef.current?.focus();
    };
    const handleSortChange = (sortBy) => {
        setSelectedSort(sortBy);
        onSort(sortBy);
    };
    // Update local state if prop changes
    useEffect(() => {
        setSelectedSort(currentSort);
    }, [currentSort]);
    return (_jsxs("div", { className: "search-sort-bar", children: [_jsx("form", { className: `search-form ${isSearchFocused ? 'focused' : ''}`, onSubmit: handleSearchSubmit, children: _jsxs("div", { className: "search-input-container", children: [_jsxs("svg", { className: "search-icon", xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("circle", { cx: "11", cy: "11", r: "8" }), _jsx("line", { x1: "21", y1: "21", x2: "16.65", y2: "16.65" })] }), _jsx("input", { ref: searchInputRef, type: "text", placeholder: "Search articles...", value: searchQuery, onChange: handleSearchChange, onFocus: () => setIsSearchFocused(true), onBlur: () => setIsSearchFocused(false), className: "search-input" }), searchQuery && (_jsx("button", { type: "button", className: "search-clear-button", onClick: handleClearSearch, "aria-label": "Clear search", children: _jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("line", { x1: "18", y1: "6", x2: "6", y2: "18" }), _jsx("line", { x1: "6", y1: "6", x2: "18", y2: "18" })] }) }))] }) }), _jsxs("div", { className: "sort-controls", children: [_jsx("span", { className: "sort-label", children: "Sort by:" }), _jsxs("div", { className: "sort-buttons", children: [_jsx("button", { className: `sort-button ${selectedSort === 'date' ? 'active' : ''}`, onClick: () => handleSortChange('date'), children: "Date" }), _jsx("button", { className: `sort-button ${selectedSort === 'source' ? 'active' : ''}`, onClick: () => handleSortChange('source'), children: "Source" }), _jsx("button", { className: `sort-button ${selectedSort === 'title' ? 'active' : ''}`, onClick: () => handleSortChange('title'), children: "Title" })] })] })] }));
};
export default SearchSortBar;
