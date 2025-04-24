'use client'

import { useAccount } from 'wagmi'
import { ConnectButton, useConnectModal } from '@rainbow-me/rainbowkit'
import { Popup } from 'antd-mobile'
import { useState } from 'react'
import Loading from './Loading'
export default function WalletModal({ isOpen, onClose, onConnect, submitting }: {
  isOpen: boolean
  onClose: () => void
  onConnect: (address: string) => void
  submitting: boolean
}) {
  const { address, isConnected } = useAccount()
  const { openConnectModal } = useConnectModal()
  const [visible, setVisible] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  const handleBindWallet = async () => {
    setVisible(false)
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
    }, 3000);
    if (!isConnected) {
      // 如果未连接钱包，先打开连接钱包弹窗
      openConnectModal?.()
      return
    }

    // 如果已连接钱包，直接执行绑定操作
    if (address) {
      onConnect(address)
    }
    setIsLoading(false)
  }

  if (!isOpen) return null;
  if (isLoading) return (
    <Popup
      visible={isLoading}
      onMaskClick={onClose}
      bodyStyle={{
        borderTopLeftRadius: '12px',
        borderTopRightRadius: '12px',
        minHeight: '40%',
        padding: '20px',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}
    >
      <Loading />
    </Popup>
  )


  return (
    <Popup
      visible={isOpen && visible}
      onMaskClick={onClose}
      bodyStyle={{
        borderTopLeftRadius: '12px',
        borderTopRightRadius: '12px',
        minHeight: '40%',
        padding: '20px',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}
    >
      <div className="flex flex-col items-center">
        <h2 className="text-lg font-medium mb-3">绑定钱包地址</h2>
        <p className="text-gray-500 text-sm text-center mb-8">
          绑定钱包地址以便进行交易和收益提现
        </p>

        <div className="w-full space-y-3">
          <button
            className='w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center w-full bind-wallet-btn'
            onClick={handleBindWallet}
            disabled={submitting}
          >
            {submitting ? '绑定中...' : (isConnected ? '绑定钱包' : '连接钱包')}
          </button>

          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-100 text-gray-600 rounded-lg"
          >
            暂不绑定
          </button>
        </div>
      </div>
    </Popup>
  )
} 