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

console.log('本周范围 (当地时间):');
console.log('  开始:', monday.toISOString(), '(本地:', monday.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) + ')');
console.log('  结束:', sunday.toISOString(), '(本地:', sunday.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) + ')');
console.log();

db.all('SELECT id, title, category, created_at FROM tasks WHERE user_id = 2 AND deleted_at IS NULL ORDER BY created_at DESC', [], (err, allTasks) => {
  if (err) {
    console.error('查询失败:', err);
    db.close();
    return;
  }
  
  console.log(`用户2的所有未删除任务 (共${allTasks.length}条)`);
  console.log();
  
  console.log('=== 过滤测试 ===');
  let passCount = 0;
  let failCount = 0;
  
  allTasks.forEach(task => {
    const createdAtStr = task.created_at.includes('Z') ? task.created_at : task.created_at + 'Z';
    const createdDate = new Date(createdAtStr);
    
    const hasCreatedAt = !!task.created_at;
    const categoryValue = task.category;
    const categoryType = typeof categoryValue;
    const isValidCategory = categoryValue && categoryValue !== '' && categoryValue !== 'null' && categoryValue !== '0' && categoryValue !== 0 && categoryValue !== null;
    const validCategories = ['勤政', '恕己', '爱人'];
    const inValidList = isValidCategory && validCategories.includes(categoryValue);
    const inRange = createdDate >= monday && createdDate <= sunday;
    
    const pass = hasCreatedAt && isValidCategory && inValidList && inRange;
    
    if (pass) passCount++;
    else failCount++;
    
    console.log(`任务${task.id}: ${task.title}`);
    console.log(`  category: "${categoryValue}" (类型: ${categoryType}, null?=${categoryValue === null})`);
    console.log(`  created_at: ${task.created_at} -> ${createdDate.toISOString()}`);
    console.log(`  检查结果: hasCreatedAt=${hasCreatedAt}, isValidCategory=${isValidCategory}, inValidList=${inValidList}, inRange=${inRange}`);
    console.log(`  最终结果: ${pass ? '✅ 通过' : '❌ 被过滤'}`);
    console.log();
  });
  
  console.log('=== 统计结果 ===');
  console.log(`总任务数: ${allTasks.length}`);
  console.log(`本周有效任务: ${passCount}`);
  console.log(`被过滤任务: ${failCount}`);
  
  db.close();
});
