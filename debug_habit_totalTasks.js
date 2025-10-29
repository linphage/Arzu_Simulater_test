const sqlite3 = require('./Arzu_simulator_back/node_modules/sqlite3').verbose();
const path = require('path');

const dbPath = './database_new_2025-09-25T08-54-04-778Z.db';
const db = new sqlite3.Database(dbPath);

const now = new Date();
const currentDay = now.getDay();
const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay;

const monday = new Date(now);
monday.setDate(now.getDate() + daysToMonday);
monday.setHours(0, 0, 0, 0);

const sunday = new Date(monday);
sunday.setDate(monday.getDate() + 6);
sunday.setHours(23, 59, 59, 999);

console.log('本周范围:');
console.log('  开始:', monday.toISOString());
console.log('  结束:', sunday.toISOString());
console.log();

db.all('SELECT id, title, category, created_at FROM tasks WHERE user_id = 2', [], (err, allTasks) => {
  if (err) {
    console.error('查询失败:', err);
    db.close();
    return;
  }
  
  console.log(`用户2的所有任务 (共${allTasks.length}条):`);
  allTasks.forEach(task => {
    console.log(`  ID: ${task.id}, 类别: "${task.category}" (类型: ${typeof task.category}), 创建时间: ${task.created_at}`);
  });
  console.log();

  console.log('过滤逻辑测试:');
  const tasksInRange = allTasks.filter(task => {
    if (!task.created_at) {
      console.log(`  任务${task.id}: 无created_at -> 被过滤`);
      return false;
    }
    
    const category = task.category;
    if (!category || category === '0' || category === 'null') {
      console.log(`  任务${task.id}: category="${category}" -> 被category过滤`);
      return false;
    }
    
    const createdAtStr = task.created_at.includes('Z') ? task.created_at : task.created_at + 'Z';
    const createdDate = new Date(createdAtStr);
    const inRange = createdDate >= monday && createdDate <= sunday;
    
    console.log(`  任务${task.id}: category="${category}", created_at="${createdAtStr}", 在范围内=${inRange}`);
    return inRange;
  });

  console.log();
  console.log(`本周有效任务数: ${tasksInRange.length}`);

  db.close();
});
