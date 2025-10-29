"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const task_routes_1 = __importDefault(require("./task.routes"));
const brieflog_routes_1 = __importDefault(require("./brieflog.routes"));
const logger_1 = require("../config/logger");
const router = (0, express_1.Router)();
router.use('/v1/auth', auth_routes_1.default);
router.use('/v1/tasks', task_routes_1.default);
router.use('/v1/brieflogs', brieflog_routes_1.default);
router.use('/auth', auth_routes_1.default);
router.use('/tasks', task_routes_1.default);
router.use('/brieflogs', brieflog_routes_1.default);
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'API服务运行正常',
        data: {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            environment: process.env.NODE_ENV || 'development'
        }
    });
});
router.get('/docs', (req, res) => {
    res.json({
        success: true,
        message: 'API文档',
        data: {
            title: 'Arzu Simulator API',
            version: '1.0.0',
            description: '任务管理和番茄钟应用API',
            endpoints: {
                auth: {
                    register: 'POST /api/v1/auth/register',
                    login: 'POST /api/v1/auth/login',
                    refresh: 'POST /api/v1/auth/refresh',
                    logout: 'POST /api/v1/auth/logout'
                },
                tasks: {
                    create: 'POST /api/v1/tasks',
                    list: 'GET /api/v1/tasks',
                    getById: 'GET /api/v1/tasks/:id',
                    update: 'PATCH /api/v1/tasks/:id',
                    delete: 'DELETE /api/v1/tasks/:id',
                    stats: 'GET /api/v1/tasks/stats',
                    analytics: 'GET /api/v1/tasks/analytics',
                    search: 'GET /api/v1/tasks/search',
                    upcoming: 'GET /api/v1/tasks/upcoming',
                    overdue: 'GET /api/v1/tasks/overdue',
                    archive: 'POST /api/v1/tasks/archive',
                    batch: 'POST /api/v1/tasks/batch'
                },
                pomodoro: {
                    create: 'POST /api/v1/tasks/pomodoro',
                    complete: 'PATCH /api/v1/tasks/pomodoro/:sessionId/complete',
                    sessions: 'GET /api/v1/tasks/pomodoro',
                    active: 'GET /api/v1/tasks/pomodoro/active',
                    stats: 'GET /api/v1/tasks/pomodoro/stats'
                },
                users: {
                    profile: 'GET /api/v1/users/profile',
                    update: 'PATCH /api/v1/users/profile',
                    password: 'PATCH /api/v1/users/password'
                },
                analytics: {
                    overview: 'GET /api/v1/analytics/overview',
                    trends: 'GET /api/v1/analytics/trends',
                    insights: 'GET /api/v1/analytics/insights'
                }
            },
            documentation: {
                postman: '/api/docs/postman',
                swagger: '/api/docs/swagger',
                examples: '/api/docs/examples'
            }
        }
    });
});
router.get('/docs/postman', (req, res) => {
    const postmanCollection = {
        info: {
            name: "Arzu Simulator API",
            version: "1.0.0",
            description: "任务管理和番茄钟应用API集合",
            schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
        },
        item: [
            {
                name: "认证",
                item: [
                    {
                        name: "用户注册",
                        request: {
                            method: "POST",
                            header: [{ key: "Content-Type", value: "application/json" }],
                            body: {
                                mode: "raw",
                                raw: JSON.stringify({
                                    username: "testuser",
                                    email: "test@example.com",
                                    password: "Test123!@#"
                                }, null, 2)
                            },
                            url: { raw: "{{baseUrl}}/api/v1/auth/register", host: ["{{baseUrl}}"], path: ["api", "v1", "auth", "register"] }
                        }
                    },
                    {
                        name: "用户登录",
                        request: {
                            method: "POST",
                            header: [{ key: "Content-Type", value: "application/json" }],
                            body: {
                                mode: "raw",
                                raw: JSON.stringify({
                                    username: "testuser",
                                    password: "Test123!@#"
                                }, null, 2)
                            },
                            url: { raw: "{{baseUrl}}/api/v1/auth/login", host: ["{{baseUrl}}"], path: ["api", "v1", "auth", "login"] }
                        }
                    }
                ]
            },
            {
                name: "任务管理",
                item: [
                    {
                        name: "创建任务",
                        request: {
                            method: "POST",
                            header: [
                                { key: "Content-Type", value: "application/json" },
                                { key: "Authorization", value: "Bearer {{accessToken}}" }
                            ],
                            body: {
                                mode: "raw",
                                raw: JSON.stringify({
                                    title: "完成项目文档",
                                    description: "编写项目的技术文档和用户手册",
                                    category: "勤政",
                                    priority: "金",
                                    dueDate: "2024-12-31T23:59:59.999Z"
                                }, null, 2)
                            },
                            url: { raw: "{{baseUrl}}/api/v1/tasks", host: ["{{baseUrl}}"], path: ["api", "v1", "tasks"] }
                        }
                    },
                    {
                        name: "获取任务列表",
                        request: {
                            method: "GET",
                            header: [{ key: "Authorization", value: "Bearer {{accessToken}}" }],
                            url: { raw: "{{baseUrl}}/api/v1/tasks?page=1&limit=10", host: ["{{baseUrl}}"], path: ["api", "v1", "tasks"] }
                        }
                    }
                ]
            }
        ]
    };
    res.json(postmanCollection);
});
router.get('/docs/examples', (req, res) => {
    const examples = {
        authentication: {
            register: {
                description: "用户注册",
                request: {
                    method: "POST",
                    url: "/api/v1/auth/register",
                    headers: { "Content-Type": "application/json" },
                    body: {
                        username: "testuser",
                        email: "test@example.com",
                        password: "Test123!@#"
                    }
                },
                response: {
                    success: true,
                    message: "用户注册成功",
                    data: { userId: 1 }
                }
            }
        },
        tasks: {
            create: {
                description: "创建任务",
                request: {
                    method: "POST",
                    url: "/api/v1/tasks",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer YOUR_ACCESS_TOKEN"
                    },
                    body: {
                        title: "完成项目文档",
                        description: "编写项目的技术文档和用户手册",
                        category: "勤政",
                        priority: "金",
                        dueDate: "2024-12-31T23:59:59.999Z"
                    }
                },
                response: {
                    success: true,
                    message: "任务创建成功",
                    data: {
                        id: 1,
                        user_id: 1,
                        title: "完成项目文档",
                        description: "编写项目的技术文档和用户手册",
                        category: "勤政",
                        priority: "金",
                        completed: 0,
                        pomodoro_count: 0,
                        due_date: "2024-12-31T23:59:59.999Z",
                        created_at: "2024-01-01 12:00:00",
                        updated_at: "2024-01-01 12:00:00"
                    }
                }
            }
        },
        errorHandling: {
            description: "错误响应格式",
            example: {
                success: false,
                message: "用户名已存在",
                timestamp: "2024-01-01T12:00:00.000Z",
                errors: [
                    {
                        field: "username",
                        message: "用户名已存在",
                        value: "testuser"
                    }
                ]
            }
        }
    };
    res.json({
        success: true,
        message: "API使用示例",
        data: examples
    });
});
router.use((req, res, next) => {
    logger_1.logger.info('API请求', {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    next();
});
exports.default = router;
//# sourceMappingURL=index.js.map