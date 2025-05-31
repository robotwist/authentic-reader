import sequelize from '../config/database.js';
import Source from './source.js';
import Article from './article.js';
import ArticleAnalysis from './articleAnalysis.js';

// Initialize models
const models = {
  Source: Source(sequelize),
  Article: Article(sequelize),
  ArticleAnalysis: ArticleAnalysis(sequelize)
};

// Set up associations
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

const db = {
  sequelize,
  ...models
};

export default db;
export const { Source: SourceModel, Article: ArticleModel, ArticleAnalysis: ArticleAnalysisModel } = models; 