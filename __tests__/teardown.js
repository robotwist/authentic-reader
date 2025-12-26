// globalTeardown.js
import { teardownTestDatabase } from './setup.js';

export default async () => {
  await teardownTestDatabase();
}; 