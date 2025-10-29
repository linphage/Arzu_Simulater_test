const axios = require('axios');

(async () => {
  try {
    const loginRes = await axios.post('http://localhost:3002/api/v1/auth/login', {
      mail: '1952710912@qq.com',
      password: '12345678'
    });
    const token = loginRes.data.data.token;
    console.log('✅ 登录成功');
    
    const statsRes = await axios.get('http://localhost:3002/api/v1/tasks/pomodoro/focus-stats?timeframe=week', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('\n📊 专注度统计结果:');
    console.log(JSON.stringify(statsRes.data, null, 2));
  } catch (error) {
    console.error('❌ 错误:', error.response?.data || error.message);
  }
  process.exit(0);
})();
