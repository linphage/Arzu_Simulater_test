"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sortValidation = exports.paginationValidation = exports.validateParam = exports.validateRequest = exports.updateTaskValidation = exports.createTaskValidation = exports.emailLoginValidation = exports.loginValidation = exports.registerValidation = exports.mailValidation = exports.usernamValidation = exports.passwordValidation = exports.emailValidation = exports.usernameValidation = void 0;
const express_validator_1 = require("express-validator");
const error_utils_1 = require("./error.utils");
exports.usernameValidation = (0, express_validator_1.body)('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('用户名长度必须在3-50个字符之间')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名只能包含字母、数字和下划线')
    .escape();
exports.emailValidation = (0, express_validator_1.body)('email')
    .trim()
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail()
    .escape();
exports.passwordValidation = (0, express_validator_1.body)('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('密码长度必须在8-128个字符之间')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/)
    .withMessage('密码必须包含大小写字母、数字和特殊字符');
exports.usernamValidation = (0, express_validator_1.body)('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('用户名长度必须在3-50个字符之间')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名只能包含字母、数字和下划线')
    .escape();
exports.mailValidation = (0, express_validator_1.body)('mail')
    .trim()
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail()
    .escape();
exports.registerValidation = [
    exports.usernamValidation,
    exports.mailValidation,
    exports.passwordValidation
];
exports.loginValidation = [
    (0, express_validator_1.body)('username')
        .trim()
        .notEmpty()
        .withMessage('用户名不能为空')
        .escape(),
    (0, express_validator_1.body)('password')
        .notEmpty()
        .withMessage('密码不能为空')
];
exports.emailLoginValidation = [
    (0, express_validator_1.body)('mail')
        .trim()
        .isEmail()
        .withMessage('请输入有效的邮箱地址')
        .normalizeEmail()
        .escape(),
    (0, express_validator_1.body)('password')
        .notEmpty()
        .withMessage('密码不能为空')
];
exports.createTaskValidation = [
    (0, express_validator_1.body)('title')
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
    (0, express_validator_1.body)('category')
        .optional()
        .isIn(['勤政', '恕己', '爱人'])
        .withMessage('无效的任务分类'),
    (0, express_validator_1.body)('priority')
        .optional()
        .isIn(['金', '银', '铜', '石'])
        .withMessage('无效的任务优先级'),
    (0, express_validator_1.body)('dueDate')
        .optional()
        .isISO8601()
        .withMessage('无效的日期格式')
        .custom((value) => {
        if (new Date(value) < new Date()) {
            throw new Error('任务截止日期不能早于当前时间');
        }
        return true;
    })
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
    (0, express_validator_1.body)('category')
        .optional()
        .isIn(['勤政', '恕己', '爱人'])
        .withMessage('无效的任务分类'),
    (0, express_validator_1.body)('priority')
        .optional()
        .isIn(['金', '银', '铜', '石'])
        .withMessage('无效的任务优先级'),
    (0, express_validator_1.body)('completed')
        .optional()
        .isBoolean()
        .withMessage('完成状态必须是布尔值')
];
const validateRequest = (req, res, next) => {
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
exports.validateRequest = validateRequest;
const validateParam = (paramName) => {
    return [
        (req, res, next) => {
            const value = req.params[paramName];
            if (!value || isNaN(Number(value)) || Number(value) <= 0) {
                throw new error_utils_1.ValidationError(`无效的${paramName}参数`);
            }
            next();
        }
    ];
};
exports.validateParam = validateParam;
exports.paginationValidation = [
    (req, res, next) => {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        if (page < 1) {
            throw new error_utils_1.ValidationError('页码必须大于0');
        }
        if (limit < 1 || limit > 100) {
            throw new error_utils_1.ValidationError('每页数量必须在1-100之间');
        }
        req.pagination = { page, limit };
        next();
    }
];
const sortValidation = (allowedFields) => {
    return [
        (req, res, next) => {
            const sortBy = req.query.sortBy;
            const sortOrder = req.query.sortOrder;
            if (sortBy && !allowedFields.includes(sortBy)) {
                throw new error_utils_1.ValidationError(`无效的排序字段: ${sortBy}`);
            }
            if (sortOrder && !['asc', 'desc'].includes(sortOrder.toLowerCase())) {
                throw new error_utils_1.ValidationError('排序顺序必须是asc或desc');
            }
            req.sorting = {
                sortBy: sortBy || allowedFields[0],
                sortOrder: sortOrder || 'desc'
            };
            next();
        }
    ];
};
exports.sortValidation = sortValidation;
//# sourceMappingURL=validators.js.map