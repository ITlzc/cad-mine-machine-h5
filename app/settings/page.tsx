'use client'

import { useState, useEffect } from 'react'
import { Toast, Dialog, Loading } from 'antd-mobile'
import { getCurrentUser, signOut } from '../utils/supabase_lib'
import { userService } from '../services/user-service'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useDisconnect } from 'wagmi'
import WalletModal from '../components/WalletModal'

export default function SettingsPage() {
  const [emailAddress, setEmailAddress] = useState('')
  const [userInfo, setUserInfo] = useState<any>({})
  const [walletAddress, setWalletAddress] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { disconnect } = useDisconnect()
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const handleBindWallet = async (address: string) => {
    try {
      setSubmitting(true)
      if (typeof window.ethereum !== 'undefined') {
        if (address) {
          await userService.bindWalletAddress(address)
          Toast.show({
            content: '绑定成功',
            position: 'center'
          })
          setShowWalletModal(false)
          getUserInfo()
        }
      }
    } catch (error) {
      console.error('连接钱包失败:', error)
      Toast.show({
        content: '连接钱包失败',
        position: 'center'
      })
    } finally {
      setSubmitting(false)
    }
  }

  async function getUserInfo() {
    try {
      setIsLoading(true)
      const { user: user_data, error } = await getCurrentUser();
      console.log('user_data', user_data)
      setUserInfo(user_data)
      if (error) {
        console.error('获取用户信息失败:', error)
      } else {
        setEmailAddress(user_data?.email || '')
        const userInfo: any = await userService.getUserInfo(user_data?.id)
        console.log('userInfo', userInfo)
        if (userInfo?.user) {
          setWalletAddress(userInfo.user.wallet_address || '')
        }
      }
    } catch (error) {
      console.error('获取用户信息错误:', error)
    } finally {
      setIsLoading(false)
    }
  }


  useEffect(() => {
    getUserInfo()
  }, [])

  const handleLogout = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        console.error('Error signing out:', error);
        return;
      }
      localStorage.removeItem('user');
      disconnect();
      router.push('/login');
    } catch (error) {
      console.error('退出登录错误:', error)
    }
  }

  const showLogoutConfirm = () => {
    Dialog.confirm({
      title: '退出登录',
      content: '确定要退出登录吗？',
      confirmText: '确定',
      cancelText: '取消',
      onConfirm: () => {
        handleLogout();
      },
    });
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center pt-20 text-lg">
        <Loading color='#1677FF' />
      </div>
    )
  }

  return (
    <div className="h-full bg-[#F5F7FA]">
      {/* 用户信息 */}
      <div className="bg-white mt-3 px-4 py-4">
        <div className="flex items-center">
          <div className="min-w-12 min-h-12 w-12 h-12 bg-gray-200 rounded-full overflow-hidden">
            <img
              src={userInfo?.user_metadata.avatar_url || "/images/avatar.png"}
              alt="Avatar"
              width={48}
              height={48}
              className="w-12 h-12 rounded-full"
            />
          </div>
          <div className="ml-3">
            <div className="text-lg font-medium">{emailAddress}</div>
            <div className="text-xs text-gray-500">用户ID: {userInfo?.id}</div>
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={showLogoutConfirm}
            className="w-full bg-red-500 text-white py-2.5 rounded-lg flex items-center justify-center text-base"
          >
            <i className="fas fa-sign-out-alt mr-2"></i>
            退出登录
          </button>
        </div>
      </div>

      {/* 钱包地址 */}
      <div className="bg-white mt-3">
        <div className="px-4 py-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-base font-medium text-gray-900">钱包地址</span>
            {walletAddress && <button
              className="text-[#165DFF]"
              onClick={() => {
                navigator.clipboard.writeText(walletAddress);
                Toast.show({
                  content: '复制成功',
                  position: 'center'
                });
              }}
            >
              <i className="far fa-copy"></i>
            </button>}
          </div>
          {walletAddress ? (
            <div className="text-xs text-gray-500 break-all">
              {walletAddress}
            </div>
          ) : (
            <button className="w-full bg-[#165DFF] text-white py-3 rounded-lg flex items-center justify-center text-base">
              <i className="fas fa-wallet mr-2"></i>
              绑定钱包
            </button>
          )}
        </div>
      </div>

      <WalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onConnect={(address: string) => handleBindWallet(address)}
        submitting={submitting}
      />
    </div>
  )
} 