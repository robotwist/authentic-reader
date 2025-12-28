'use strict';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Sequelize from 'sequelize';
import process from 'process';
import databaseConfig from '../config/database.cjs';

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
  sourceId: Sequelize.INTEGER,
  consensusScore: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    field: 'consensus_score'
  },
  analysisPayload: {
    type: Sequelize.JSONB,
    allowNull: true,
    field: 'analysis_payload'
  }
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

const Vote = sequelize.define('Vote', {
  articleId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    field: 'article_id'
  },
  userId: {
    type: Sequelize.UUID,
    allowNull: false,
    field: 'user_id'
  },
  voteType: {
    type: Sequelize.ENUM('AGREE', 'DISAGREE', 'MISSED_FALLACY'),
    allowNull: false,
    field: 'vote_type'
  },
  comment: {
    type: Sequelize.TEXT,
    allowNull: true
  }
}, {
  tableName: 'votes',
  underscored: true
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
db.Vote = Vote;

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

// Vote relationships
Article.hasMany(Vote, { foreignKey: 'articleId', as: 'votes' });
Vote.belongsTo(Article, { foreignKey: 'articleId' });

// Daily Briefing Articles for history/archive feature
const DailyBriefingArticle = sequelize.define('DailyBriefingArticle', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  },
  briefingDate: {
    type: Sequelize.DATEONLY,
    allowNull: false,
    field: 'briefing_date'
  },
  topic: {
    type: Sequelize.STRING(50),
    allowNull: false
  },
  topicLabel: {
    type: Sequelize.STRING(100),
    allowNull: false,
    field: 'topic_label'
  },
  icon: {
    type: Sequelize.STRING(10),
    allowNull: false
  },
  headline: {
    type: Sequelize.STRING(500),
    allowNull: false
  },
  source: {
    type: Sequelize.STRING(200),
    allowNull: false
  },
  author: {
    type: Sequelize.STRING(200),
    allowNull: true
  },
  url: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  content: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  publishDate: {
    type: Sequelize.DATE,
    allowNull: true,
    field: 'publish_date'
  },
  fallacies: {
    type: Sequelize.JSON,
    allowNull: true,
    defaultValue: {}
  },
  reliabilityScore: {
    type: Sequelize.INTEGER,
    allowNull: true,
    field: 'reliability_score'
  }
}, {
  tableName: 'daily_briefing_articles',
  underscored: true,
  timestamps: true
});

db.DailyBriefingArticle = DailyBriefingArticle;

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
export { User, Source, Article, UserSource, UserArticle, Analysis, UserPrefs, DailyBriefingArticle, Vote }; 