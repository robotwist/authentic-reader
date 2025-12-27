'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Article extends Model {
    static associate(models) {
      // Define associations
      Article.belongsTo(models.Source, { foreignKey: 'sourceId' });
      Article.belongsToMany(models.User, {
        through: 'UserArticles',
        foreignKey: 'articleId',
        as: 'users'
      });
      Article.hasMany(models.Analysis, { foreignKey: 'articleId' });
      Article.belongsToMany(models.Collection, {
        through: 'CollectionItems',
        foreignKey: 'articleId',
        as: 'collections'
      });
      Article.hasMany(models.Vote, { foreignKey: 'articleId', as: 'votes' });
    }
  }

  Article.init({
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    link: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isUrl: true
      }
    },
    sourceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'sources',
        key: 'id'
      }
    },
    author: {
      type: DataTypes.STRING,
      allowNull: true
    },
    publishDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    categories: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: []
    },
    guid: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    consensusScore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'consensus_score',
      comment: 'Community consensus score based on votes (+1 for AGREE, -1 for DISAGREE)'
    }
  }, {
    sequelize,
    modelName: 'Article',
    tableName: 'articles',
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['guid']
      },
      {
        fields: ['source_id']
      },
      {
        fields: ['publish_date']
      }
    ]
  });

  return Article;
}; 