const path = require('path');
const sqlite3 = require(path.join(__dirname, 'Arzu_simulator_back', 'node_modules', 'sqlite3')).verbose();

const dbPath = path.join(__dirname, 'Arzu_simulator_back', 'database_new_2025-09-25T08-54-04-778Z.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 [检查] 查询10月22日和10月24日的详细数据...\n');

db.serialize(() => {
  console.log('📊 [10月22日] 番茄钟会话:');
  db.all(`
    SELECT id, user_id, duration_minutes, started_at, completed_at
    FROM pomodoro_sessions
    WHERE user_id = 2
      AND DATE(started_at) = '2025-10-22'
  `, [], (err, rows) => {
    if (err) {
      console.error('❌ 查询失败:', err);
      return;
    }
    if (rows.length === 0) {
      console.log('  无数据');
    } else {
      rows.forEach(row => {
        console.log(`  会话${row.id}: 计划${row.duration_minutes}分钟, 开始于${row.started_at}`);
      });
    }
    console.log('');
  });

  console.log('📊 [10月22日] 专注时段:');
  db.all(`
    SELECT fp.period_id, fp.session_id, fp.duration_min, fp.is_interrupted, fp.start_time, fp.end_time, fp.created_at
    FROM focus_periods fp
    INNER JOIN pomodoro_sessions ps ON fp.session_id = ps.id
    WHERE ps.user_id = 2
      AND DATE(fp.created_at) = '2025-10-22'
      AND fp.duration_min <= 300
  `, [], (err, rows) => {
    if (err) {
      console.error('❌ 查询失败:', err);
      return;
    }
    if (rows.length === 0) {
      console.log('  无有效数据(已过滤>300分钟)');
    } else {
      const totalFocus = rows.reduce((sum, row) => sum + row.duration_min, 0);
      console.log(`  共${rows.length}个时段, 总专注${totalFocus.toFixed(1)}分钟`);
      rows.forEach(row => {
        console.log(`    时段${row.period_id}: session_id=${row.session_id}, ${row.duration_min}分钟, 中断=${row.is_interrupted}, created_at=${row.created_at}`);
      });
    }
    console.log('');
  });

  console.log('📊 [10月24日] 番茄钟会话:');
  db.all(`
    SELECT id, user_id, duration_minutes, started_at, completed_at
    FROM pomodoro_sessions
    WHERE user_id = 2
      AND DATE(started_at) = '2025-10-24'
  `, [], (err, rows) => {
    if (err) {
      console.error('❌ 查询失败:', err);
      return;
    }
    if (rows.length === 0) {
      console.log('  无数据');
    } else {
      rows.forEach(row => {
        console.log(`  会话${row.id}: 计划${row.duration_minutes}分钟, 开始于${row.started_at}`);
      });
    }
    console.log('');
  });

  console.log('📊 [10月24日] 专注时段:');
  db.all(`
    SELECT fp.period_id, fp.session_id, fp.duration_min, fp.is_interrupted, fp.start_time, fp.end_time, fp.created_at
    FROM focus_periods fp
    INNER JOIN pomodoro_sessions ps ON fp.session_id = ps.id
    WHERE ps.user_id = 2
      AND DATE(fp.created_at) = '2025-10-24'
      AND fp.duration_min <= 300
  `, [], (err, rows) => {
    if (err) {
      console.error('❌ 查询失败:', err);
      db.close();
      return;
    }
    if (rows.length === 0) {
      console.log('  无有效数据(已过滤>300分钟)');
    } else {
      const totalFocus = rows.reduce((sum, row) => sum + row.duration_min, 0);
      console.log(`  共${rows.length}个时段, 总专注${totalFocus.toFixed(1)}分钟`);
      rows.forEach(row => {
        console.log(`    时段${row.period_id}: session_id=${row.session_id}, ${row.duration_min}分钟, 中断=${row.is_interrupted}, created_at=${row.created_at}`);
      });
    }
    
    console.log('\n📈 [计算] 专注指数:');
    
    db.all(`
      SELECT 
        DATE(ps.started_at) as date,
        SUM(ps.duration_minutes) as total_planned,
        COUNT(DISTINCT ps.id) as session_count
      FROM pomodoro_sessions ps
      WHERE ps.user_id = 2
        AND DATE(ps.started_at) IN ('2025-10-22', '2025-10-24')
      GROUP BY DATE(ps.started_at)
    `, [], (err, sessions) => {
      if (err) {
        console.error('❌ 查询失败:', err);
        db.close();
        return;
      }

      db.all(`
        SELECT 
          DATE(fp.created_at) as date,
          SUM(fp.duration_min) as total_focus,
          COUNT(*) as period_count
        FROM focus_periods fp
        INNER JOIN pomodoro_sessions ps ON fp.session_id = ps.id
        WHERE ps.user_id = 2
          AND DATE(fp.created_at) IN ('2025-10-22', '2025-10-24')
          AND fp.duration_min <= 300
        GROUP BY DATE(fp.created_at)
      `, [], (err, periods) => {
        if (err) {
          console.error('❌ 查询失败:', err);
          db.close();
          return;
        }

        sessions.forEach(session => {
          const period = periods.find(p => p.date === session.date);
          const totalFocus = period ? period.total_focus : 0;
          const focusIndex = session.total_planned > 0 
            ? Math.round((totalFocus / session.total_planned) * 100)
            : 0;
          
          console.log(`  ${session.date}: 计划${session.total_planned}分钟, 专注${totalFocus.toFixed(1)}分钟, 专注指数${focusIndex}%`);
        });

        console.log('\n✅ [检查完成]');
        db.close();
      });
    });
  });
});
