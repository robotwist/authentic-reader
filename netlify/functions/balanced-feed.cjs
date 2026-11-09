const axios = require('axios');
const { parseStringPromise } = require('xml2js');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Sample articles data (you can expand this)
    const sampleArticles = [
      {
        id: "sample-1",
        title: "Sample Article 1",
        url: "https://example.com/article1",
        author: "Sample Author",
        publishedAt: new Date().toISOString(),
        content: "This is a sample article for demonstration purposes.",
        summary: "Sample article summary",
        source: {
          name: "Sample News",
          category: "news",
          biasRating: "center",
          reliability: "high"
        },
        category: "news",
        categories: ["news"],
        wordCount: 10,
        complexity: "low",
        tags: [],
        credibility: "high",
        bias: "center",
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      }
    ];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        articles: sampleArticles,
        metadata: {
          total: sampleArticles.length,
          hasMore: false,
          limit: 20,
          offset: 0,
          filters: {
            categories: [],
            sources: [],
            biasRatings: []
          }
        }
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
