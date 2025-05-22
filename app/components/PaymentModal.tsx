'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, ClipboardIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { QRCodeSVG } from 'qrcode.react'
import { Popup } from 'antd-mobile'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  paymentAddress: string
  expiration_time?: string
  minAmount?: number
  miner: any
}

export default function PaymentModal({
  isOpen,
  onClose,
  paymentAddress,
  expiration_time = '',
  minAmount = 0.00000001,
  miner
}: PaymentModalProps) {
  // const [countdown, setCountdown] = useState('23:59:59')

  // useEffect(() => {
  //   // 设置倒计时
  //   const endTime = expiration_time ? new Date(expiration_time).getTime() : new Date().getTime() + 24 * 60 * 60 * 1000 // 24小时

  //   const timer = setInterval(() => {
  //     const now = new Date().getTime()
  //     const distance = endTime - now

  //     const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  //     const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
  //     const seconds = Math.floor((distance % (1000 * 60)) / 1000)

  //     setCountdown(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)

  //     if (distance < 0) {
  //       clearInterval(timer)
  //       setCountdown('00:00:00')
  //     }
  //   }, 1000)

  //   if (!isOpen) {
  //     clearInterval(timer)
  //   }

  //   return () => clearInterval(timer)
  // }, [isOpen])

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(paymentAddress)
    toast.success('地址已复制')
  }

  return (
    <Popup
      visible={isOpen}
      onMaskClick={onClose}
      position="bottom"
      bodyStyle={{
        height: '90%',
        overflowY: 'auto',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}
    >
      <div className="flex flex-col h-full bg-white">
        {/* 标题 */}
        <div className="p-4 border-b relative">
          <div className="absolute right-4 top-4">
            <XMarkIcon className="w-5 h-5 text-gray-400" onClick={onClose} />
          </div>
          <h2 className="text-lg font-medium">支付信息</h2>
        </div>

        {/* 支付信息 */}
        <div className="flex-1 overflow-auto px-4 py-4">
          <div className="flex flex-col justify-between items-center mb-2">
            <div className="text-sm text-gray-500">网络</div>
            <div className="text-sm">{miner?.currency_type === 'BSC_USDT' ? 'Binance Smart Chain' : 'Ethereum'}</div>
          </div>

          <div className="flex flex-col items-center mb-2">
            <QRCodeSVG
              value={paymentAddress}
              size={180}
              level="H"
              includeMargin
            />
            <div className="text-sm text-gray-500">扫码支付</div>
          </div>

          <div className="mb-6 bg-gray-50 rounded-lg p-2">
            <div className="flex justify-between">
              <div className="text-sm text-gray-500 mb-2">钱包地址</div>
              <button
                onClick={handleCopyAddress}
                className="text-[#F5B544] text-sm flex items-center"
              >
                <ClipboardIcon className="w-4 h-4 mr-1" />
                复制
              </button>
            </div>
            <div className="break-all text-sm rounded-lg py-3 mb-2">
              {paymentAddress}
            </div>
          </div>

          {/* 交易信息 */}
          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">最小充币额</span>
              <span className="text-sm">{minAmount} {miner?.currency_type === 'BSC_USDT' ? 'USDT' : 'CAD'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">充币到账时间</span>
              <span className="text-sm">约 7 分钟</span>
            </div>
          </div>

          <div className="bg-[#FFF9F0] p-4 rounded-lg text-sm text-[#F5B544]">
            <p>请注意：为确保交易安全，请在24小时内完成转账，超时钱包地址及二维码将会更新。</p>
          </div>
        </div>
      </div>
    </Popup>
  )
} 