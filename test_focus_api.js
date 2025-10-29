const http = require('http');

const getToken = () => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      email: 'test@example.com',
      password: 'Test123456!'
    });

    const options = {
      hostname: 'localhost',
      port: 3002,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          const response = JSON.parse(data);
          resolve(response.data.accessToken);
        } else {
          console.log('❌ 登录失败:', data);
          reject(new Error('登录失败'));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
};

const getFocusStats = (token, timeframe) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: `/api/v1/tasks/pomodoro/focus-stats?timeframe=${timeframe}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          console.log('❌ 获取专注度统计失败:', data);
          reject(new Error('获取专注度统计失败'));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
};

(async () => {
  try {
    console.log('🔐 [测试] 开始登录...');
    const token = await getToken();
    console.log('✅ [测试] 登录成功\n');

    console.log('📊 [测试] 获取本周专注度统计数据...');
    const weekStats = await getFocusStats(token, 'week');
    console.log('✅ [测试] 本周数据:', JSON.stringify(weekStats, null, 2));
    console.log('\n关键指标:');
    console.log('  - 平均专注时长:', weekStats.data.keyMetrics.avgFocusTime, '分钟');
    console.log('  - 平均中断次数:', weekStats.data.keyMetrics.avgInterruptions);
    console.log('  - 专注指数:', weekStats.data.keyMetrics.focusIndex, '%');
    console.log('\n每日数据:');
    weekStats.data.dailyData.forEach(day => {
      console.log(`  ${day.date}: 专注${day.sessionDuration}分钟, 中断${day.interruptions}次, 专注指数${day.focusIndex}%`);
    });

    console.log('\n📊 [测试] 获取本月专注度统计数据...');
    const monthStats = await getFocusStats(token, 'month');
    console.log('\n✅ [测试] 本月关键指标:');
    console.log('  - 平均专注时长:', monthStats.data.keyMetrics.avgFocusTime, '分钟');
    console.log('  - 平均中断次数:', monthStats.data.keyMetrics.avgInterruptions);
    console.log('  - 专注指数:', monthStats.data.keyMetrics.focusIndex, '%');

    console.log('\n✅ [测试完成]');
    process.exit(0);
  } catch (error) {
    console.error('❌ [测试失败]', error.message);
    process.exit(1);
  }
})();
