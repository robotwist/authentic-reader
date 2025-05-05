'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserSource extends Model {
    static associate(models) {
      // Define associations with User and Source
      UserSource.belongsTo(models.User, { foreignKey: 'userId' });
      UserSource.belongsTo(models.Source, { foreignKey: 'sourceId' });
    }
  }

  UserSource.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
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
    displayOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'UserSource',
    tableName: 'user_sources',
    underscored: true,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['source_id']
      },
      {
        unique: true,
        fields: ['user_id', 'source_id']
      }
    ]
  });

  return UserSource;
}; 