const sqlite3 = require('./Arzu_simulator_back/node_modules/sqlite3').verbose();
const db = new sqlite3.Database('./Arzu_simulator_back/database_new_2025-09-25T08-54-04-778Z.db');

console.log('=== 检查用户表 ===');
db.all('SELECT user_id, username FROM users', [], (err, users) => {
  if (err) {
    console.error('查询失败:', err);
    db.close();
    return;
  }
  
  console.log('用户列表:');
  users.forEach(user => {
    console.log(`  ID: ${user.user_id}, 用户名: ${user.username}`);
  });
  console.log();

  console.log('=== 检查用户2的任务 ===');
  db.all('SELECT id, title, category, created_at FROM tasks WHERE user_id = 2 ORDER BY created_at DESC', [], (err, tasks) => {
    if (err) {
      console.error('查询失败:', err);
      db.close();
      return;
    }
    
    console.log(`用户2的任务列表 (共${tasks.length}条):`);
    tasks.forEach(task => {
      console.log(`  ID: ${task.id}, 标题: ${task.title}, 类别: "${task.category}" (${typeof task.category}), 创建时间: ${task.created_at}`);
    });
    
    db.close();
  });
});
