import { body, validationResult, ValidationChain } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { ApiError, ValidationError } from './error.utils';

// 用户名验证规则
export const usernameValidation = body('username')
  .trim()
  .isLength({ min: 3, max: 50 })
  .withMessage('用户名长度必须在3-50个字符之间')
  .matches(/^[a-zA-Z0-9_]+$/)
  .withMessage('用户名只能包含字母、数字和下划线')
  .escape();

// 邮箱验证规则
export const emailValidation = body('email')
  .trim()
  .isEmail()
  .withMessage('请输入有效的邮箱地址')
  .normalizeEmail()
  .escape();

// 密码验证规则
export const passwordValidation = body('password')
  .isLength({ min: 8, max: 128 })
  .withMessage('密码长度必须在8-128个字符之间')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/)
  .withMessage('密码必须包含大小写字母、数字和特殊字符');

// 用户名验证规则（loginplan.md规范）
export const usernamValidation = body('username')
  .trim()
  .isLength({ min: 3, max: 50 })
  .withMessage('用户名长度必须在3-50个字符之间')
  .matches(/^[a-zA-Z0-9_]+$/)
  .withMessage('用户名只能包含字母、数字和下划线')
  .escape();

// 邮箱验证规则（loginplan.md规范）
export const mailValidation = body('mail')
  .trim()
  .isEmail()
  .withMessage('请输入有效的邮箱地址')
  .normalizeEmail()
  .escape();

// 用户注册验证（loginplan.md规范）
export const registerValidation: ValidationChain[] = [
  usernamValidation,
  mailValidation,
  passwordValidation
];

// 用户登录验证
export const loginValidation: ValidationChain[] = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('用户名不能为空')
    .escape(),
  body('password')
    .notEmpty()
    .withMessage('密码不能为空')
];

// 邮箱登录验证 - 适配loginplan.md规范
export const emailLoginValidation: ValidationChain[] = [
  body('mail')
    .trim()
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail()
    .escape(),
  body('password')
    .notEmpty()
    .withMessage('密码不能为空')
];

// 任务创建验证
export const createTaskValidation: ValidationChain[] = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('任务标题长度必须在1-255个字符之间')
    .escape(),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('任务描述不能超过1000个字符')
    .escape(),
  
  body('category')
    .optional()
    .isIn(['勤政', '恕己', '爱人'])
    .withMessage('无效的任务分类'),
  
  body('priority')
    .optional()
    .isIn(['金', '银', '铜', '石'])
    .withMessage('无效的任务优先级'),
  
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('无效的日期格式')
    .custom((value: string) => {
      if (new Date(value) < new Date()) {
        throw new Error('任务截止日期不能早于当前时间');
      }
      return true;
    })
];

// 任务更新验证
export const updateTaskValidation: ValidationChain[] = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('任务标题长度必须在1-255个字符之间')
    .escape(),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('任务描述不能超过1000个字符')
    .escape(),
  
  body('category')
    .optional()
    .isIn(['勤政', '恕己', '爱人'])
    .withMessage('无效的任务分类'),
  
  body('priority')
    .optional()
    .isIn(['金', '银', '铜', '石'])
    .withMessage('无效的任务优先级'),
  
  body('completed')
    .optional()
    .isBoolean()
    .withMessage('完成状态必须是布尔值')
];

// 验证结果处理中间件
export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : error.type,
      message: error.msg,
      value: error.value
    }));
    
    throw new ValidationError('输入验证失败', errorDetails);
  }
  
  next();
};

// 通用参数验证
export const validateParam = (paramName: string) => {
  return [
    (req: Request, res: Response, next: NextFunction) => {
      const value = req.params[paramName];
      
      if (!value || isNaN(Number(value)) || Number(value) <= 0) {
        throw new ValidationError(`无效的${paramName}参数`);
      }
      
      next();
    }
  ];
};

// 分页验证
export const paginationValidation = [
  (req: Request, res: Response, next: NextFunction) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    if (page < 1) {
      throw new ValidationError('页码必须大于0');
    }
    
    if (limit < 1 || limit > 100) {
      throw new ValidationError('每页数量必须在1-100之间');
    }
    
    req.pagination = { page, limit };
    next();
  }
];

// 排序验证
export const sortValidation = (allowedFields: string[]) => {
  return [
    (req: Request, res: Response, next: NextFunction) => {
      const sortBy = req.query.sortBy as string;
      const sortOrder = req.query.sortOrder as string;
      
      if (sortBy && !allowedFields.includes(sortBy)) {
        throw new ValidationError(`无效的排序字段: ${sortBy}`);
      }
      
      if (sortOrder && !['asc', 'desc'].includes(sortOrder.toLowerCase())) {
        throw new ValidationError('排序顺序必须是asc或desc');
      }
      
      req.sorting = {
        sortBy: sortBy || allowedFields[0],
        sortOrder: (sortOrder as 'asc' | 'desc') || 'desc'
      };
      
      next();
    }
  ];
};