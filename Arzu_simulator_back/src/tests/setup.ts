import dotenv from 'dotenv';

// 设置测试环境
dotenv.config({ path: '.env.test' });

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_12345';
process.env.JWT_REFRESH_SECRET = 'test_jwt_refresh_secret_key_67890';
process.env.PORT = '3002';

// 全局测试超时
global.TEST_TIMEOUT = 30000;