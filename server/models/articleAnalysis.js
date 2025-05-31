import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Article from './article.js';

// Initialize the Article model
const ArticleModel = Article(sequelize);

const ArticleAnalysis = sequelize.define('ArticleAnalysis', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  articleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: ArticleModel,
      key: 'id'
    }
  },
  sentiment: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  subjectivity: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  bias: {
    type: DataTypes.STRING,
    allowNull: true
  },
  reliability: {
    type: DataTypes.STRING,
    allowNull: true
  },
  analysis: {
    type: DataTypes.JSON,
    allowNull: true
  }
});

// Set up the association
ArticleAnalysis.belongsTo(ArticleModel, { foreignKey: 'articleId' });
ArticleModel.hasOne(ArticleAnalysis, { foreignKey: 'articleId' });

export default ArticleAnalysis; 