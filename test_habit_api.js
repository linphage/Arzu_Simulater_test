const http = require('http');

const getToken = () => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      mail: '1952710912@qq.com',
      password: 'Test@2024'
    });

    const options = {
      hostname: 'localhost',
      port: 3002,
      path: '/api/v1/auth/login/email',
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

const getHabitStats = (token, timeframe) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: `/api/v1/tasks/pomodoro/habit-stats?timeframe=${timeframe}`,
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
        console.log(`\n📊 [响应] 状态码: ${res.statusCode}`);
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          console.log('❌ 获取习惯分析失败:', data);
          reject(new Error('获取习惯分析失败'));
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

    console.log('📊 [测试] 获取本周习惯分析数据...');
    const weekStats = await getHabitStats(token, 'week');
    console.log('✅ [测试] 本周数据:', JSON.stringify(weekStats, null, 2));
    
    console.log('\n📈 [关键指标]:');
    console.log(`  问题事件总数: ${weekStats.data.keyMetrics.totalProblematicEvents}`);
    console.log(`  问题事件比例: ${weekStats.data.keyMetrics.problematicEventRatio}%`);
    console.log(`  本周创建任务: ${weekStats.data.keyMetrics.totalTasksCreated}`);
    
    console.log('\n📅 [每日数据]:');
    weekStats.data.dailyData.slice(0, 3).forEach(day => {
      console.log(`  ${day.date}: 删除=${day.taskDeletion}, 修改类型=${day.categoryChange}, 修改优先级=${day.priorityChange}, 修改DDL=${day.dueDateChange}`);
    });
    
    console.log('\n🏷️ [任务类型]:');
    weekStats.data.taskTypeStats.forEach(stat => {
      console.log(`  ${stat.taskType}: ${stat.affectedCount}/${stat.totalCount} (${stat.percentage}%)`);
    });
    
    console.log('\n⏰ [高频时段]:');
    weekStats.data.highFrequencyTimeSlots.forEach((slot, idx) => {
      console.log(`  ${idx + 1}. ${slot.timeSlot}: ${slot.count}次`);
    });

    console.log('\n✅ [测试完成]');
    process.exit(0);
  } catch (error) {
    console.error('❌ [测试失败]', error.message);
    process.exit(1);
  }
})();
