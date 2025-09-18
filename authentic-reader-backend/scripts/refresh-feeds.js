import 'dotenv/config';
import jsonStorage from '../services/jsonStorageService.js';

// Placeholder feed refresh: no-op that touches timestamps
async function main() {
  const sources = await jsonStorage.getSources();
  const articles = await jsonStorage.getArticles();
  const now = new Date().toISOString();
  const stats = {
    sources: Object.keys(sources).length,
    articles: Object.keys(articles).length,
    refreshedAt: now
  };
  console.log(JSON.stringify({ ok: true, stats }));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


