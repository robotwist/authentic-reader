'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('sources', 'category', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'news'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('sources', 'category');
  }
};
