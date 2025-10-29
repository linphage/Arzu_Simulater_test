"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startScheduledTasks = startScheduledTasks;
const node_cron_1 = __importDefault(require("node-cron"));
const connection_1 = require("../database/connection");
const logger_1 = require("../config/logger");
function startScheduledTasks() {
    node_cron_1.default.schedule('0 0 1 * *', () => __awaiter(this, void 0, void 0, function* () {
        try {
            logger_1.logger.info('开始执行每月重置补打卡次数任务');
            yield (0, connection_1.runQuery)('UPDATE users SET reward_count = 0', []);
            logger_1.logger.info('每月补打卡次数重置成功');
        }
        catch (error) {
            logger_1.logger.error('每月补打卡次数重置失败', { error: error.message });
        }
    }), {
        timezone: 'Asia/Shanghai'
    });
    logger_1.logger.info('定时任务已启动：每月1日凌晨0:00（东八区）重置补打卡次数');
}
//# sourceMappingURL=scheduler.js.map