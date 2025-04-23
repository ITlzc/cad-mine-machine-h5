'use client'

import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useEffect } from 'react'
import { Popup } from 'antd-mobile'

export default function WalletModal({ isOpen, onClose, onConnect }: {
  isOpen: boolean
  onClose: () => void
  onConnect: (address: string) => void
}) {
  const { address } = useAccount()

  useEffect(() => {
    if (address && isOpen) {
      onConnect(address)
    }
  }, [address, isOpen])

  return (
    <Popup
      visible={isOpen}
      onMaskClick={onClose}
      bodyStyle={{
        borderTopLeftRadius: '12px',
        borderTopRightRadius: '12px',
        minHeight: '40vh',
        padding: '20px'
      }}
    >
      <div className="flex flex-col items-center">
        <h2 className="text-lg font-medium mb-3">绑定钱包地址</h2>
        <p className="text-gray-500 text-sm text-center mb-8">
          绑定钱包地址以便进行交易和收益提现
        </p>
        
        <div className="w-full space-y-3">
          {!address ? (
            <div className="flex items-center justify-center w-full bind-wallet-btn bg-[#1677FF] text-white rounded-lg">
              <ConnectButton label="连接钱包" />
            </div>
          ) : (
            <div className="w-full py-3 bg-[#1677FF] text-white rounded-lg text-center">
              绑定中...
            </div>
          )}
          
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