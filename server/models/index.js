'use strict';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Sequelize from 'sequelize';
import process from 'process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';

// Create a simple db object for Railway deployment without database
const createSimpleDb = () => {
  const db = {};
  db.sequelize = null;
  db.Sequelize = Sequelize;
  return db;
};

// Main database initialization function
const initializeDatabase = async () => {
  // Skip database initialization if DATABASE_URL is not set (for Railway deployment)
  if (!process.env.DATABASE_URL && env === 'production') {
    console.log('DATABASE_URL not set, skipping database initialization');
    return createSimpleDb();
  }

  // Only import database config if we're going to use it
  let databaseConfig;
  try {
    databaseConfig = await import('../config/database.cjs');
  } catch (error) {
    console.warn('Database config not found, skipping database initialization:', error.message);
    return createSimpleDb();
  }

  let config = databaseConfig.default[env];

  // Fallback to development config if production config is not found
  if (!config) {
    console.warn(`Database config for environment '${env}' not found, falling back to development`);
    config = databaseConfig.default.development;
  }

  const db = {};

  let sequelize;
  try {
    if (config.use_env_variable) {
      sequelize = new Sequelize(process.env[config.use_env_variable], config);
    } else {
      sequelize = new Sequelize(config.database, config.username, config.password, config);
    }
  } catch (error) {
    console.warn('Database connection failed, skipping database initialization:', error.message);
    return createSimpleDb();
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
    preferredCategories: {
      type: Sequelize.JSON,
      defaultValue: []
    },
    excludedSources: {
      type: Sequelize.JSON,
      defaultValue: []
    },
    readingTime: {
      type: Sequelize.INTEGER,
      defaultValue: 5
    },
    notificationSettings: {
      type: Sequelize.JSON,
      defaultValue: {
        email: false,
        push: false,
        digest: true
      }
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

  db.sequelize = sequelize;
  db.Sequelize = Sequelize;

  return db;
};

// Initialize and export the database
const db = await initializeDatabase();
export default db; 