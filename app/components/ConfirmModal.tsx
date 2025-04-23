'use client'

import { Modal, Button } from 'antd-mobile'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  content: string
  confirmText?: string
  cancelText?: string
  loading?: boolean
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  content,
  confirmText = '确认',
  cancelText = '取消',
  loading = false
}: ConfirmModalProps) {
  return (
    <Modal
      visible={isOpen}
      content={content}
      closeOnAction
      onClose={onClose}
      title={title}
      actions={[
        {
          key: 'cancel',
          text: cancelText,
          disabled: loading,
          onClick: onClose,
          className: '!text-gray-600'
        },
        {
          key: 'confirm',
          text: loading ? '处理中...' : confirmText,
          disabled: loading,
          onClick: onConfirm,
          className: '!text-red-600'
        }
      ]}
    />
  )
} 