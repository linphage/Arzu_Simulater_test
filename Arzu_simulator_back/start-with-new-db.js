const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 启动后端服务（使用新的数据库）...');

// 复制新的环境变量文件
const fs = require('fs');
const envSource = path.join(__dirname, '.env.newdb');
const envTarget = path.join(__dirname, '.env');

try {
  fs.copyFileSync(envSource, envTarget);
  console.log('✅ 环境变量文件已更新');
} catch (error) {
  console.error('❌ 更新环境变量文件失败:', error.message);
}

// 启动后端服务
console.log('🔄 启动Node.js服务...');
const server = spawn('npm', ['run', 'dev'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

server.on('error', (error) => {
  console.error('❌ 启动服务失败:', error.message);
});

server.on('close', (code) => {
  console.log(`服务已停止，退出码: ${code}`);
});

// 处理进程退出
process.on('SIGINT', () => {
  console.log('\n🛑 正在停止服务...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 正在停止服务...');
  server.kill('SIGTERM');
});