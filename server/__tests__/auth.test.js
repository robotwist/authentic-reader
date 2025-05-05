const request = require('supertest');
const app = require('../index'); // Adjust the path to your main Express app file
const { User } = require('../models');

// Use the exported server instance directly
const server = app;

describe('Authentication API', () => {

  // Clean up users before each test suite related to auth
  beforeAll(async () => {
    await User.destroy({ where: {}, truncate: true, cascade: true, force: true });
  });

  // Clean up users after each test
  afterEach(async () => {
    await User.destroy({ where: {}, truncate: true, cascade: true, force: true });
  });

  describe('POST /api/users/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(server)
        .post('/api/users/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('token');
      expect(res.body.username).toBe('testuser');
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await request(server)
        .post('/api/users/register')
        .send({ username: 'testuser' }); // Missing email and password
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message', 'All fields are required');
    });

    it('should return 400 if username or email is already in use', async () => {
      // First registration
      await request(server)
        .post('/api/users/register')
        .send({
          username: 'existinguser',
          email: 'existing@example.com',
          password: 'password123'
        });

      // Second registration attempt with same email
      const res = await request(server)
        .post('/api/users/register')
        .send({
          username: 'newuser',
          email: 'existing@example.com',
          password: 'password456'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message', 'Username or email already in use');
    });
  });

  describe('POST /api/users/login', () => {
    beforeEach(async () => {
      // Ensure clean state before each login test
      await User.destroy({ where: {}, truncate: true, cascade: true, force: true });
      // Create a user for login tests
      await request(server)
        .post('/api/users/register')
        .send({
          username: 'loginuser',
          email: 'login@example.com',
          password: 'password123'
        });
    });

    it('should login successfully with email and password', async () => {
      const res = await request(server)
        .post('/api/users/login')
        .send({
          email: 'login@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.email).toBe('login@example.com');
    });

    it('should login successfully with username and password', async () => {
      const res = await request(server)
        .post('/api/users/login')
        .send({
          username: 'loginuser',
          password: 'password123'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.username).toBe('loginuser');
    });

    it('should return 401 for invalid credentials (wrong password)', async () => {
      const res = await request(server)
        .post('/api/users/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message', 'Invalid credentials');
    });

    it('should return 401 for non-existent user', async () => {
      const res = await request(server)
        .post('/api/users/login')
        .send({
          email: 'nosuchuser@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message', 'Invalid credentials');
    });
  });
}); 