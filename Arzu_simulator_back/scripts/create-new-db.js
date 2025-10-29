const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// 创建新的数据库文件（带时间戳避免冲突）
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const newDbPath = path.join(__dirname, '..', `database_new_${timestamp}.db`);
const migrationPath = path.join(__dirname, '..', 'src', 'database', 'migrations', '003-reinitialize-database.sql');

console.log('🔄 创建新的数据库文件...');
console.log(`📁 新数据库路径: ${newDbPath}`);

// 读取SQL脚本
console.log('📖 读取SQL迁移脚本...');
let sql;
try {
  sql = fs.readFileSync(migrationPath, 'utf8');
  console.log('✅ SQL脚本读取成功');
} catch (error) {
  console.error('❌ 读取SQL脚本失败:', error.message);
  process.exit(1);
}

// 创建新数据库并执行SQL脚本
console.log('🗄️ 创建新数据库...');
const db = new sqlite3.Database(newDbPath, (err) => {
  if (err) {
    console.error('❌ 数据库连接失败:', err.message);
    process.exit(1);
  }
  console.log('✅ 数据库连接成功');
});

// 执行SQL脚本
db.exec(sql, function(err) {
  if (err) {
    console.error('❌ SQL脚本执行失败:', err.message);
    db.close();
    process.exit(1);
  }
  
  console.log('✅ 数据库初始化成功');
  
  // 验证表结构
  db.all("PRAGMA table_info(users)", (err, rows) => {
    if (err) {
      console.error('❌ 验证表结构失败:', err.message);
    } else {
      console.log('\n📋 新的users表结构:');
      console.log('字段名 | 类型 | 可空 | 默认值');
      console.log('--------------------------------');
      rows.forEach(row => {
        console.log(`${row.name.padEnd(15)} | ${row.type.padEnd(10)} | ${row.notnull ? 'NOT NULL' : 'NULL'.padEnd(8)} | ${row.dflt_value || ''}`);
      });
      
      // 添加测试用户
      console.log('\n🔧 添加测试用户...');
      const bcrypt = require('bcryptjs');
      const testPasswordHash = bcrypt.hashSync('Test123!@#', 10);
      
      db.run(
        'INSERT INTO users (usernam, mail, password_hash) VALUES (?, ?, ?)',
        ['testuser', 'test@example.com', testPasswordHash],
        function(err) {
          if (err) {
            console.error('❌ 添加测试用户失败:', err.message);
          } else {
            console.log('✅ 测试用户添加成功，ID:', this.lastID);
          }
          
          // 关闭数据库连接
          db.close((err) => {
            if (err) {
              console.error('❌ 关闭数据库连接失败:', err.message);
            } else {
              console.log('\n✅ 新数据库创建完成！');
              console.log(`💡 请将配置文件中的数据库路径更新为: ${path.basename(newDbPath)}`);
            }
          });
        }
      );
    }
  });
});