import express from 'express';

// Get public sources - simplified version without database dependencies
export const getPublicSources = async (req, res) => {
  try {
    console.log('getPublicSources called');
    
    // Simple hardcoded response for now - no database dependency
    const sourcesArray = [
      {
        id: 'npr',
        name: 'NPR',
        url: 'https://feeds.npr.org/1001/rss.xml',
        description: 'National Public Radio',
        category: 'center',
        isPublic: true
      },
      {
        id: 'bbc',
        name: 'BBC News',
        url: 'http://feeds.bbci.co.uk/news/rss.xml',
        description: 'BBC News',
        category: 'center',
        isPublic: true
      },
      {
        id: 'reuters',
        name: 'Reuters',
        url: 'https://feeds.reuters.com/reuters/topNews',
        description: 'International news agency',
        category: 'center',
        isPublic: true
      },
      {
        id: 'ap',
        name: 'Associated Press',
        url: 'https://feeds.ap.org/ap/topnews',
        description: 'Non-profit news cooperative',
        category: 'center',
        isPublic: true
      },
      {
        id: 'wsj',
        name: 'Wall Street Journal',
        url: 'https://feeds.wsj.com/public/rss/2_0.xml',
        description: 'Conservative business newspaper',
        category: 'right',
        isPublic: true
      }
    ];
    
    console.log('Returning sources:', sourcesArray.length, 'sources');
    res.json(sourcesArray);
  } catch (error) {
    console.error('Error fetching public sources:', error);
    res.status(500).json({ message: 'Server error fetching public sources' });
  }
};

// Get a public source by ID - simplified version
export const getPublicSource = async (req, res) => {
  try {
    const sourceId = req.params.id;
    
    // Hardcoded sources for now
    const sources = {
      'npr': {
        id: 'npr',
        name: 'NPR',
        url: 'https://feeds.npr.org/1001/rss.xml',
        description: 'National Public Radio',
        category: 'center',
        isPublic: true
      },
      'bbc': {
        id: 'bbc',
        name: 'BBC News',
        url: 'http://feeds.bbci.co.uk/news/rss.xml',
        description: 'BBC News',
        category: 'center',
        isPublic: true
      },
      'reuters': {
        id: 'reuters',
        name: 'Reuters',
        url: 'https://feeds.reuters.com/reuters/topNews',
        description: 'International news agency',
        category: 'center',
        isPublic: true
      },
      'ap': {
        id: 'ap',
        name: 'Associated Press',
        url: 'https://feeds.ap.org/ap/topnews',
        description: 'Non-profit news cooperative',
        category: 'center',
        isPublic: true
      },
      'wsj': {
        id: 'wsj',
        name: 'Wall Street Journal',
        url: 'https://feeds.wsj.com/public/rss/2_0.xml',
        description: 'Conservative business newspaper',
        category: 'right',
        isPublic: true
      }
    };
    
    const source = sources[sourceId];
    
    if (!source) {
      return res.status(404).json({ message: 'Public source not found' });
    }
    
    res.json(source);
  } catch (error) {
    console.error('Error fetching public source:', error);
    res.status(500).json({ message: 'Server error fetching public source' });
  }
};
