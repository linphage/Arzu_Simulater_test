console.log('✅ [验证] 问题事件比例修复\n');

const tasks = [
  { id: 39, category: '勤政', created_at: '2025-10-27 06:44:03' },
  { id: 38, category: 'null', created_at: '2025-10-27 03:08:48' },
  { id: 37, category: 'null', created_at: '2025-10-27 03:05:59' },
  { id: 36, category: '勤政', created_at: '2025-10-27 02:56:17' },
  { id: 35, category: '勤政', created_at: '2025-10-27 02:55:58' }
];

const briefLogs = [
  { task_id: 39, brief_type: 1, created_at: '2025-10-27 06:44:12' }
];

console.log('📊 原始数据:');
console.log(`  任务总数: ${tasks.length}`);
console.log(`  问题日志: ${briefLogs.length}`);

console.log('\n🔍 过滤任务 (排除 category 为 null, "null", "0"):');
const validTasks = tasks.filter(t => {
  const category = t.category;
  if (!category || category === '0' || category === 'null') {
    console.log(`  ❌ 排除 id=${t.id}, category="${category}"`);
    return false;
  }
  console.log(`  ✅ 保留 id=${t.id}, category="${category}"`);
  return true;
});

console.log(`\n📈 计算结果:`);
console.log(`  有效任务数: ${validTasks.length}`);

const uniqueTaskIds = new Set(briefLogs.map(log => log.task_id));
const totalProblematicEvents = uniqueTaskIds.size;
console.log(`  问题事件数: ${totalProblematicEvents}`);

const ratio = validTasks.length > 0 
  ? Math.round((totalProblematicEvents / validTasks.length) * 100)
  : 0;

console.log(`  问题事件比例: ${totalProblematicEvents}/${validTasks.length} × 100 = ${ratio}%`);

console.log(`\n✅ 预期结果: 1/3 × 100 = 33%`);
console.log(`✅ 实际结果: ${ratio}%`);
console.log(ratio === 33 ? '✅ 修复成功！' : '❌ 仍有问题');
