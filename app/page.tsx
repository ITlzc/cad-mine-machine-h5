'use client'

import { TabBar } from 'antd-mobile'
import { AppOutline, UserOutline, TruckOutline } from 'antd-mobile-icons'
import { useState, useEffect } from 'react'
import MinerList from './components/MinerList'
import WalletModal from './components/WalletModal'
import { userService } from './services/user-service'
import { Toast } from 'antd-mobile'
import { getCurrentUser } from './utils/supabase_lib'

export default function Home() {
  const [showWalletModal, setShowWalletModal] = useState(false)

  const handleBindWallet = async (address: string) => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        if (address) {
          await userService.bindWalletAddress(address)
          Toast.show({
            content: '绑定成功',
            icon: 'success',
          })
          setShowWalletModal(false)
        }
      } else {
        Toast.show({
          content: '请安装 MetaMask 钱包！',
          icon: 'fail',
        })
      }
    } catch (error) {
      console.error('连接钱包失败:', error)
      Toast.show({
        content: '连接钱包失败',
        icon: 'fail',
      })
    }
  }

  useEffect(() => {
    async function getUserInfo() {
      const { user: user_data, error } = await getCurrentUser();
      if (error) {
        console.error('获取用户信息失败:', error)
      } else {
        const userInfo: any = await userService.getUserInfo(user_data?.id)
        console.log('用户信息:', userInfo, userInfo && userInfo?.user && !userInfo?.user.wallet_address)
        if(userInfo && userInfo?.user && !userInfo?.user.wallet_address) {
          setShowWalletModal(true)
        } 
      }
    }
    getUserInfo()

  }, [])
  
  return (
    //min-h-screen 高度减去tabbar的高度 
    <main className=" flex flex-col">
      <div className="flex-1 overflow-auto pb-20">
        <MinerList />
      </div>

      <WalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onConnect={(address: string) => handleBindWallet(address)}
      />
    </main>
  )
} 