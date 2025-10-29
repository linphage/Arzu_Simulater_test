const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database_new_2025-09-25T08-54-04-778Z.db');
const db = new sqlite3.Database(dbPath);

console.log('\n========== 数据库表检查 ==========\n');

db.all(`
  SELECT name FROM sqlite_master 
  WHERE type='table' AND name NOT LIKE 'sqlite_%'
  ORDER BY name
`, (err, tables) => {
  if (err) {
    console.error('查询表失败:', err);
    db.close();
    return;
  }

  console.log('数据库中的表：');
  if (tables.length === 0) {
    console.log('  ❌ 没有找到任何表');
  } else {
    tables.forEach(table => {
      console.log(`  - ${table.name}`);
    });
  }

  console.log('\n========== users 表字段检查 ==========\n');

  db.all(`PRAGMA table_info(users)`, (err, usersFields) => {
    if (err || !usersFields || usersFields.length === 0) {
      console.log('  ❌ users 表不存在或没有字段');
    } else {
      console.log('users 表字段：');
      usersFields.forEach(field => {
        console.log(`  - ${field.name} (${field.type})`);
      });
    }

    console.log('\n========== tasks 表字段检查 ==========\n');

    db.all(`PRAGMA table_info(tasks)`, (err, tasksFields) => {
      if (err || !tasksFields || tasksFields.length === 0) {
        console.log('  ❌ tasks 表不存在或没有字段');
      } else {
        console.log('tasks 表字段：');
        tasksFields.forEach(field => {
          console.log(`  - ${field.name} (${field.type})`);
        });
      }

      console.log('\n========== 检查完成 ==========\n');
      db.close();
    });
  });
});
