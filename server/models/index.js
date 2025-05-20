'use strict';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Sequelize from 'sequelize';
import process from 'process';
import databaseConfig from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = databaseConfig[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

// Define models directly instead of using dynamic imports
// This is a placeholder - in a real app, you'd define your models here
const User = sequelize.define('User', {
  username: Sequelize.STRING,
  email: Sequelize.STRING,
  password: Sequelize.STRING,
  isAdmin: Sequelize.BOOLEAN
});

const Source = sequelize.define('Source', {
  name: Sequelize.STRING,
  url: Sequelize.STRING,
  category: Sequelize.STRING,
  description: Sequelize.TEXT
});

const Article = sequelize.define('Article', {
  title: Sequelize.STRING,
  link: Sequelize.STRING,
  author: Sequelize.STRING,
  publishDate: Sequelize.DATE,
  content: Sequelize.TEXT,
  summary: Sequelize.TEXT,
  imageUrl: Sequelize.STRING,
  categories: Sequelize.JSON,
  guid: Sequelize.STRING,
  sourceId: Sequelize.INTEGER
});

const UserSource = sequelize.define('UserSource', {
  userId: Sequelize.INTEGER,
  sourceId: Sequelize.INTEGER,
  displayOrder: Sequelize.INTEGER
});

const UserArticle = sequelize.define('UserArticle', {
  userId: Sequelize.INTEGER,
  articleId: Sequelize.INTEGER,
  isRead: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  isSaved: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  readAt: Sequelize.DATE,
  savedAt: Sequelize.DATE,
  articleGuid: Sequelize.STRING
});

const Analysis = sequelize.define('Analysis', {
  userId: Sequelize.INTEGER,
  articleId: Sequelize.INTEGER,
  content: Sequelize.TEXT,
  results: Sequelize.JSON,
  visibility: Sequelize.STRING,
  biasTags: Sequelize.JSON,
  sharedWith: Sequelize.JSON
});

// Define UserPrefs model
const UserPrefs = sequelize.define('UserPrefs', {
  userId: {
    type: Sequelize.INTEGER,
    unique: true,
    allowNull: false
  },
  darkMode: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  muteOutrage: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  blockDoomscroll: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  refreshInterval: {
    type: Sequelize.INTEGER,
    defaultValue: 60
  }
});

// Add models to db object
db.User = User;
db.Source = Source;
db.Article = Article;
db.UserSource = UserSource;
db.UserArticle = UserArticle;
db.Analysis = Analysis;
db.UserPrefs = UserPrefs;

// Set up associations
// In a real app, you'd set up proper associations here
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Define relationships
User.hasOne(UserPrefs, { foreignKey: 'userId' });
UserPrefs.belongsTo(User, { foreignKey: 'userId' });

// Source relationships
User.belongsToMany(Source, { through: UserSource, foreignKey: 'userId' });
Source.belongsToMany(User, { through: UserSource, foreignKey: 'sourceId' });

// Article relationships
Source.hasMany(Article, { foreignKey: 'sourceId' });
Article.belongsTo(Source, { foreignKey: 'sourceId' });

// UserArticle relationships
User.belongsToMany(Article, { through: UserArticle, foreignKey: 'userId' });
Article.belongsToMany(User, { through: UserArticle, foreignKey: 'articleId' });
User.hasMany(UserArticle, { foreignKey: 'userId' });
Article.hasMany(UserArticle, { foreignKey: 'articleId' });
UserArticle.belongsTo(User, { foreignKey: 'userId' });
UserArticle.belongsTo(Article, { foreignKey: 'articleId' });

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
export { User, Source, Article, UserSource, UserArticle, Analysis, UserPrefs }; 