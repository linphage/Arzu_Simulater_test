const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// 从环境变量或命令行参数获取数据库路径
const envDbPath = process.env.DB_PATH || './database.db';
const dbPath = path.join(__dirname, '..', envDbPath);

// 获取命令行参数中的迁移文件名
const args = process.argv.slice(2);
const migrationFile = args[0] || 'migrate-database.sql';

// 确定 SQL 文件路径
let sqlPath;
if (path.isAbsolute(migrationFile)) {
  sqlPath = migrationFile;
} else if (migrationFile.includes('/') || migrationFile.includes('\\')) {
  sqlPath = path.join(__dirname, '..', migrationFile);
} else {
  sqlPath = path.join(__dirname, migrationFile);
}

console.log('🔄 开始执行数据库迁移...');
console.log('📁 数据库路径:', dbPath);
console.log('📄 SQL 脚本路径:', sqlPath);

// 检查 SQL 文件是否存在
if (!fs.existsSync(sqlPath)) {
  console.error('❌ SQL 文件不存在:', sqlPath);
  process.exit(1);
}

// 读取 SQL 文件
const sql = fs.readFileSync(sqlPath, 'utf8');

// 连接数据库
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ 数据库连接失败:', err.message);
    process.exit(1);
  }
  console.log('✅ 数据库连接成功');
});

// 执行迁移脚本
db.exec(sql, (err) => {
  if (err) {
    console.error('❌ 迁移失败:', err.message);
    db.close();
    process.exit(1);
  }

  console.log('✅ 数据库迁移成功！');

  // 验证表结构
  db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", [], (err, tables) => {
    if (err) {
      console.error('❌ 查询表失败:', err.message);
    } else {
      console.log('\n📋 已创建的表:');
      tables.forEach(table => {
        console.log('  -', table.name);
      });
    }

    // 验证 users 表结构
    db.all("PRAGMA table_info(users)", [], (err, columns) => {
      if (err) {
        console.error('❌ 查询 users 表结构失败:', err.message);
      } else {
        console.log('\n👤 users 表字段:');
        columns.forEach(col => {
          console.log(`  - ${col.name} (${col.type})`);
        });
      }

      // 验证 tasks 表结构
      db.all("PRAGMA table_info(tasks)", [], (err, columns) => {
        if (err) {
          console.error('❌ 查询 tasks 表结构失败:', err.message);
        } else {
          console.log('\n📝 tasks 表字段:');
          columns.forEach(col => {
            console.log(`  - ${col.name} (${col.type})`);
          });
        }

        // 关闭数据库连接
        db.close((err) => {
          if (err) {
            console.error('❌ 关闭数据库失败:', err.message);
          } else {
            console.log('\n✅ 数据库迁移完成！');
          }
        });
      });
    });
  });
});
