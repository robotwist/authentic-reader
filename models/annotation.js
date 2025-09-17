'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Annotation extends Model {
    static associate(models) {
      // An annotation belongs to a user
      Annotation.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
      
      // An annotation can be associated with an article (optional)
      Annotation.belongsTo(models.Article, {
        foreignKey: 'articleId',
        as: 'article'
      });
    }
  }
  
  Annotation.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    articleId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Articles',
        key: 'id'
      }
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isUrl: true
      }
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('highlight', 'note', 'question', 'insight', 'correction'),
      defaultValue: 'note'
    },
    selection: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'For highlights, contains the selected text and its location data'
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    sentiment: {
      type: DataTypes.ENUM('positive', 'negative', 'neutral'),
      defaultValue: 'neutral'
    },
    visibility: {
      type: DataTypes.ENUM('private', 'public', 'shared'),
      defaultValue: 'private'
    },
    sharedWith: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      defaultValue: []
    },
    reactionCount: {
      type: DataTypes.JSON,
      defaultValue: { agree: 0, disagree: 0, insightful: 0 }
    },
    sourceData: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional metadata about the source'
    },
    createdAt: {
      allowNull: false,
      type: DataTypes.DATE
    },
    updatedAt: {
      allowNull: false,
      type: DataTypes.DATE
    }
  }, {
    sequelize,
    modelName: 'Annotation',
    tableName: 'Annotations',
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['articleId']
      },
      {
        fields: ['url']
      },
      {
        fields: ['type']
      },
      {
        fields: ['tags'],
        using: 'gin'
      },
      {
        fields: ['visibility']
      }
    ]
  });
  
  return Annotation;
}; 