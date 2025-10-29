const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database_new_2025-09-25T08-54-04-778Z.db');

console.log('🔍 开始清理活跃会话和细分时间段...\n');

// 1. 查找并结束所有未结束的细分时间段
db.all('SELECT period_id, session_id, start_time FROM focus_periods WHERE end_time IS NULL', [], (err, periods) => {
  if (err) {
    console.error('❌ 查询未结束的细分时间段失败:', err);
    db.close();
    return;
  }

  console.log(`📊 找到 ${periods.length} 个未结束的细分时间段`);

  if (periods.length === 0) {
    checkSessions();
    return;
  }

  let completed = 0;
  const endTime = new Date().toISOString();

  periods.forEach((period) => {
    const startTime = period.start_time;
    const startMs = new Date(startTime.replace(' ', 'T') + 'Z').getTime();
    const endMs = new Date(endTime).getTime();
    const durationMin = Math.round((endMs - startMs) / 60000 * 10) / 10;

    db.run(
      'UPDATE focus_periods SET end_time = datetime(?), duration_min = ?, is_interrupted = 1 WHERE period_id = ?',
      [endTime, durationMin, period.period_id],
      (err) => {
        if (err) {
          console.error(`❌ 结束 period ${period.period_id} 失败:`, err);
        } else {
          console.log(`✅ Period ${period.period_id} (session ${period.session_id}) 已结束，时长: ${durationMin} 分钟`);
        }

        completed++;
        if (completed === periods.length) {
          checkSessions();
        }
      }
    );
  });
});

// 2. 检查并结束未结束的会话
function checkSessions() {
  console.log('\n🔍 检查未结束的番茄钟会话...\n');

  db.all(
    'SELECT id, user_id, task_id, started_at, duration_minutes FROM pomodoro_sessions WHERE completed_at IS NULL',
    [],
    (err, sessions) => {
      if (err) {
        console.error('❌ 查询未结束的会话失败:', err);
        db.close();
        return;
      }

      console.log(`📊 找到 ${sessions.length} 个未结束的会话`);

      if (sessions.length === 0) {
        console.log('\n✅ 清理完成！');
        db.close();
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
              console.error(`❌ 计算 session ${session.id} 时长失败:`, err);
              completed++;
              if (completed === sessions.length) {
                console.log('\n✅ 清理完成！');
                db.close();
              }
              return;
            }

            const actualDuration = Math.round((result.total || 0) * 10) / 10;

            db.run(
              'UPDATE pomodoro_sessions SET completed_at = datetime(?), duration_minutes = ?, is_completed = 0 WHERE id = ?',
              [endTime, actualDuration, session.id],
              (err) => {
                if (err) {
                  console.error(`❌ 结束 session ${session.id} 失败:`, err);
                } else {
                  console.log(`✅ Session ${session.id} (task ${session.task_id}) 已结束，实际时长: ${actualDuration} 分钟`);
                }

                completed++;
                if (completed === sessions.length) {
                  console.log('\n✅ 清理完成！');
                  db.close();
                }
              }
            );
          }
        );
      });
    }
  );
}
