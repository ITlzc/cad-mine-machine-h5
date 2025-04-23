'use client'

import { Popup, Form, Input, Button, NavBar } from 'antd-mobile'
import { useState } from 'react'

interface AddressInfo {
  receiver: string
  phone: string
  address: string
}

interface Props {
  visible: boolean
  onClose: () => void
  onSubmit: (info: AddressInfo) => void
}

export default function AddressModal({ visible, onClose, onSubmit }: Props) {
  const [form] = Form.useForm<AddressInfo>()

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      onSubmit(values)
    } catch (error) {
      // 表单验证失败
    }
  }

  return (
    <Popup
      visible={visible}
      onMaskClick={onClose}
      position="bottom"
      bodyStyle={{ height: '100vh' }}
    >
      <div className="flex flex-col h-full bg-gray-50">
        <NavBar onBack={onClose}>填写收货信息</NavBar>
        <div className="flex-1 overflow-auto">
          <Form
            form={form}
            layout="horizontal"
            className="p-4"
            requiredMarkStyle="text-required"
          >
            <Form.Item
              name="receiver"
              label="收货人"
              rules={[{ required: true, message: '请输入收货人姓名' }]}
            >
              <Input placeholder="请输入收货人姓名" />
            </Form.Item>
            <Form.Item
              name="phone"
              label="手机号码"
              rules={[
                { required: true, message: '请输入手机号码' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码' }
              ]}
            >
              <Input placeholder="请输入手机号码" type="tel" />
            </Form.Item>
            <Form.Item
              name="address"
              label="详细地址"
              rules={[{ required: true, message: '请输入详细地址' }]}
            >
              <Input placeholder="请输入详细地址" />
            </Form.Item>
          </Form>
        </div>
        <div className="p-4 bg-white border-t">
          <Button
            block
            color="primary"
            size="large"
            onClick={handleSubmit}
            className="!rounded-full"
          >
            确认
          </Button>
        </div>
      </div>
    </Popup>
  )
} 