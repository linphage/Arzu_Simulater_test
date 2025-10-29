const path = require('path');
const sqlite3 = require(path.join(__dirname, 'Arzu_simulator_back', 'node_modules', 'sqlite3')).verbose();

const dbPath = path.join(__dirname, 'Arzu_simulator_back', 'database_new_2025-09-25T08-54-04-778Z.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 [测试] 检查时区问题...\n');

const now = new Date();
const currentDay = now.getDay();
const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay;

const monday = new Date(now);
monday.setDate(now.getDate() + daysToMonday);
monday.setHours(0, 0, 0, 0);

const sunday = new Date(monday);
sunday.setDate(monday.getDate() + 6);
sunday.setHours(23, 59, 59, 999);

const startStr = monday.toISOString().replace('T', ' ').substring(0, 19);
const endStr = sunday.toISOString().replace('T', ' ').substring(0, 19);

console.log(`📅 本周范围: ${startStr} 到 ${endStr}\n`);

db.all(`
  SELECT debrief_id, task_id, brief_type, created_at
  FROM task_brieflogs
  WHERE user_id = 2
    AND brief_type IN (1, 2, 3, 4)
    AND created_at >= ?
    AND created_at <= ?
  ORDER BY created_at DESC
`, [startStr, endStr], (err, rows) => {
  if (err) {
    console.error('❌ 查询失败:', err);
    db.close();
    return;
  }

  console.log(`📊 找到 ${rows.length} 条记录:\n`);
  
  rows.forEach(row => {
    const dbTime = row.created_at;
    const jsDate = new Date(dbTime);
    const jsHour = jsDate.getHours();
    const jsMinute = jsDate.getMinutes();
    
    console.log(`debrief_id=${row.debrief_id}, brief_type=${row.brief_type}`);
    console.log(`  数据库时间: ${dbTime}`);
    console.log(`  JS解析结果: ${jsDate.toISOString()}`);
    console.log(`  JS获取小时: ${jsHour}:${jsMinute.toString().padStart(2, '0')}`);
    console.log(`  时间段: ${Math.floor(jsHour / 2) * 2}:00-${Math.floor(jsHour / 2) * 2 + 2}:00`);
    console.log('');
  });

  console.log('💡 [分析] 如果数据库存储的是东八区时间 14:44:00');
  console.log('  直接用 new Date() 解析会被当作 UTC 时间');
  console.log('  在东八区环境下会显示为 22:44:00 (14+8)');
  console.log('  但如果当前环境不是东八区,就会有问题\n');

  const testTime = '2025-10-27 14:44:00';
  const wrongParse = new Date(testTime);
  const correctParse = new Date(testTime.replace(' ', 'T') + '+08:00');
  
  console.log(`📝 测试时间: ${testTime}`);
  console.log(`  错误解析(当作UTC): ${wrongParse.toISOString()} -> 小时=${wrongParse.getHours()}`);
  console.log(`  正确解析(明确+08): ${correctParse.toISOString()} -> 小时=${correctParse.getHours()}`);

  db.close();
});
