const http = require('http');
const querystring = require('querystring');

const API_BASE_URL = 'localhost:3001';

// 测试不同的注册数据来找出验证问题
const testCases = [
  {
    name: '原始数据',
    data: {
      usernam: "amber",
      mail: "1952710912@qq.com", 
      password: "lin271828"
    }
  },
  {
    name: '修复密码（添加大写字母和特殊字符）',
    data: {
      usernam: "amber",
      mail: "1952710912@qq.com",
      password: "Lin271828!"
    }
  },
  {
    name: '完全合规数据',
    data: {
      usernam: "amber_test",
      mail: "amber@example.com",
      password: "Amber123!@#"
    }
  }
];

function makeRequest(testCase) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(testCase.data);
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/v1/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          statusText: res.statusMessage,
          data: data ? JSON.parse(data) : null
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

async function testRegistration(testCase) {
  console.log(`\n🧪 测试: ${testCase.name}`);
  console.log('请求数据:', JSON.stringify(testCase.data, null, 2));
  
  try {
    const response = await makeRequest(testCase);
    
    if (response.status === 201) {
      console.log('✅ 注册成功:', response.data);
      return true;
    } else {
      console.log('❌ 注册失败:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });
      return false;
    }
  } catch (error) {
    console.log('❌ 请求失败:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🔍 分析注册验证错误...\n');
  
  for (const testCase of testCases) {
    await testRegistration(testCase);
    
    // 等待一下避免速率限制
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n📋 总结:');
  console.log('根据验证规则分析:');
  console.log('1. 用户名只能包含字母、数字和下划线');
  console.log('2. 密码必须包含：');
  console.log('   - 至少一个小写字母');
  console.log('   - 至少一个大写字母');
  console.log('   - 至少一个数字');
  console.log('   - 至少一个特殊字符（@$!%*?&#）');
  console.log('   - 长度8-128位');
  console.log('');
  console.log('你的密码 "lin271828" 缺少大写字母和特殊字符');
  console.log('建议密码格式: "Lin271828!" 或 "Amber123!@#"');
}

runTests();