const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./Arzu_simulator_back/database_new_2025-09-25T08-54-04-778Z.db');

const getWeekRange = (weeksAgo) => {
  const now = new Date();
  const currentDay = now.getDay();
  const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  
  const monday = new Date(now);
  monday.setDate(now.getDate() + daysToMonday - (weeksAgo * 7));
  monday.setHours(0, 0, 0, 0);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  
  return {
    start: monday.toISOString(),
    end: sunday.toISOString(),
    startDate: monday,
    endDate: sunday
  };
};

const calculateWeekStats = async (weeksAgo) => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM tasks WHERE user_id = 1 AND due_date IS NOT NULL AND deleted_at IS NULL ORDER BY due_date ASC;', (err, allTasks) => {
      if (err) return reject(err);
      
      const { start, end, startDate, endDate } = getWeekRange(weeksAgo);
      
      console.log(`\n===== 第 ${weeksAgo === 0 ? '本周' : '前' + weeksAgo + '周'} =====`);
      console.log('周范围:', start, '至', end);
      console.log('周一:', startDate.toISOString());
      console.log('周日:', endDate.toISOString());
      
      // 过滤本周任务
      const tasks = allTasks.filter(t => {
        if (!t.due_date) return false;
        const taskDueDate = new Date(t.due_date);
        const inRange = taskDueDate >= startDate && taskDueDate <= endDate;
        if (inRange) {
          console.log('  - 任务', t.id, t.title, 'due_date:', t.due_date, '=> UTC:', taskDueDate.toISOString(), 'category:', t.category, 'completed:', t.completed);
        }
        return inRange;
      });
      
      const totalTasks = tasks.filter(t => t.category !== null).length;
      const completedTasks = tasks.filter(t => t.category !== null && t.completed === 1).length;
      
      const now = new Date();
      const overdueTasks = tasks.filter(t => 
        t.category !== null && 
        t.completed === 0 && 
        t.due_date && 
        new Date(t.due_date) < now
      ).length;
      
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      const overdueRate = totalTasks > 0 ? (overdueTasks / totalTasks) * 100 : 0;
      
      console.log('总任务数:', totalTasks);
      console.log('已完成:', completedTasks);
      console.log('逾期:', overdueTasks);
      console.log('完成率:', completionRate.toFixed(1) + '%');
      console.log('逾期率:', overdueRate.toFixed(1) + '%');
      
      resolve({ completionRate, overdueRate, totalTasks });
    });
  });
};

(async () => {
  try {
    const [week0, week1, week2, week3] = await Promise.all([
      calculateWeekStats(0),
      calculateWeekStats(1),
      calculateWeekStats(2),
      calculateWeekStats(3)
    ]);
    
    console.log('\n===== 最终结果 =====');
    console.log('本周:', week0);
    console.log('前1周:', week1);
    console.log('前2周:', week2);
    console.log('前3周:', week3);
    
  } catch (error) {
    console.error('错误:', error);
  } finally {
    db.close();
  }
})();
