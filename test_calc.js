const sqlite3 = require('./Arzu_simulator_back/node_modules/sqlite3').verbose();
const db = new sqlite3.Database('./Arzu_simulator_back/database_new_2025-09-25T08-54-04-778Z.db');

const now = new Date();
const currentDay = now.getDay();
const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay;

const monday = new Date(now);
monday.setDate(now.getDate() + daysToMonday);
monday.setHours(0, 0, 0, 0);

const sunday = new Date(monday);
sunday.setDate(monday.getDate() + 6);
sunday.setHours(23, 59, 59, 999);

console.log('本周范围:', monday.toISOString(), '至', sunday.toISOString());
console.log('');

db.all(`
  SELECT 
    fp.duration_min,
    fp.is_interrupted,
    fp.created_at,
    ps.duration_minutes as session_duration,
    ps.started_at
  FROM focus_periods fp
  INNER JOIN pomodoro_sessions ps ON fp.session_id = ps.id
  WHERE ps.user_id = 2
  ORDER BY fp.created_at DESC
`, (err, rows) => {
  if (err) {
    console.error(err);
    db.close();
    process.exit(1);
  }
  
  const weekData = rows.filter(row => {
    const createdDateStr = row.created_at.replace(' ', 'T') + 'Z';
    const createdDate = new Date(createdDateStr);
    return createdDate >= monday && createdDate <= sunday;
  });
  
  console.log('本周focus_periods数量:', weekData.length);
  console.log('');
  
  if (weekData.length > 0) {
    const totalFocusTime = weekData.reduce((sum, r) => sum + (r.duration_min || 0), 0);
    const totalInterruptions = weekData.filter(r => r.is_interrupted === 1).length;
    const totalPlannedTime = weekData.reduce((sum, r) => sum + (r.session_duration || 0), 0);
    
    const daysPassedInPeriod = Math.ceil((now.getTime() - monday.getTime()) / (1000 * 60 * 60 * 24));
    const avgFocusTime = Math.round(totalFocusTime / daysPassedInPeriod);
    const avgInterruptions = Math.round((totalInterruptions / daysPassedInPeriod) * 10) / 10;
    const focusIndex = totalPlannedTime > 0 ? Math.round((totalFocusTime / totalPlannedTime) * 100) : 0;
    
    console.log('计算结果:');
    console.log('- 总专注时长:', totalFocusTime, '分钟');
    console.log('- 总中断次数:', totalInterruptions);
    console.log('- 总计划时长:', totalPlannedTime, '分钟');
    console.log('- 本周已过天数:', daysPassedInPeriod);
    console.log('');
    console.log('关键指标:');
    console.log('- 平均专注时长:', avgFocusTime, '分钟');
    console.log('- 平均中断频率:', avgInterruptions, '次');
    console.log('- 专注指数:', focusIndex, '%');
    console.log('');
    console.log('本周数据明细:');
    weekData.forEach(r => {
      console.log('  ', r.created_at, '专注时长:', r.duration_min, '中断:', r.is_interrupted);
    });
  } else {
    console.log('⚠️ 本周没有数据');
  }
  
  db.close();
  process.exit(0);
});
