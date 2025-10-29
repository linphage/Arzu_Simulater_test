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

async function testDataIsolation() {
  let user1Token, user2Token, user1TaskId, user2TaskId;

  try {
    console.log('🔒 开始测试数据隔离功能...');

    // 1. 创建用户1
    console.log('\n1. 创建用户1:');
    const user1Data = JSON.stringify({
      username: 'user1_' + Date.now(),
      email: 'user1_' + Date.now() + '@example.com',
      password: 'Test123!@#'
    });
    
    let result = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(user1Data)
      }
    }, user1Data);
    
    console.log('用户1注册状态码:', result.statusCode);
    if (result.statusCode === 201) {
      console.log('✅ 用户1注册成功');
    }

    // 2. 用户1登录
    console.log('\n2. 用户1登录:');
    const user1Login = JSON.stringify({
      username: JSON.parse(user1Data).username,
      password: 'Test123!@#'
    });
    
    result = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(user1Login)
      }
    }, user1Login);
    
    if (result.statusCode === 200) {
      user1Token = result.data.data.accessToken;
      console.log('✅ 用户1登录成功');
    }

    // 3. 创建用户2
    console.log('\n3. 创建用户2:');
    const user2Data = JSON.stringify({
      username: 'user2_' + Date.now(),
      email: 'user2_' + Date.now() + '@example.com',
      password: 'Test123!@#'
    });
    
    result = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(user2Data)
      }
    }, user2Data);
    
    console.log('用户2注册状态码:', result.statusCode);
    if (result.statusCode === 201) {
      console.log('✅ 用户2注册成功');
    }

    // 4. 用户2登录
    console.log('\n4. 用户2登录:');
    const user2Login = JSON.stringify({
      username: JSON.parse(user2Data).username,
      password: 'Test123!@#'
    });
    
    result = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(user2Login)
      }
    }, user2Login);
    
    if (result.statusCode === 200) {
      user2Token = result.data.data.accessToken;
      console.log('✅ 用户2登录成功');
    }

    // 5. 用户1创建任务
    console.log('\n5. 用户1创建任务:');
    const taskData1 = JSON.stringify({
      title: '用户1的私密任务',
      description: '这个任务只能用户1看到',
      category: '勤政',
      priority: '金'
    });
    
    result = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/tasks',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user1Token}`,
        'Content-Length': Buffer.byteLength(taskData1)
      }
    }, taskData1);
    
    if (result.statusCode === 201) {
      user1TaskId = result.data.data.id;
      console.log('✅ 用户1创建任务成功，任务ID:', user1TaskId);
    }

    // 6. 用户2创建任务
    console.log('\n6. 用户2创建任务:');
    const taskData2 = JSON.stringify({
      title: '用户2的私密任务',
      description: '这个任务只能用户2看到',
      category: '恕己',
      priority: '银'
    });
    
    result = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/tasks',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user2Token}`,
        'Content-Length': Buffer.byteLength(taskData2)
      }
    }, taskData2);
    
    if (result.statusCode === 201) {
      user2TaskId = result.data.data.id;
      console.log('✅ 用户2创建任务成功，任务ID:', user2TaskId);
    }

    // 7. 验证用户1不能访问用户2的任务
    console.log('\n7. 验证用户1不能访问用户2的任务:');
    result = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: `/api/tasks/${user2TaskId}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${user1Token}`
      }
    });
    
    console.log('用户1访问用户2任务状态码:', result.statusCode);
    if (result.statusCode === 404) {
      console.log('✅ 用户1无法访问用户2的任务（返回404）');
    } else {
      console.log('❌ 数据隔离失败，用户1可以访问用户2的任务');
    }

    // 8. 验证用户2不能访问用户1的任务
    console.log('\n8. 验证用户2不能访问用户1的任务:');
    result = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: `/api/tasks/${user1TaskId}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${user2Token}`
      }
    });
    
    console.log('用户2访问用户1任务状态码:', result.statusCode);
    if (result.statusCode === 404) {
      console.log('✅ 用户2无法访问用户1的任务（返回404）');
    } else {
      console.log('❌ 数据隔离失败，用户2可以访问用户1的任务');
    }

    // 9. 验证用户1只能看到自己的任务
    console.log('\n9. 验证用户1的任务列表:');
    result = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/tasks',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${user1Token}`
      }
    });
    
    if (result.statusCode === 200) {
      const user1Tasks = result.data.data.tasks;
      const hasUser2Task = user1Tasks.some(task => task.id === user2TaskId);
      console.log(`用户1任务列表数量: ${user1Tasks.length}`);
      if (!hasUser2Task) {
        console.log('✅ 用户1的任务列表中不包含用户2的任务');
      } else {
        console.log('❌ 数据隔离失败，用户1可以看到用户2的任务');
      }
    }

    // 10. 验证用户2只能看到自己的任务
    console.log('\n10. 验证用户2的任务列表:');
    result = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/tasks',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${user2Token}`
      }
    });
    
    if (result.statusCode === 200) {
      const user2Tasks = result.data.data.tasks;
      const hasUser1Task = user2Tasks.some(task => task.id === user1TaskId);
      console.log(`用户2任务列表数量: ${user2Tasks.length}`);
      if (!hasUser1Task) {
        console.log('✅ 用户2的任务列表中不包含用户1的任务');
      } else {
        console.log('❌ 数据隔离失败，用户2可以看到用户1的任务');
      }
    }

    console.log('\n🎉 数据隔离测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.stack) {
      console.error('堆栈:', error.stack);
    }
  }
}

// 运行测试
testDataIsolation();