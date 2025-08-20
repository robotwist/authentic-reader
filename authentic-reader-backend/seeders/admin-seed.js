'use strict';
const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    return queryInterface.bulkInsert('users', [{
      username: 'seededadmin',
      email: 'seededadmin@example.com',
      password: hashedPassword,
      is_admin: true,
      created_at: new Date(),
      updated_at: new Date()
    }], {});
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('users', { email: 'seededadmin@example.com' }, {});
  }
}; 