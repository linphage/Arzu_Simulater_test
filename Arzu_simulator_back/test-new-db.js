const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api/v1';
const TEST_USER = {
  usernam: 'testuser_new',
  mail: 'test_new@example.com',
  password: 'Test123!@#'
};

async function testRegistration() {
  console.log('🧪 测试注册功能...');
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, {
      usernam: TEST_USER.usernam,
      mail: TEST_USER.mail,
      password: TEST_USER.password
    });
    
    console.log('✅ 注册成功:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('❌ 注册失败:', error.response?.data || error.message);
    throw error;
  }
}

async function testLogin() {
  console.log('\n🔐 测试登录功能...');
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login/email`, {
      mail: TEST_USER.mail,
      password: TEST_USER.password
    });
    
    console.log('✅ 登录成功:', response.data);
    return response.data.data.token;
  } catch (error) {
    console.error('❌ 登录失败:', error.response?.data || error.message);
    throw error;
  }
}

async function runTests() {
  console.log('🚀 开始测试新的数据库和API...\n');
  
  try {
    // 测试注册
    const userData = await testRegistration();
    console.log(`📋 注册用户信息 - ID: ${userData.userId}, 用户名: ${userData.usernam}, 邮箱: ${userData.mail}`);
    
    // 测试登录
    const token = await testLogin();
    console.log(`🔑 获取到的JWT令牌: ${token.substring(0, 50)}...`);
    
    console.log('\n✅ 所有测试通过！新的数据库和API工作正常。');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    process.exit(1);
  }
}

// 运行测试
runTests();