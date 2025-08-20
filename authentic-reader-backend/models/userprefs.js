'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserPrefs extends Model {
    static associate(models) {
      // Define associations
      UserPrefs.belongsTo(models.User, { foreignKey: 'userId' });
    }
  }

  UserPrefs.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    darkMode: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    muteOutrage: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    blockDoomscroll: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    refreshInterval: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 60 // minutes
    }
  }, {
    sequelize,
    modelName: 'UserPrefs',
    tableName: 'user_prefs',
    underscored: true
  });

  return UserPrefs;
}; 