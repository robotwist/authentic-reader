'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // Define associations
      User.hasOne(models.UserPrefs, { foreignKey: 'userId' });
      User.belongsToMany(models.Source, { 
        through: 'UserSources',
        foreignKey: 'userId',
        as: 'sources'
      });
      User.belongsToMany(models.Article, {
        through: 'UserArticles',
        foreignKey: 'userId',
        as: 'articles'
      });
      User.hasMany(models.Collection, { foreignKey: 'userId' });
      User.hasMany(models.Analysis, { foreignKey: 'userId' });
    }

    // Fixed instance method to compare passwords
    async validPassword(password) {
      try {
        if (!password || !this.password) {
          console.error('Password validation failed: Missing password data');
          return false;
        }

        console.log('Comparing password with hash');
        console.log('Input password length:', password.length);
        console.log('Stored hash length:', this.password.length);
        
        // Use direct bcrypt comparison
        const result = await bcrypt.compare(password, this.password);
        console.log('bcrypt.compare result:', result);
        return result;
      } catch (error) {
        console.error('Password validation error:', error);
        return false;
      }
    }
  }

  User.init({
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 30]
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [6, 100]
      }
    },
    isAdmin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    underscored: true,
    hooks: {
      beforeCreate: async (user) => {
        try {
          if (user.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
        } catch (error) {
          console.error('Error hashing password during create:', error);
          throw new Error('Error creating user: password hashing failed');
        }
      },
      beforeUpdate: async (user) => {
        try {
          if (user.changed('password')) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
        } catch (error) {
          console.error('Error hashing password during update:', error);
          throw new Error('Error updating user: password hashing failed');
        }
      }
    }
  });

  return User;
}; 