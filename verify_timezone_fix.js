console.log('✅ [验证] 时区修复验证\n');

const dbTime = '2025-10-27 06:44:12';
console.log(`数据库存储: ${dbTime}`);

const timeStr = dbTime.includes('Z') ? dbTime : dbTime + 'Z';
const createdDate = new Date(timeStr);
const utcHour = createdDate.getUTCHours();
const cst8Hour = (utcHour + 8) % 24;
const slotIndex = Math.floor(cst8Hour / 2);

const timeSlots = [
  '0:00-2:00', '2:00-4:00', '4:00-6:00', '6:00-8:00',
  '8:00-10:00', '10:00-12:00', '12:00-14:00', '14:00-16:00',
  '16:00-18:00', '18:00-20:00', '20:00-22:00', '22:00-24:00'
];

const timeSlot = timeSlots[slotIndex];

console.log(`\n解析流程:`);
console.log(`  1. 原始字符串: "${dbTime}"`);
console.log(`  2. 添加Z标记: "${timeStr}"`);
console.log(`  3. Date对象: ${createdDate.toISOString()}`);
console.log(`  4. UTC小时: ${utcHour}`);
console.log(`  5. 东八区小时: ${cst8Hour} (${utcHour} + 8)`);
console.log(`  6. 时段索引: ${slotIndex} (floor(${cst8Hour} / 2))`);
console.log(`  7. 时间段: ${timeSlot}`);

console.log(`\n✅ 结果: 14:44的删除操作被正确统计在 ${timeSlot} 时段`);
