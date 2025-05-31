import Parser from 'rss-parser';
import { ArticleModel, SourceModel } from '../models/index.js';
import axios from 'axios';

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'media'],
      ['content:encoded', 'contentEncoded'],
      ['dc:creator', 'author']
    ]
  },
  timeout: 10000 // 10 second timeout
});

export async function fetchAndProcessFeeds() {
  try {
    const sources = await SourceModel.findAll({ where: { isActive: true } });
    const results = [];

    for (const source of sources) {
      try {
        console.log(`Fetching feed from ${source.name} (${source.rssUrl})`);
        
        // First fetch the feed content with axios for better timeout control
        const response = await axios.get(source.rssUrl, {
          timeout: 10000, // 10 second timeout
          headers: {
            'User-Agent': 'Authentic Reader RSS Fetcher/1.0',
            'Accept': 'application/rss+xml, application/xml, text/xml, */*'
          }
        });
        
        // Then parse the content
        const feed = await parser.parseString(response.data);
        
        for (const item of feed.items) {
          const existingArticle = await ArticleModel.findOne({
            where: { link: item.link }
          });

          if (!existingArticle) {
            const article = await ArticleModel.create({
              sourceId: source.id,
              title: item.title,
              link: item.link,
              pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
              content: item.contentEncoded || item.content || item.summary,
              summary: item.summary || item.content?.substring(0, 200) || '',
              categories: item.categories || [],
              author: item.author || item.creator || source.name,
              isAnalyzed: false
            });
            results.push(article);
          }
        }
      } catch (error) {
        console.error(`Error processing feed for ${source.name}:`, error.message);
        // Continue with next source instead of failing completely
        continue;
      }
    }

    return results;
  } catch (error) {
    console.error('Error in fetchAndProcessFeeds:', error);
    throw error;
  }
}

export async function getLatestArticles(limit = 50) {
  try {
    return await ArticleModel.findAll({
      include: [{
        model: SourceModel,
        attributes: ['name', 'bias', 'reliability']
      }],
      order: [['pubDate', 'DESC']],
      limit
    });
  } catch (error) {
    console.error('Error fetching latest articles:', error);
    throw error;
  }
} 