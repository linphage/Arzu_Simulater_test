const tasks = [
  {id: 29, due_date: '2025-10-26T20:00:00+08:00', category: 'test'},
  {id: 34, due_date: '2025-10-26T20:00:00+08:00', category: 'test'},
  {id: 28, due_date: '2025-10-25T20:00:00+08:00', category: 'test'}
];

const now = new Date('2025-10-27T10:00:00');
const currentDay = now.getDay();
const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay;

const monday = new Date(now);
monday.setDate(now.getDate() + daysToMonday);
monday.setHours(0, 0, 0, 0);

const sunday = new Date(monday);
sunday.setDate(monday.getDate() + 6);
sunday.setHours(23, 59, 59, 999);

console.log('当前时间:', now.toISOString());
console.log('本周一:', monday.toISOString());
console.log('本周日:', sunday.toISOString());
console.log('');

const filtered = tasks.filter(t => {
  const taskDate = new Date(t.due_date);
  const inRange = taskDate >= monday && taskDate <= sunday;
  console.log('任务', t.id, ':', t.due_date, '=>', taskDate.toISOString(), '在范围?', inRange);
  return inRange && t.category !== null;
});

console.log('');
console.log('本周任务数:', filtered.length);
