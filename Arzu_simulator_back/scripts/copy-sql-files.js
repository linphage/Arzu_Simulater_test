const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else if (entry.name.endsWith('.sql')) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied: ${srcPath} -> ${destPath}`);
    }
  }
}

const srcDatabase = path.join(__dirname, '..', 'src', 'database');
const destDatabase = path.join(__dirname, '..', 'dist', 'database');

console.log('Copying SQL files...');
console.log(`Source: ${srcDatabase}`);
console.log(`Destination: ${destDatabase}`);

copyDir(srcDatabase, destDatabase);

console.log('SQL files copied successfully!');
