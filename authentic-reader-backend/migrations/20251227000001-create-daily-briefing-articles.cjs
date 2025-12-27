'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('daily_briefing_articles', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      briefing_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      topic: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Topic key: ukraine, gaza, epstein, diseases, trump'
      },
      topic_label: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Display label: Ukraine Conflict, Gaza Crisis, etc.'
      },
      icon: {
        type: Sequelize.STRING(10),
        allowNull: false,
        comment: 'Emoji icon for the topic'
      },
      headline: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      source: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      author: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      url: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Full article content (HTML)'
      },
      publish_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      fallacies: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: 'Analysis data including fallacies, key sentences, reliability score'
      },
      reliability_score: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Overall reliability score 0-100'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for efficient querying
    await queryInterface.addIndex('daily_briefing_articles', ['briefing_date'], {
      name: 'idx_briefing_date'
    });

    await queryInterface.addIndex('daily_briefing_articles', ['topic'], {
      name: 'idx_topic'
    });

    await queryInterface.addIndex('daily_briefing_articles', ['briefing_date', 'topic'], {
      name: 'idx_briefing_date_topic',
      unique: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('daily_briefing_articles');
  }
};

