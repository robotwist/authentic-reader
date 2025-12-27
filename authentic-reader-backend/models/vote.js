'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Vote extends Model {
    static associate(models) {
      // Define associations
      Vote.belongsTo(models.Article, { foreignKey: 'articleId' });
    }
  }

  Vote.init({
    articleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'articles',
        key: 'id'
      },
      field: 'article_id'
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'Anonymous UUID for user identification',
      field: 'user_id'
    },
    voteType: {
      type: DataTypes.ENUM('AGREE', 'DISAGREE', 'MISSED_FALLACY'),
      allowNull: false,
      field: 'vote_type'
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Vote',
    tableName: 'votes',
    underscored: true,
    indexes: [
      {
        fields: ['article_id']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['vote_type']
      },
      {
        unique: true,
        fields: ['article_id', 'user_id']
      }
    ]
  });

  return Vote;
};

