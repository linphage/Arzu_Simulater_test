"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: '.env.test' });
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_12345';
process.env.JWT_REFRESH_SECRET = 'test_jwt_refresh_secret_key_67890';
process.env.PORT = '3002';
global.TEST_TIMEOUT = 30000;
//# sourceMappingURL=setup.js.map