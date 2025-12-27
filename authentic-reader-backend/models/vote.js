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
    userFingerprint: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Browser fingerprint or IP hash for anonymous user identification',
      field: 'user_fingerprint'
    },
    voteType: {
      type: DataTypes.ENUM('UPVOTE', 'DOWNVOTE', 'FLAG_MISSING'),
      allowNull: false,
      field: 'vote_type'
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
        fields: ['user_fingerprint']
      },
      {
        fields: ['vote_type']
      },
      {
        unique: true,
        fields: ['article_id', 'user_fingerprint']
      }
    ]
  });

  return Vote;
};

