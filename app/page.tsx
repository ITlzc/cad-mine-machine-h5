'use client'

import { useState, useEffect, Suspense } from 'react'
import MinerList from './components/MinerList'
import WalletModal from './components/WalletModal'
import { userService } from './services/user-service'
import { Toast } from 'antd-mobile'
import { getCurrentUser } from './utils/supabase_lib'
import { minerService } from './services/miner-service'
import Loading from './components/Loading'

function HomeContent() {
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
      if (!error.message.includes('User denied') && !error.message.includes('user rejected') && !error.message.includes('User rejected')) {
        console.error('绑定钱包失败:', error)
        Toast.show({
          content: '绑定钱包失败：' + error.message,
          position: 'center'
        })
      }
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
          setUserInfoByFetch(userInfo?.user)

          const historyAddress: any = await userService.getHistoryAddress()
          if(!historyAddress || (historyAddress && historyAddress?.length === 0)) {
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

export default function Home() {
  return (
    <Suspense fallback={<Loading />}>
      <HomeContent />
    </Suspense>
  );
}