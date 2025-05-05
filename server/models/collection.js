'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Collection extends Model {
    static associate(models) {
      // Define associations
      Collection.belongsTo(models.User, { foreignKey: 'userId' });
      Collection.belongsToMany(models.Article, {
        through: 'CollectionItems',
        foreignKey: 'collectionId',
        as: 'articles'
      });
    }
  }

  Collection.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'Collection',
    tableName: 'collections',
    underscored: true,
    indexes: [
      {
        fields: ['user_id']
      }
    ]
  });

  return Collection;
}; 