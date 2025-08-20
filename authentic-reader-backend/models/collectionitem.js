'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CollectionItem extends Model {
    static associate(models) {
      // No additional associations needed as this is a join table
    }
  }

  CollectionItem.init({
    collectionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'collections',
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
    displayOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'CollectionItem',
    tableName: 'collection_items',
    underscored: true,
    indexes: [
      {
        fields: ['collection_id']
      },
      {
        fields: ['article_id']
      },
      {
        unique: true,
        fields: ['collection_id', 'article_id']
      }
    ]
  });

  return CollectionItem;
}; 