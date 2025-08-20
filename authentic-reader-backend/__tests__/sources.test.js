const request = require('supertest');
const app = require('../index');
const { sequelize, User, Source, UserSource } = require('../models');
const { execSync } = require('child_process'); // To run seeds
const bcrypt = require('bcrypt');

// Use the exported server instance directly
const server = app;

// Helper function to create a user and get a token
const createUserAndLogin = async (userData, makeAdmin = false) => {
  // REMOVED Manual Hashing: Let the User model hook handle hashing

  // 1. Create user directly in DB - Pass plain text password
  const createdUser = await User.create({
    username: userData.username,
    email: userData.email,
    password: userData.password, // Pass plain password, hook will hash it
    isAdmin: makeAdmin, 
  });
  
  // 2. Fetch the created user again to ensure we have the final ID and state
  const user = await User.findByPk(createdUser.id); 
  if (!user) {
      throw new Error(`Failed to fetch newly created user ${userData.email}`);
  }

  // 3. Login user using the original plain text password
  const loginRes = await request(server)
    .post('/api/users/login')
    .send({ email: userData.email, password: userData.password }); 

  if (loginRes.statusCode !== 200) {
    console.error(`Failed to log in user ${userData.email} (ID: ${user.id}):`, loginRes.body);
    // Fetch user again to check password hash just before login failure
    const userCheck = await User.findByPk(user.id);
    console.error('Stored password hash at login attempt:', userCheck ? userCheck.password : 'User not found');
    throw new Error(`Login failed for ${userData.email}`);
  }
  
  return { userId: user.id, token: loginRes.body.token };
};

describe('Sources API', () => {
  let adminUser = {
    username: 'sourcetestadmin_unique', // Ensure unique username
    email: 'sourceadmin_unique@test.com', // Ensure unique email
    password: 'password123',
  };
  let regularUser = {
    username: 'sourcetestuser_unique', // Ensure unique username
    email: 'sourceuser_unique@test.com', // Ensure unique email
    password: 'password123'
  };
  let adminToken;
  let userToken;
  let adminUserId;
  let regularUserId;

  // Setup: Clean DB, run seeds, create users, get tokens
  beforeAll(async () => {
    // Ensure DB is clean before seeding and testing
    // Use force: true only in test environment!
    await sequelize.sync({ force: true }); // This drops and recreates tables based on models

    // Run source seeds
    try {
      console.log('Running source seeds for sources.test.js...');
      // Adjust path to sequelize-cli and seeds if necessary
      execSync('npx sequelize-cli db:seed --seed source-seeds.js', { stdio: 'inherit', cwd: __dirname + '/..' }); 
      console.log('Source seeds completed.');
    } catch (error) {
      console.error('Failed to run source seeds:', error);
      throw error; // Stop tests if seeding fails
    }

    // Create admin user
    try {
      const adminLogin = await createUserAndLogin(adminUser, true); // Pass true for isAdmin
      adminToken = adminLogin.token;
      adminUserId = adminLogin.userId;
      if (!adminToken) throw new Error('Failed to create/log in admin user');
      console.log(`Admin user ${adminUserId} created and logged in.`);
    } catch (error) {
       console.error("Error creating/logging in admin user:", error);
       throw error;
    }
    
    // Create regular user
    try {
      const userLogin = await createUserAndLogin(regularUser, false); // Pass false for isAdmin
      userToken = userLogin.token;
      regularUserId = userLogin.userId;
      if (!userToken) throw new Error('Failed to create/log in regular user');
       console.log(`Regular user ${regularUserId} created and logged in.`);
    } catch (error) {
      console.error("Error creating/logging in regular user:", error);
      throw error;
    }
  }, 30000); // Increase timeout for setup if needed

  // Test GET /api/sources
  describe('GET /api/sources', () => {
    it('should return a list of all sources', async () => {
      const res = await request(server).get('/api/sources');
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
      // Check if seeded sources are present (based on source-seeds.js)
      expect(res.body.length).toBeGreaterThanOrEqual(7);
      expect(res.body.some(s => s.name === 'TechCrunch')).toBe(true);
    });
  });

  // Test GET /api/sources/:id
  describe('GET /api/sources/:id', () => {
    let sourceId;
    // This now runs AFTER the main beforeAll, so seeds should be present
    beforeAll(async () => {
      const source = await Source.findOne({ where: { name: 'Wired' } });
      if (!source) {
        // Check if seeds actually ran
        const allSources = await Source.findAll();
        console.log('Available sources after seeding:', allSources.map(s => s.name));
        throw new Error("Test source 'Wired' not found. Ensure source-seeds.js includes 'Wired' and ran correctly.");
      }
      sourceId = source.id;
    });

    it('should return a single source by ID', async () => {
      const res = await request(server).get(`/api/sources/${sourceId}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('id', sourceId);
      expect(res.body.name).toBe('Wired');
    });

    it('should return 404 for non-existent source ID', async () => {
      const res = await request(server).get('/api/sources/99999');
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('message', 'Source not found');
    });
  });

  // Test POST /api/sources (Admin only)
  describe('POST /api/sources', () => {
    const newSourceData = { name: 'Test Feed Unique', url: 'https://test.feed.unique/rss', category: 'testing' }; // Use unique URL

    // Clean up created source after tests in this block
    afterAll(async () => {
       await Source.destroy({ where: { url: newSourceData.url } });
    });

    it('should allow admin to create a new source', async () => {
      const res = await request(server)
        .post('/api/sources')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newSourceData);
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe(newSourceData.name);
    });

    it('should prevent regular user from creating a source', async () => {
      const res = await request(server)
        .post('/api/sources')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newSourceData);
      expect(res.statusCode).toEqual(403); // Forbidden
    });

    it('should prevent unauthenticated user from creating a source', async () => {
      const res = await request(server)
        .post('/api/sources')
        .send(newSourceData);
      expect(res.statusCode).toEqual(401); // Unauthorized
    });

    it('should return 400 if required fields are missing', async () => {
       const res = await request(server)
        .post('/api/sources')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Incomplete Source' });
       expect(res.statusCode).toEqual(400);
       expect(res.body).toHaveProperty('message', 'Name, URL and category are required');
    });

    it('should return 400 if source URL already exists', async () => {
      // First, create the source
      await request(server)
        .post('/api/sources')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Duplicate URL Source', url: 'https://duplicate.url.unique/rss', category: 'test' }); // Use unique URL

      // Then, try to create it again
      const res = await request(server)
        .post('/api/sources')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Another Source', url: 'https://duplicate.url.unique/rss', category: 'test2' }); // Use the same unique URL
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message', 'Source with this URL already exists');

      // Cleanup
      await Source.destroy({ where: { url: 'https://duplicate.url.unique/rss' } });
    });
  });
  
  // Add tests for PUT /api/sources/:id (Admin only)
  describe('PUT /api/sources/:id', () => {
    let createdSourceId;
    const initialSourceData = { name: 'Update Test Unique', url: 'https://update.test.unique/rss', category: 'updates' }; // Unique URL
    const updateData = { name: 'Updated Test Feed', description: 'New description' };

    beforeEach(async () => {
      // Create a source to update
      const res = await request(server)
        .post('/api/sources')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(initialSourceData);
      // Check if creation was successful before accessing id
      if (res.statusCode !== 201 || !res.body || !res.body.id) {
          console.error("Failed to create source for PUT test:", res.status, res.body);
          throw new Error("Failed to create source needed for PUT test setup.");
      }
      createdSourceId = res.body.id;
    });

    // Cleanup source after each test in this block
     afterEach(async () => {
        if (createdSourceId) {
            await Source.destroy({ where: { id: createdSourceId } });
            createdSourceId = null; // Reset id
        }
     });

    it('should allow admin to update a source', async () => {
      const res = await request(server)
        .put(`/api/sources/${createdSourceId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);
      expect(res.statusCode).toEqual(200);
      expect(res.body.name).toBe(updateData.name);
      expect(res.body.description).toBe(updateData.description);
    });

    it('should prevent regular user from updating a source', async () => {
       const res = await request(server)
        .put(`/api/sources/${createdSourceId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData);
       expect(res.statusCode).toEqual(403);
    });

    it('should return 404 if source ID does not exist', async () => {
      const res = await request(server)
        .put('/api/sources/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);
      expect(res.statusCode).toEqual(404);
    });
  });

  // Add tests for DELETE /api/sources/:id (Admin only)
  describe('DELETE /api/sources/:id', () => {
    let sourceToDeleteId;
    const sourceToDeleteData = { name: 'Delete Me Unique', url: 'https://delete.me.unique/rss', category: 'delete' }; // Unique URL

    beforeEach(async () => {
      // Create a source to delete
      const res = await request(server)
        .post('/api/sources')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(sourceToDeleteData);
      // Check if creation was successful before accessing id
       if (res.statusCode !== 201 || !res.body || !res.body.id) {
           console.error("Failed to create source for DELETE test:", res.status, res.body);
           throw new Error("Failed to create source needed for DELETE test setup.");
       }
      sourceToDeleteId = res.body.id;
    });

     // Optional: Cleanup just in case delete test fails
     afterEach(async () => {
        if(sourceToDeleteId) {
           await Source.destroy({ where: { id: sourceToDeleteId }, force: true }).catch(err => console.log("Cleanup failed, source might already be deleted:", err.message));
            sourceToDeleteId = null;
        }
     });

    it('should allow admin to delete a source', async () => {
      const res = await request(server)
        .delete(`/api/sources/${sourceToDeleteId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toEqual(204);

      // Verify it's gone
      const getRes = await request(server).get(`/api/sources/${sourceToDeleteId}`);
      expect(getRes.statusCode).toEqual(404);
    });

    it('should prevent regular user from deleting a source', async () => {
      const res = await request(server)
        .delete(`/api/sources/${sourceToDeleteId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toEqual(403);
    });
    
    it('should return 404 if source ID does not exist', async () => {
      const res = await request(server)
        .delete('/api/sources/99999')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toEqual(404);
    });
  });

  // Add tests for Subscription routes
  describe('Subscription API (/api/sources/user/... & /api/sources/:id/subscribe)', () => {
    let sourceToSubscribeId;

    // This now runs AFTER the main beforeAll, so seeds should be present
    beforeAll(async () => {
      const source = await Source.findOne({ where: { name: 'NPR' } }); // Use a seeded source
       if (!source) {
         const allSources = await Source.findAll();
         console.log('Available sources after seeding:', allSources.map(s => s.name));
         throw new Error("Test source 'NPR' not found. Ensure source-seeds.js includes 'NPR' and ran correctly.");
       }
      sourceToSubscribeId = source.id;
    });
    
    // Cleanup subscriptions after tests in this block
    afterAll(async () => {
        if (regularUserId && sourceToSubscribeId) {
            await UserSource.destroy({ where: { user_id: regularUserId, source_id: sourceToSubscribeId } });
        }
    });

    it('POST /:id/subscribe should allow user to subscribe', async () => {
      const res = await request(server)
        .post(`/api/sources/${sourceToSubscribeId}/subscribe`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('id', sourceToSubscribeId);
      expect(res.body).toHaveProperty('displayOrder');
    });

    it('POST /:id/subscribe should return 400 if already subscribed', async () => {
      // Subscribe first time
      await request(server)
        .post(`/api/sources/${sourceToSubscribeId}/subscribe`)
        .set('Authorization', `Bearer ${userToken}`);
      
      // Attempt to subscribe again
      const res = await request(server)
        .post(`/api/sources/${sourceToSubscribeId}/subscribe`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message', 'Already subscribed to this source');
    });

    it('GET /user/subscriptions should return user\'s subscribed sources', async () => {
      // Subscribe to a source first
      await request(server)
        .post(`/api/sources/${sourceToSubscribeId}/subscribe`)
        .set('Authorization', `Bearer ${userToken}`);

      const res = await request(server)
        .get('/api/sources/user/subscriptions')
        .set('Authorization', `Bearer ${userToken}`);
        
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].id).toBe(sourceToSubscribeId);
      expect(res.body[0].name).toBe('NPR');
    });

    it('GET /user/subscriptions should return empty array if no subscriptions', async () => {
      // Create a NEW user who has no subscriptions
      const newUser = { username: 'nosubuser_again', email: 'nosub_again@test.com', password: 'password123' }; // Ensure unique details
      const { token: newUserToken } = await createUserAndLogin(newUser);

      const res = await request(server).get('/api/sources/user/subscriptions').set('Authorization', `Bearer ${newUserToken}`);
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0); // This user should have 0 subs
    });

    it('DELETE /:id/subscribe should allow user to unsubscribe', async () => {
      // Subscribe first
      await request(server)
        .post(`/api/sources/${sourceToSubscribeId}/subscribe`)
        .set('Authorization', `Bearer ${userToken}`);

      // Unsubscribe
      const res = await request(server)
        .delete(`/api/sources/${sourceToSubscribeId}/subscribe`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toEqual(204);

      // Verify subscription is gone
      const getRes = await request(server)
        .get('/api/sources/user/subscriptions')
        .set('Authorization', `Bearer ${userToken}`);
      expect(getRes.body.length).toBe(0);
    });

    it('PUT /user/order should update display order', async () => {
      // Subscribe to a couple of sources first
      const source1 = await Source.findOne({ where: { name: 'BBC News' } });
      const source2 = await Source.findOne({ where: { name: 'CNBC News' } }); // Changed from Reuters
      if (!source1 || !source2) throw new Error('Required seeded sources (BBC, CNBC) not found for order test.');

      await request(server).post(`/api/sources/${source1.id}/subscribe`).set('Authorization', `Bearer ${userToken}`);
      await request(server).post(`/api/sources/${source2.id}/subscribe`).set('Authorization', `Bearer ${userToken}`);

      const newOrder = [
        { sourceId: source2.id, displayOrder: 0 },
        { sourceId: source1.id, displayOrder: 1 },
      ];

      const res = await request(server)
        .put('/api/sources/user/order')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ sourceOrders: newOrder }); // Ensure key is 'sourceOrders'

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('Source order updated successfully');

      // Verify order
      const subsRes = await request(server).get('/api/sources/user/subscriptions').set('Authorization', `Bearer ${userToken}`);
      expect(subsRes.body[0].id).toBe(source2.id); // Check against 'id', not 'source_id'
      expect(subsRes.body[1].id).toBe(source1.id); // Check against 'id', not 'source_id'

      // Cleanup
      await UserSource.destroy({ where: { user_id: regularUserId } });
    });
  });
}); 