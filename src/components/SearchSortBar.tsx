import React, { useState, useEffect, useRef } from 'react';
import '../styles/SearchSortBar.css';

interface SearchSortBarProps {
  onSearch: (query: string) => void;
  onSort: (sortBy: string) => void;
  currentSort?: string;
}

const SearchSortBar: React.FC<SearchSortBarProps> = ({ 
  onSearch, 
  onSort, 
  currentSort = 'date' 
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [selectedSort, setSelectedSort] = useState<string>(currentSort);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    // Trigger search with a slight delay for better performance
    const timeoutId = setTimeout(() => onSearch(value), 300);
    return () => clearTimeout(timeoutId);
  };
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };
  
  const handleClearSearch = () => {
    setSearchQuery('');
    onSearch('');
    searchInputRef.current?.focus();
  };
  
  const handleSortChange = (sortBy: string) => {
    setSelectedSort(sortBy);
    onSort(sortBy);
  };
  
  // Update local state if prop changes
  useEffect(() => {
    setSelectedSort(currentSort);
  }, [currentSort]);
  
  return (
    <div className="search-sort-bar">
      <form 
        className={`search-form ${isSearchFocused ? 'focused' : ''}`} 
        onSubmit={handleSearchSubmit}
      >
        <div className="search-input-container">
          <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className="search-input"
          />
          
          {searchQuery && (
            <button 
              type="button" 
              className="search-clear-button" 
              onClick={handleClearSearch}
              aria-label="Clear search"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>
      </form>
      
      <div className="sort-controls">
        <span className="sort-label">Sort by:</span>
        <div className="sort-buttons">
          <button 
            className={`sort-button ${selectedSort === 'date' ? 'active' : ''}`}
            onClick={() => handleSortChange('date')}
          >
            Date
          </button>
          <button 
            className={`sort-button ${selectedSort === 'source' ? 'active' : ''}`}
            onClick={() => handleSortChange('source')}
          >
            Source
          </button>
          <button 
            className={`sort-button ${selectedSort === 'title' ? 'active' : ''}`}
            onClick={() => handleSortChange('title')}
          >
            Title
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchSortBar; 