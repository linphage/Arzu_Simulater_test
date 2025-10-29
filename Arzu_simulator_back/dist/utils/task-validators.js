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
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTaskOwnership = exports.validateTaskExists = exports.taskQueryValidation = exports.validateTaskRequest = exports.createPomodoroSessionValidation = exports.taskStatsValidation = exports.updateTaskValidation = exports.deleteTaskValidation = exports.createTaskValidation = exports.batchTaskValidation = exports.taskSortValidation = exports.taskFilterValidation = exports.paginationValidation = exports.taskIdParamValidation = exports.taskPomodoroCountValidation = exports.taskCompletedValidation = exports.taskDueDateUpdateValidation = exports.taskDueDateValidation = exports.taskDescriptionValidation = exports.taskTitleValidation = exports.taskPriorityValidation = exports.taskCategoryValidation = void 0;
const express_validator_1 = require("express-validator");
const error_utils_1 = require("./error.utils");
exports.taskCategoryValidation = (0, express_validator_1.body)('category')
    .optional()
    .isIn(['勤政', '恕己', '爱人'])
    .withMessage('无效的任务分类，必须是：勤政、恕己、爱人');
exports.taskPriorityValidation = (0, express_validator_1.body)('priority')
    .optional()
    .isIn(['金', '银', '铜', '石'])
    .withMessage('无效的任务优先级，必须是：金、银、铜、石');
exports.taskTitleValidation = (0, express_validator_1.body)('title')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('任务标题长度必须在1-255个字符之间')
    .escape();
exports.taskDescriptionValidation = (0, express_validator_1.body)('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('任务描述不能超过1000个字符')
    .escape();
exports.taskDueDateValidation = (0, express_validator_1.body)('dueDate')
    .optional()
    .isISO8601()
    .withMessage('无效的日期格式，必须是ISO 8601格式');
exports.taskDueDateUpdateValidation = (0, express_validator_1.body)('dueDate')
    .optional()
    .isISO8601()
    .withMessage('无效的日期格式，必须是ISO 8601格式');
exports.taskCompletedValidation = (0, express_validator_1.body)('completed')
    .optional()
    .isBoolean()
    .withMessage('完成状态必须是布尔值');
exports.taskPomodoroCountValidation = (0, express_validator_1.body)('pomodoroCount')
    .optional()
    .isInt({ min: 0, max: 999 })
    .withMessage('番茄钟计数必须是0-999之间的整数');
exports.taskIdParamValidation = (0, express_validator_1.param)('id')
    .isInt({ min: 1 })
    .withMessage('任务ID必须是大于0的整数');
exports.paginationValidation = [
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('页码必须是大于0的整数'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('每页数量必须在1-100之间')
];
exports.taskFilterValidation = [
    (0, express_validator_1.query)('category')
        .optional()
        .isIn(['勤政', '恕己', '爱人'])
        .withMessage('无效的任务分类'),
    (0, express_validator_1.query)('priority')
        .optional()
        .isIn(['金', '银', '铜', '石'])
        .withMessage('无效的任务优先级'),
    (0, express_validator_1.query)('completed')
        .optional()
        .isBoolean()
        .withMessage('完成状态必须是布尔值'),
    (0, express_validator_1.query)('search')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('搜索关键词长度必须在1-100个字符之间')
        .escape(),
    (0, express_validator_1.query)('dueDateFrom')
        .optional()
        .isISO8601()
        .withMessage('开始日期必须是有效的ISO 8601格式'),
    (0, express_validator_1.query)('dueDateTo')
        .optional()
        .isISO8601()
        .withMessage('结束日期必须是有效的ISO 8601格式')
        .custom((value, { req }) => {
        if (req.query.dueDateFrom && new Date(value) < new Date(req.query.dueDateFrom)) {
            throw new Error('结束日期不能早于开始日期');
        }
        return true;
    })
];
exports.taskSortValidation = [
    (0, express_validator_1.query)('sortBy')
        .optional()
        .isIn(['createdAt', 'updatedAt', 'dueDate', 'priority', 'category', 'title', 'pomodoroCount'])
        .withMessage('无效的排序字段'),
    (0, express_validator_1.query)('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('排序顺序必须是asc或desc')
];
exports.batchTaskValidation = [
    (0, express_validator_1.body)('operation')
        .isIn(['complete', 'delete', 'update_category', 'update_priority', 'update_due_date', 'archive'])
        .withMessage('无效的批量操作类型'),
    (0, express_validator_1.body)('taskIds')
        .isArray({ min: 1 })
        .withMessage('任务ID数组不能为空')
        .custom((value) => {
        if (!value.every(id => Number.isInteger(id) && id > 0)) {
            throw new Error('所有任务ID必须是大于0的整数');
        }
        return true;
    }),
    (0, express_validator_1.body)('data')
        .optional()
        .isObject()
        .withMessage('操作数据必须是对象')
];
exports.createTaskValidation = [
    exports.taskTitleValidation,
    exports.taskDescriptionValidation,
    exports.taskCategoryValidation,
    exports.taskPriorityValidation,
    exports.taskDueDateValidation
];
exports.deleteTaskValidation = [
    (0, express_validator_1.body)('deleteReason')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('删除原因不能超过500个字符')
];
exports.updateTaskValidation = [
    (0, express_validator_1.body)('title')
        .optional()
        .trim()
        .isLength({ min: 1, max: 255 })
        .withMessage('任务标题长度必须在1-255个字符之间')
        .escape(),
    (0, express_validator_1.body)('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('任务描述不能超过1000个字符')
        .escape(),
    (0, express_validator_1.body)('changeReason')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('修改原因不能超过500个字符'),
    exports.taskCategoryValidation,
    exports.taskPriorityValidation,
    exports.taskDueDateUpdateValidation,
    exports.taskCompletedValidation,
    exports.taskPomodoroCountValidation
];
exports.taskStatsValidation = [
    (0, express_validator_1.query)('dateFrom')
        .optional()
        .isISO8601()
        .withMessage('开始日期必须是有效的ISO 8601格式'),
    (0, express_validator_1.query)('dateTo')
        .optional()
        .isISO8601()
        .withMessage('结束日期必须是有效的ISO 8601格式')
        .custom((value, { req }) => {
        if (req.query.dateFrom && new Date(value) < new Date(req.query.dateFrom)) {
            throw new Error('结束日期不能早于开始日期');
        }
        return true;
    }),
    (0, express_validator_1.query)('category')
        .optional()
        .isIn(['勤政', '恕己', '爱人'])
        .withMessage('无效的任务分类'),
    (0, express_validator_1.query)('priority')
        .optional()
        .isIn(['金', '银', '铜', '石'])
        .withMessage('无效的任务优先级')
];
exports.createPomodoroSessionValidation = [
    (0, express_validator_1.body)('taskId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('任务ID必须是大于0的整数'),
    (0, express_validator_1.body)('durationMinutes')
        .optional()
        .isInt({ min: 1, max: 120 })
        .withMessage('番茄钟时长必须在1-120分钟之间')
];
const validateTaskRequest = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const errorDetails = errors.array().map(error => ({
            field: error.type === 'field' ? error.path : error.type,
            message: error.msg,
            value: error.value
        }));
        throw new error_utils_1.ValidationError('输入验证失败', errorDetails);
    }
    next();
};
exports.validateTaskRequest = validateTaskRequest;
exports.taskQueryValidation = [
    ...exports.paginationValidation,
    ...exports.taskFilterValidation,
    ...exports.taskSortValidation,
    exports.validateTaskRequest
];
const validateTaskExists = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const taskId = parseInt(req.params.id);
        next();
    }
    catch (error) {
        next(error);
    }
});
exports.validateTaskExists = validateTaskExists;
const validateTaskOwnership = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const taskId = parseInt(req.params.id);
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            throw new error_utils_1.ApiError('用户未认证', 401);
        }
        next();
    }
    catch (error) {
        next(error);
    }
});
exports.validateTaskOwnership = validateTaskOwnership;
//# sourceMappingURL=task-validators.js.map