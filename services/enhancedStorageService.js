import fs from 'fs/promises';
import path from 'path';

class EnhancedStorageService {
  constructor() {
    this.dataDir = path.join(process.cwd(), 'data');
    this.sourcesFile = path.join(this.dataDir, 'sources.json');
    this.articlesFile = path.join(this.dataDir, 'articles.json');
    this.analysisFile = path.join(this.dataDir, 'analysis.json');
    this.usersFile = path.join(this.dataDir, 'users.json');
    this.authorsFile = path.join(this.dataDir, 'authors.json');
    this.organizationsFile = path.join(this.dataDir, 'organizations.json');
    this.networkFile = path.join(this.dataDir, 'network.json');
    this.politicalProfilesFile = path.join(this.dataDir, 'politicalProfiles.json');
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

  // Enhanced Sources with Political Profiles
  async getSources() {
    return await this.readFile(this.sourcesFile, {});
  }

  async saveSource(sourceName, sourceData) {
    const sources = await this.getSources();
    sources[sourceName] = {
      ...sourceData,
      politicalProfile: await this.generatePoliticalProfile(sourceData),
      lastUpdated: new Date().toISOString()
    };
    await this.writeFile(this.sourcesFile, sources);
    return sources[sourceName];
  }

  // Authors with Network Analysis
  async getAuthors() {
    return await this.readFile(this.authorsFile, {});
  }

  async saveAuthor(authorId, authorData) {
    const authors = await this.getAuthors();
    authors[authorId] = {
      ...authorData,
      networkConnections: await this.analyzeAuthorNetwork(authorData),
      politicalProfile: await this.generateAuthorPoliticalProfile(authorData),
      lastUpdated: new Date().toISOString()
    };
    await this.writeFile(this.authorsFile, authors);
    return authors[authorId];
  }

  async getAuthor(authorId) {
    const authors = await this.getAuthors();
    return authors[authorId] || null;
  }

  // Organizations and Affiliations
  async getOrganizations() {
    return await this.readFile(this.organizationsFile, {});
  }

  async saveOrganization(orgId, orgData) {
    const organizations = await this.getOrganizations();
    organizations[orgId] = {
      ...orgData,
      politicalProfile: await this.generateOrganizationPoliticalProfile(orgData),
      affiliations: await this.analyzeOrganizationAffiliations(orgData),
      lastUpdated: new Date().toISOString()
    };
    await this.writeFile(this.organizationsFile, organizations);
    return organizations[orgId];
  }

  // Network Analysis
  async getNetwork() {
    return await this.readFile(this.networkFile, {});
  }

  async saveNetworkData(networkData) {
    const network = await this.getNetwork();
    network.connections = networkData.connections || [];
    network.nodes = networkData.nodes || [];
    network.lastUpdated = new Date().toISOString();
    await this.writeFile(this.networkFile, network);
    return network;
  }

  // Political Profiles
  async getPoliticalProfiles() {
    return await this.readFile(this.politicalProfilesFile, {});
  }

  async savePoliticalProfile(entityId, profileData) {
    const profiles = await this.getPoliticalProfiles();
    profiles[entityId] = {
      ...profileData,
      lastUpdated: new Date().toISOString()
    };
    await this.writeFile(this.politicalProfilesFile, profiles);
    return profiles[entityId];
  }

  // Enhanced Articles with Network Context
  async getArticles() {
    return await this.readFile(this.articlesFile, {});
  }

  async saveArticle(articleId, articleData) {
    const articles = await this.getArticles();
    
    // Enhanced article data with network analysis
    const enhancedArticle = {
      ...articleData,
      networkContext: await this.generateNetworkContext(articleData),
      politicalAnalysis: await this.generatePoliticalAnalysis(articleData),
      lastUpdated: new Date().toISOString()
    };
    
    articles[articleId] = enhancedArticle;
    await this.writeFile(this.articlesFile, articles);
    
    // Update author and organization data
    if (articleData.author) {
      await this.updateAuthorFromArticle(articleData.author, enhancedArticle);
    }
    
    return enhancedArticle;
  }

  async getArticle(articleId) {
    const articles = await this.getArticles();
    return articles[articleId] || null;
  }

  // Analysis with Political Context
  async getAnalysis() {
    return await this.readFile(this.analysisFile, {});
  }

  async saveAnalysis(analysisId, analysisData) {
    const analysis = await this.getAnalysis();
    analysis[analysisId] = {
      ...analysisData,
      politicalContext: await this.generatePoliticalContext(analysisData),
      networkInfluence: await this.analyzeNetworkInfluence(analysisData),
      lastUpdated: new Date().toISOString()
    };
    await this.writeFile(this.analysisFile, analysis);
    return analysis[analysisId];
  }

  // Political Profile Generation
  async generatePoliticalProfile(sourceData) {
    const profile = {
      economicAxis: {
        position: 0, // -100 (far left) to +100 (far right)
        confidence: 0.8,
        factors: []
      },
      socialAxis: {
        position: 0, // -100 (authoritarian) to +100 (libertarian)
        confidence: 0.8,
        factors: []
      },
      foreignPolicyAxis: {
        position: 0, // -100 (isolationist) to +100 (interventionist)
        confidence: 0.7,
        factors: []
      },
      environmentalAxis: {
        position: 0, // -100 (anti-regulation) to +100 (pro-regulation)
        confidence: 0.6,
        factors: []
      },
      overallBias: {
        direction: 'center',
        intensity: 0,
        confidence: 0.8
      }
    };

    // Analyze source characteristics
    if (sourceData.name) {
      const nameAnalysis = this.analyzeSourceName(sourceData.name);
      profile.economicAxis.factors.push(nameAnalysis.economic);
      profile.socialAxis.factors.push(nameAnalysis.social);
    }

    // Analyze content patterns if available
    if (sourceData.contentAnalysis) {
      const contentAnalysis = this.analyzeContentPatterns(sourceData.contentAnalysis);
      profile.economicAxis.factors.push(...contentAnalysis.economic);
      profile.socialAxis.factors.push(...contentAnalysis.social);
    }

    // Calculate weighted positions
    profile.economicAxis.position = this.calculateWeightedPosition(profile.economicAxis.factors);
    profile.socialAxis.position = this.calculateWeightedPosition(profile.socialAxis.factors);
    profile.foreignPolicyAxis.position = this.calculateWeightedPosition(profile.foreignPolicyAxis.factors);
    profile.environmentalAxis.position = this.calculateWeightedPosition(profile.environmentalAxis.factors);

    // Determine overall bias
    profile.overallBias = this.calculateOverallBias(profile);

    return profile;
  }

  async generateAuthorPoliticalProfile(authorData) {
    const profile = {
      economicAxis: { position: 0, confidence: 0.6, factors: [] },
      socialAxis: { position: 0, confidence: 0.6, factors: [] },
      foreignPolicyAxis: { position: 0, confidence: 0.5, factors: [] },
      environmentalAxis: { position: 0, confidence: 0.5, factors: [] },
      affiliations: [],
      writingPatterns: [],
      sourceConnections: []
    };

    // Analyze author's writing history
    if (authorData.articles) {
      const articleAnalysis = this.analyzeAuthorArticles(authorData.articles);
      profile.economicAxis.factors.push(...articleAnalysis.economic);
      profile.socialAxis.factors.push(...articleAnalysis.social);
      profile.writingPatterns = articleAnalysis.patterns;
    }

    // Analyze affiliations
    if (authorData.affiliations) {
      profile.affiliations = await this.analyzeAffiliations(authorData.affiliations);
    }

    return profile;
  }

  async generateOrganizationPoliticalProfile(orgData) {
    const profile = {
      economicAxis: { position: 0, confidence: 0.7, factors: [] },
      socialAxis: { position: 0, confidence: 0.7, factors: [] },
      foreignPolicyAxis: { position: 0, confidence: 0.6, factors: [] },
      environmentalAxis: { position: 0, confidence: 0.6, factors: [] },
      funding: [],
      boardMembers: [],
      policyPositions: []
    };

    // Analyze organization characteristics
    if (orgData.funding) {
      profile.funding = await this.analyzeFundingSources(orgData.funding);
    }

    if (orgData.boardMembers) {
      profile.boardMembers = await this.analyzeBoardMembers(orgData.boardMembers);
    }

    return profile;
  }

  // Network Analysis Methods
  async analyzeAuthorNetwork(authorData) {
    const connections = {
      sources: [],
      organizations: [],
      coAuthors: [],
      topics: [],
      influence: {
        inDegree: 0,
        outDegree: 0,
        centrality: 0
      }
    };

    // Analyze source connections
    if (authorData.sources) {
      connections.sources = authorData.sources.map(source => ({
        source: source,
        frequency: authorData.articleCount || 1,
        relationship: 'contributor'
      }));
    }

    // Analyze organizational affiliations
    if (authorData.organizations) {
      connections.organizations = authorData.organizations.map(org => ({
        organization: org,
        role: authorData.roles?.[org] || 'member',
        relationship: 'affiliation'
      }));
    }

    return connections;
  }

  async generateNetworkContext(articleData) {
    const context = {
      authorNetwork: null,
      sourceNetwork: null,
      topicNetwork: null,
      influenceMetrics: {
        reach: 0,
        credibility: 0,
        controversy: 0
      }
    };

    // Get author network if available
    if (articleData.author) {
      const author = await this.getAuthor(articleData.author);
      if (author) {
        context.authorNetwork = author.networkConnections;
      }
    }

    // Analyze source network
    if (articleData.source) {
      context.sourceNetwork = await this.analyzeSourceNetwork(articleData.source);
    }

    // Analyze topic network
    if (articleData.analysis?.keyTopics) {
      context.topicNetwork = await this.analyzeTopicNetwork(articleData.analysis.keyTopics);
    }

    return context;
  }

  // Helper Methods for Political Analysis
  analyzeSourceName(name) {
    const analysis = {
      economic: { weight: 0.3, position: 0 },
      social: { weight: 0.3, position: 0 }
    };

    const nameLower = name.toLowerCase();
    
    // Economic indicators
    if (nameLower.includes('business') || nameLower.includes('market') || nameLower.includes('economy')) {
      analysis.economic.position = 20; // Slightly right
    }
    if (nameLower.includes('worker') || nameLower.includes('labor') || nameLower.includes('union')) {
      analysis.economic.position = -20; // Slightly left
    }

    // Social indicators
    if (nameLower.includes('conservative') || nameLower.includes('traditional')) {
      analysis.social.position = -30; // More authoritarian
    }
    if (nameLower.includes('progressive') || nameLower.includes('liberal')) {
      analysis.social.position = 30; // More libertarian
    }

    return analysis;
  }

  analyzeContentPatterns(contentAnalysis) {
    const analysis = {
      economic: [],
      social: []
    };

    // Analyze language patterns
    if (contentAnalysis.keyTopics) {
      contentAnalysis.keyTopics.forEach(topic => {
        if (topic.includes('business') || topic.includes('market')) {
          analysis.economic.push({ weight: 0.4, position: 15 });
        }
        if (topic.includes('worker') || topic.includes('labor')) {
          analysis.economic.push({ weight: 0.4, position: -15 });
        }
      });
    }

    return analysis;
  }

  calculateWeightedPosition(factors) {
    if (factors.length === 0) return 0;
    
    const totalWeight = factors.reduce((sum, factor) => sum + factor.weight, 0);
    const weightedSum = factors.reduce((sum, factor) => sum + (factor.position * factor.weight), 0);
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  calculateOverallBias(profile) {
    const economicWeight = 0.3;
    const socialWeight = 0.3;
    const foreignPolicyWeight = 0.2;
    const environmentalWeight = 0.2;

    const weightedPosition = (
      profile.economicAxis.position * economicWeight +
      profile.socialAxis.position * socialWeight +
      profile.foreignPolicyAxis.position * foreignPolicyWeight +
      profile.environmentalAxis.position * environmentalWeight
    );

    let direction = 'center';
    let intensity = Math.abs(weightedPosition) / 100;

    if (weightedPosition > 20) direction = 'right';
    else if (weightedPosition < -20) direction = 'left';

    return {
      direction,
      intensity: Math.min(intensity, 1),
      confidence: 0.8
    };
  }

  // Users management (keeping existing functionality)
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
}

export default new EnhancedStorageService();
