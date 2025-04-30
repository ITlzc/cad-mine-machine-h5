'use client'

import { useState, useEffect } from 'react'
import MinerList from './components/MinerList'
import WalletModal from './components/WalletModal'
import { userService } from './services/user-service'
import { Toast } from 'antd-mobile'
import { getCurrentUser } from './utils/supabase_lib'
import { minerService } from './services/miner-service'
export default function Home() {
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [userInfoByFetch, setUserInfoByFetch] = useState(null)
  const [discount, setDiscount] = useState(0)

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
          setSubmitting(false)
          setShowWalletModal(false)
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

  useEffect(() => {
    async function getUserInfo() {
      try {
        const { user: user_data, error } = await getCurrentUser();
        if (error) {
          console.error('获取用户信息失败:', error)
        } else {
          const userInfo: any = await userService.getUserInfo(user_data?.id)
          console.log('用户信息:', userInfo, userInfo && userInfo?.user && !userInfo?.user.wallet_address)
          setUserInfoByFetch(userInfo?.user)

          if (userInfo && userInfo?.user && !userInfo?.user.wallet_address) {
            setShowWalletModal(true)
          }

          if (user_data?.email) {
            try {
              const discountData: any = await minerService.getDiscount(user_data.email)
              console.log('折扣信息:', discountData)
              if (discountData?.discount) {
                setDiscount(discountData.discount)
              }
            } catch (error) {
              console.error('获取折扣信息失败:', error)
            }
          }
        }
      } catch (error) {
        console.error('获取用户信息失败:', error)
      }
    }
    getUserInfo()

  }, [])

  return (
    //min-h-screen 高度减去tabbar的高度 
    <main className=" flex flex-col">
      <div className="flex-1 overflow-auto pb-20">
        <MinerList discount={discount} userInfo={userInfoByFetch} />
      </div>

      <WalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onConnect={(address: string) => handleBindWallet(address)}
        submitting={submitting}
      />
    </main>
  )
} 