'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();
    
    return queryInterface.bulkInsert('sources', [
      {
        name: 'TechCrunch',
        url: 'https://techcrunch.com/feed/',
        category: 'technology',
        description: 'The latest technology news and information on startups',
        created_at: now,
        updated_at: now
      },
      {
        name: 'Wired',
        url: 'https://www.wired.com/feed/rss',
        category: 'technology',
        description: 'The latest in technology, science, and culture',
        created_at: now,
        updated_at: now
      },
      {
        name: 'Hacker News',
        url: 'https://hnrss.org/frontpage',
        category: 'technology',
        description: 'Top stories from Hacker News',
        created_at: now,
        updated_at: now
      },
      {
        name: 'The Verge',
        url: 'https://www.theverge.com/rss/index.xml',
        category: 'technology',
        description: 'The Verge covers the intersection of technology, science, art, and culture',
        created_at: now,
        updated_at: now
      },
      {
        name: 'NPR',
        url: 'https://feeds.npr.org/1001/rss.xml',
        category: 'news',
        description: 'National Public Radio news and stories',
        created_at: now,
        updated_at: now
      },
      {
        name: 'CNBC News',
        url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html',
        category: 'news',
        description: 'Latest business and financial news from CNBC',
        created_at: now,
        updated_at: now
      },
      {
        name: 'BBC News',
        url: 'http://feeds.bbci.co.uk/news/world/rss.xml',
        category: 'news',
        description: 'BBC News - World',
        created_at: now,
        updated_at: now
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('sources', null, {});
  }
}; 