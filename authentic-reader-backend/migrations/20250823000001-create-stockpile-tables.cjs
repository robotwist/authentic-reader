'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create articles table if it doesn't exist
    await queryInterface.createTable('articles', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      link: {
        type: Sequelize.STRING(1000),
        allowNull: false
      },
      author: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      publishDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      summary: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      imageUrl: {
        type: Sequelize.STRING(1000),
        allowNull: true
      },
      categories: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
        defaultValue: []
      },
      guid: {
        type: Sequelize.STRING(500),
        allowNull: true,
        unique: true
      },
      sourceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'sources',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create indexes for articles table
    await queryInterface.addIndex('articles', ['guid'], {
      unique: true,
      name: 'articles_guid_unique'
    });
    await queryInterface.addIndex('articles', ['sourceId'], {
      name: 'articles_source_id_idx'
    });
    await queryInterface.addIndex('articles', ['publishDate'], {
      name: 'articles_publish_date_idx'
    });

    // Create analyses table if it doesn't exist
    await queryInterface.createTable('analyses', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      articleId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'articles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      biasScore: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      biasDirection: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      sentiment: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      entities: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      topKeywords: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true
      },
      readingLevel: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      clickbaitScore: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      outrageBaitScore: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      summaryText: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      userFeedback: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create indexes for analyses table
    await queryInterface.addIndex('analyses', ['articleId'], {
      name: 'analyses_article_id_idx'
    });
    await queryInterface.addIndex('analyses', ['userId'], {
      name: 'analyses_user_id_idx'
    });
    await queryInterface.addIndex('analyses', ['biasDirection'], {
      name: 'analyses_bias_direction_idx'
    });

    // Create user_articles table if it doesn't exist
    await queryInterface.createTable('user_articles', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      articleId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'articles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      interactionType: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      feedback: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create indexes for user_articles table
    await queryInterface.addIndex('user_articles', ['userId'], {
      name: 'user_articles_user_id_idx'
    });
    await queryInterface.addIndex('user_articles', ['articleId'], {
      name: 'user_articles_article_id_idx'
    });
    await queryInterface.addIndex('user_articles', ['interactionType'], {
      name: 'user_articles_interaction_type_idx'
    });
    await queryInterface.addIndex('user_articles', ['timestamp'], {
      name: 'user_articles_timestamp_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop tables in reverse order
    await queryInterface.dropTable('user_articles');
    await queryInterface.dropTable('analyses');
    await queryInterface.dropTable('articles');
  }
};
