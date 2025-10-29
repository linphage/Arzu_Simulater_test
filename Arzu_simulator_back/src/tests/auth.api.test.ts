import request from 'supertest';
import server from '../server';
import db from '../config/database';

describe('Auth API Integration Tests', () => {
  let testUser: { username: string; email: string; password: string };

  beforeAll((done) => {
    // 确保数据库连接并创建表
    db.serialize(() => {
      done();
    });
  });

  afterAll((done) => {
    server.close(() => {
      db.close();
      done();
    });
  });

  beforeEach(() => {
    testUser = {
      username: 'testuser_' + Date.now(),
      email: 'test_' + Date.now() + '@example.com',
      password: 'Test123!@#'
    };
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(server)
        .post('/api/auth/register')
        .send({
          username: testUser.username,
          email: testUser.email,
          password: testUser.password
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('message', '用户注册成功');
      expect(res.body.data).toHaveProperty('userId');
    });

    it('should fail with invalid username format', async () => {
      const res = await request(server)
        .post('/api/auth/register')
        .send({
          username: 'ab', // too short
          email: testUser.email,
          password: testUser.password
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('message');
    });

    it('should fail with invalid email format', async () => {
      const res = await request(server)
        .post('/api/auth/register')
        .send({
          username: testUser.username,
          email: 'invalid-email',
          password: testUser.password
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('success', false);
    });

    it('should fail with weak password', async () => {
      const res = await request(server)
        .post('/api/auth/register')
        .send({
          username: testUser.username,
          email: testUser.email,
          password: 'weak' // too simple
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('success', false);
    });

    it('should fail with duplicate username', async () => {
      // First registration
      await request(server)
        .post('/api/auth/register')
        .send({
          username: testUser.username,
          email: testUser.email,
          password: testUser.password
        });

      // Second registration with same username
      const res = await request(server)
        .post('/api/auth/register')
        .send({
          username: testUser.username,
          email: 'another_' + testUser.email,
          password: testUser.password
        });

      expect(res.statusCode).toEqual(409);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.message).toContain('用户名已存在');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // 注册一个测试用户
      await request(server)
        .post('/api/auth/register')
        .send({
          username: testUser.username,
          email: testUser.email,
          password: testUser.password
        });
    });

    it('should login successfully with valid credentials', async () => {
      const res = await request(server)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('message', '登录成功');
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.data).toHaveProperty('user');
    });

    it('should fail with invalid username', async () => {
      const res = await request(server)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: testUser.password
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.message).toContain('用户名或密码错误');
    });

    it('should fail with invalid password', async () => {
      const res = await request(server)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: 'WrongPassword123!'
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.message).toContain('用户名或密码错误');
    });

    it('should fail with empty credentials', async () => {
      const res = await request(server)
        .post('/api/auth/login')
        .send({
          username: '',
          password: ''
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      // 注册用户并获取刷新令牌
      const registerRes = await request(server)
        .post('/api/auth/register')
        .send({
          username: testUser.username,
          email: testUser.email,
          password: testUser.password
        });

      const loginRes = await request(server)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password
        });

      refreshToken = loginRes.body.data.refreshToken;
    });

    it('should refresh access token successfully', async () => {
      const res = await request(server)
        .post('/api/auth/refresh')
        .send({
          refreshToken: refreshToken
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
    });

    it('should fail with invalid refresh token', async () => {
      const res = await request(server)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid_refresh_token'
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/auth/logout', () => {
    let accessToken: string;

    beforeEach(async () => {
      // 注册用户并获取访问令牌
      await request(server)
        .post('/api/auth/register')
        .send({
          username: testUser.username,
          email: testUser.email,
          password: testUser.password
        });

      const loginRes = await request(server)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password
        });

      accessToken = loginRes.body.data.accessToken;
    });

    it('should logout successfully', async () => {
      const res = await request(server)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('message', '用户登出成功');
    });

    it('should fail without authentication', async () => {
      const res = await request(server)
        .post('/api/auth/logout')
        .send({});

      expect(res.statusCode).toEqual(401);
    });
  });
});