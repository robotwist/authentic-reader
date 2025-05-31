export async function up(queryInterface, Sequelize) {
  // Create Sources table
  await queryInterface.createTable('Sources', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false
    },
    url: {
      type: Sequelize.STRING,
      allowNull: false
    },
    rssUrl: {
      type: Sequelize.STRING,
      allowNull: false
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    category: {
      type: Sequelize.STRING,
      allowNull: true
    },
    bias: {
      type: Sequelize.STRING,
      allowNull: true
    },
    reliability: {
      type: Sequelize.STRING,
      allowNull: true
    },
    isActive: {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false
    }
  });

  // Create Articles table
  await queryInterface.createTable('Articles', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    sourceId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'Sources',
        key: 'id'
      }
    },
    title: {
      type: Sequelize.STRING,
      allowNull: false
    },
    link: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    pubDate: {
      type: Sequelize.DATE,
      allowNull: false
    },
    content: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    summary: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    categories: {
      type: Sequelize.JSON,
      allowNull: true
    },
    author: {
      type: Sequelize.STRING,
      allowNull: true
    },
    isAnalyzed: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false
    }
  });

  // Create ArticleAnalyses table
  await queryInterface.createTable('ArticleAnalyses', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    articleId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'Articles',
        key: 'id'
      }
    },
    sentiment: {
      type: Sequelize.FLOAT,
      allowNull: true
    },
    subjectivity: {
      type: Sequelize.FLOAT,
      allowNull: true
    },
    bias: {
      type: Sequelize.STRING,
      allowNull: true
    },
    reliability: {
      type: Sequelize.STRING,
      allowNull: true
    },
    analysis: {
      type: Sequelize.JSON,
      allowNull: true
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false
    }
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('ArticleAnalyses');
  await queryInterface.dropTable('Articles');
  await queryInterface.dropTable('Sources');
} 