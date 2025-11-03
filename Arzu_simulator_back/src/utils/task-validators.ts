import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { ApiError, ValidationError } from './error.utils';
import { TaskCategory, TaskPriority } from '../types/task.types';

// 任务分类验证
export const taskCategoryValidation = body('category')
  .optional()
  .isIn(['勤政', '恕己', '爱人'] as TaskCategory[])
  .withMessage('无效的任务分类，必须是：勤政、恕己、爱人');

// 任务优先级验证
export const taskPriorityValidation = body('priority')
  .optional()
  .isIn(['金', '银', '铜', '石'] as TaskPriority[])
  .withMessage('无效的任务优先级，必须是：金、银、铜、石');

// 任务标题验证
export const taskTitleValidation = body('title')
  .trim()
  .isLength({ min: 1, max: 255 })
  .withMessage('任务标题长度必须在1-255个字符之间')
  .escape();

// 任务描述验证
export const taskDescriptionValidation = body('description')
  .optional()
  .trim()
  .isLength({ max: 1000 })
  .withMessage('任务描述不能超过1000个字符')
  .escape();

// 任务截止日期验证（创建时使用）
export const taskDueDateValidation = body('dueDate')
  .optional()
  .isISO8601()
  .withMessage('无效的日期格式，必须是ISO 8601格式');

// 任务截止日期验证（更新时使用，允许过去的日期）
export const taskDueDateUpdateValidation = body('dueDate')
  .optional()
  .isISO8601()
  .withMessage('无效的日期格式，必须是ISO 8601格式');

// 完成状态验证
export const taskCompletedValidation = body('completed')
  .optional()
  .isBoolean()
  .withMessage('完成状态必须是布尔值');

// 番茄钟计数验证
export const taskPomodoroCountValidation = body('pomodoroCount')
  .optional()
  .isInt({ min: 0, max: 999 })
  .withMessage('番茄钟计数必须是0-999之间的整数');

// 任务ID参数验证
export const taskIdParamValidation = param('id')
  .isInt({ min: 1 })
  .withMessage('任务ID必须是大于0的整数');

// 分页查询验证
export const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是大于0的整数'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须在1-100之间')
];

// 任务过滤验证
export const taskFilterValidation = [
  query('category')
    .optional()
    .isIn(['勤政', '恕己', '爱人'] as TaskCategory[])
    .withMessage('无效的任务分类'),
  query('priority')
    .optional()
    .isIn(['金', '银', '铜', '石'] as TaskPriority[])
    .withMessage('无效的任务优先级'),
  query('completed')
    .optional()
    .isBoolean()
    .withMessage('完成状态必须是布尔值'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('搜索关键词长度必须在1-100个字符之间')
    .escape(),
  query('dueDateFrom')
    .optional()
    .isISO8601()
    .withMessage('开始日期必须是有效的ISO 8601格式'),
  query('dueDateTo')
    .optional()
    .isISO8601()
    .withMessage('结束日期必须是有效的ISO 8601格式')
    .custom((value: string, { req }) => {
      if (req.query?.dueDateFrom && new Date(value) < new Date(req.query.dueDateFrom as string)) {
        throw new Error('结束日期不能早于开始日期');
      }
      return true;
    })
];

// 排序验证
export const taskSortValidation = [
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'dueDate', 'priority', 'category', 'title', 'pomodoroCount'])
    .withMessage('无效的排序字段'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('排序顺序必须是asc或desc')
];

// 批量操作验证
export const batchTaskValidation = [
  body('operation')
    .isIn(['complete', 'delete', 'update_category', 'update_priority', 'update_due_date', 'archive'])
    .withMessage('无效的批量操作类型'),
  body('taskIds')
    .isArray({ min: 1 })
    .withMessage('任务ID数组不能为空')
    .custom((value: number[]) => {
      if (!value.every(id => Number.isInteger(id) && id > 0)) {
        throw new Error('所有任务ID必须是大于0的整数');
      }
      return true;
    }),
  body('data')
    .optional()
    .isObject()
    .withMessage('操作数据必须是对象')
];

// 创建任务验证
export const createTaskValidation = [
  taskTitleValidation,
  taskDescriptionValidation,
  taskCategoryValidation,
  taskPriorityValidation,
  taskDueDateValidation
];

// 删除任务验证
export const deleteTaskValidation = [
  body('deleteReason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('删除原因不能超过500个字符')
];

// 更新任务验证
export const updateTaskValidation = [
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
  body('changeReason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('修改原因不能超过500个字符'),
  taskCategoryValidation,
  taskPriorityValidation,
  taskDueDateUpdateValidation,
  taskCompletedValidation,
  taskPomodoroCountValidation
];

// 任务统计查询验证
export const taskStatsValidation = [
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('开始日期必须是有效的ISO 8601格式'),
  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('结束日期必须是有效的ISO 8601格式')
    .custom((value: string, { req }) => {
      if (req.query?.dateFrom && new Date(value) < new Date(req.query.dateFrom as string)) {
        throw new Error('结束日期不能早于开始日期');
      }
      return true;
    }),
  query('category')
    .optional()
    .isIn(['勤政', '恕己', '爱人'] as TaskCategory[])
    .withMessage('无效的任务分类'),
  query('priority')
    .optional()
    .isIn(['金', '银', '铜', '石'] as TaskPriority[])
    .withMessage('无效的任务优先级')
];

// 番茄钟会话验证
export const createPomodoroSessionValidation = [
  body('taskId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('任务ID必须是大于0的整数'),
  body('durationMinutes')
    .optional()
    .isInt({ min: 1, max: 120 })
    .withMessage('番茄钟时长必须在1-120分钟之间')
];

// 验证结果处理中间件
export const validateTaskRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map((error: any) => ({
      field: error.type === 'field' ? error.path : error.type,
      message: error.msg,
      value: error.value || ''
    }));
    
    throw new ValidationError('输入验证失败', errorDetails);
  }
  
  next();
};

// 任务查询参数验证（组合验证）
export const taskQueryValidation = [
  ...paginationValidation,
  ...taskFilterValidation,
  ...taskSortValidation,
  validateTaskRequest
];

// 任务存在性验证中间件
export const validateTaskExists = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const taskId = parseInt(req.params.id);
    
    // 这里需要调用任务服务来检查任务是否存在
    // 暂时跳过，在控制器中处理
    next();
  } catch (error) {
    next(error);
  }
};

// 任务权限验证中间件
export const validateTaskOwnership = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const taskId = parseInt(req.params.id);
    const userId = (req as any).user?.id;
    
    if (!userId) {
      throw new ApiError('用户未认证', 401);
    }
    
    // 这里需要检查任务是否属于当前用户
    // 暂时跳过，在控制器中处理
    next();
  } catch (error) {
    next(error);
  }
};