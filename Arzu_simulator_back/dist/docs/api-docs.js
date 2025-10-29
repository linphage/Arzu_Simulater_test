"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
const apiEndpoints = [
    {
        path: '/api/v1/auth/register',
        method: 'POST',
        description: '用户注册',
        tags: ['Authentication'],
        requestBody: {
            description: '用户注册信息',
            required: true,
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        required: ['username', 'email', 'password'],
                        properties: {
                            username: {
                                type: 'string',
                                minLength: 3,
                                maxLength: 50,
                                pattern: '^[a-zA-Z0-9_]+$',
                                description: '用户名（3-50个字符，只能包含字母、数字和下划线）'
                            },
                            email: {
                                type: 'string',
                                format: 'email',
                                maxLength: 255,
                                description: '邮箱地址'
                            },
                            password: {
                                type: 'string',
                                minLength: 8,
                                maxLength: 128,
                                pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#])[A-Za-z\\d@$!%*?&#]{8,}$',
                                description: '密码（至少8个字符，包含大小写字母、数字和特殊字符）'
                            }
                        }
                    },
                    example: {
                        username: 'testuser',
                        email: 'test@example.com',
                        password: 'Test123!@#'
                    }
                }
            }
        },
        responses: {
            '201': {
                description: '注册成功',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                success: { type: 'boolean' },
                                message: { type: 'string' },
                                data: {
                                    type: 'object',
                                    properties: {
                                        userId: { type: 'number' }
                                    }
                                }
                            }
                        },
                        example: {
                            success: true,
                            message: '用户注册成功',
                            data: { userId: 1 }
                        }
                    }
                }
            },
            '400': {
                description: '输入数据验证失败',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                success: { type: 'boolean' },
                                message: { type: 'string' },
                                errors: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            field: { type: 'string' },
                                            message: { type: 'string' },
                                            value: { type: 'string' }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '409': {
                description: '用户名或邮箱已存在'
            }
        },
        rateLimit: {
            windowMs: 15 * 60 * 1000,
            max: 10,
            message: '注册请求过于频繁，请稍后重试'
        }
    },
    {
        path: '/api/v1/auth/login',
        method: 'POST',
        description: '用户登录',
        tags: ['Authentication'],
        requestBody: {
            description: '用户登录凭据',
            required: true,
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        required: ['username', 'password'],
                        properties: {
                            username: {
                                type: 'string',
                                description: '用户名'
                            },
                            password: {
                                type: 'string',
                                description: '密码'
                            }
                        }
                    },
                    example: {
                        username: 'testuser',
                        password: 'Test123!@#'
                    }
                }
            }
        },
        responses: {
            '200': {
                description: '登录成功',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                success: { type: 'boolean' },
                                message: { type: 'string' },
                                data: {
                                    type: 'object',
                                    properties: {
                                        accessToken: { type: 'string' },
                                        refreshToken: { type: 'string' },
                                        user: {
                                            type: 'object',
                                            properties: {
                                                id: { type: 'number' },
                                                username: { type: 'string' },
                                                email: { type: 'string' }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '401': {
                description: '用户名或密码错误'
            }
        },
        rateLimit: {
            windowMs: 15 * 60 * 1000,
            max: 30,
            message: '登录请求过于频繁，请稍后重试'
        }
    }
];
function generateOpenAPISpec() {
    return {
        openapi: '3.0.0',
        info: {
            title: 'Arzu Simulator API',
            version: '1.0.0',
            description: '任务管理和番茄钟应用API',
            contact: {
                name: 'API Support',
                email: 'support@arzu.com'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: 'http://localhost:3001/api',
                description: '开发服务器'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        message: { type: 'string' },
                        timestamp: { type: 'string', format: 'date-time' },
                        errors: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    field: { type: 'string' },
                                    message: { type: 'string' }
                                }
                            }
                        }
                    }
                }
            }
        },
        paths: apiEndpoints.reduce((paths, endpoint) => {
            if (!paths[endpoint.path]) {
                paths[endpoint.path] = {};
            }
            paths[endpoint.path][endpoint.method.toLowerCase()] = {
                tags: endpoint.tags,
                summary: endpoint.description,
                description: endpoint.description,
                parameters: endpoint.parameters,
                requestBody: endpoint.requestBody,
                responses: endpoint.responses,
                security: endpoint.authentication ? [{ bearerAuth: [] }] : undefined
            };
            return paths;
        }, {})
    };
}
router.get('/openapi.json', (req, res) => {
    const spec = generateOpenAPISpec();
    res.json(spec);
});
router.get('/swagger', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Arzu Simulator API - Swagger UI</title>
        <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css" />
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js"></script>
        <script>
          window.onload = function() {
            SwaggerUIBundle({
              url: "/api/docs/openapi.json",
              dom_id: '#swagger-ui',
              presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIBundle.presets.standalone
              ]
            });
          }
        </script>
      </body>
    </html>
  `);
});
router.get('/endpoints', (req, res) => {
    const groupedEndpoints = apiEndpoints.reduce((groups, endpoint) => {
        endpoint.tags.forEach(tag => {
            if (!groups[tag]) {
                groups[tag] = [];
            }
            groups[tag].push(endpoint);
        });
        return groups;
    }, {});
    res.json({
        success: true,
        message: 'API端点列表',
        data: {
            endpoints: groupedEndpoints,
            total: apiEndpoints.length
        }
    });
});
router.get('/examples/:language', (req, res) => {
    const { language } = req.params;
    const examples = {};
    switch (language) {
        case 'javascript':
        case 'typescript':
            examples.auth = `
// 用户注册
const register = async () => {
  try {
    const response = await fetch('http://localhost:3001/api/v1/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test123!@#'
      })
    });

    const data = await response.json();
    console.log('注册成功:', data);
  } catch (error) {
    console.error('注册失败:', error);
  }
};

// 用户登录
const login = async () => {
  try {
    const response = await fetch('http://localhost:3001/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'testuser',
        password: 'Test123!@#'
      })
    });

    const data = await response.json();
    if (data.success) {
      // 保存令牌
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
    }
  } catch (error) {
    console.error('登录失败:', error);
  }
};
      `;
            examples.tasks = `
// 创建任务
const createTask = async () => {
  const token = localStorage.getItem('accessToken');
  
  try {
    const response = await fetch('http://localhost:3001/api/v1/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${token}\`
      },
      body: JSON.stringify({
        title: '完成项目文档',
        description: '编写项目的技术文档和用户手册',
        category: '勤政',
        priority: '金',
        dueDate: '2024-12-31T23:59:59.999Z'
      })
    });

    const data = await response.json();
    console.log('任务创建成功:', data);
  } catch (error) {
    console.error('任务创建失败:', error);
  }
};

// 获取任务列表
const getTasks = async (page = 1, limit = 10) => {
  const token = localStorage.getItem('accessToken');
  
  try {
    const response = await fetch(\`http://localhost:3001/api/v1/tasks?page=\${page}&limit=\${limit}\`, {
      method: 'GET',
      headers: {
        'Authorization': \`Bearer \${token}\`
      }
    });

    const data = await response.json();
    console.log('任务列表:', data.data.tasks);
  } catch (error) {
    console.error('获取任务列表失败:', error);
  }
};
      `;
            break;
        case 'python':
            examples.auth = `
import requests
import json

def register_user():
    url = "http://localhost:3001/api/v1/auth/register"
    data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "Test123!@#"
    }
    
    response = requests.post(url, json=data)
    
    if response.status_code == 201:
        result = response.json()
        print("注册成功:", result)
    else:
        print("注册失败:", response.text)

def login_user():
    url = "http://localhost:3001/api/v1/auth/login"
    data = {
        "username": "testuser",
        "password": "Test123!@#"
    }
    
    response = requests.post(url, json=data)
    
    if response.status_code == 200:
        result = response.json()
        print("登录成功:", result)
        
        # 保存令牌
        access_token = result['data']['accessToken']
        refresh_token = result['data']['refreshToken']
        
        return access_token, refresh_token
    else:
        print("登录失败:", response.text)
        return None, None
      `;
            break;
        case 'curl':
            examples.auth = `
# 用户注册
curl -X POST http://localhost:3001/api/v1/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test123!@#"
  }'

# 用户登录
curl -X POST http://localhost:3001/api/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "username": "testuser",
    "password": "Test123!@#"
  }'
      `;
            examples.tasks = `
# 创建任务（需要认证）
curl -X POST http://localhost:3001/api/v1/tasks \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -d '{
    "title": "完成项目文档",
    "description": "编写项目的技术文档和用户手册",
    "category": "勤政",
    "priority": "金",
    "dueDate": "2024-12-31T23:59:59.999Z"
  }'

# 获取任务列表（需要认证）
curl -X GET "http://localhost:3001/api/v1/tasks?page=1&limit=10" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
      `;
            break;
        default:
            return res.status(404).json({
                success: false,
                message: '不支持的语言'
            });
    }
    res.json({
        success: true,
        message: `API使用示例 - ${language.toUpperCase()}`,
        data: {
            language,
            examples
        }
    });
});
router.post('/test', (req, res) => {
    const { endpoint, method, headers, body } = req.body;
    if (!endpoint || !method) {
        return res.status(400).json({
            success: false,
            message: '缺少必要的参数：endpoint 和 method'
        });
    }
    res.json({
        success: true,
        message: 'API测试功能开发中',
        data: {
            request: { endpoint, method, headers, body },
            note: '此功能需要额外的安全措施，正在开发中'
        }
    });
});
exports.default = router;
//# sourceMappingURL=api-docs.js.map