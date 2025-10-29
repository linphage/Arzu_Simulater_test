"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const validators_1 = require("../utils/validators");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rate_limit_middleware_1 = require("../middleware/rate-limit.middleware");
const router = (0, express_1.Router)();
const authController = new auth_controller_1.AuthController();
router.post('/register', (0, rate_limit_middleware_1.rateLimiter)('register', 5, 15 * 60 * 1000), validators_1.registerValidation, validators_1.validateRequest, authController.register);
router.post('/login', (0, rate_limit_middleware_1.rateLimiter)('login', 5, 15 * 60 * 1000), validators_1.loginValidation, validators_1.validateRequest, authController.login);
router.post('/login/email', (0, rate_limit_middleware_1.rateLimiter)('email-login', 5, 15 * 60 * 1000), validators_1.emailLoginValidation, validators_1.validateRequest, authController.loginByEmail);
router.post('/refresh', (0, rate_limit_middleware_1.rateLimiter)('refresh', 10, 60 * 1000), authController.refreshToken);
router.post('/logout', auth_middleware_1.authenticateToken, authController.logout);
router.get('/profile', auth_middleware_1.authenticateToken, authController.getProfile);
router.get('/stats', auth_middleware_1.authenticateToken, authController.getAuthStats);
router.delete('/cleanup-tokens', auth_middleware_1.authenticateToken, authController.cleanupTokens);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map