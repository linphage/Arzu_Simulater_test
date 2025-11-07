/**
 * 一次性数据修复脚本：清理和修正 focus_periods 表中的异常数据
 * 
 * 问题：
 * 1. 存在 end_time 为 NULL 的僵尸记录
 * 2. 存在 duration_min 超过合理范围（如 719.1, 325.7, 3913.1）的记录
 * 
 * 解决方案：
 * 1. 自动结束所有超过 2 小时的未结束 focus_period
 * 2. 修正所有超过 120 分钟的 duration_min 值
 * 
 * 使用方法：
 * node scripts/fix-zombie-focus-periods.js
 */

require('dotenv').config();
const { Pool } = require('pg');
const sqlite3 = require('sqlite3');

const DB_TYPE = process.env.DATABASE_URL ? 'postgres' : 'sqlite';
const MAX_DURATION_MINUTES = 120; // 最大允许时长
const MAX_UNFINISHED_HOURS = 2; // 超过2小时未结束的视为僵尸记录

console.log('🔧 [数据修复] 开始修复 focus_periods 表的异常数据...');
console.log(`📊 [数据修复] 数据库类型: ${DB_TYPE}`);

async function fixWithPostgres() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🔍 [PostgreSQL] 正在连接数据库...');
    await pool.query('SELECT 1');
    console.log('✅ [PostgreSQL] 数据库连接成功\n');

    // 步骤1: 查找所有未结束的 focus_period
    console.log('🔍 [步骤1] 查找未结束的 focus_period...');
    const unfinishedResult = await pool.query(`
      SELECT period_id, session_id, start_time, 
             EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - start_time)) / 3600 as hours_elapsed
      FROM focus_periods
      WHERE end_time IS NULL
      ORDER BY start_time ASC
    `);

    const unfinishedPeriods = unfinishedResult.rows;
    console.log(`📊 [步骤1] 找到 ${unfinishedPeriods.length} 个未结束的 focus_period`);

    if (unfinishedPeriods.length > 0) {
      console.log('\n未结束的记录详情:');
      unfinishedPeriods.forEach(p => {
        console.log(`  - Period ID: ${p.period_id}, Session ID: ${p.session_id}, 开始时间: ${p.start_time}, 已经过: ${Math.round(p.hours_elapsed * 10) / 10} 小时`);
      });

      // 自动结束超过 MAX_UNFINISHED_HOURS 的记录
      const zombiePeriods = unfinishedPeriods.filter(p => p.hours_elapsed > MAX_UNFINISHED_HOURS);
      
      if (zombiePeriods.length > 0) {
        console.log(`\n⚠️  [步骤1] 发现 ${zombiePeriods.length} 个僵尸记录（超过 ${MAX_UNFINISHED_HOURS} 小时未结束），正在自动结束...`);
        
        for (const period of zombiePeriods) {
          // 设置结束时间为开始时间 + MAX_DURATION_MINUTES
          const endTime = new Date(new Date(period.start_time).getTime() + MAX_DURATION_MINUTES * 60000).toISOString();
          
          await pool.query(`
            UPDATE focus_periods
            SET end_time = $1,
                duration_min = $2,
                is_interrupted = true
            WHERE period_id = $3
          `, [endTime, MAX_DURATION_MINUTES, period.period_id]);
          
          console.log(`  ✅ Period ID ${period.period_id} 已自动结束，duration_min 设为 ${MAX_DURATION_MINUTES} 分钟`);
        }
      } else {
        console.log(`✅ [步骤1] 所有未结束的记录都在合理时间范围内（<${MAX_UNFINISHED_HOURS}小时），无需处理`);
      }
    } else {
      console.log('✅ [步骤1] 未发现未结束的 focus_period');
    }

    // 步骤2: 查找并修正异常的 duration_min
    console.log('\n🔍 [步骤2] 查找异常的 duration_min...');
    const abnormalResult = await pool.query(`
      SELECT period_id, session_id, start_time, end_time, duration_min
      FROM focus_periods
      WHERE duration_min > $1 OR duration_min < 0
      ORDER BY duration_min DESC
    `, [MAX_DURATION_MINUTES]);

    const abnormalPeriods = abnormalResult.rows;
    console.log(`📊 [步骤2] 找到 ${abnormalPeriods.length} 个异常的 duration_min 记录`);

    if (abnormalPeriods.length > 0) {
      console.log('\n异常记录详情:');
      abnormalPeriods.forEach(p => {
        console.log(`  - Period ID: ${p.period_id}, Session ID: ${p.session_id}, duration_min: ${p.duration_min} 分钟`);
      });

      console.log(`\n⚠️  [步骤2] 正在修正这些异常值...`);
      
      for (const period of abnormalPeriods) {
        let fixedDuration;
        
        if (period.duration_min < 0) {
          fixedDuration = 0;
        } else if (period.duration_min > MAX_DURATION_MINUTES) {
          fixedDuration = MAX_DURATION_MINUTES;
        }
        
        await pool.query(`
          UPDATE focus_periods
          SET duration_min = $1
          WHERE period_id = $2
        `, [fixedDuration, period.period_id]);
        
        console.log(`  ✅ Period ID ${period.period_id} 的 duration_min 从 ${period.duration_min} 修正为 ${fixedDuration} 分钟`);
      }
    } else {
      console.log('✅ [步骤2] 未发现异常的 duration_min');
    }

    // 步骤3: 统计修复结果
    console.log('\n📊 [步骤3] 生成修复报告...');
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_periods,
        COUNT(CASE WHEN end_time IS NULL THEN 1 END) as unfinished_periods,
        COUNT(CASE WHEN duration_min > $1 THEN 1 END) as abnormal_durations,
        MAX(duration_min) as max_duration,
        MIN(duration_min) as min_duration,
        AVG(duration_min) as avg_duration
      FROM focus_periods
    `, [MAX_DURATION_MINUTES]);

    const stats = statsResult.rows[0];
    console.log('\n=== 修复后的数据统计 ===');
    console.log(`总记录数: ${stats.total_periods}`);
    console.log(`未结束记录: ${stats.unfinished_periods}`);
    console.log(`异常时长记录: ${stats.abnormal_durations}`);
    console.log(`最大时长: ${stats.max_duration} 分钟`);
    console.log(`最小时长: ${stats.min_duration} 分钟`);
    console.log(`平均时长: ${Math.round(stats.avg_duration * 10) / 10} 分钟`);

    console.log('\n🎉 [完成] 数据修复完成！');

  } catch (error) {
    console.error('\n❌ [错误] 数据修复失败:', error.message);
    throw error;
  } finally {
    await pool.end();
    console.log('\n✅ [PostgreSQL] 数据库连接已关闭');
  }
}

async function fixWithSQLite() {
  const dbPath = process.env.DB_PATH || './database.db';
  
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ [SQLite] 连接失败:', err.message);
        reject(err);
        return;
      }
      
      console.log('✅ [SQLite] 数据库连接成功\n');

      // 步骤1: 查找未结束的 focus_period
      console.log('🔍 [步骤1] 查找未结束的 focus_period...');
      
      db.all(`
        SELECT period_id, session_id, start_time,
               (julianday('now') - julianday(start_time)) * 24 as hours_elapsed
        FROM focus_periods
        WHERE end_time IS NULL
        ORDER BY start_time ASC
      `, [], async (err, rows) => {
        if (err) {
          console.error('❌ 查询失败:', err.message);
          db.close();
          reject(err);
          return;
        }

        console.log(`📊 [步骤1] 找到 ${rows.length} 个未结束的 focus_period`);

        if (rows.length > 0) {
          console.log('\n未结束的记录详情:');
          rows.forEach(p => {
            console.log(`  - Period ID: ${p.period_id}, Session ID: ${p.session_id}, 开始时间: ${p.start_time}, 已经过: ${Math.round(p.hours_elapsed * 10) / 10} 小时`);
          });

          const zombiePeriods = rows.filter(p => p.hours_elapsed > MAX_UNFINISHED_HOURS);
          
          if (zombiePeriods.length > 0) {
            console.log(`\n⚠️  [步骤1] 发现 ${zombiePeriods.length} 个僵尸记录，正在自动结束...`);
            
            const updatePromises = zombiePeriods.map(period => {
              return new Promise((resolveUpdate, rejectUpdate) => {
                const startMs = new Date(period.start_time.replace(' ', 'T') + 'Z').getTime();
                const endTime = new Date(startMs + MAX_DURATION_MINUTES * 60000).toISOString();
                
                db.run(`
                  UPDATE focus_periods
                  SET end_time = datetime(?),
                      duration_min = ?,
                      is_interrupted = 1
                  WHERE period_id = ?
                `, [endTime, MAX_DURATION_MINUTES, period.period_id], function(err) {
                  if (err) {
                    console.error(`  ❌ Period ID ${period.period_id} 更新失败:`, err.message);
                    rejectUpdate(err);
                  } else {
                    console.log(`  ✅ Period ID ${period.period_id} 已自动结束`);
                    resolveUpdate();
                  }
                });
              });
            });

            await Promise.all(updatePromises);
          }
        }

        // 步骤2: 修正异常 duration_min
        console.log('\n🔍 [步骤2] 查找异常的 duration_min...');
        
        db.all(`
          SELECT period_id, session_id, duration_min
          FROM focus_periods
          WHERE duration_min > ? OR duration_min < 0
          ORDER BY duration_min DESC
        `, [MAX_DURATION_MINUTES], async (err, rows) => {
          if (err) {
            console.error('❌ 查询失败:', err.message);
            db.close();
            reject(err);
            return;
          }

          console.log(`📊 [步骤2] 找到 ${rows.length} 个异常记录`);

          if (rows.length > 0) {
            console.log('\n⚠️  [步骤2] 正在修正异常值...');
            
            for (const period of rows) {
              const fixedDuration = period.duration_min < 0 ? 0 : MAX_DURATION_MINUTES;
              
              await new Promise((resolveUpdate) => {
                db.run(`
                  UPDATE focus_periods
                  SET duration_min = ?
                  WHERE period_id = ?
                `, [fixedDuration, period.period_id], () => {
                  console.log(`  ✅ Period ID ${period.period_id} 修正为 ${fixedDuration} 分钟`);
                  resolveUpdate();
                });
              });
            }
          }

          // 生成报告
          console.log('\n📊 [步骤3] 生成修复报告...');
          db.get(`
            SELECT 
              COUNT(*) as total_periods,
              SUM(CASE WHEN end_time IS NULL THEN 1 ELSE 0 END) as unfinished_periods,
              SUM(CASE WHEN duration_min > ? THEN 1 ELSE 0 END) as abnormal_durations,
              MAX(duration_min) as max_duration,
              MIN(duration_min) as min_duration,
              AVG(duration_min) as avg_duration
            FROM focus_periods
          `, [MAX_DURATION_MINUTES], (err, stats) => {
            if (!err) {
              console.log('\n=== 修复后的数据统计 ===');
              console.log(`总记录数: ${stats.total_periods}`);
              console.log(`未结束记录: ${stats.unfinished_periods}`);
              console.log(`异常时长记录: ${stats.abnormal_durations}`);
              console.log(`最大时长: ${stats.max_duration} 分钟`);
              console.log(`最小时长: ${stats.min_duration} 分钟`);
              console.log(`平均时长: ${Math.round(stats.avg_duration * 10) / 10} 分钟`);
            }

            console.log('\n🎉 [完成] 数据修复完成！');
            db.close(() => {
              console.log('\n✅ [SQLite] 数据库连接已关闭');
              resolve();
            });
          });
        });
      });
    });
  });
}

// 执行修复
(async () => {
  try {
    if (DB_TYPE === 'postgres') {
      await fixWithPostgres();
    } else {
      await fixWithSQLite();
    }
  } catch (error) {
    console.error('\n❌ 脚本执行失败:', error);
    process.exit(1);
  }
})();
