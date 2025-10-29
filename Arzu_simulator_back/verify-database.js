const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// 获取最新的数据库文件
const dbDir = __dirname;
const dbFiles = fs.readdirSync(dbDir).filter(file => file.startsWith('database_new_') && file.endsWith('.db'));

if (dbFiles.length === 0) {
  console.error('❌ 未找到新的数据库文件');
  process.exit(1);
}

const latestDbFile = dbFiles.sort().pop();
const dbPath = path.join(dbDir, latestDbFile);

console.log(`🔍 验证数据库文件: ${latestDbFile}`);

// 连接数据库
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ 数据库连接失败:', err.message);
    process.exit(1);
  }
  console.log('✅ 数据库连接成功');
});

// 验证users表结构
function verifyUsersTable() {
  return new Promise((resolve, reject) => {
    db.all("PRAGMA table_info(users)", (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      console.log('\n📋 users表结构验证:');
      
      const expectedFields = [
        { name: 'user_id', type: 'INTEGER', notnull: 0, pk: 1 },
        { name: 'mail', type: 'VARCHAR(255)', notnull: 1, pk: 0 },
        { name: 'usernam', type: 'VARCHAR(255)', notnull: 1, pk: 0 },
        { name: 'password_hash', type: 'VARCHAR(255)', notnull: 1, pk: 0 },
        { name: 'created_at', type: 'DATETIME', notnull: 0, pk: 0, dflt_value: 'CURRENT_TIMESTAMP' },
        { name: 'api_ds', type: 'VARCHAR(120)', notnull: 0, pk: 0 },
        { name: 'work_count', type: 'INTEGER', notnull: 0, pk: 0, dflt_value: '0' },
        { name: 'worktime_count', type: 'INTEGER', notnull: 0, pk: 0, dflt_value: '0' }
      ];
      
      let allCorrect = true;
      
      expectedFields.forEach(expected => {
        const actual = rows.find(row => row.name === expected.name);
        if (!actual) {
          console.error(`❌ 缺少字段: ${expected.name}`);
          allCorrect = false;
        } else {
          const checks = [
            { name: '类型', expected: expected.type, actual: actual.type },
            { name: '非空', expected: expected.notnull, actual: actual.notnull },
            { name: '主键', expected: expected.pk, actual: actual.pk },
            { name: '默认值', expected: expected.dflt_value, actual: actual.dflt_value }
          ];
          
          checks.forEach(check => {
            if (check.expected !== undefined && check.expected !== check.actual) {
              console.error(`❌ 字段 ${expected.name} 的${check.name}不匹配: 期望 ${check.expected}, 实际 ${check.actual}`);
              allCorrect = false;
            }
          });
          
          if (allCorrect) {
            console.log(`✅ 字段 ${expected.name}: 类型=${actual.type}, 非空=${actual.notnull ? '是' : '否'}, 主键=${actual.pk ? '是' : '否'}`);
          }
        }
      });
      
      resolve(allCorrect);
    });
  });
}

// 验证索引
function verifyIndexes() {
  return new Promise((resolve, reject) => {
    db.all("PRAGMA index_list(users)", (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      console.log('\n🔑 索引验证:');
      
      const expectedIndexes = ['idx_users_mail', 'idx_users_usernam'];
      let allCorrect = true;
      
      expectedIndexes.forEach(indexName => {
        const index = rows.find(row => row.name === indexName);
        if (!index) {
          console.error(`❌ 缺少索引: ${indexName}`);
          allCorrect = false;
        } else {
          console.log(`✅ 索引存在: ${indexName}`);
        }
      });
      
      resolve(allCorrect);
    });
  });
}

// 验证测试数据
function verifyTestData() {
  return new Promise((resolve, reject) => {
    db.get("SELECT COUNT(*) as count FROM users WHERE usernam = 'testuser'", (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      
      console.log('\n📊 测试数据验证:');
      if (row.count > 0) {
        console.log('✅ 测试用户已存在');
        resolve(true);
      } else {
        console.log('⚠️  未找到测试用户');
        resolve(false);
      }
    });
  });
}

// 执行所有验证
async function runVerification() {
  try {
    const usersTableCorrect = await verifyUsersTable();
    const indexesCorrect = await verifyIndexes();
    const testDataExists = await verifyTestData();
    
    console.log('\n' + '='.repeat(50));
    console.log('📋 验证结果总结:');
    console.log(`users表结构: ${usersTableCorrect ? '✅ 正确' : '❌ 错误'}`);
    console.log(`索引验证: ${indexesCorrect ? '✅ 正确' : '❌ 错误'}`);
    console.log(`测试数据: ${testDataExists ? '✅ 存在' : '⚠️  不存在'}`);
    
    if (usersTableCorrect && indexesCorrect) {
      console.log('\n🎉 数据库验证通过！表结构符合loginplan.md规范。');
    } else {
      console.log('\n❌ 数据库验证失败！请检查表结构。');
    }
    
  } catch (error) {
    console.error('❌ 验证过程出错:', error.message);
  } finally {
    db.close();
  }
}

// 运行验证
runVerification();