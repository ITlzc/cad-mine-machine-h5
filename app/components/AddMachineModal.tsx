import { Dialog } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'

interface AddMachineModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (macAddress: string) => void
  submitting: boolean
}

export default function AddMachineModal({
  isOpen,
  onClose,
  onConfirm,
  submitting
}: AddMachineModalProps) {
  const [macAddress, setMacAddress] = useState('')
  const [error, setError] = useState('')

  const validateMacAddress = (mac: string) => {
    // 支持冒号或连字符分隔的MAC地址格式
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/
    return macRegex.test(mac)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // 清除之前的错误
    setError('')

    // 验证MAC地址格式
    if (!validateMacAddress(macAddress)) {
      setError('请输入正确的MAC地址格式，例如：00:1A:2B:3C:4D:5E')
      return
    }

    onConfirm(macAddress)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setMacAddress(value)
    // 当用户输入时清除错误提示
    if (error) setError('')
  }

  useEffect(() => {
    if (isOpen) {
      setMacAddress('')
      setError('')
    }
  }, [isOpen])

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-sm rounded-lg bg-white p-6 w-full">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-medium">
              新增矿机
            </Dialog.Title>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="macAddress" className="block text-sm font-medium text-gray-700 mb-1">
                MAC地址
              </label>
              <input
                type="text"
                id="macAddress"
                value={macAddress}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  error ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="请输入MAC地址，例如：00:1A:2B:3C:4D:5E"
                required
              />
              {error && (
                <p className="mt-1 text-sm text-red-500">
                  {error}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? '提交中...' : '确认'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
} 