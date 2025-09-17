import express from 'express';
import axios from 'axios';
import xml2js from 'xml2js';
const router = express.Router();

// Fact-checking source configurations
const FACT_CHECK_SOURCES = {
  snopes: {
    name: 'Snopes',
    rssUrl: 'https://www.snopes.com/feed/',
    searchUrl: 'https://www.snopes.com/search/',
    reliability: 0.9
  },
  politifact: {
    name: 'PolitiFact',
    rssUrl: 'https://www.politifact.com/rss/all/',
    searchUrl: 'https://www.politifact.com/search/',
    reliability: 0.85
  },
  reuters: {
    name: 'Reuters Fact Check',
    rssUrl: 'https://www.reuters.com/fact-check/feed',
    searchUrl: 'https://www.reuters.com/fact-check/search',
    reliability: 0.9
  },
  factcheckOrg: {
    name: 'FactCheck.org',
    rssUrl: 'https://www.factcheck.org/feed/',
    searchUrl: 'https://www.factcheck.org/search/',
    reliability: 0.85
  }
};

/**
 * Search Snopes for fact checks related to a claim
 */
router.get('/snopes', async (req, res) => {
  try {
    const { claim } = req.query;
    if (!claim) {
      return res.status(400).json({ error: 'Claim parameter is required' });
    }

    // Fetch Snopes RSS feed
    const response = await axios.get(FACT_CHECK_SOURCES.snopes.rssUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AuthenticReader/1.0)'
      }
    });

    const feed = await xml2js.parseStringPromise(response.data);
    const items = feed.rss?.channel?.[0]?.item || [];

    // Search for relevant fact checks
    const relevantChecks = items.filter(item => {
      const title = item.title?.[0]?.toLowerCase() || '';
      const description = item.description?.[0]?.toLowerCase() || '';
      const claimLower = claim.toLowerCase();
      
      // Simple keyword matching
      const keywords = claimLower.split(' ').filter(word => word.length > 3);
      return keywords.some(keyword => 
        title.includes(keyword) || description.includes(keyword)
      );
    }).slice(0, 5);

    // Process results
    const results = relevantChecks.map(item => {
      const title = item.title?.[0] || '';
      const description = item.description?.[0] || '';
      const link = item.link?.[0] || '';
      const pubDate = item.pubDate?.[0] || '';

      // Extract verdict from title/description
      let status = 'unverified';
      if (title.toLowerCase().includes('true') || description.toLowerCase().includes('true')) {
        status = 'verified';
      } else if (title.toLowerCase().includes('false') || description.toLowerCase().includes('false')) {
        status = 'false';
      } else if (title.toLowerCase().includes('misleading') || description.toLowerCase().includes('misleading')) {
        status = 'misleading';
      }

      return {
        title,
        description,
        link,
        pubDate,
        status,
        source: FACT_CHECK_SOURCES.snopes.name,
        reliability: FACT_CHECK_SOURCES.snopes.reliability
      };
    });

    res.json({
      claim,
      source: FACT_CHECK_SOURCES.snopes.name,
      results,
      totalFound: results.length
    });

  } catch (error) {
    console.error('Snopes fact-check error:', error);
    res.status(500).json({ 
      error: 'Failed to check Snopes',
      details: error.message 
    });
  }
});

/**
 * Search PolitiFact for fact checks related to a claim
 */
router.get('/politifact', async (req, res) => {
  try {
    const { claim } = req.query;
    if (!claim) {
      return res.status(400).json({ error: 'Claim parameter is required' });
    }

    // Fetch PolitiFact RSS feed
    const response = await axios.get(FACT_CHECK_SOURCES.politifact.rssUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AuthenticReader/1.0)'
      }
    });

    const feed = await xml2js.parseStringPromise(response.data);
    const items = feed.rss?.channel?.[0]?.item || [];

    // Search for relevant fact checks
    const relevantChecks = items.filter(item => {
      const title = item.title?.[0]?.toLowerCase() || '';
      const description = item.description?.[0]?.toLowerCase() || '';
      const claimLower = claim.toLowerCase();
      
      const keywords = claimLower.split(' ').filter(word => word.length > 3);
      return keywords.some(keyword => 
        title.includes(keyword) || description.includes(keyword)
      );
    }).slice(0, 5);

    // Process results
    const results = relevantChecks.map(item => {
      const title = item.title?.[0] || '';
      const description = item.description?.[0] || '';
      const link = item.link?.[0] || '';
      const pubDate = item.pubDate?.[0] || '';

      // Extract PolitiFact's Truth-O-Meter rating
      let status = 'unverified';
      if (title.includes('True') || description.includes('True')) {
        status = 'verified';
      } else if (title.includes('False') || description.includes('False')) {
        status = 'false';
      } else if (title.includes('Mostly True') || description.includes('Mostly True')) {
        status = 'verified';
      } else if (title.includes('Mostly False') || description.includes('Mostly False')) {
        status = 'false';
      } else if (title.includes('Half True') || description.includes('Half True')) {
        status = 'misleading';
      } else if (title.includes('Pants on Fire') || description.includes('Pants on Fire')) {
        status = 'false';
      }

      return {
        title,
        description,
        link,
        pubDate,
        status,
        source: FACT_CHECK_SOURCES.politifact.name,
        reliability: FACT_CHECK_SOURCES.politifact.reliability
      };
    });

    res.json({
      claim,
      source: FACT_CHECK_SOURCES.politifact.name,
      results,
      totalFound: results.length
    });

  } catch (error) {
    console.error('PolitiFact fact-check error:', error);
    res.status(500).json({ 
      error: 'Failed to check PolitiFact',
      details: error.message 
    });
  }
});

/**
 * Search Reuters Fact Check for fact checks related to a claim
 */
router.get('/reuters', async (req, res) => {
  try {
    const { claim } = req.query;
    if (!claim) {
      return res.status(400).json({ error: 'Claim parameter is required' });
    }

    // Fetch Reuters Fact Check RSS feed
    const response = await axios.get(FACT_CHECK_SOURCES.reuters.rssUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AuthenticReader/1.0)'
      }
    });

    const feed = await xml2js.parseStringPromise(response.data);
    const items = feed.rss?.channel?.[0]?.item || [];

    // Search for relevant fact checks
    const relevantChecks = items.filter(item => {
      const title = item.title?.[0]?.toLowerCase() || '';
      const description = item.description?.[0]?.toLowerCase() || '';
      const claimLower = claim.toLowerCase();
      
      const keywords = claimLower.split(' ').filter(word => word.length > 3);
      return keywords.some(keyword => 
        title.includes(keyword) || description.includes(keyword)
      );
    }).slice(0, 5);

    // Process results
    const results = relevantChecks.map(item => {
      const title = item.title?.[0] || '';
      const description = item.description?.[0] || '';
      const link = item.link?.[0] || '';
      const pubDate = item.pubDate?.[0] || '';

      // Extract Reuters verdict
      let status = 'unverified';
      if (title.toLowerCase().includes('true') || description.toLowerCase().includes('true')) {
        status = 'verified';
      } else if (title.toLowerCase().includes('false') || description.toLowerCase().includes('false')) {
        status = 'false';
      } else if (title.toLowerCase().includes('misleading') || description.toLowerCase().includes('misleading')) {
        status = 'misleading';
      }

      return {
        title,
        description,
        link,
        pubDate,
        status,
        source: FACT_CHECK_SOURCES.reuters.name,
        reliability: FACT_CHECK_SOURCES.reuters.reliability
      };
    });

    res.json({
      claim,
      source: FACT_CHECK_SOURCES.reuters.name,
      results,
      totalFound: results.length
    });

  } catch (error) {
    console.error('Reuters fact-check error:', error);
    res.status(500).json({ 
      error: 'Failed to check Reuters Fact Check',
      details: error.message 
    });
  }
});

/**
 * Search FactCheck.org for fact checks related to a claim
 */
router.get('/factcheck-org', async (req, res) => {
  try {
    const { claim } = req.query;
    if (!claim) {
      return res.status(400).json({ error: 'Claim parameter is required' });
    }

    // Fetch FactCheck.org RSS feed
    const response = await axios.get(FACT_CHECK_SOURCES.factcheckOrg.rssUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AuthenticReader/1.0)'
      }
    });

    const feed = await xml2js.parseStringPromise(response.data);
    const items = feed.rss?.channel?.[0]?.item || [];

    // Search for relevant fact checks
    const relevantChecks = items.filter(item => {
      const title = item.title?.[0]?.toLowerCase() || '';
      const description = item.description?.[0]?.toLowerCase() || '';
      const claimLower = claim.toLowerCase();
      
      const keywords = claimLower.split(' ').filter(word => word.length > 3);
      return keywords.some(keyword => 
        title.includes(keyword) || description.includes(keyword)
      );
    }).slice(0, 5);

    // Process results
    const results = relevantChecks.map(item => {
      const title = item.title?.[0] || '';
      const description = item.description?.[0] || '';
      const link = item.link?.[0] || '';
      const pubDate = item.pubDate?.[0] || '';

      // Extract FactCheck.org verdict
      let status = 'unverified';
      if (title.toLowerCase().includes('true') || description.toLowerCase().includes('true')) {
        status = 'verified';
      } else if (title.toLowerCase().includes('false') || description.toLowerCase().includes('false')) {
        status = 'false';
      } else if (title.toLowerCase().includes('misleading') || description.toLowerCase().includes('misleading')) {
        status = 'misleading';
      }

      return {
        title,
        description,
        link,
        pubDate,
        status,
        source: FACT_CHECK_SOURCES.factcheckOrg.name,
        reliability: FACT_CHECK_SOURCES.factcheckOrg.reliability
      };
    });

    res.json({
      claim,
      source: FACT_CHECK_SOURCES.factcheckOrg.name,
      results,
      totalFound: results.length
    });

  } catch (error) {
    console.error('FactCheck.org fact-check error:', error);
    res.status(500).json({ 
      error: 'Failed to check FactCheck.org',
      details: error.message 
    });
  }
});

/**
 * Comprehensive fact-check endpoint that checks all sources
 */
router.post('/comprehensive', async (req, res) => {
  try {
    const { claim, context } = req.body;
    if (!claim) {
      return res.status(400).json({ error: 'Claim is required' });
    }

    // Check all fact-checking sources in parallel
    const results = await Promise.allSettled([
      axios.get(`${req.protocol}://${req.get('host')}/api/fact-check/snopes?claim=${encodeURIComponent(claim)}`),
      axios.get(`${req.protocol}://${req.get('host')}/api/fact-check/politifact?claim=${encodeURIComponent(claim)}`),
      axios.get(`${req.protocol}://${req.get('host')}/api/fact-check/reuters?claim=${encodeURIComponent(claim)}`),
      axios.get(`${req.protocol}://${req.get('host')}/api/fact-check/factcheck-org?claim=${encodeURIComponent(claim)}`)
    ]);

    // Process results
    const successfulResults = results
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value.data);

    // Synthesize results
    const synthesis = synthesizeFactCheckResults(claim, successfulResults);

    res.json({
      claim,
      context,
      sources: successfulResults,
      synthesis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Comprehensive fact-check error:', error);
    res.status(500).json({ 
      error: 'Failed to perform comprehensive fact-check',
      details: error.message 
    });
  }
});

/**
 * Synthesize results from multiple fact-checking sources
 */
function synthesizeFactCheckResults(claim, results) {
  const statusCounts = new Map();
  const allSources = [];
  const evidence = { supporting: [], contradicting: [], neutral: [] };

  results.forEach(result => {
    if (result.results) {
      result.results.forEach(check => {
        // Count statuses
        statusCounts.set(check.status, (statusCounts.get(check.status) || 0) + 1);
        
        // Collect sources
        allSources.push({
          name: check.source,
          url: check.link,
          reliability: check.reliability,
          stance: check.status,
          verdict: check.title,
          date: check.pubDate
        });

        // Categorize evidence
        if (check.status === 'verified') {
          evidence.supporting.push(check.title);
        } else if (check.status === 'false') {
          evidence.contradicting.push(check.title);
        } else {
          evidence.neutral.push(check.title);
        }
      });
    }
  });

  // Determine overall status
  const total = Array.from(statusCounts.values()).reduce((sum, count) => sum + count, 0);
  let overallStatus = 'unverified';
  
  if (total > 0) {
    const verifiedCount = statusCounts.get('verified') || 0;
    const falseCount = statusCounts.get('false') || 0;
    const misleadingCount = statusCounts.get('misleading') || 0;

    if (verifiedCount > total * 0.6) {
      overallStatus = 'verified';
    } else if (falseCount > total * 0.5) {
      overallStatus = 'false';
    } else if (misleadingCount > total * 0.4) {
      overallStatus = 'misleading';
    } else if (verifiedCount > 0 && falseCount > 0) {
      overallStatus = 'disputed';
    }
  }

  // Calculate confidence
  const confidence = total > 0 ? Math.min(total / 4, 1) : 0.3;

  return {
    status: overallStatus,
    confidence,
    sources: allSources,
    evidence,
    explanation: generateExplanation(overallStatus, statusCounts, allSources.length),
    aiInsight: generateAIInsight(claim, overallStatus, allSources.length)
  };
}

function generateExplanation(status, statusCounts, sourceCount) {
  const total = Array.from(statusCounts.values()).reduce((sum, count) => sum + count, 0);
  
  switch (status) {
    case 'verified':
      return `This claim has been verified by ${sourceCount} fact-checking sources. Multiple independent sources confirm this information.`;
    case 'false':
      return `This claim has been debunked by ${sourceCount} fact-checking sources. The evidence contradicts this statement.`;
    case 'misleading':
      return `This claim contains misleading information according to ${sourceCount} fact-checking sources.`;
    case 'disputed':
      return `This claim is disputed among fact-checking sources. ${sourceCount} sources have reviewed this claim with conflicting conclusions.`;
    default:
      return `This claim has not been thoroughly fact-checked by our sources. We found ${sourceCount} related fact checks but cannot provide a definitive verdict.`;
  }
}

function generateAIInsight(claim, status, sourceCount) {
  if (sourceCount === 0) {
    return 'No fact-checking sources have reviewed this specific claim. Consider the source and seek additional verification.';
  }
  
  if (status === 'verified') {
    return 'This claim has been verified by multiple fact-checking organizations. However, always consider the context and potential biases.';
  } else if (status === 'false') {
    return 'This claim has been debunked by fact-checking organizations. Be cautious of sources that continue to promote this information.';
  } else if (status === 'misleading') {
    return 'This claim uses selective facts or omits important context. Always verify with multiple sources and consider the full picture.';
  } else if (status === 'disputed') {
    return 'Experts disagree on this claim. This suggests the issue is complex and may require deeper research from multiple perspectives.';
  }
  
  return 'This claim has been reviewed by fact-checking organizations. Consider their findings alongside other sources.';
}

export default router;
