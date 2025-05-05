// globalTeardown.js
const { teardownTestDatabase } = require('./setup');

module.exports = async () => {
  await teardownTestDatabase();
}; 