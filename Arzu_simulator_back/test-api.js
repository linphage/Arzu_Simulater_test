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

async function testAPI() {
  try {
    console.log('🧪 测试API...');

    // 测试根端点
    console.log('\n1. 测试根端点:');
    let result = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/',
      method: 'GET'
    });
    console.log('状态码:', result.statusCode);
    console.log('响应:', result.data);

    // 测试健康检查
    console.log('\n2. 测试健康检查:');
    result = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/health',
      method: 'GET'
    });
    console.log('状态码:', result.statusCode);
    console.log('响应:', result.data);

    // 测试用户注册
    console.log('\n3. 测试用户注册:');
    const registerData = JSON.stringify({
      username: 'testuser123',
      email: 'test123@example.com',
      password: 'Test123!@#'
    });
    
    result = await makeRequest({
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
    console.log('响应:', result.data);

    // 测试用户登录
    console.log('\n4. 测试用户登录:');
    const loginData = JSON.stringify({
      username: 'testuser123',
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
    console.log('响应:', result.data);

    console.log('\n✅ API测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 运行测试
testAPI();