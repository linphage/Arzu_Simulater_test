const path = require('path');
const sqlite3 = require(path.join(__dirname, 'Arzu_simulator_back', 'node_modules', 'sqlite3')).verbose();

const db = new sqlite3.Database('./Arzu_simulator_back/database_new_2025-09-25T08-54-04-778Z.db', sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('数据库打开失败:', err);
    process.exit(1);
  }
});

function getWeekRange() {
  const now = new Date();
  const currentDay = now.getDay();
  const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  
  const monday = new Date(now);
  monday.setDate(now.getDate() + daysToMonday);
  monday.setHours(0, 0, 0, 0);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  
  return { start: monday, end: sunday };
}

function formatLocalTime(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

const { start, end } = getWeekRange();
const startStr = formatLocalTime(start);
const endStr = formatLocalTime(end);

console.log('=== 本周时间范围 ===');
console.log('开始时间:', startStr);
console.log('结束时间:', endStr);
console.log('');

console.log('=== 查询用户列表 ===');
db.all('SELECT user_id, username FROM users', [], (err, users) => {
  if (err) {
    console.error('查询用户失败:', err);
    db.close();
    return;
  }
  
  console.log('用户列表:', users);
  console.log('');
  
  const userId = users[0]?.user_id || 1;
  
  console.log(`=== 用户 ${userId} 的本周任务数据 ===`);
  db.all(
    `SELECT id, title, category, created_at, deleted_at 
     FROM tasks 
     WHERE user_id = ? 
     ORDER BY created_at DESC`,
    [userId],
    (err, tasks) => {
      if (err) {
        console.error('查询任务失败:', err);
        db.close();
        return;
      }
      
      console.log(`总任务数: ${tasks.length}`);
      console.log('');
      
      const tasksInRange = tasks.filter(task => {
        if (!task.created_at) return false;
        
        const category = task.category;
        if (!category || category === '' || category === 'null' || category === '0' || category === 0 || category === null) {
          return false;
        }
        
        const validCategories = ['勤政', '恕己', '爱人'];
        if (!validCategories.includes(category)) {
          return false;
        }
        
        const createdAtStr = task.created_at.includes('Z') ? task.created_at : task.created_at + 'Z';
        const createdDate = new Date(createdAtStr);
        return createdDate >= start && createdDate <= end;
      });
      
      console.log(`本周任务数（排除category=0）: ${tasksInRange.length}`);
      console.log('本周任务列表:');
      tasksInRange.forEach(task => {
        console.log(`  - ID: ${task.id}, 标题: ${task.title}, 类型: ${task.category}, 创建时间: ${task.created_at}, 删除时间: ${task.deleted_at || '未删除'}`);
      });
      console.log('');
      
      console.log('被排除的任务（category=0或无效）:');
      const excludedTasks = tasks.filter(task => {
        if (!task.created_at) return false;
        const createdAtStr = task.created_at.includes('Z') ? task.created_at : task.created_at + 'Z';
        const createdDate = new Date(createdAtStr);
        if (createdDate < start || createdDate > end) return false;
        
        const category = task.category;
        if (!category || category === '' || category === 'null' || category === '0' || category === 0 || category === null) {
          return true;
        }
        const validCategories = ['勤政', '恕己', '爱人'];
        return !validCategories.includes(category);
      });
      
      console.log(`排除的任务数: ${excludedTasks.length}`);
      excludedTasks.forEach(task => {
        console.log(`  - ID: ${task.id}, 标题: ${task.title}, 类型: ${task.category} (typeof: ${typeof task.category}), 创建时间: ${task.created_at}`);
      });
      console.log('');
      
      console.log('=== 查询本周问题事件数据 ===');
      db.all(
        `SELECT debrief_id, task_id, brief_type, brief_content, created_at 
         FROM task_brieflogs 
         WHERE user_id = ? 
         AND brief_type IN (1, 2, 3, 4)
         AND created_at >= ? 
         AND created_at <= ?
         ORDER BY created_at DESC`,
        [userId, startStr, endStr],
        (err, briefLogs) => {
          if (err) {
            console.error('查询问题事件失败:', err);
            db.close();
            return;
          }
          
          console.log(`问题事件总记录数: ${briefLogs.length}`);
          console.log('问题事件列表:');
          briefLogs.forEach(log => {
            console.log(`  - ID: ${log.debrief_id}, TaskID: ${log.task_id}, 类型: ${log.brief_type}, 时间: ${log.created_at}, 内容: ${log.brief_content}`);
          });
          console.log('');
          
          const uniqueTaskIds = new Set(briefLogs.map(log => log.task_id));
          console.log(`去重后的问题任务数: ${uniqueTaskIds.size}`);
          console.log('问题任务ID列表:', Array.from(uniqueTaskIds));
          console.log('');
          
          const totalProblematicEvents = uniqueTaskIds.size;
          const totalTasksCreated = tasksInRange.length;
          const problematicEventRatio = totalTasksCreated > 0 
            ? Math.round((totalProblematicEvents / totalTasksCreated) * 100)
            : 0;
          
          console.log('=== 计算结果 ===');
          console.log(`本周创建总任务（排除category=0）: ${totalTasksCreated}`);
          console.log(`问题事件总数（去重后）: ${totalProblematicEvents}`);
          console.log(`问题事件比例: ${problematicEventRatio}%`);
          
          db.close();
        }
      );
    }
  );
});
