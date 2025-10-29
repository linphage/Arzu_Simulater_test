const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'database_new_2025-09-25T08-54-04-778Z.db');

console.log('🔧 [修复脚本] 开始修复 task_brieflogs 表的 brief_type 约束...');
console.log(`📁 [修复脚本] 数据库路径: ${DB_PATH}\n`);

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ [修复脚本] 数据库连接失败:', err.message);
    process.exit(1);
  }
  console.log('✅ [修复脚本] 数据库连接成功\n');
});

db.serialize(() => {
  console.log('🔍 [修复脚本] 步骤1: 备份现有数据...');
  
  db.run(`CREATE TEMPORARY TABLE task_brieflogs_backup AS SELECT * FROM task_brieflogs`, (err) => {
    if (err) {
      console.error('❌ [修复脚本] 备份失败:', err.message);
      db.close();
      process.exit(1);
    }
    console.log('✅ [修复脚本] 数据备份完成\n');

    console.log('🔍 [修复脚本] 步骤2: 删除旧表...');
    db.run(`DROP TABLE task_brieflogs`, (err) => {
      if (err) {
        console.error('❌ [修复脚本] 删除旧表失败:', err.message);
        db.close();
        process.exit(1);
      }
      console.log('✅ [修复脚本] 旧表已删除\n');

      console.log('🔍 [修复脚本] 步骤3: 创建新表（支持 brief_type 1-7）...');
      db.run(`
        CREATE TABLE task_brieflogs (
          debrief_id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id INTEGER,
          task_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          brief_type INTEGER NOT NULL CHECK(brief_type IN (1, 2, 3, 4, 5, 6, 7)),
          brief_content TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (session_id) REFERENCES pomodoro_sessions(id) ON DELETE CASCADE,
          FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          console.error('❌ [修复脚本] 创建新表失败:', err.message);
          db.close();
          process.exit(1);
        }
        console.log('✅ [修复脚本] 新表创建完成（CHECK 约束: brief_type IN (1-7)）\n');

        console.log('🔍 [修复脚本] 步骤4: 恢复数据...');
        db.run(`
          INSERT INTO task_brieflogs 
          SELECT * FROM task_brieflogs_backup
        `, (err) => {
          if (err) {
            console.error('❌ [修复脚本] 数据恢复失败:', err.message);
            db.close();
            process.exit(1);
          }
          console.log('✅ [修复脚本] 数据恢复完成\n');

          console.log('🔍 [修复脚本] 步骤5: 删除备份表...');
          db.run(`DROP TABLE task_brieflogs_backup`, (err) => {
            if (err) {
              console.error('❌ [修复脚本] 删除备份表失败:', err.message);
              db.close();
              process.exit(1);
            }
            console.log('✅ [修复脚本] 备份表已清理\n');

            console.log('🔍 [修复脚本] 步骤6: 验证新约束...');
            db.get(`SELECT sql FROM sqlite_master WHERE type='table' AND name='task_brieflogs'`, (err, row) => {
              if (err) {
                console.error('❌ [修复脚本] 验证失败:', err.message);
                db.close();
                process.exit(1);
              }
              
              console.log('✅ [修复脚本] 表结构验证:');
              console.log(row.sql);
              console.log('\n🎉 [修复脚本] 所有步骤完成！');
              console.log('✅ [修复脚本] task_brieflogs 表现已支持 brief_type 1-7\n');
              
              db.close((err) => {
                if (err) {
                  console.error('❌ [修复脚本] 关闭数据库失败:', err.message);
                  process.exit(1);
                }
                console.log('✅ [修复脚本] 数据库连接已关闭');
                process.exit(0);
              });
            });
          });
        });
      });
    });
  });
});
