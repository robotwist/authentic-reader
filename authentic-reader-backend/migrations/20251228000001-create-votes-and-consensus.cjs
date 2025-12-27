'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add consensus_score column to articles table
    await queryInterface.addColumn('articles', 'consensus_score', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Community consensus score based on votes (+1 for UPVOTE, -1 for DOWNVOTE)'
    });

    // Create votes table
    await queryInterface.createTable('votes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      article_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'articles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_fingerprint: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Browser fingerprint or IP hash for anonymous user identification'
      },
      vote_type: {
        type: Sequelize.ENUM('UPVOTE', 'DOWNVOTE', 'FLAG_MISSING'),
        allowNull: false
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create indexes for votes table
    await queryInterface.addIndex('votes', ['article_id'], {
      name: 'votes_article_id_idx'
    });
    await queryInterface.addIndex('votes', ['user_fingerprint'], {
      name: 'votes_user_fingerprint_idx'
    });
    await queryInterface.addIndex('votes', ['vote_type'], {
      name: 'votes_vote_type_idx'
    });
    // Unique constraint: one vote per user per article
    await queryInterface.addIndex('votes', ['article_id', 'user_fingerprint'], {
      unique: true,
      name: 'votes_article_user_unique_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop votes table
    await queryInterface.dropTable('votes');
    
    // Remove consensus_score column from articles
    await queryInterface.removeColumn('articles', 'consensus_score');
    
    // Drop the ENUM type (PostgreSQL specific)
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_votes_vote_type";');
  }
};

