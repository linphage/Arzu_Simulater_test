const fs = require('fs');
const path = require('path');

console.log('🔄 开始批量替换 usernam → username...\n');

const replacements = [
  {
    file: 'src/services/auth.service.ts',
    changes: [
      { from: 'async register(usernam: string,', to: 'async register(username: string,' },
      { from: 'usernam: string; mail: string }>', to: 'username: string; mail: string }>' },
      { from: 'usernam,', to: 'username,' },
      { from: 'usernam: usernam', to: 'username: username' },
      { from: 'usernam: string', to: 'username: string' },
      { from: 'existingUser.usernam === usernam', to: 'existingUser.username === username' },
      { from: 'usernam: user.usernam', to: 'username: user.username' }
    ]
  },
  {
    file: 'src/database/init.ts',
    changes: [
      { from: "'usernam'", to: "'username'" }
    ]
  },
  {
    file: 'src/utils/validators.ts',
    changes: [
      { from: 'usernam', to: 'username', replace_all: true }
    ]
  },
  {
    file: 'src/utils/sanitizers.ts',
    changes: [
      { from: 'usernam', to: 'username', replace_all: true }
    ]
  }
];

let totalChanges = 0;

replacements.forEach(({ file, changes }) => {
  const filePath = path.join(__dirname, '..', file);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let fileChanges = 0;
    
    changes.forEach(({ from, to, replace_all }) => {
      const beforeLength = content.length;
      if (replace_all) {
        content = content.split(from).join(to);
      } else {
        content = content.replace(from, to);
      }
      const afterLength = content.length;
      if (beforeLength !== afterLength || content.includes(to)) {
        fileChanges++;
      }
    });
    
    if (fileChanges > 0) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ ${file} - 完成 ${fileChanges} 处替换`);
      totalChanges += fileChanges;
    } else {
      console.log(`⏭️  ${file} - 无需修改`);
    }
  } catch (error) {
    console.error(`❌ ${file} - 处理失败:`, error.message);
  }
});

console.log(`\n✅ 完成！共处理 ${totalChanges} 处修改`);
