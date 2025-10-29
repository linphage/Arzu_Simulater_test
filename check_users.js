const path = require('path');
const sqlite3 = require(path.join(__dirname, 'Arzu_simulator_back', 'node_modules', 'sqlite3')).verbose();

const dbPath = path.join(__dirname, 'Arzu_simulator_back', 'database_new_2025-09-25T08-54-04-778Z.db');
const db = new sqlite3.Database(dbPath);

db.all("SELECT user_id, username, email FROM users", [], (err, rows) => {
  if (err) {
    console.error('❌ 查询失败:', err);
    db.close();
    return;
  }
  
  console.log('👥 [用户列表]:');
  rows.forEach(row => {
    console.log(`  用户ID=${row.user_id}, username=${row.username}, email=${row.email}`);
  });
  
  db.close();
});
