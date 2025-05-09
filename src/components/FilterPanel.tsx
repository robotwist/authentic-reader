import { useState, useEffect } from 'react';
import '../styles/FilterPanel.css';

interface FilterPanelProps {
  activeFilters: string[];
  onFilterChange: (filters: string[]) => void;
  contentTypes: string[];
  categories?: string[];
  qualityFilters?: {
    muteOutrage: boolean;
    blockDoomscroll: boolean;
  };
  onQualityFilterChange?: (filters: {
    muteOutrage: boolean;
    blockDoomscroll: boolean;
  }) => void;
}

// Common tags for filtering
const COMMON_TAGS = [
  'technology', 
  'science', 
  'health', 
  'environment', 
  'politics', 
  'business', 
  'ethics', 
  'culture',
  'education'
];

const FilterPanel = ({ 
  activeFilters, 
  onFilterChange, 
  contentTypes,
  categories = [],
  qualityFilters = { muteOutrage: false, blockDoomscroll: false },
  onQualityFilterChange
}: FilterPanelProps) => {
  const [outrageMuted, setOutrageMuted] = useState(qualityFilters.muteOutrage);
  const [doomscrollBlocked, setDoomscrollBlocked] = useState(qualityFilters.blockDoomscroll);
  
  // Update internal state when props change
  useEffect(() => {
    setOutrageMuted(qualityFilters.muteOutrage);
    setDoomscrollBlocked(qualityFilters.blockDoomscroll);
  }, [qualityFilters]);
  
  const handleTagClick = (tag: string) => {
    if (activeFilters.includes(tag)) {
      onFilterChange(activeFilters.filter(t => t !== tag));
    } else {
      onFilterChange([...activeFilters, tag]);
    }
  };
  
  const handleSourceClick = (source: string) => {
    // Create a new array of filters
    let newFilters: string[];
    
    if (activeFilters.includes(source)) {
      // Remove the source from filters
      newFilters = activeFilters.filter(filter => filter !== source);
    } else {
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

  return (
    <div className="filter-panel">
      <div className="filter-section">
        <h3>Content Quality Filters</h3>
        <div className="toggle-filter">
          <label className="toggle">
            <input 
              type="checkbox" 
              checked={outrageMuted} 
              onChange={handleOutrageMuteChange} 
            />
            <span className="slider"></span>
          </label>
          <span>Mute outrage bait</span>
        </div>
        
        <div className="toggle-filter">
          <label className="toggle">
            <input 
              type="checkbox" 
              checked={doomscrollBlocked} 
              onChange={handleDoomscrollBlockChange} 
            />
            <span className="slider"></span>
          </label>
          <span>Block doomscroll traps</span>
        </div>
      </div>
      
      {contentTypes.length > 0 && (
        <div className="filter-section">
          <h3>Sources</h3>
          <div className="filter-chips">
            {contentTypes.map(source => (
              <button 
                key={source}
                className={`filter-chip ${activeFilters.includes(source) ? 'active' : ''}`}
                onClick={() => handleSourceClick(source)}
                aria-pressed={activeFilters.includes(source)}
              >
                {source}
              </button>
            ))}
          </div>
        </div>
      )}
      
      <div className="filter-section">
        <h3>Topics</h3>
        <div className="filter-chips">
          {displayCategories.map(tag => (
            <button 
              key={tag}
              className={`filter-chip ${activeFilters.includes(tag) ? 'active' : ''}`}
              onClick={() => handleTagClick(tag)}
              aria-pressed={activeFilters.includes(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
      
      {activeFilters.length > 0 && (
        <button className="clear-filters" onClick={clearAllFilters}>
          Clear all filters
        </button>
      )}
    </div>
  );
};

export default FilterPanel; 