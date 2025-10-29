const testTime = '2025-10-27 06:44:12';

console.log('🔍 [分析] SQLite 时间字符串解析\n');

console.log(`数据库存储的字符串: "${testTime}"`);

const wrongParse = new Date(testTime);
console.log(`\n方法1: new Date("${testTime}")`);
console.log(`  解析结果: ${wrongParse.toISOString()}`);
console.log(`  getHours(): ${wrongParse.getHours()}`);
console.log(`  getUTCHours(): ${wrongParse.getUTCHours()}`);

const correctParse = new Date(testTime + 'Z');
console.log(`\n方法2: new Date("${testTime}Z") - 明确为UTC`);
console.log(`  解析结果: ${correctParse.toISOString()}`);
console.log(`  getHours(): ${correctParse.getHours()}`);
console.log(`  getUTCHours(): ${correctParse.getUTCHours()}`);

const utcHour2 = correctParse.getUTCHours();
const cst8Hour2 = (utcHour2 + 8) % 24;
console.log(`  UTC小时 + 8 = 东八区小时: ${utcHour2} + 8 = ${cst8Hour2}`);
console.log(`  时间段: ${Math.floor(cst8Hour2 / 2) * 2}:00-${Math.floor(cst8Hour2 / 2) * 2 + 2}:00`);

console.log('\n💡 结论:');
console.log('  SQLite的CURRENT_TIMESTAMP存储UTC时间');
console.log('  06:44:12是UTC时间，对应东八区14:44:12');
console.log('  解析时需要在字符串末尾加"Z"明确为UTC，然后+8得到东八区小时');
