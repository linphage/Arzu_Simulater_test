import React, { useState } from 'react';
import logoImage from 'figma:asset/347b167e287340b4a3a4ef9056fbd51d28ee7553.png';
import { RegisterScreen } from './RegisterScreen';
import { authService } from '../services/authService';

interface LoginScreenProps {
  onStartWork: (loginData: { email: string; password: string }) => void;
}

export function LoginScreen({ onStartWork }: LoginScreenProps) {
  // 🔐 登录表单状态管理
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // 📝 注册页面状态管理
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // 🚀 处理登录提交
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 基础验证
    if (!email || !password) {
      setErrorMessage('请填写邮箱和密码');
      return;
    }

    if (!email.includes('@')) {
      setErrorMessage('请输入有效的邮箱地址');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      console.log('🔐 [登录] 尝试登录:', { email, passwordLength: password.length });
      
      const response = await authService.loginByEmail({
        mail: email,
        password: password
      });

      console.log('✅ [登录] 登录成功:', response);

      if (response.data.accessToken) {
        localStorage.setItem('accessToken', response.data.accessToken);
      }
      if (response.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.refreshToken);
      }
      localStorage.setItem('userInfo', JSON.stringify({
        userId: response.data.userId,
        username: response.data.username,
        email: response.data.email || email
      }));
      
      onStartWork({ email, password });
      
    } catch (error) {
      console.error('❌ 登录失败:', error);
      setErrorMessage(error instanceof Error ? error.message : '登录失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 📝 处理注册入口点击
  const handleRegisterClick = () => {
    console.log('📝 [注册] 用户点击注册入口，切换到注册页面');
    setIsRegisterMode(true);
    // 清空当前表单数据
    setEmail('');
    setPassword('');
    setErrorMessage('');
  };

  // 🔄 处理返回登录页面
  const handleBackToLogin = () => {
    console.log('🔄 [返回登录] 用户返回登录页面');
    setIsRegisterMode(false);
    // 清空当前表单数据
    setEmail('');
    setPassword('');
    setErrorMessage('');
  };

  // ✅ 处理注册成功
  const handleRegisterSuccess = (userData: { email: string; nickname: string }) => {
    console.log('✅ [注册成功] 用户注册完成:', userData);
    
    // 🔥 TODO: 处理注册成功后的逻辑
    // 这里可以选择：
    // 1. 直接登录用户（如果后端返回了登录令牌）
    // 2. 显示邮箱验证提示页面
    // 3. 返回登录页面提示用户登录
    /*
    
    注册成功后的处理选项：
    
    选项1：直接登录（推荐）
    if (userData.token) {
      // 保存登录令牌
      localStorage.setItem('userToken', userData.token);
      localStorage.setItem('userInfo', JSON.stringify(userData.user));
      
      // 直接调用登录成功回调
      onStartWork({ 
        email: userData.email, 
        password: '' // 不保存密码
      });
      return;
    }
    
    选项2：邮箱验证流程
    if (userData.requiresVerification) {
      setIsEmailVerificationMode(true);
      setVerificationEmail(userData.email);
      return;
    }
    
    选项3：返回登录页面
    setIsRegisterMode(false);
    setEmail(userData.email); // 预填邮箱
    setSuccessMessage('注册成功！请使用邮箱和密码登录。');
    
    */
    
    // 🧪 临时处理：显示成功提示并返回登录页面
    alert(`🎉 注册成功！\n\n欢迎 ${userData.nickname}！\n邮箱：${userData.email}\n\n请使用注册的邮箱和密码登录。`);
    
    // 返回登录页面并预填邮箱
    setIsRegisterMode(false);
    setEmail(userData.email);
    setPassword('');
    setErrorMessage('');
    
    console.log('🔥 [TODO] 注册成功后需要根据后端接口返回的数据决定下一步操作');
  };

  // 🔄 根据状态显示不同页面
  if (isRegisterMode) {
    return (
      <RegisterScreen
        onBackToLogin={handleBackToLogin}
        onRegisterSuccess={handleRegisterSuccess}
      />
    );
  }

  return (
    <div className="mobile-fullscreen mobile-app-container">
      {/* 全屏背景容器 */}
      <div 
        className="absolute inset-0 bg-[#DAE8F1] w-full h-full" 
        data-name="登录页背景"
        style={{
          width: '100vw',
          height: '100vh',
          height: '100dvh',
          left: '50%',
          transform: 'translateX(-50%)'
        }}
      />
      
      {/* 主登录容器 */}
      <div 
        className="responsive-container relative overflow-hidden flex flex-col items-center justify-center" 
        data-name="登录首页"
        style={{
          height: '100vh',
          height: '100dvh',
          minHeight: '100vh',
          minHeight: '100dvh',
          padding: '32px 20px',
          background: '#FFFFFF'
        }}
      >
        {/* LOGO 区域 */}
        <div className="flex flex-col items-center justify-center w-full max-w-sm mb-8">
          <div 
            className="relative mb-8"
            style={{
              width: '120px',
              height: '120px'
            }}
          >
            <img 
              src={logoImage}
              alt="APP Logo"
              className="w-full h-full object-contain"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                borderRadius: '20px'
              }}
            />
          </div>
          
          {/* 欢迎文字 */}
          <div className="text-center mb-6">
            <h1 
              className="text-[#3A3F47] font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_sans-serif] mb-2"
              style={{
                fontSize: '20px',
                fontWeight: '500',
                lineHeight: '1.4'
              }}
            >
              青金石宫模拟器
            </h1>
            <p 
              className="text-[#3A3F47] font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_sans-serif] opacity-80"
              style={{
                fontSize: '14px',
                fontWeight: '400',
                lineHeight: '1.5'
              }}
            >
              奈费勒怎么这么坏啊！
            </p>
          </div>
        </div>
        
        {/* 登录表单区域 */}
        <div className="w-full max-w-sm px-4 flex-1 flex flex-col justify-center">
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            
            {/* 错误信息显示 */}
            {errorMessage && (
              <div 
                className="unified-content bg-red-50 border-red-200 text-red-700 text-center"
                style={{
                  fontSize: '14px',
                  fontWeight: '400',
                  lineHeight: '1.5',
                  padding: '12px'
                }}
              >
                {errorMessage}
              </div>
            )}
            
            {/* 邮箱输入框 */}
            <div>
              <label 
                htmlFor="email"
                className="block text-[#3A3F47] font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_sans-serif] mb-2"
                style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  lineHeight: '1.5'
                }}
              >
                邮箱地址
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="请输入邮箱地址"
                className="unified-input w-full"
                style={{
                  fontSize: '14px',
                  fontWeight: '400',
                  borderRadius: '6px',
                  boxShadow: 'none'
                }}
                disabled={isLoading}
                autoComplete="email"
              />
            </div>

            {/* 密码输入框 */}
            <div>
              <label 
                htmlFor="password"
                className="block text-[#3A3F47] font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_sans-serif] mb-2"
                style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  lineHeight: '1.5'
                }}
              >
                密码
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="unified-input w-full"
                style={{
                  fontSize: '14px',
                  fontWeight: '400',
                  borderRadius: '6px',
                  boxShadow: 'none'
                }}
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>

            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={isLoading}
              className="unified-button w-full bg-[#1E3A8A] text-white hover:bg-[#1E40AF] active:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              style={{
                fontSize: '14px',
                fontWeight: '500',
                borderRadius: '100px',
                padding: '16px 24px',
                lineHeight: '1.5',
                minHeight: '52px'
              }}
              data-name="邮箱登录按钮"
            >
              {isLoading ? '登录中...' : '开始拉磨'}
            </button>

          </form>

          {/* 注册入口 */}
          <div className="text-center mt-6">
            <p 
              className="text-[#3A3F47] font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_sans-serif] opacity-70"
              style={{
                fontSize: '12px',
                fontWeight: '400',
                lineHeight: '1.5'
              }}
            >
              还没有账号？
              <button
                type="button"
                onClick={handleRegisterClick}
                className="ml-1 text-[#1E3A8A] hover:text-[#1E40AF] transition-colors duration-200 underline"
                style={{
                  fontSize: '12px',
                  fontWeight: '500',
                  lineHeight: '1.5',
                  background: 'none',
                  border: 'none',
                  padding: '0',
                  cursor: 'pointer'
                }}
                data-name="注册入口按钮"
              >
                立即注册
              </button>
            </p>
          </div>
        </div>
        
        {/* 底部安全区域 */}
        <div style={{ height: '32px' }} />
      </div>
    </div>
  );
}