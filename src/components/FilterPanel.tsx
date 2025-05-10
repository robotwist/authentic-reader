import { useState, useEffect } from 'react';
import '../styles/FilterPanel.css';
import { HF_CONFIG } from '../config/huggingFaceConfig';

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
  availableSources: string[];
  availableCategories: string[];
  initialFilters?: {
    sources: string[];
    categories: string[];
  };
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
  onQualityFilterChange,
  availableSources,
  availableCategories,
  initialFilters = { sources: [], categories: [] }
}: FilterPanelProps) => {
  const [outrageMuted, setOutrageMuted] = useState(qualityFilters.muteOutrage);
  const [doomscrollBlocked, setDoomscrollBlocked] = useState(qualityFilters.blockDoomscroll);
  
  // Add state for API/local analysis mode
  const [useLocalAnalysis, setUseLocalAnalysis] = useState<boolean>(() => {
    return localStorage.getItem('use_local_fallbacks') === 'true';
  });
  
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

  // Handle local analysis toggle
  const handleLocalAnalysisToggle = () => {
    const newValue = !useLocalAnalysis;
    setUseLocalAnalysis(newValue);
    localStorage.setItem('use_local_fallbacks', newValue.toString());
    // Force page reload to apply the setting
    window.location.reload();
  };

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
      
      {/* Analysis Mode Toggle */}
      <div className="filter-group">
        <h4>Analysis Mode</h4>
        <label className="toggle-switch">
          <input 
            type="checkbox" 
            checked={useLocalAnalysis}
            onChange={handleLocalAnalysisToggle}
          />
          <span className="toggle-slider"></span>
          <span className="toggle-label">
            {useLocalAnalysis ? 'Local Analysis (Faster)' : 'API Analysis (Better)'}
          </span>
        </label>
        <p className="toggle-description">
          {useLocalAnalysis 
            ? 'Using local analysis for faster performance but less accuracy' 
            : 'Using Hugging Face API for better results but may be slower'}
        </p>
      </div>
    </div>
  );
};

export default FilterPanel; 