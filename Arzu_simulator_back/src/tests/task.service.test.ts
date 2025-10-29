import { TaskService } from '../services/task.service';
import { TaskRepository } from '../repositories/task.repository';
import { PomodoroRepository } from '../repositories/pomodoro.repository';
import { ValidationError, NotFoundError, ConflictError } from '../utils/error.utils';
import { CreateTaskDto, UpdateTaskDto, CreatePomodoroSessionDto } from '../types/task.types';

// Mock repositories
jest.mock('../repositories/task.repository');
jest.mock('../repositories/pomodoro.repository');

describe('TaskService', () => {
  let taskService: TaskService;
  let mockTaskRepository: jest.Mocked<TaskRepository>;
  let mockPomodoroRepository: jest.Mocked<PomodoroRepository>;

  beforeEach(() => {
    mockTaskRepository = new TaskRepository() as jest.Mocked<TaskRepository>;
    mockPomodoroRepository = new PomodoroRepository() as jest.Mocked<PomodoroRepository>;
    taskService = new TaskService();
    
    // Replace private properties with mocks
    (taskService as any).taskRepository = mockTaskRepository;
    (taskService as any).pomodoroRepository = mockPomodoroRepository;
  });

  describe('createTask', () => {
    const userId = 1;
    const taskData: CreateTaskDto = {
      title: 'Test Task',
      description: 'Test Description',
      category: '勤政',
      priority: '金',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    it('should create task successfully', async () => {
      const mockTaskId = 123;
      mockTaskRepository.create.mockResolvedValue(mockTaskId);

      const result = await taskService.createTask(userId, taskData);

      expect(mockTaskRepository.create).toHaveBeenCalledWith(userId, taskData);
      expect(result).toEqual({ taskId: mockTaskId });
    });

    it('should fail with invalid due date', async () => {
      const invalidTaskData = {
        ...taskData,
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // past date
      };

      await expect(taskService.createTask(userId, invalidTaskData))
        .rejects.toThrow(ValidationError);
    });

    it('should fail with empty title', async () => {
      const invalidTaskData = {
        ...taskData,
        title: ''
      };

      await expect(taskService.createTask(userId, invalidTaskData))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('getUserTasks', () => {
    const userId = 1;
    const mockTasks = {
      tasks: [
        {
          id: 1,
          user_id: userId,
          title: 'Task 1',
          completed: 0,
          created_at: '2024-01-01 00:00:00',
          updated_at: '2024-01-01 00:00:00'
        },
        {
          id: 2,
          user_id: userId,
          title: 'Task 2',
          completed: 1,
          created_at: '2024-01-02 00:00:00',
          updated_at: '2024-01-02 00:00:00'
        }
      ],
      total: 2
    };

    it('should get user tasks successfully', async () => {
      mockTaskRepository.findByUserId.mockResolvedValue(mockTasks);

      const result = await taskService.getUserTasks(userId, { page: 1, limit: 10 });

      expect(mockTaskRepository.findByUserId).toHaveBeenCalledWith(userId, { page: 1, limit: 10 });
      expect(result).toEqual(mockTasks);
    });

    it('should apply filters correctly', async () => {
      const filters = {
        page: 1,
        limit: 10,
        category: '勤政',
        priority: '金',
        completed: false
      };

      mockTaskRepository.findByUserId.mockResolvedValue(mockTasks);

      await taskService.getUserTasks(userId, filters);

      expect(mockTaskRepository.findByUserId).toHaveBeenCalledWith(userId, filters);
    });
  });

  describe('updateTask', () => {
    const userId = 1;
    const taskId = 123;
    const updateData: UpdateTaskDto = {
      title: 'Updated Task Title',
      completed: true
    };

    it('should update task successfully', async () => {
      const mockTask = {
        id: taskId,
        user_id: userId,
        title: 'Original Title',
        completed: 0
      };

      mockTaskRepository.findByIdAndUserId.mockResolvedValue(mockTask);
      mockTaskRepository.update.mockResolvedValue();

      const result = await taskService.updateTask(userId, taskId, updateData);

      expect(mockTaskRepository.findByIdAndUserId).toHaveBeenCalledWith(taskId, userId);
      expect(mockTaskRepository.update).toHaveBeenCalledWith(taskId, updateData);
      expect(result).toEqual({ success: true });
    });

    it('should fail if task not found', async () => {
      mockTaskRepository.findByIdAndUserId.mockResolvedValue(undefined);

      await expect(taskService.updateTask(userId, taskId, updateData))
        .rejects.toThrow(NotFoundError);
    });

    it('should fail if task belongs to different user', async () => {
      const otherUserTask = {
        id: taskId,
        user_id: 999, // different user
        title: 'Other User Task'
      };

      mockTaskRepository.findByIdAndUserId.mockResolvedValue(otherUserTask);

      await expect(taskService.updateTask(userId, taskId, updateData))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteTask', () => {
    const userId = 1;
    const taskId = 123;

    it('should delete task successfully', async () => {
      const mockTask = {
        id: taskId,
        user_id: userId,
        title: 'Task to Delete'
      };

      mockTaskRepository.findByIdAndUserId.mockResolvedValue(mockTask);
      mockTaskRepository.delete.mockResolvedValue();

      const result = await taskService.deleteTask(userId, taskId);

      expect(mockTaskRepository.findByIdAndUserId).toHaveBeenCalledWith(taskId, userId);
      expect(mockTaskRepository.delete).toHaveBeenCalledWith(taskId);
      expect(result).toEqual({ success: true });
    });

    it('should fail if task not found', async () => {
      mockTaskRepository.findByIdAndUserId.mockResolvedValue(undefined);

      await expect(taskService.deleteTask(userId, taskId))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('createPomodoroSession', () => {
    const userId = 1;
    const sessionData: CreatePomodoroSessionDto = {
      taskId: 123,
      durationMinutes: 25
    };

    it('should create pomodoro session successfully', async () => {
      const mockTask = {
        id: 123,
        user_id: userId,
        title: 'Task with Pomodoro'
      };
      const mockSessionId = 456;
      const mockSession = {
        id: mockSessionId,
        user_id: userId,
        task_id: 123,
        duration_minutes: 25,
        completed: 0,
        started_at: new Date().toISOString()
      };

      mockTaskRepository.findByIdAndUserId.mockResolvedValue(mockTask);
      mockPomodoroRepository.getActiveSession.mockResolvedValue(undefined);
      mockPomodoroRepository.create.mockResolvedValue(mockSessionId);
      mockPomodoroRepository.findById.mockResolvedValue(mockSession);

      const result = await taskService.createPomodoroSession(userId, sessionData);

      expect(mockTaskRepository.findByIdAndUserId).toHaveBeenCalledWith(123, userId);
      expect(mockPomodoroRepository.getActiveSession).toHaveBeenCalledWith(userId);
      expect(mockPomodoroRepository.create).toHaveBeenCalledWith(userId, sessionData);
      expect(result).toEqual(mockSession);
    });

    it('should fail if task does not exist', async () => {
      mockTaskRepository.findByIdAndUserId.mockResolvedValue(undefined);

      await expect(taskService.createPomodoroSession(userId, sessionData))
        .rejects.toThrow(ValidationError);
    });

    it('should fail if there is already an active session', async () => {
      const mockTask = {
        id: 123,
        user_id: userId,
        title: 'Task with Pomodoro'
      };
      const activeSession = {
        id: 789,
        user_id: userId,
        started_at: new Date().toISOString()
      };

      mockTaskRepository.findByIdAndUserId.mockResolvedValue(mockTask);
      mockPomodoroRepository.getActiveSession.mockResolvedValue(activeSession);

      await expect(taskService.createPomodoroSession(userId, sessionData))
        .rejects.toThrow(ConflictError);
    });
  });

  describe('getTaskStats', () => {
    const userId = 1;
    const mockStats = {
      totalTasks: 10,
      completedTasks: 5,
      pendingTasks: 3,
      overdueTasks: 2,
      tasksByCategory: { '勤政': 6, '恕己': 3, '爱人': 1 },
      tasksByPriority: { '金': 2, '银': 3, '铜': 4, '石': 1 },
      tasksByStatus: { pending: 3, completed: 5, overdue: 2 },
      pomodoroCount: 15
    };

    it('should get task statistics successfully', async () => {
      mockTaskRepository.getTaskStats.mockResolvedValue(mockStats);

      const result = await taskService.getTaskStats(userId);

      expect(mockTaskRepository.getTaskStats).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockStats);
    });
  });

  describe('searchTasks', () => {
    const userId = 1;
    const query = 'project';
    const mockResults = [
      {
        id: 1,
        user_id: userId,
        title: 'Complete project documentation',
        description: 'Write technical docs for the project'
      }
    ];

    it('should search tasks successfully', async () => {
      mockTaskRepository.searchTasks.mockResolvedValue(mockResults);

      const result = await taskService.searchTasks(userId, query);

      expect(mockTaskRepository.searchTasks).toHaveBeenCalledWith(userId, query, 10);
      expect(result).toEqual(mockResults);
    });
  });

  describe('batchOperateTasks', () => {
    const userId = 1;
    const batchData = {
      operation: 'complete' as const,
      taskIds: [1, 2, 3]
    };

    it('should complete tasks successfully', async () => {
      mockTaskRepository.updateManyStatus.mockResolvedValue(3);

      const result = await taskService.batchOperateTasks(userId, batchData);

      expect(mockTaskRepository.updateManyStatus).toHaveBeenCalledWith([1, 2, 3], true);
      expect(result).toEqual({ success: true, affectedCount: 3 });
    });

    it('should delete tasks successfully', async () => {
      const deleteData = {
        operation: 'delete' as const,
        taskIds: [1, 2, 3]
      };

      mockTaskRepository.deleteMany.mockResolvedValue(3);

      const result = await taskService.batchOperateTasks(userId, deleteData);

      expect(mockTaskRepository.deleteMany).toHaveBeenCalledWith([1, 2, 3]);
      expect(result).toEqual({ success: true, affectedCount: 3 });
    });

    it('should fail with invalid operation', async () => {
      const invalidData = {
        operation: 'invalid' as any,
        taskIds: [1, 2, 3]
      };

      await expect(taskService.batchOperateTasks(userId, invalidData))
        .rejects.toThrow(ValidationError);
    });
  });
});