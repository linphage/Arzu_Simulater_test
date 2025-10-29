const path = require('path');
const jwt = require(path.join(__dirname, 'Arzu_simulator_back', 'node_modules', 'jsonwebtoken'));

const JWT_SECRET = 'your_super_secret_and_random_string_here_12345_change_this_immediately';

const payload = {
  userId: 2,
  username: 'amber'
};

const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

console.log('Generated Token:', token);
console.log('');

async function testUserStatsAPI() {
  try {
    console.log('=== 测试用户统计API ===');
    const http = require('http');
    
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: '/api/v1/users/stats',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('响应状态:', res.statusCode);
        console.log('响应数据:', data);
        try {
          const json = JSON.parse(data);
          console.log('格式化数据:', JSON.stringify(json, null, 2));
        } catch (e) {
          console.log('无法解析JSON');
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('请求失败:', error);
    });
    
    req.end();
  } catch (error) {
    console.error('请求失败:', error);
  }
}

testUserStatsAPI();
