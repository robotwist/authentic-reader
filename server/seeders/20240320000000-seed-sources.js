import { sources } from './sources.js';

export async function up(queryInterface, Sequelize) {
  return queryInterface.bulkInsert('Sources', sources.map(source => ({
    ...source,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  })), {});
}

export async function down(queryInterface, Sequelize) {
  return queryInterface.bulkDelete('Sources', null, {});
} 