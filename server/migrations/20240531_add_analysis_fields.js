'use strict';

import { DataTypes } from 'sequelize';

export default {
  up: async (queryInterface) => {
    await queryInterface.addColumn('Articles', 'doomScore', {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      allowNull: false
    });

    await queryInterface.addColumn('Articles', 'errorScore', {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      allowNull: false
    });

    await queryInterface.addColumn('Articles', 'biasAnalysis', {
      type: DataTypes.JSONB,
      defaultValue: {},
      allowNull: false
    });

    await queryInterface.addColumn('Articles', 'rhetoricalAnalysis', {
      type: DataTypes.JSONB,
      defaultValue: {},
      allowNull: false
    });

    await queryInterface.addColumn('Articles', 'networkAnalysis', {
      type: DataTypes.JSONB,
      defaultValue: {},
      allowNull: false
    });

    await queryInterface.addColumn('Articles', 'manipulationAnalysis', {
      type: DataTypes.JSONB,
      defaultValue: {},
      allowNull: false
    });

    await queryInterface.addColumn('Articles', 'emotionAnalysis', {
      type: DataTypes.JSONB,
      defaultValue: {},
      allowNull: false
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('Articles', 'doomScore');
    await queryInterface.removeColumn('Articles', 'errorScore');
    await queryInterface.removeColumn('Articles', 'biasAnalysis');
    await queryInterface.removeColumn('Articles', 'rhetoricalAnalysis');
    await queryInterface.removeColumn('Articles', 'networkAnalysis');
    await queryInterface.removeColumn('Articles', 'manipulationAnalysis');
    await queryInterface.removeColumn('Articles', 'emotionAnalysis');
  }
}; 