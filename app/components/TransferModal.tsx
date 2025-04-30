'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface TransferModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (email: string) => void
  minerId: string
  submitting?: boolean
}

export default function TransferModal({
  isOpen,
  onClose,
  onConfirm,
  minerId,
  submitting = false
}: TransferModalProps) {
  const [step, setStep] = useState<'input' | 'confirm'>('input')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  // 每次打开模态框时重置状态
  useEffect(() => {
    if (isOpen) {
      setStep('input')
      setEmail('')
      setError('')
    }
  }, [isOpen])

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleEmailSubmit = () => {
    if (!email.trim()) {
      setError('请输入邮箱地址')
      return
    }

    if (!validateEmail(email)) {
      setError('请输入有效的邮箱地址')
      return
    }

    setError('')
    setStep('confirm')
  }

  const handleConfirm = () => {
    onConfirm(email)
  }

  const handleBack = () => {
    setStep('input')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[400px] relative">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        {/* 标题 */}
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">转让矿机</h2>
        </div>

        {/* 内容 */}
        <div className="px-6 py-4">
          {step === 'input' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                目标邮箱 <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                placeholder="请输入接收方邮箱"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  error ? 'border-red-500' : ''
                }`}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (error) setError('')
                }}
              />
              {error && (
                <p className="mt-1 text-sm text-red-500">{error}</p>
              )}
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-4">
                请确认转让信息：
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="flex flex-col mb-2">
                  <span className="text-sm text-gray-500 mb-1">矿机 ID</span>
                  <span className="text-sm font-medium break-all">{minerId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">接收方邮箱</span>
                  <span className="text-sm font-medium">{email}</span>
                </div>
              </div>
              <p className="text-sm text-red-600">
                注意：转让后将无法撤销，请确认接收方邮箱无误！
              </p>
            </div>
          )}
        </div>

        {/* 按钮组 */}
        <div className="px-6 py-4 border-t flex justify-end space-x-2">
          {step === 'input' ? (
            <>
              <button
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleEmailSubmit}
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                下一步
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleBack}
                disabled={submitting}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                返回修改
              </button>
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    处理中...
                  </>
                ) : (
                  '确认转让'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
} 