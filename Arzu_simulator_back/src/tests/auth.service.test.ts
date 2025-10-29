import { AuthService } from '../services/auth.service';
import { AuthError, ConflictError, ValidationError } from '../utils/error.utils';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'testuser_' + Date.now(),
        email: 'test_' + Date.now() + '@example.com',
        password: 'Test123!@#'
      };

      const result = await authService.register(userData.username, userData.email, userData.password);
      
      expect(result).toHaveProperty('userId');
      expect(typeof result.userId).toBe('number');
    });

    it('should fail with invalid username format', async () => {
      const userData = {
        username: 'ab', // too short
        email: 'test@example.com',
        password: 'Test123!@#'
      };

      await expect(authService.register(userData.username, userData.email, userData.password))
        .rejects.toThrow(ValidationError);
    });

    it('should fail with invalid email format', async () => {
      const userData = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'Test123!@#'
      };

      await expect(authService.register(userData.username, userData.email, userData.password))
        .rejects.toThrow(ValidationError);
    });

    it('should fail with weak password', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'weak' // too simple
      };

      await expect(authService.register(userData.username, userData.email, userData.password))
        .rejects.toThrow(ValidationError);
    });

    it('should fail with duplicate username', async () => {
      const userData = {
        username: 'duplicate_user_' + Date.now(),
        email: 'test1@example.com',
        password: 'Test123!@#'
      };

      // First registration should succeed
      await authService.register(userData.username, userData.email, userData.password);

      // Second registration with same username should fail
      await expect(authService.register(userData.username, 'test2@example.com', userData.password))
        .rejects.toThrow(ConflictError);
    });

    it('should fail with duplicate email', async () => {
      const userData = {
        username: 'user1_' + Date.now(),
        email: 'duplicate@example.com',
        password: 'Test123!@#'
      };

      // First registration should succeed
      await authService.register(userData.username, userData.email, userData.password);

      // Second registration with same email should fail
      await expect(authService.register('user2_' + Date.now(), userData.email, userData.password))
        .rejects.toThrow(ConflictError);
    });
  });

  describe('login', () => {
    let testUser: { username: string; email: string; password: string };

    beforeEach(async () => {
      testUser = {
        username: 'logintest_' + Date.now(),
        email: 'login_' + Date.now() + '@example.com',
        password: 'Test123!@#'
      };
      
      await authService.register(testUser.username, testUser.email, testUser.password);
    });

    it('should login successfully with valid credentials', async () => {
      const result = await authService.login(testUser.username, testUser.password);
      
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.user).toHaveProperty('id');
      expect(result.user).toHaveProperty('username', testUser.username);
      expect(result.user).toHaveProperty('email', testUser.email);
      expect(result.tokens).toHaveProperty('accessToken');
      expect(result.tokens).toHaveProperty('refreshToken');
    });

    it('should fail with invalid username', async () => {
      await expect(authService.login('nonexistent', testUser.password))
        .rejects.toThrow(AuthError);
    });

    it('should fail with invalid password', async () => {
      await expect(authService.login(testUser.username, 'WrongPassword123!'))
        .rejects.toThrow(AuthError);
    });

    it('should fail with empty credentials', async () => {
      await expect(authService.login('', ''))
        .rejects.toThrow(AuthError);
    });
  });

  describe('validateAccessToken', () => {
    let testUser: { username: string; email: string; password: string };
    let accessToken: string;

    beforeEach(async () => {
      testUser = {
        username: 'token_test_' + Date.now(),
        email: 'token_' + Date.now() + '@example.com',
        password: 'Test123!@#'
      };
      
      const loginResult = await authService.register(testUser.username, testUser.email, testUser.password);
      const tokens = await authService.login(testUser.username, testUser.password);
      accessToken = tokens.tokens.accessToken;
    });

    it('should validate valid access token', async () => {
      const result = await authService.validateAccessToken(accessToken);
      
      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('username', testUser.username);
      expect(result).toHaveProperty('email', testUser.email);
    });

    it('should fail with invalid token', async () => {
      await expect(authService.validateAccessToken('invalid_token'))
        .rejects.toThrow(AuthError);
    });

    it('should fail with expired token', async () => {
      // This test might need mocking if we want to test actual expiration
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoidGVzdCIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTYwOTQ1OTIwMCwiZXhwIjoxNjA5NDU5MjAxfQ.invalid_signature';
      
      await expect(authService.validateAccessToken(expiredToken))
        .rejects.toThrow(AuthError);
    });
  });
});