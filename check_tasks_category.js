const Database = require('better-sqlite3');
const db = new Database('./database_new_2025-09-25T08-54-04-778Z.db');

const now = new Date();
const currentDay = now.getDay();
const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay;

const monday = new Date(now);
monday.setDate(now.getDate() + daysToMonday);
monday.setHours(0, 0, 0, 0);

const sunday = new Date(monday);
sunday.setDate(monday.getDate() + 6);
sunday.setHours(23, 59, 59, 999);

const formatLocalTime = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

console.log('本周范围:');
console.log('开始:', formatLocalTime(monday));
console.log('结束:', formatLocalTime(sunday));
console.log();

const allTasks = db.prepare('SELECT id, title, category, created_at FROM tasks WHERE user_id = 2').all();
console.log('用户2的所有任务:');
allTasks.forEach(task => {
  console.log(`ID: ${task.id}, 标题: ${task.title}, 类别: ${task.category} (类型: ${typeof task.category}), 创建时间: ${task.created_at}`);
});
console.log();

const tasksInWeek = allTasks.filter(task => {
  if (!task.created_at) return false;
  
  const createdAtStr = task.created_at.includes('Z') ? task.created_at : task.created_at + 'Z';
  const createdDate = new Date(createdAtStr);
  
  const inRange = createdDate >= monday && createdDate <= sunday;
  console.log(`任务${task.id}: created_at="${task.created_at}", parsed="${createdDate.toISOString()}", 在范围内: ${inRange}`);
  
  return inRange;
});

console.log('\n本周创建的任务:', tasksInWeek.length);

const tasksWithValidCategory = tasksInWeek.filter(task => {
  const category = task.category;
  
  const isInvalid = !category || category === '0' || category === 'null' || category === 0;
  console.log(`任务${task.id}: category=${category} (类型: ${typeof category}), 是否无效: ${isInvalid}`);
  
  return !isInvalid;
});

console.log('\n本周有效类别的任务:', tasksWithValidCategory.length);

db.close();
