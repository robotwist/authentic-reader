import fs from 'fs/promises';
import path from 'path';

class JSONStorageService {
  constructor() {
    this.dataDir = path.join(process.cwd(), 'data');
    this.sourcesFile = path.join(this.dataDir, 'sources.json');
    this.articlesFile = path.join(this.dataDir, 'articles.json');
    this.analysisFile = path.join(this.dataDir, 'analysis.json');
    this.usersFile = path.join(this.dataDir, 'users.json');
    this.dailyBriefingFile = path.join(this.dataDir, 'daily_briefing.json');
  }

  async ensureDataDir() {
    try {
      await fs.access(this.dataDir);
    } catch {
      await fs.mkdir(this.dataDir, { recursive: true });
    }
  }

  async readFile(filePath, defaultValue = {}) {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch {
      return defaultValue;
    }
  }

  async writeFile(filePath, data) {
    await this.ensureDataDir();
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  }

  // Sources management
  async getSources() {
    return await this.readFile(this.sourcesFile, {});
  }

  async saveSource(sourceName, sourceData) {
    const sources = await this.getSources();
    sources[sourceName] = sourceData;
    await this.writeFile(this.sourcesFile, sources);
    return sourceData;
  }

  async deleteSource(sourceName) {
    const sources = await this.getSources();
    delete sources[sourceName];
    await this.writeFile(this.sourcesFile, sources);
  }

  // Articles management
  async getArticles() {
    return await this.readFile(this.articlesFile, {});
  }

  async saveArticle(articleId, articleData) {
    const articles = await this.getArticles();
    articles[articleId] = articleData;
    await this.writeFile(this.articlesFile, articles);
    return articleData;
  }

  async getArticle(articleId) {
    const articles = await this.getArticles();
    return articles[articleId] || null;
  }

  // Analysis management
  async getAnalysis() {
    return await this.readFile(this.analysisFile, {});
  }

  async saveAnalysis(analysisId, analysisData) {
    const analysis = await this.getAnalysis();
    analysis[analysisId] = analysisData;
    await this.writeFile(this.analysisFile, analysis);
    return analysisData;
  }

  // Users management
  async getUsers() {
    return await this.readFile(this.usersFile, {});
  }

  async saveUser(userId, userData) {
    const users = await this.getUsers();
    users[userId] = userData;
    await this.writeFile(this.usersFile, users);
    return userData;
  }

  async getUser(userId) {
    const users = await this.getUsers();
    return users[userId] || null;
  }

  // Daily briefing management
  async getDailyBriefing() {
    return await this.readFile(this.dailyBriefingFile, null);
  }

  async saveDailyBriefing(briefingData) {
    await this.writeFile(this.dailyBriefingFile, briefingData);
    return briefingData;
  }
}

export default new JSONStorageService();
