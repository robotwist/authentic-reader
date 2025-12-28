import express from 'express';
import { DailyBriefingArticle } from '../models/index.js';
import { Op } from 'sequelize';

const router = express.Router();

/**
 * Helper function to count fallacies in the analysis JSONB object
 */
function countFallacies(fallaciesData) {
  if (!fallaciesData || typeof fallaciesData !== 'object') {
    return 0;
  }

  let count = 0;

  // Count logical fallacies from manipulationAnalysis
  if (fallaciesData.manipulationAnalysis?.logicalFallacies) {
    count += Array.isArray(fallaciesData.manipulationAnalysis.logicalFallacies)
      ? fallaciesData.manipulationAnalysis.logicalFallacies.length
      : 0;
  }

  // Count manipulation techniques from keySentences
  if (fallaciesData.keySentences && Array.isArray(fallaciesData.keySentences)) {
    fallaciesData.keySentences.forEach((sentence) => {
      if (sentence.manipulationTechniques && Array.isArray(sentence.manipulationTechniques)) {
        count += sentence.manipulationTechniques.length;
      }
    });
  }

  return count;
}

/**
 * GET /api/trends
 * Get fallacy density trends for the last 7 days
 * Returns fallacy count (score) per article grouped by date (MM-DD) and topic
 */
router.get('/', async (req, res) => {
  try {
    // Calculate the date range (last 7 days)
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 6); // 7 days total (today + 6 days back)
    startDate.setHours(0, 0, 0, 0);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Fetch all articles from the last 7 days
    const articles = await DailyBriefingArticle.findAll({
      where: {
        briefingDate: {
          [Op.between]: [startDateStr, endDateStr]
        }
      },
      attributes: ['briefingDate', 'topic', 'fallacies'],
      order: [['briefingDate', 'ASC'], ['topic', 'ASC']],
      raw: false
    });

    // Format response with MM-DD date format and "score" field
    // Each article represents one date/topic combination
    const trends = articles.map((article) => {
      const fallacyCount = countFallacies(article.fallacies);
      
      // Format date as MM-DD
      const dateObj = new Date(article.briefingDate + 'T12:00:00');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const formattedDate = `${month}-${day}`;
      
      return {
        date: formattedDate,
        topic: article.topic,
        score: fallacyCount
      };
    });

    res.json(trends);
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({
      error: 'Failed to fetch trends',
      message: error.message
    });
  }
});

export default router;
