import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testSources() {
  try {
    console.log('Testing sources endpoint...');
    
    const sourcesPath = path.join(__dirname, 'data', 'sources.json');
    console.log('Sources path:', sourcesPath);
    
    const sourcesData = await fs.readFile(sourcesPath, 'utf8');
    console.log('Sources data:', sourcesData);
    
    const sources = JSON.parse(sourcesData);
    console.log('Parsed sources:', sources);
    
    const sourcesArray = Object.entries(sources).map(([key, source]) => ({
      id: key,
      name: source.name,
      url: source.url,
      description: source.description,
      category: 'center',
      isPublic: true
    }));
    
    console.log('Final array:', JSON.stringify(sourcesArray, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testSources();
