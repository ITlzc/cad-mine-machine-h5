'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { signInWithEmailOtp, verifyOtp, loginWithTwitter } from '../utils/supabase_lib';
import { Toast } from 'antd-mobile'


const LoginPage: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [emailError, setEmailError] = useState('');

  // 邮箱格式验证函数
  const validateEmail = (email: string) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  // 处理邮箱输入变化
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    
    // 实时验证邮箱格式
    if (newEmail && !validateEmail(newEmail)) {
      setEmailError('请输入有效的邮箱地址');
    } else {
      setEmailError('');
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown]);

  const handleSendVerificationCode = async () => {
    console.log('handleSendVerificationCode = ',email)
    if (!email || isSendingCode || countdown > 0) return;
    
    // 发送验证码前再次验证邮箱格式
    if (!validateEmail(email)) {
      setEmailError('请输入有效的邮箱地址');
      Toast.show({
        content: '请输入有效的邮箱地址',
        position: 'center'
      });
      return;
    }
    
    setIsSendingCode(true);
    try {
      const data = await signInWithEmailOtp(email);
      console.log('data = ',data)
      setCountdown(120); // Start 120 seconds countdown
      Toast.show({
        content: '验证码已发送',
        position: 'center'
      });
    } catch (error) {
      Toast.show({
        content: error.message || 'Error sending verification code',
        position: 'center'
      });
      console.error('Error sending verification code:', error);
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    console.log('handleLogin = ',email,verificationCode)
    e.preventDefault();
    if (!email || !verificationCode) return;
    
    // 登录前再次验证邮箱格式
    if (!validateEmail(email)) {
      setEmailError('请输入有效的邮箱地址');
      Toast.show({
        content: '请输入有效的邮箱地址',
        position: 'center'
      });
      return;
    }

    try {
      // TODO: Implement your login logic here
      // const response = await fetch('/api/v1/auth/email-login/verify', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ email, verificationCode }),
      // });

      const data = await verifyOtp(email, verificationCode);
      console.log('data = ',data)
      router.replace('/');
    } catch (error) {
      Toast.show({
        content: error.message || 'Login failed',
        position: 'center'
      });
      console.error('Login error:', error);
    }
  };

  const handleTwitterLogin = async () => {
    try {
      const { error } = await loginWithTwitter();
      if (error) {
        Toast.show({
          content: 'Twitter login failed',
          position: 'center'
        });
        console.error('Twitter login error:', error);
      }
    } catch (error) {
      Toast.show({
        content: 'Twitter login failed',
        position: 'center'
      });
      console.error('Error during Twitter login:', error);
    }
  };

  return (
    <div className="flex h-full items-center justify-center bg-gray-50">
      <div className="w-full bg-white rounded-lg p-8 pt-20">
        <div className="flex justify-center mb-6">
          <Image 
            src="/images/logo.svg" 
            alt="Logo" 
            width={48}
            height={48}
            className="h-12 w-auto"
          />
        </div>
        <h1 className="text-2xl font-medium text-center mb-8">欢迎登录 EpochMine</h1>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-base text-gray-700 mb-2">邮箱地址</label>
            <input
              type="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="请输入邮箱地址"
              className={`text-base w-full px-3 py-2 border ${emailError ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
              required
            />
            {emailError && <p className="mt-1 text-sm text-red-500">{emailError}</p>}
          </div>
          
          <div>
            <label className="block text-base text-gray-700 mb-2">验证码</label>
            <div className="flex gap-4">
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="请输入验证码"
                className="text-base w-[70%] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="button"
                onClick={handleSendVerificationCode}
                disabled={isSendingCode || countdown > 0 || !!emailError}
                className="text-sm w-[30%] py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 text-center"
              >
                {isSendingCode ? '发送中...' : countdown > 0 ? `${countdown}秒后重发` : '发送验证码'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="text-base w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            登录
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">或</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTwitterLogin}
            className="text-base mt-4 w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="h-5 w-5 text-[#1DA1F2] mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
            </svg>
            使用 Twitter 登录
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 