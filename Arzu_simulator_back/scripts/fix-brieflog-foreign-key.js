const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database_new_2025-09-25T08-54-04-778Z.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 [修复脚本] 开始修复 task_brieflogs 外键约束...');
console.log(`📁 [修复脚本] 数据库路径: ${dbPath}`);

db.serialize(() => {
  console.log('\n✅ [修复脚本] 数据库连接成功');
  
  db.run('PRAGMA foreign_keys = OFF;', (err) => {
    if (err) {
      console.error('❌ [修复脚本] 关闭外键检查失败:', err.message);
      db.close();
      return;
    }
    console.log('🔓 [修复脚本] 已临时关闭外键检查');
  });

  db.run('BEGIN TRANSACTION;', (err) => {
    if (err) {
      console.error('❌ [修复脚本] 开始事务失败:', err.message);
      db.close();
      return;
    }
    console.log('📝 [修复脚本] 事务已开始');
  });

  db.all('SELECT * FROM task_brieflogs;', [], (err, rows) => {
    if (err) {
      console.error('❌ [修复脚本] 读取旧数据失败:', err.message);
      db.run('ROLLBACK;');
      db.close();
      return;
    }
    console.log(`📊 [修复脚本] 备份了 ${rows.length} 条记录`);

    db.run('DROP TABLE IF EXISTS task_brieflogs;', (err) => {
      if (err) {
        console.error('❌ [修复脚本] 删除旧表失败:', err.message);
        db.run('ROLLBACK;');
        db.close();
        return;
      }
      console.log('🗑️  [修复脚本] 旧表已删除');

      const createTableSQL = `
        CREATE TABLE task_brieflogs (
          debrief_id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id INTEGER,
          task_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          brief_type INTEGER NOT NULL,
          brief_content TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
          FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
          FOREIGN KEY (session_id) REFERENCES pomodoro_sessions(id) ON DELETE CASCADE
        );
      `;

      db.run(createTableSQL, (err) => {
        if (err) {
          console.error('❌ [修复脚本] 创建新表失败:', err.message);
          db.run('ROLLBACK;');
          db.close();
          return;
        }
        console.log('✅ [修复脚本] 新表已创建（外键已修复: users.user_id）');

        db.run('CREATE INDEX idx_brieflogs_task ON task_brieflogs(task_id);', (err) => {
          if (err) console.error('⚠️  [修复脚本] 创建索引1失败:', err.message);
        });

        db.run('CREATE INDEX idx_brieflogs_user ON task_brieflogs(user_id);', (err) => {
          if (err) console.error('⚠️  [修复脚本] 创建索引2失败:', err.message);
        });

        db.run('CREATE INDEX idx_brieflogs_session ON task_brieflogs(session_id);', (err) => {
          if (err) console.error('⚠️  [修复脚本] 创建索引3失败:', err.message);
        });

        console.log('📑 [修复脚本] 索引已创建');

        if (rows.length > 0) {
          const insertSQL = `INSERT INTO task_brieflogs (debrief_id, session_id, task_id, user_id, brief_type, brief_content, created_at)
                             VALUES (?, ?, ?, ?, ?, ?, ?)`;
          
          let insertCount = 0;
          rows.forEach((row, index) => {
            db.run(insertSQL, [
              row.debrief_id,
              row.session_id,
              row.task_id,
              row.user_id,
              row.brief_type,
              row.brief_content,
              row.created_at
            ], (err) => {
              if (err) {
                console.error(`❌ [修复脚本] 插入记录 ${index + 1} 失败:`, err.message);
              } else {
                insertCount++;
                if (insertCount === rows.length) {
                  console.log(`✅ [修复脚本] 已恢复 ${insertCount} 条记录`);
                  finishTransaction();
                }
              }
            });
          });
        } else {
          console.log('ℹ️  [修复脚本] 无数据需要恢复');
          finishTransaction();
        }
      });
    });
  });

  function finishTransaction() {
    db.run('COMMIT;', (err) => {
      if (err) {
        console.error('❌ [修复脚本] 提交事务失败:', err.message);
        db.run('ROLLBACK;');
        db.close();
        return;
      }
      console.log('✅ [修复脚本] 事务已提交');

      db.run('PRAGMA foreign_keys = ON;', (err) => {
        if (err) {
          console.error('❌ [修复脚本] 重新启用外键检查失败:', err.message);
        } else {
          console.log('🔒 [修复脚本] 外键检查已重新启用');
        }

        db.all('PRAGMA foreign_key_check(task_brieflogs);', [], (err, rows) => {
          if (err) {
            console.error('❌ [修复脚本] 外键完整性检查失败:', err.message);
          } else if (rows.length > 0) {
            console.error('❌ [修复脚本] 外键完整性检查发现错误:', rows);
          } else {
            console.log('✅ [修复脚本] 外键完整性检查通过');
          }

          console.log('\n🎉 [修复脚本] 修复完成！');
          db.close((err) => {
            if (err) {
              console.error('❌ [修复脚本] 关闭数据库失败:', err.message);
            } else {
              console.log('👋 [修复脚本] 数据库连接已关闭');
            }
          });
        });
      });
    });
  }
});
