'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add analysis_payload column to articles table
    await queryInterface.addColumn('articles', 'analysis_payload', {
      type: Sequelize.JSONB,
      allowNull: true,
      comment: 'Rich LLM analysis payload matching frontend schema: { summary, bias, confidence_score, tone, fallacies[], educational_insight }'
    });

    // Add GIN index for JSONB queries (useful for filtering articles with analysis)
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS articles_analysis_payload_idx 
      ON articles USING GIN (analysis_payload);
    `);
  },

  async down(queryInterface, Sequelize) {
    // Remove index first
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS articles_analysis_payload_idx;
    `);
    
    // Remove analysis_payload column
    await queryInterface.removeColumn('articles', 'analysis_payload');
  }
};

