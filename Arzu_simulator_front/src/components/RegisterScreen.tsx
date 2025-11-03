import React, { useState } from 'react';
import logoImage from 'figma:asset/347b167e287340b4a3a4ef9056fbd51d28ee7553.png';
import { authService } from '../services/authService';

interface RegisterScreenProps {
  onBackToLogin: () => void;
  onRegisterSuccess: (userData: { email: string; nickname: string }) => void;
}

export function RegisterScreen({ onBackToLogin, onRegisterSuccess }: RegisterScreenProps) {
  // 🔐 注册表单状态管理
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // 🚀 处理注册提交
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 基础验证
    if (!email || !password || !confirmPassword || !nickname) {
      setErrorMessage('请填写所有必填字段');
      return;
    }

    if (!email.includes('@')) {
      setErrorMessage('请输入有效的邮箱地址');
      return;
    }

    if (nickname.trim().length < 3) {
      setErrorMessage('昵称至少需要3个字符');
      return;
    }

    if (nickname.trim().length > 50) {
      setErrorMessage('昵称不能超过50个字符');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(nickname.trim())) {
      setErrorMessage('昵称只能包含字母、数字和下划线');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('两次输入的密码不一致');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('密码至少需要8个字符');
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/.test(password)) {
      setErrorMessage('密码必须包含大小写字母、数字和特殊字符(@$!%*?&#)');
      return;
    }

    if (!agreedToTerms) {
      setErrorMessage('请同意服务条款和隐私政策');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      console.log('🔐 [注册] 尝试注册用户:', { 
        email, 
        nickname: nickname.trim(),
        hasPassword: !!password
      });

      const response = await authService.register({
        username: nickname.trim(),
        mail: email.trim().toLowerCase(),
        password: password
      });

      console.log('✅ [注册] 注册成功:', response);
      
      const userData = {
        email: response.data.email || email.trim(),
        nickname: response.data.username || nickname.trim()
      };
      
      onRegisterSuccess(userData);
      
    } catch (error) {
      console.error('❌ 注册失败:', error);
      setErrorMessage(error instanceof Error ? error.message : '注册失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mobile-fullscreen mobile-app-container">
      {/* 全屏背景容器 */}
      <div 
        className="absolute inset-0 bg-[#DAE8F1] w-full h-full" 
        data-name="注册页背景"
        style={{
          width: '100vw',
          height: '100dvh',
          left: '50%',
          transform: 'translateX(-50%)'
        }}
      />
      
      {/* 主注册容器 */}
      <div 
        className="responsive-container relative overflow-hidden flex flex-col items-center justify-center" 
        data-name="注册页面"
        style={{
          height: '100dvh',
          minHeight: '100dvh',
          padding: '32px 20px',
          background: '#FFFFFF'
        }}
      >
        {/* LOGO 区域 */}
        <div className="flex flex-col items-center justify-center w-full max-w-sm mb-6">
          <div 
            className="relative mb-6"
            style={{
              width: '100px',
              height: '100px'
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
          
          {/* 注册页面标题 */}
          <div className="text-center mb-4">
            <h1 
              className="text-[#3A3F47] font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_sans-serif] mb-1"
              style={{
                fontSize: '20px',
                fontWeight: '500',
                lineHeight: '1.4'
              }}
            >
              创建账号
            </h1>
            <p 
              className="text-[#3A3F47] font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_sans-serif] opacity-80"
              style={{
                fontSize: '14px',
                fontWeight: '400',
                lineHeight: '1.5'
              }}
            >
              贤者之国offer，拿下！
            </p>
          </div>
        </div>
        
        {/* 注册表单区域 */}
        <div className="w-full max-w-sm px-4 flex-1 flex flex-col justify-center">
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            
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
                htmlFor="register-email"
                className="block text-[#3A3F47] font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_sans-serif] mb-2"
                style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  lineHeight: '1.5'
                }}
              >
                邮箱地址 *
              </label>
              <input
                id="register-email"
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
                required
              />
            </div>

            {/* 昵称输入框 */}
            <div>
              <label 
                htmlFor="register-nickname"
                className="block text-[#3A3F47] font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_sans-serif] mb-2"
                style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  lineHeight: '1.5'
                }}
              >
                昵称 *
              </label>
              <input
                id="register-nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="请输入昵称"
                className="unified-input w-full"
                style={{
                  fontSize: '14px',
                  fontWeight: '400',
                  borderRadius: '6px',
                  boxShadow: 'none'
                }}
                disabled={isLoading}
                autoComplete="nickname"
                maxLength={50}
                required
              />
            </div>

            {/* 密码输入框 */}
            <div>
              <label 
                htmlFor="register-password"
                className="block text-[#3A3F47] font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_sans-serif] mb-2"
                style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  lineHeight: '1.5'
                }}
              >
                密码 *
              </label>
              <input
                id="register-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码（至少8位，包含大小写字母、数字和特殊字符）"
                className="unified-input w-full"
                style={{
                  fontSize: '14px',
                  fontWeight: '400',
                  borderRadius: '6px',
                  boxShadow: 'none'
                }}
                disabled={isLoading}
                autoComplete="new-password"
                required
                minLength={8}
              />
            </div>

            {/* 确认密码输入框 */}
            <div>
              <label 
                htmlFor="register-confirm-password"
                className="block text-[#3A3F47] font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_sans-serif] mb-2"
                style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  lineHeight: '1.5'
                }}
              >
                确认密码 *
              </label>
              <input
                id="register-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入密码"
                className="unified-input w-full"
                style={{
                  fontSize: '14px',
                  fontWeight: '400',
                  borderRadius: '6px',
                  boxShadow: 'none'
                }}
                disabled={isLoading}
                autoComplete="new-password"
                required
              />
            </div>

            {/* 服务条款同意 */}
            <div className="flex items-start gap-3">
              <input
                id="agree-terms"
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 w-4 h-4 flex-shrink-0"
                style={{
                  accentColor: '#1E3A8A'
                }}
                disabled={isLoading}
                required
              />
              <label 
                htmlFor="agree-terms" 
                className="text-[#3A3F47] opacity-80 font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_sans-serif]"
                style={{
                  fontSize: '12px',
                  fontWeight: '400',
                  lineHeight: '1.5'
                }}
              >
                我已阅读并同意
                <button
                  type="button"
                  className="text-[#1E3A8A] underline mx-1 hover:text-[#1E40AF] transition-colors"
                  style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    background: 'none',
                    border: 'none',
                    padding: '0',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    // 🔥 TODO: 添加服务条款页面
                    // 这里需要实现服务条款的显示逻辑
                    alert('服务条款页面开发中');
                  }}
                >
                  《服务条款》
                </button>
                和
                <button
                  type="button"
                  className="text-[#1E3A8A] underline mx-1 hover:text-[#1E40AF] transition-colors"
                  style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    background: 'none',
                    border: 'none',
                    padding: '0',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    // 🔥 TODO: 添加隐私政策页面
                    // 这里需要实现隐私政策的显示逻辑
                    alert('隐私政策页面开发中');
                  }}
                >
                  《隐私政策》
                </button>
              </label>
            </div>

            {/* 注册按钮 */}
            <button
              type="submit"
              disabled={isLoading || !agreedToTerms}
              className="unified-button w-full bg-[#1E3A8A] text-white hover:bg-[#1E40AF] active:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              style={{
                fontSize: '14px',
                fontWeight: '500',
                borderRadius: '100px',
                padding: '16px 24px',
                lineHeight: '1.5',
                minHeight: '52px'
              }}
              data-name="注册按钮"
            >
              {isLoading ? '注册中...' : '创建账号'}
            </button>
          </form>

          {/* 返回登录链接 */}
          <div className="text-center mt-6">
            <p 
              className="text-[#3A3F47] font-['ABeeZee:Regular',_'Noto_Sans_SC:Regular',_sans-serif] opacity-70"
              style={{
                fontSize: '12px',
                fontWeight: '400',
                lineHeight: '1.5'
              }}
            >
              已有账号？
              <button
                type="button"
                onClick={onBackToLogin}
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
                data-name="返回登录按钮"
              >
                立即登录
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