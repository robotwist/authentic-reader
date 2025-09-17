'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserArticle extends Model {
    static associate(models) {
      // No additional associations needed as this is a join table
    }
  }

  UserArticle.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    articleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'articles',
        key: 'id'
      }
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    isSaved: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    savedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'UserArticle',
    tableName: 'user_articles',
    underscored: true,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['article_id']
      },
      {
        unique: true,
        fields: ['user_id', 'article_id']
      }
    ]
  });

  return UserArticle;
}; 