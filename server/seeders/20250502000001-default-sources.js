'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('sources', [
      {
        name: 'TechCrunch',
        url: 'https://techcrunch.com/feed/',
        category: 'technology',
        description: 'Technology news and analysis',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Wired',
        url: 'https://www.wired.com/feed/rss',
        category: 'technology',
        description: 'Tech news and culture',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Hacker News',
        url: 'https://hnrss.org/frontpage',
        category: 'technology',
        description: 'Tech and startup news',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'The Verge',
        url: 'https://www.theverge.com/rss/index.xml',
        category: 'technology',
        description: 'Technology, science, art, and culture',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'NPR',
        url: 'https://feeds.npr.org/1001/rss.xml',
        category: 'news',
        description: 'National Public Radio news',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Reuters',
        url: 'https://feeds.reuters.com/reuters/topNews',
        category: 'news',
        description: 'Top news from Reuters',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'BBC News',
        url: 'http://feeds.bbci.co.uk/news/world/rss.xml',
        category: 'news',
        description: 'BBC world news',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('sources', null, {});
  }
}; 