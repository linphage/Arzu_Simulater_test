const path = require('path');
const sqlite3 = require(path.join(__dirname, 'Arzu_simulator_back', 'node_modules', 'sqlite3')).verbose();

const dbPath = path.join(__dirname, 'Arzu_simulator_back', 'database_new_2025-09-25T08-54-04-778Z.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 [检查] task_brieflogs 表结构和数据...\n');

db.serialize(() => {
  console.log('📋 [表结构] task_brieflogs:');
  db.all("PRAGMA table_info(task_brieflogs)", [], (err, rows) => {
    if (err) {
      console.error('❌ 查询失败:', err);
      return;
    }
    rows.forEach(row => {
      console.log(`  - ${row.name} (${row.type})`);
    });
    console.log('');
  });

  console.log('📊 [示例数据] task_brieflogs:');
  db.all("SELECT * FROM task_brieflogs LIMIT 10", [], (err, rows) => {
    if (err) {
      console.error('❌ 查询失败:', err);
      return;
    }
    console.log(`  总记录数: ${rows.length}`);
    rows.forEach(row => {
      console.log(`  log_id=${row.log_id}, task_id=${row.task_id}, brief_type=${row.brief_type}, created_at=${row.created_at}`);
    });
    console.log('');
  });

  console.log('📋 [表结构] tasks:');
  db.all("PRAGMA table_info(tasks)", [], (err, rows) => {
    if (err) {
      console.error('❌ 查询失败:', err);
      return;
    }
    rows.forEach(row => {
      console.log(`  - ${row.name} (${row.type})`);
    });
    console.log('');
  });

  console.log('📊 [示例数据] tasks:');
  db.all("SELECT id, user_id, category, created_at FROM tasks LIMIT 5", [], (err, rows) => {
    if (err) {
      console.error('❌ 查询失败:', err);
      db.close();
      return;
    }
    rows.forEach(row => {
      console.log(`  id=${row.id}, user_id=${row.user_id}, category=${row.category}, created_at=${row.created_at}`);
    });
    
    console.log('\n📊 [统计数据] brief_type 分布:');
    db.all("SELECT brief_type, COUNT(*) as count FROM task_brieflogs GROUP BY brief_type", [], (err, rows) => {
      if (err) {
        console.error('❌ 查询失败:', err);
        db.close();
        return;
      }
      rows.forEach(row => {
        console.log(`  brief_type=${row.brief_type}: ${row.count}条`);
      });
      
      console.log('\n✅ [检查完成]');
      db.close();
    });
  });
});
