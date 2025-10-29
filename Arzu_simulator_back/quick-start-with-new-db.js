const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 快速启动 - 使用新的数据库配置...\n');

// 1. 找到最新的数据库文件
const dbDir = __dirname;
const dbFiles = fs.readdirSync(dbDir).filter(file => file.startsWith('database_new_') && file.endsWith('.db'));

if (dbFiles.length === 0) {
  console.error('❌ 未找到新的数据库文件');
  process.exit(1);
}

const latestDbFile = dbFiles.sort().pop();
console.log(`📁 使用数据库文件: ${latestDbFile}`);

// 2. 创建或更新.env文件
const envContent = `# 数据库配置
DB_PATH=./${latestDbFile}

# JWT密钥配置
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key

# 服务器配置
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000`;

const envPath = path.join(__dirname, '.env');

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env文件已更新');
} catch (error) {
  console.error('❌ 更新.env文件失败:', error.message);
  process.exit(1);
}

// 3. 启动后端服务
console.log('\n🚀 启动后端服务...');
const server = spawn('npm', ['run', 'dev'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

server.on('error', (error) => {
  console.error('❌ 启动服务失败:', error.message);
});

server.on('close', (code) => {
  console.log(`\n服务已停止，退出码: ${code}`);
});

// 4. 处理进程退出
process.on('SIGINT', () => {
  console.log('\n🛑 正在停止服务...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 正在停止服务...');
  server.kill('SIGTERM');
});