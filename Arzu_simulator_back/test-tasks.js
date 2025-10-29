const http = require('http');

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function testTaskAPI() {
  let authToken = null;
  let testUserId = null;

  try {
    console.log('🧪 开始测试任务管理API...');

    // 1. 用户注册
    console.log('\n1. 用户注册测试:');
    const registerData = JSON.stringify({
      username: 'tasktestuser',
      email: 'tasktest@example.com',
      password: 'Test123!@#'
    });
    
    let result = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(registerData)
      }
    }, registerData);
    
    console.log('状态码:', result.statusCode);
    console.log('响应:', JSON.stringify(result.data, null, 2));

    if (result.statusCode === 201) {
      testUserId = result.data.data.userId;
      console.log('✅ 用户注册成功，用户ID:', testUserId);
    }

    // 2. 用户登录
    console.log('\n2. 用户登录测试:');
    const loginData = JSON.stringify({
      username: 'tasktestuser',
      password: 'Test123!@#'
    });
    
    result = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    }, loginData);
    
    console.log('状态码:', result.statusCode);
    console.log('响应:', JSON.stringify(result.data, null, 2));

    if (result.statusCode === 200) {
      authToken = result.data.data.accessToken;
      console.log('✅ 用户登录成功，获取到认证令牌');
    }

    if (!authToken) {
      console.log('❌ 无法获取认证令牌，跳过后续测试');
      return;
    }

    // 3. 创建任务
    console.log('\n3. 创建任务测试:');
    const createTaskData = JSON.stringify({
      title: '完成项目文档',
      description: '编写项目的技术文档和用户手册',
      category: '勤政',
      priority: '金',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7天后
    });
    
    result = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/tasks',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'Content-Length': Buffer.byteLength(createTaskData)
      }
    }, createTaskData);
    
    console.log('状态码:', result.statusCode);
    console.log('响应:', JSON.stringify(result.data, null, 2));

    let testTaskId = null;
    if (result.statusCode === 201) {
      testTaskId = result.data.data.id;
      console.log('✅ 任务创建成功，任务ID:', testTaskId);
    }

    // 4. 获取任务列表
    console.log('\n4. 获取任务列表测试:');
    result = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/tasks',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('状态码:', result.statusCode);
    console.log('响应:', JSON.stringify(result.data, null, 2));

    if (result.statusCode === 200) {
      console.log('✅ 任务列表获取成功，任务数量:', result.data.data.tasks.length);
    }

    // 5. 获取任务统计
    console.log('\n5. 获取任务统计测试:');
    result = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/tasks/stats',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('状态码:', result.statusCode);
    console.log('响应:', JSON.stringify(result.data, null, 2));

    if (result.statusCode === 200) {
      console.log('✅ 任务统计获取成功');
    }

    // 6. 搜索任务
    console.log('\n6. 搜索任务测试:');
    result = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/tasks/search?q=' + encodeURIComponent('项目'),
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('状态码:', result.statusCode);
    console.log('响应:', JSON.stringify(result.data, null, 2));

    if (result.statusCode === 200) {
      console.log('✅ 任务搜索成功，结果数量:', result.data.data.resultCount);
    }

    // 7. 更新任务（如果已有任务）
    if (testTaskId) {
      console.log('\n7. 更新任务测试:');
      const updateTaskData = JSON.stringify({
        title: '更新后的项目文档',
        description: '更新后的技术文档和用户手册',
        completed: true
      });
      
      result = await makeRequest({
        hostname: 'localhost',
        port: 3001,
        path: `/api/tasks/${testTaskId}`,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'Content-Length': Buffer.byteLength(updateTaskData)
        }
      }, updateTaskData);
      
      console.log('状态码:', result.statusCode);
      console.log('响应:', JSON.stringify(result.data, null, 2));

      if (result.statusCode === 200) {
        console.log('✅ 任务更新成功');
      }

      // 8. 创建番茄钟会话
      console.log('\n8. 创建番茄钟会话测试:');
      const pomodoroData = JSON.stringify({
        taskId: testTaskId,
        durationMinutes: 25
      });
      
      result = await makeRequest({
        hostname: 'localhost',
        port: 3001,
        path: '/api/tasks/pomodoro',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'Content-Length': Buffer.byteLength(pomodoroData)
        }
      }, pomodoroData);
      
      console.log('状态码:', result.statusCode);
      console.log('响应:', JSON.stringify(result.data, null, 2));

      let sessionId = null;
      if (result.statusCode === 201) {
        sessionId = result.data.data.id;
        console.log('✅ 番茄钟会话创建成功，会话ID:', sessionId);
      }

      // 9. 获取番茄钟会话列表
      console.log('\n9. 获取番茄钟会话列表测试:');
      result = await makeRequest({
        hostname: 'localhost',
        port: 3001,
        path: '/api/tasks/pomodoro',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      console.log('状态码:', result.statusCode);
      console.log('响应:', JSON.stringify(result.data, null, 2));

      if (result.statusCode === 200) {
        console.log('✅ 番茄钟会话列表获取成功，会话数量:', result.data.data.sessions.length);
      }

      // 10. 获取番茄钟统计
      console.log('\n10. 获取番茄钟统计测试:');
      result = await makeRequest({
        hostname: 'localhost',
        port: 3001,
        path: '/api/tasks/pomodoro/stats?days=7',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      console.log('状态码:', result.statusCode);
      console.log('响应:', JSON.stringify(result.data, null, 2));

      if (result.statusCode === 200) {
        console.log('✅ 番茄钟统计获取成功');
      }

      // 11. 获取任务分析数据
      console.log('\n11. 获取任务分析数据测试:');
      result = await makeRequest({
        hostname: 'localhost',
        port: 3001,
        path: '/api/tasks/analytics?days=7',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      console.log('状态码:', result.statusCode);
      console.log('响应:', JSON.stringify(result.data, null, 2));

      if (result.statusCode === 200) {
        console.log('✅ 任务分析数据获取成功');
      }
    }

    console.log('\n🎉 任务管理API测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.stack) {
      console.error('堆栈:', error.stack);
    }
  }
}

// 运行测试
testTaskAPI();