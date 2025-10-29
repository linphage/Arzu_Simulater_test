const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const dbPath = './database_new_2025-09-25T08-54-04-778Z.db';
const sqlPath = './scripts/final-migration.sql';

console.log('🔄 执行完整数据库迁移...');
console.log('📁 数据库:', dbPath);
console.log('📄 SQL脚本:', sqlPath);

const sql = fs.readFileSync(sqlPath, 'utf8');
const db = new sqlite3.Database(dbPath);

db.exec(sql, (err) => {
  if (err) {
    console.error('\n❌ 迁移失败:', err.message);
    db.close();
    process.exit(1);
  }
  
  console.log('\n✅ 迁移成功！');
  
  db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", (err2, rows) => {
    if (err2) {
      console.error('查询表失败:', err2);
    } else {
      console.log('\n📊 数据库中的表:');
      rows.forEach(r => console.log('  ✓', r.name));
      console.log('\n总共', rows.length, '个表');
    }
    db.close();
  });
});
