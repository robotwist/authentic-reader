'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Analysis extends Model {
    static associate(models) {
      // Define associations
      Analysis.belongsTo(models.Article, { foreignKey: 'articleId' });
      Analysis.belongsTo(models.User, { foreignKey: 'userId' });
    }
  }

  Analysis.init({
    articleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'articles',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    biasScore: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    biasDirection: {
      type: DataTypes.STRING,
      allowNull: true
    },
    sentiment: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    entities: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    topKeywords: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true
    },
    readingLevel: {
      type: DataTypes.STRING,
      allowNull: true
    },
    clickbaitScore: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    outrageBaitScore: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    summaryText: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Analysis',
    tableName: 'analyses',
    underscored: true,
    indexes: [
      {
        fields: ['article_id']
      },
      {
        fields: ['user_id']
      }
    ]
  });

  return Analysis;
}; 