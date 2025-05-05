'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Source extends Model {
    static associate(models) {
      // Define associations
      Source.belongsToMany(models.User, { 
        through: 'UserSources',
        foreignKey: 'sourceId',
        as: 'users'
      });
      Source.hasMany(models.Article, { foreignKey: 'sourceId' });
    }
  }

  Source.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isUrl: true
      }
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Source',
    tableName: 'sources',
    underscored: true
  });

  return Source;
}; 