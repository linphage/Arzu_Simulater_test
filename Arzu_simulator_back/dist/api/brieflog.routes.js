"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const brieflog_controller_1 = require("../controllers/brieflog.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rate_limit_middleware_1 = require("../middleware/rate-limit.middleware");
const router = (0, express_1.Router)();
const briefLogController = new brieflog_controller_1.BriefLogController();
router.post('/', auth_middleware_1.authenticateToken, (0, rate_limit_middleware_1.rateLimiter)('create-brieflog', 50, 60 * 1000), briefLogController.createBriefLog);
router.get('/task/:taskId', auth_middleware_1.authenticateToken, (0, rate_limit_middleware_1.rateLimiter)('get-brieflogs', 100, 60 * 1000), briefLogController.getBriefLogsByTaskId);
router.get('/user', auth_middleware_1.authenticateToken, (0, rate_limit_middleware_1.rateLimiter)('get-user-brieflogs', 100, 60 * 1000), briefLogController.getBriefLogsByUserId);
exports.default = router;
//# sourceMappingURL=brieflog.routes.js.map