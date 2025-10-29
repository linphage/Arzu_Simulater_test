const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// 数据库文件路径
const dbPath = path.join(__dirname, '..', 'database.db');
const migrationPath = path.join(__dirname, '..', 'src', 'database', 'migrations', '003-reinitialize-database.sql');

console.log('🔄 开始重新初始化数据库...');

// 删除现有数据库文件
if (fs.existsSync(dbPath)) {
  console.log('📁 删除现有数据库文件...');
  try {
    fs.unlinkSync(dbPath);
    console.log('✅ 数据库文件已删除');
  } catch (error) {
    console.error('❌ 删除数据库文件失败:', error.message);
    process.exit(1);
  }
}

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
const db = new sqlite3.Database(dbPath, (err) => {
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
  
  console.log('✅ 数据库重新初始化成功');
  
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
    }
    
    // 关闭数据库连接
    db.close((err) => {
      if (err) {
        console.error('❌ 关闭数据库连接失败:', err.message);
      } else {
        console.log('\n✅ 数据库重新初始化完成！');
      }
    });
  });
});