import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Source from './source.js';

export default (sequelize) => {
  class Article extends Model {
    static associate(models) {
      Article.belongsTo(models.Source, {
        foreignKey: 'sourceId',
        as: 'source'
      });
    }
  }

  Article.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    sourceId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Sources',
        key: 'id'
      }
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    link: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    pubDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    summary: {
      type: DataTypes.TEXT
    },
    categories: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    author: {
      type: DataTypes.STRING
    },
    isAnalyzed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    // Analysis fields
    doomScore: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 1
      }
    },
    errorScore: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 1
      }
    },
    biasAnalysis: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    rhetoricalAnalysis: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    networkAnalysis: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    manipulationAnalysis: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    emotionAnalysis: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    sequelize,
    modelName: 'Article',
    tableName: 'Articles',
    timestamps: true
  });

  // Set up the association
  Article.belongsTo(Source, { foreignKey: 'sourceId' });
  Source.hasMany(Article, { foreignKey: 'sourceId' });

  return Article;
}; 