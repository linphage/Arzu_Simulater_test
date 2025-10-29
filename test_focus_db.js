const path = require('path');
const sqlite3 = require(path.join(__dirname, 'Arzu_simulator_back', 'node_modules', 'sqlite3')).verbose();

const dbPath = path.join(__dirname, 'Arzu_simulator_back', 'database_new_2025-09-25T08-54-04-778Z.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 [数据库检查] 开始检查专注度统计相关数据...\n');

db.serialize(() => {
  console.log('📋 [表结构] pomodoro_sessions:');
  db.all("PRAGMA table_info(pomodoro_sessions)", [], (err, rows) => {
    if (err) {
      console.error('❌ 查询失败:', err);
      return;
    }
    rows.forEach(row => {
      console.log(`  - ${row.name} (${row.type})`);
    });
    console.log('');
  });

  console.log('📋 [表结构] focus_periods:');
  db.all("PRAGMA table_info(focus_periods)", [], (err, rows) => {
    if (err) {
      console.error('❌ 查询失败:', err);
      return;
    }
    rows.forEach(row => {
      console.log(`  - ${row.name} (${row.type})`);
    });
    console.log('');
  });

  console.log('📊 [数据统计] pomodoro_sessions:');
  db.get("SELECT COUNT(*) as total FROM pomodoro_sessions", [], (err, row) => {
    if (err) {
      console.error('❌ 查询失败:', err);
      return;
    }
    console.log(`  总会话数: ${row.total}`);
  });

  db.all("SELECT id, user_id, task_id, duration_minutes, completed, started_at, completed_at FROM pomodoro_sessions LIMIT 5", [], (err, rows) => {
    if (err) {
      console.error('❌ 查询失败:', err);
      return;
    }
    console.log('  示例数据:');
    rows.forEach(row => {
      console.log(`    会话${row.id}: user_id=${row.user_id}, duration_minutes=${row.duration_minutes}, started_at=${row.started_at}`);
    });
    console.log('');
  });

  console.log('📊 [数据统计] focus_periods:');
  db.get("SELECT COUNT(*) as total FROM focus_periods", [], (err, row) => {
    if (err) {
      console.error('❌ 查询失败:', err);
      return;
    }
    console.log(`  总时段数: ${row.total}`);
  });

  db.all("SELECT period_id, session_id, duration_min, is_interrupted, start_time, end_time, created_at FROM focus_periods LIMIT 5", [], (err, rows) => {
    if (err) {
      console.error('❌ 查询失败:', err);
      return;
    }
    console.log('  示例数据:');
    rows.forEach(row => {
      console.log(`    时段${row.period_id}: session_id=${row.session_id}, duration_min=${row.duration_min}, created_at=${row.created_at}`);
    });
    console.log('');
  });

  console.log('🔗 [关联查询] focus_periods 与 pomodoro_sessions 的关联情况:');
  db.all(`
    SELECT 
      ps.id as session_id,
      ps.user_id,
      ps.duration_minutes as planned_minutes,
      ps.started_at,
      COUNT(fp.period_id) as period_count,
      SUM(COALESCE(fp.duration_min, 0)) as total_focus_min
    FROM pomodoro_sessions ps
    LEFT JOIN focus_periods fp ON ps.id = fp.session_id
    GROUP BY ps.id
    LIMIT 10
  `, [], (err, rows) => {
    if (err) {
      console.error('❌ 查询失败:', err);
      db.close();
      return;
    }
    console.log('  会话与专注时段关联:');
    rows.forEach(row => {
      const focusIndex = row.planned_minutes > 0 
        ? Math.round((row.total_focus_min / row.planned_minutes) * 100) 
        : 0;
      console.log(`    会话${row.session_id} (user_id=${row.user_id}): 计划${row.planned_minutes}分钟, 实际专注${row.total_focus_min}分钟, 专注指数${focusIndex}%, 时段数${row.period_count}`);
    });
    console.log('\n✅ [检查完成]');
    db.close();
  });
});
