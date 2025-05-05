import fetch from 'node-fetch';

async function testApi() {
  try {
    // Test health endpoint
    console.log('Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:3000/health');
    const healthData = await healthResponse.json();
    console.log('Health check response:', healthData);
    
    // Test login endpoint
    console.log('\nTesting login endpoint...');
    const loginResponse = await fetch('http://localhost:3000/api/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'robwistrand@gmail.com',
        password: 'Home3841!'
      })
    });
    
    if (!loginResponse.ok) {
      const errorData = await loginResponse.json();
      console.error('Login failed:', errorData);
    } else {
      const userData = await loginResponse.json();
      console.log('Login successful:', userData);
    }
    
    // Test sources endpoint
    console.log('\nTesting sources endpoint...');
    const sourcesResponse = await fetch('http://localhost:3000/api/sources');
    
    if (!sourcesResponse.ok) {
      const errorData = await sourcesResponse.json();
      console.error('Sources API failed:', errorData);
    } else {
      const sourcesData = await sourcesResponse.json();
      console.log(`Sources API returned ${sourcesData.length} sources`);
    }
    
  } catch (error) {
    console.error('API test failed:', error);
  }
}

testApi(); 