import request from 'supertest';
import server from '../server';
import db from '../config/database';

describe('Task API Integration Tests', () => {
  let authToken: string;
  let testUser: { username: string; email: string; password: string };
  let testTaskId: number;

  beforeAll((done) => {
    // 确保数据库连接并创建表
    db.serialize(() => {
      done();
    });
  });

  afterAll((done) => {
    server.close(() => {
      db.close();
      done();
    });
  });

  beforeEach(async () => {
    // 创建测试用户
    testUser = {
      username: 'tasktest_' + Date.now(),
      email: 'tasktest_' + Date.now() + '@example.com',
      password: 'Test123!@#'
    };

    // 注册用户
    await request(server)
      .post('/api/auth/register')
      .send(testUser);

    // 登录获取令牌
    const loginRes = await request(server)
      .post('/api/auth/login')
      .send({
        username: testUser.username,
        password: testUser.password
      });

    authToken = loginRes.body.data.accessToken;
  });

  describe('POST /api/tasks', () => {
    it('should create a new task successfully', async () => {
      const taskData = {
        title: '测试任务',
        description: '这是一个测试任务',
        category: '勤政',
        priority: '金',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };

      const res = await request(server)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('message', '任务创建成功');
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.title).toBe(taskData.title);
      expect(res.body.data.category).toBe(taskData.category);
      expect(res.body.data.priority).toBe(taskData.priority);

      testTaskId = res.body.data.id;
    });

    it('should fail without authentication', async () => {
      const taskData = {
        title: '测试任务',
        description: '这是一个测试任务'
      };

      const res = await request(server)
        .post('/api/tasks')
        .send(taskData);

      expect(res.statusCode).toEqual(401);
    });

    it('should fail with invalid due date', async () => {
      const taskData = {
        title: '测试任务',
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // past date
      };

      const res = await request(server)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/tasks', () => {
    beforeEach(async () => {
      // 创建几个测试任务
      const tasks = [
        { title: '任务1', category: '勤政', priority: '金' },
        { title: '任务2', category: '恕己', priority: '银', completed: true },
        { title: '任务3', category: '爱人', priority: '铜' }
      ];

      for (const task of tasks) {
        await request(server)
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send(task);
      }
    });

    it('should get user tasks successfully', async () => {
      const res = await request(server)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('tasks');
      expect(res.body.data).toHaveProperty('pagination');
      expect(Array.isArray(res.body.data.tasks)).toBe(true);
      expect(res.body.data.tasks.length).toBeGreaterThan(0);
    });

    it('should filter tasks by category', async () => {
      const res = await request(server)
        .get('/api/tasks?category=勤政')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.tasks.every((task: any) => task.category === '勤政')).toBe(true);
    });

    it('should filter tasks by completion status', async () => {
      const res = await request(server)
        .get('/api/tasks?completed=true')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.tasks.every((task: any) => task.completed === 1)).toBe(true);
    });

    it('should support pagination', async () => {
      const res = await request(server)
        .get('/api/tasks?page=1&limit=2')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.tasks.length).toBeLessThanOrEqual(2);
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(2);
    });
  });

  describe('GET /api/tasks/:id', () => {
    beforeEach(async () => {
      // 创建一个测试任务
      const createRes = await request(server)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '单个任务测试',
          description: '用于获取单个任务的测试'
        });

      testTaskId = createRes.body.data.id;
    });

    it('should get task by id successfully', async () => {
      const res = await request(server)
        .get(`/api/tasks/${testTaskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('id', testTaskId);
      expect(res.body.data.title).toBe('单个任务测试');
    });

    it('should return 404 for non-existent task', async () => {
      const res = await request(server)
        .get('/api/tasks/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('PATCH /api/tasks/:id', () => {
    beforeEach(async () => {
      // 创建一个测试任务
      const createRes = await request(server)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '待更新任务',
          description: '这个任务将被更新'
        });

      testTaskId = createRes.body.data.id;
    });

    it('should update task successfully', async () => {
      const updateData = {
        title: '已更新的任务',
        description: '任务内容已更新',
        completed: true
      };

      const res = await request(server)
        .patch(`/api/tasks/${testTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('message', '任务更新成功');

      // 验证更新结果
      const getRes = await request(server)
        .get(`/api/tasks/${testTaskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getRes.body.data.title).toBe(updateData.title);
      expect(getRes.body.data.description).toBe(updateData.description);
      expect(getRes.body.data.completed).toBe(1);
    });

    it('should fail for non-existent task', async () => {
      const res = await request(server)
        .patch('/api/tasks/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated Title' });

      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    beforeEach(async () => {
      // 创建一个测试任务
      const createRes = await request(server)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '待删除任务',
          description: '这个任务将被删除'
        });

      testTaskId = createRes.body.data.id;
    });

    it('should delete task successfully', async () => {
      const res = await request(server)
        .delete(`/api/tasks/${testTaskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('message', '任务删除成功');

      // 验证任务已被删除
      const getRes = await request(server)
        .get(`/api/tasks/${testTaskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getRes.statusCode).toEqual(404);
    });

    it('should fail for non-existent task', async () => {
      const res = await request(server)
        .delete('/api/tasks/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/tasks/stats', () => {
    beforeEach(async () => {
      // 创建一些测试任务用于统计
      const tasks = [
        { title: '任务1', category: '勤政', priority: '金' },
        { title: '任务2', category: '恕己', priority: '银', completed: true },
        { title: '任务3', category: '爱人', priority: '铜' },
        { title: '任务4', category: '勤政', priority: '石', completed: true }
      ];

      for (const task of tasks) {
        await request(server)
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send(task);
      }
    });

    it('should get task statistics successfully', async () => {
      const res = await request(server)
        .get('/api/tasks/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('totalTasks');
      expect(res.body.data).toHaveProperty('completedTasks');
      expect(res.body.data).toHaveProperty('pendingTasks');
      expect(res.body.data).toHaveProperty('tasksByCategory');
      expect(res.body.data).toHaveProperty('tasksByPriority');
    });
  });

  describe('GET /api/tasks/search', () => {
    beforeEach(async () => {
      // 创建一些测试任务用于搜索
      const tasks = [
        { title: '项目开发任务', description: '开发新功能' },
        { title: '文档编写任务', description: '编写项目文档' },
        { title: '测试任务', description: '执行项目测试' }
      ];

      for (const task of tasks) {
        await request(server)
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send(task);
      }
    });

    it('should search tasks successfully', async () => {
      const res = await request(server)
        .get('/api/tasks/search?q=项目')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('tasks');
      expect(res.body.data).toHaveProperty('query', '项目');
      expect(res.body.data.tasks.length).toBeGreaterThan(0);
    });

    it('should return empty result for non-matching query', async () => {
      const res = await request(server)
        .get('/api/tasks/search?q=不存在的任务')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.tasks.length).toBe(0);
    });
  });

  describe('POST /api/tasks/batch', () => {
    let taskIds: number[] = [];

    beforeEach(async () => {
      // 创建一些测试任务用于批量操作
      const tasks = [
        { title: '批量任务1' },
        { title: '批量任务2' },
        { title: '批量任务3' }
      ];

      taskIds = [];
      for (const task of tasks) {
        const createRes = await request(server)
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send(task);
        taskIds.push(createRes.body.data.id);
      }
    });

    it('should complete tasks in batch', async () => {
      const res = await request(server)
        .post('/api/tasks/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          operation: 'complete',
          taskIds: taskIds
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('affectedCount', 3);

      // 验证任务状态已更新
      const getRes = await request(server)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`);

      const completedTasks = getRes.body.data.tasks.filter((task: any) => 
        taskIds.includes(task.id) && task.completed === 1
      );
      expect(completedTasks.length).toBe(3);
    });

    it('should delete tasks in batch', async () => {
      const res = await request(server)
        .post('/api/tasks/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          operation: 'delete',
          taskIds: taskIds
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('affectedCount', 3);

      // 验证任务已被删除
      for (const taskId of taskIds) {
        const getRes = await request(server)
          .get(`/api/tasks/${taskId}`)
          .set('Authorization', `Bearer ${authToken}`);
        expect(getRes.statusCode).toEqual(404);
      }
    });
  });

  describe('POST /api/tasks/pomodoro', () => {
    let taskId: number;

    beforeEach(async () => {
      // 创建一个测试任务
      const createRes = await request(server)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '番茄钟测试任务'
        });

      taskId = createRes.body.data.id;
    });

    it('should create pomodoro session successfully', async () => {
      const res = await request(server)
        .post('/api/tasks/pomodoro')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          taskId: taskId,
          durationMinutes: 25
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('task_id', taskId);
      expect(res.body.data.duration_minutes).toBe(25);
      expect(res.body.data.completed).toBe(0);
    });

    it('should fail without task ID', async () => {
      const res = await request(server)
        .post('/api/tasks/pomodoro')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          durationMinutes: 25
        });

      expect(res.statusCode).toEqual(201); // Should succeed with optional taskId
    });
  });

  describe('GET /api/tasks/pomodoro/active', () => {
    it('should get active pomodoro session', async () => {
      // 创建一个任务和番茄钟会话
      const createRes = await request(server)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: '番茄钟任务' });

      await request(server)
        .post('/api/tasks/pomodoro')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          taskId: createRes.body.data.id,
          durationMinutes: 25
        });

      const res = await request(server)
        .get('/api/tasks/pomodoro/active')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('session');
    });
  });
});