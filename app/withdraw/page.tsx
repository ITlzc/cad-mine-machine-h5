'use client'

import { useState, useEffect } from 'react'
import { Input, Button, Popup, DatePicker } from 'antd-mobile'
import moment from 'moment'

interface WithdrawRecord {
  amount: string
  time: string
  address: string
  status: 'completed' | 'pending' | 'failed'
}

export default function WithdrawPage() {
  const [withdrawAddress, setWithdrawAddress] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [fee] = useState(0.01) // 1%
  const [actualAmount, setActualAmount] = useState(0)
  const [showRecords, setShowRecords] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>()

  // 模拟数据
  const availableBalance = 120
  const totalWithdrawn = 1200
  
  const withdrawRecords: WithdrawRecord[] = [
    {
      amount: '3.8',
      time: '2024.1.15 15:30:33',
      address: '0xsad.....f3sd',
      status: 'completed'
    },
    {
      amount: '2.2',
      time: '2024.1.15 14:25:12',
      address: '0xfad.....e2sd',
      status: 'failed'
    },
    {
      amount: '4.5',
      time: '2024.1.15 13:15:45',
      address: '0ead.....a1sd',
      status: 'pending'
    },
    {
      amount: '1.6',
      time: '2024.1.15 12:40:21',
      address: '0xdad.....b4sd',
      status: 'completed'
    },
    {
      amount: '5.2',
      time: '2024.1.15 11:20:08',
      address: '0xcad.....c5sd',
      status: 'pending'
    },
    {
      amount: '2.9',
      time: '2024.1.14 16:30:33',
      address: '0xbad.....h7sd',
      status: 'completed'
    },
    {
      amount: '6.1',
      time: '2024.1.14 14:25:12',
      address: '0xaad.....j9sd',
      status: 'failed'
    },
    {
      amount: '3.4',
      time: '2024.1.14 13:15:45',
      address: '0xkad.....m2sd',
      status: 'completed'
    },
    {
      amount: '4.7',
      time: '2024.1.14 12:40:21',
      address: '0xpad.....n5sd',
      status: 'pending'
    },
    {
      amount: '1.8',
      time: '2024.1.14 11:20:08',
      address: '0xqad.....r8sd',
      status: 'completed'
    }
  ]

  // 计算实际到账金额
  useEffect(() => {
    const amount = parseFloat(withdrawAmount) || 0
    setActualAmount(amount - amount * fee)
  }, [withdrawAmount, fee])

  const handleWithdraw = () => {
    // 处理提现逻辑
  }

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-0.5 text-[#00B42A] bg-[#E8F7EE] rounded text-xs">已完成</span>
      case 'pending':
        return <span className="px-2 py-0.5 text-[#165DFF] bg-[#E8F3FF] rounded text-xs">处理中</span>
      case 'failed':
        return <span className="px-2 py-0.5 text-red-500 bg-red-50 rounded text-xs">失败</span>
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-[#fff] pb-20">

      {/* 余额卡片 */}
      <div className="grid grid-cols-2 gap-3 p-4">
        <div className="bg-[#FFB400] rounded-lg p-3 text-white">
          <div className="text-sm mb-1">可提现金额</div>
          <div className="text-xl font-medium">{availableBalance} ETH</div>
        </div>
        <div className="bg-[#00B42A] rounded-lg p-3 text-white">
          <div className="text-sm mb-1">已提现金额</div>
          <div className="text-xl font-medium">{totalWithdrawn} ETH</div>
        </div>
      </div>

      {/* 提现表单 */}
      <div className="px-4">
        <div className="bg-white rounded-lg p-4 space-y-4">
          <Input
            placeholder="请输入提现地址"
            value={withdrawAddress}
            onChange={setWithdrawAddress}
          />
          <Input
            type="number"
            placeholder="请输入提现数量"
            value={withdrawAmount}
            onChange={setWithdrawAmount}
          />
          <div className="flex justify-between items-center text-sm py-2">
            <span className="text-gray-500">手续费率</span>
            <span>1%</span>
          </div>
          <div className="flex justify-between items-center text-sm py-2">
            <span className="text-gray-500">实际到账</span>
            <span>{actualAmount.toFixed(2)} ETH</span>
          </div>
          <Button
            block
            color="primary"
            className="!rounded-lg !h-11"
            onClick={handleWithdraw}
          >
            确认提现
          </Button>
        </div>
      </div>

      {/* 提现记录 */}
      <div className="mt-4 px-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-gray-900">提现记录</span>
          <span 
            className="text-[#165DFF] text-sm"
            onClick={() => setShowRecords(true)}
          >
            更多记录 &gt;
          </span>
        </div>
        <div className="bg-white rounded-lg">
          <table className="w-full text-sm">
            <thead className="text-gray-500">
              <tr className="grid grid-cols-4 px-3 py-2">
                <th className="text-left">数量</th>
                <th className="text-left">时间</th>
                <th className="text-left">地址</th>
                <th className="text-right">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {withdrawRecords.slice(0, 5).map((record, index) => (
                <tr key={index} className="grid grid-cols-4 px-3 py-2">
                  <td>{record.amount} ETH</td>
                  <td>{record.time}</td>
                  <td className="truncate">{record.address}</td>
                  <td className="text-right">{getStatusTag(record.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 提现记录弹窗 */}
      <Popup
        visible={showRecords}
        onMaskClick={() => setShowRecords(false)}
        position="top"
        bodyStyle={{
          height: '100vh',
          backgroundColor: '#fff'
        }}
      >
        <div className="h-full flex flex-col">
          {/* 弹窗头部 */}
          <div className="flex justify-between items-center px-4 py-3 border-b">
            <span className="text-lg font-medium">提现记录</span>
            <span 
              className="text-gray-500 text-2xl leading-none"
              onClick={() => setShowRecords(false)}
            >
              ×
            </span>
          </div>

          {/* 日期选择 */}
          <div 
            className="px-4 py-3 text-sm text-gray-500 border-b flex justify-between items-center"
            onClick={() => setShowDatePicker(true)}
          >
            <span>选择日期筛选</span>
            <span className="text-[#165DFF]">
              {selectedDate ? moment(selectedDate).format('YYYY-MM-DD') : ''}
            </span>
          </div>

          {/* 表格头部 */}
          <div className="grid grid-cols-4 px-4 py-3 text-sm text-gray-500 bg-gray-50">
            <div>数量</div>
            <div>时间</div>
            <div>地址</div>
            <div className="text-right">状态</div>
          </div>

          {/* 表格内容 */}
          <div className="flex-1 overflow-auto">
            {withdrawRecords.map((record, index) => (
              <div 
                key={index} 
                className="grid grid-cols-4 px-4 py-3 text-sm border-b"
              >
                <div>{record.amount} ETH</div>
                <div>{record.time}</div>
                <div className="truncate">{record.address}</div>
                <div className="text-right">{getStatusTag(record.status)}</div>
              </div>
            ))}
          </div>

          {/* 分页 */}
          <div className="flex justify-center items-center gap-2 py-3 border-t">
            <span className="w-8 h-8 flex items-center justify-center text-gray-400">&lt;</span>
            <span className="w-8 h-8 flex items-center justify-center text-white bg-[#165DFF] rounded">1</span>
            <span className="w-8 h-8 flex items-center justify-center text-gray-500">2</span>
            <span className="w-8 h-8 flex items-center justify-center text-gray-500">&gt;</span>
          </div>
        </div>
      </Popup>

      {/* 日期选择器 */}
      <DatePicker
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        precision="day"
        onConfirm={val => {
          setSelectedDate(val)
          setShowDatePicker(false)
        }}
      />
    </div>
  )
} 