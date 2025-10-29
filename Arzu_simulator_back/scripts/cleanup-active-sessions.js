/**
 * 清理活跃会话和细分时间段脚本
 * 用途：在服务器启动前，清理所有未结束的番茄钟会话和细分时间段
 * 防止上次异常关闭导致的数据残留
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库文件路径
const DB_PATH = path.join(__dirname, '..', 'database_new_2025-09-25T08-54-04-778Z.db');

console.log('🔧 [清理脚本] 开始清理活跃会话和细分时间段...');
console.log(`📁 [清理脚本] 数据库路径: ${DB_PATH}\n`);

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ [清理脚本] 数据库连接失败:', err.message);
    process.exit(1);
  }
  console.log('✅ [清理脚本] 数据库连接成功\n');
});

// 1. 清理所有未结束的细分时间段
function cleanupFocusPeriods() {
  return new Promise((resolve, reject) => {
    console.log('🔍 [清理脚本] 步骤1: 查找未结束的细分时间段...');
    
    db.all(
      'SELECT period_id, session_id, start_time FROM focus_periods WHERE end_time IS NULL',
      [],
      (err, periods) => {
        if (err) {
          console.error('❌ [清理脚本] 查询失败:', err.message);
          reject(err);
          return;
        }

        console.log(`📊 [清理脚本] 找到 ${periods.length} 个未结束的细分时间段`);

        if (periods.length === 0) {
          console.log('✅ [清理脚本] 步骤1完成: 无需清理细分时间段\n');
          resolve();
          return;
        }

        let completed = 0;
        const endTime = new Date().toISOString();

        periods.forEach((period) => {
          // 计算时长
          const startTimeStr = period.start_time.includes('T') 
            ? period.start_time 
            : period.start_time.replace(' ', 'T') + 'Z';
          const startMs = new Date(startTimeStr).getTime();
          const endMs = new Date(endTime).getTime();
          const durationMin = Math.round((endMs - startMs) / 60000 * 10) / 10;

          db.run(
            `UPDATE focus_periods 
             SET end_time = datetime(?), 
                 duration_min = ?, 
                 is_interrupted = 1 
             WHERE period_id = ?`,
            [endTime, durationMin, period.period_id],
            (err) => {
              if (err) {
                console.error(`❌ [清理脚本] Period ${period.period_id} 清理失败:`, err.message);
              } else {
                console.log(`✅ [清理脚本] Period ${period.period_id} (Session ${period.session_id}) 已清理 - 时长: ${durationMin} 分钟`);
              }

              completed++;
              if (completed === periods.length) {
                console.log(`✅ [清理脚本] 步骤1完成: 已清理 ${periods.length} 个细分时间段\n`);
                resolve();
              }
            }
          );
        });
      }
    );
  });
}

// 2. 清理所有未结束的番茄钟会话
function cleanupPomodoroSessions() {
  return new Promise((resolve, reject) => {
    console.log('🔍 [清理脚本] 步骤2: 查找未结束的番茄钟会话...');
    
    db.all(
      'SELECT id, user_id, task_id, started_at FROM pomodoro_sessions WHERE completed_at IS NULL',
      [],
      (err, sessions) => {
        if (err) {
          console.error('❌ [清理脚本] 查询失败:', err.message);
          reject(err);
          return;
        }

        console.log(`📊 [清理脚本] 找到 ${sessions.length} 个未结束的会话`);

        if (sessions.length === 0) {
          console.log('✅ [清理脚本] 步骤2完成: 无需清理番茄钟会话\n');
          resolve();
          return;
        }

        let completed = 0;
        const endTime = new Date().toISOString();

        sessions.forEach((session) => {
          // 计算该会话的所有focus_periods总时长
          db.get(
            'SELECT COALESCE(SUM(duration_min), 0) as total FROM focus_periods WHERE session_id = ?',
            [session.id],
            (err, result) => {
              if (err) {
                console.error(`❌ [清理脚本] Session ${session.id} 时长计算失败:`, err.message);
                completed++;
                if (completed === sessions.length) {
                  console.log(`✅ [清理脚本] 步骤2完成: 已清理 ${sessions.length} 个会话\n`);
                  resolve();
                }
                return;
              }

              const actualDuration = Math.round((result.total || 0) * 10) / 10;

              db.run(
                `UPDATE pomodoro_sessions 
                 SET completed_at = datetime(?), 
                     duration_minutes = ?, 
                     completed = 0 
                 WHERE id = ?`,
                [endTime, actualDuration, session.id],
                (err) => {
                  if (err) {
                    console.error(`❌ [清理脚本] Session ${session.id} 清理失败:`, err.message);
                  } else {
                    console.log(`✅ [清理脚本] Session ${session.id} (Task ${session.task_id || 'N/A'}) 已清理 - 实际时长: ${actualDuration} 分钟`);
                  }

                  completed++;
                  if (completed === sessions.length) {
                    console.log(`✅ [清理脚本] 步骤2完成: 已清理 ${sessions.length} 个会话\n`);
                    resolve();
                  }
                }
              );
            }
          );
        });
      }
    );
  });
}

// 执行清理流程
(async () => {
  try {
    await cleanupFocusPeriods();
    await cleanupPomodoroSessions();
    
    console.log('🎉 [清理脚本] 所有清理任务完成！');
    console.log('✅ [清理脚本] 数据库状态已恢复正常\n');
    
    db.close((err) => {
      if (err) {
        console.error('❌ [清理脚本] 关闭数据库失败:', err.message);
        process.exit(1);
      }
      console.log('✅ [清理脚本] 数据库连接已关闭');
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ [清理脚本] 执行失败:', error.message);
    db.close();
    process.exit(1);
  }
})();
