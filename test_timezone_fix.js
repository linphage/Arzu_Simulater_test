const testTime = '2025-10-27 06:44:12';

console.log('🔍 [验证] 时区修复测试\n');

const createdDate = new Date(testTime);
console.log(`数据库时间: ${testTime}`);
console.log(`JS解析为: ${createdDate.toISOString()}`);

const wrongHour = createdDate.getHours();
console.log(`\n❌ 错误做法 getHours(): ${wrongHour}:${createdDate.getMinutes()}`);
console.log(`   时间段: ${Math.floor(wrongHour / 2) * 2}:00-${Math.floor(wrongHour / 2) * 2 + 2}:00`);

const utcHour = createdDate.getUTCHours();
const cst8Hour = (utcHour + 8) % 24;
console.log(`\n✅ 正确做法 getUTCHours() + 8: ${utcHour} + 8 = ${cst8Hour}`);
console.log(`   时间段: ${Math.floor(cst8Hour / 2) * 2}:00-${Math.floor(cst8Hour / 2) * 2 + 2}:00`);

console.log('\n📝 说明:');
console.log('  数据库存储的是 UTC 时间 06:44:12');
console.log('  对应东八区时间 14:44:12 (06:44 + 8小时)');
console.log('  应该统计在 14:00-16:00 时段');
