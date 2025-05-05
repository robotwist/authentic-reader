'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_prefs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true, // Each user should have only one preferences row
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      dark_mode: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      mute_outrage: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      block_doomscroll: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      refresh_interval: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 60 // minutes
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add index for user_id for faster lookups
    await queryInterface.addIndex('user_prefs', ['user_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user_prefs');
  }
}; 