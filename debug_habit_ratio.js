const path = require('path');
const sqlite3 = require(path.join(__dirname, 'Arzu_simulator_back', 'node_modules', 'sqlite3')).verbose();

const dbPath = path.join(__dirname, 'Arzu_simulator_back', 'database_new_2025-09-25T08-54-04-778Z.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 [调试] 问题事件比例计算\n');

const now = new Date();
const currentDay = now.getDay();
const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay;

const monday = new Date(now);
monday.setDate(now.getDate() + daysToMonday);
monday.setHours(0, 0, 0, 0);

const sunday = new Date(monday);
sunday.setDate(monday.getDate() + 6);
sunday.setHours(23, 59, 59, 999);

const startStr_Wrong = monday.toISOString().replace('T', ' ').substring(0, 19);
const endStr_Wrong = sunday.toISOString().replace('T', ' ').substring(0, 19);

console.log('❌ [错误方法] 使用 toISOString() (会转为UTC):');
console.log(`  本周一 0:00: ${startStr_Wrong}`);
console.log(`  本周日 24:00: ${endStr_Wrong}`);

const formatLocalTime = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const startStr_Correct = formatLocalTime(monday);
const endStr_Correct = formatLocalTime(sunday);

console.log('\n✅ [正确方法] 使用本地时间格式化:');
console.log(`  本周一 0:00: ${startStr_Correct}`);
console.log(`  本周日 24:00: ${endStr_Correct}`);

db.serialize(() => {
  console.log('\n📊 [检查1] 问题事件总数 (brief_type 1-4):\n');
  
  db.all(`
    SELECT task_id, brief_type, created_at
    FROM task_brieflogs
    WHERE user_id = 2
      AND brief_type IN (1, 2, 3, 4)
      AND created_at >= ?
      AND created_at <= ?
    ORDER BY created_at DESC
  `, [startStr_Wrong, endStr_Wrong], (err, rows) => {
    if (err) {
      console.error('❌ 查询失败:', err);
      return;
    }
    
    console.log(`  使用错误范围查询: 找到 ${rows.length} 条记录`);
    const uniqueTaskIds_Wrong = new Set(rows.map(r => r.task_id));
    console.log(`  唯一任务数(错误): ${uniqueTaskIds_Wrong.size}`);
    
    rows.forEach(row => {
      console.log(`    task_id=${row.task_id}, brief_type=${row.brief_type}, created_at=${row.created_at}`);
    });
  });

  db.all(`
    SELECT task_id, brief_type, created_at
    FROM task_brieflogs
    WHERE user_id = 2
      AND brief_type IN (1, 2, 3, 4)
      AND created_at >= ?
      AND created_at <= ?
    ORDER BY created_at DESC
  `, [startStr_Correct, endStr_Correct], (err, rows) => {
    if (err) {
      console.error('❌ 查询失败:', err);
      return;
    }
    
    console.log(`\n  使用正确范围查询: 找到 ${rows.length} 条记录`);
    const uniqueTaskIds_Correct = new Set(rows.map(r => r.task_id));
    console.log(`  唯一任务数(正确): ${uniqueTaskIds_Correct.size}`);
    
    rows.forEach(row => {
      console.log(`    task_id=${row.task_id}, brief_type=${row.brief_type}, created_at=${row.created_at}`);
    });
  });

  console.log('\n📊 [检查2] 本周创建的任务 (category != "0"):\n');

  db.all(`
    SELECT id, category, created_at
    FROM tasks
    WHERE user_id = 2
      AND created_at >= ?
      AND created_at <= ?
    ORDER BY created_at DESC
  `, [startStr_Wrong, endStr_Wrong], (err, rows) => {
    if (err) {
      console.error('❌ 查询失败:', err);
      return;
    }
    
    console.log(`  使用错误范围查询: 找到 ${rows.length} 个任务`);
    const filtered_Wrong = rows.filter(r => r.category !== '0');
    console.log(`  category != "0" 的任务(错误): ${filtered_Wrong.length}`);
    
    filtered_Wrong.forEach(row => {
      console.log(`    id=${row.id}, category="${row.category}", created_at=${row.created_at}`);
    });
  });

  db.all(`
    SELECT id, category, created_at
    FROM tasks
    WHERE user_id = 2
      AND created_at >= ?
      AND created_at <= ?
    ORDER BY created_at DESC
  `, [startStr_Correct, endStr_Correct], (err, rows) => {
    if (err) {
      console.error('❌ 查询失败:', err);
      db.close();
      return;
    }
    
    console.log(`\n  使用正确范围查询: 找到 ${rows.length} 个任务`);
    const filtered_Correct = rows.filter(r => r.category !== '0');
    console.log(`  category != "0" 的任务(正确): ${filtered_Correct.length}`);
    
    filtered_Correct.forEach(row => {
      console.log(`    id=${row.id}, category="${row.category}", created_at=${row.created_at}`);
    });
    
    console.log('\n✅ [检查完成]');
    db.close();
  });
});
