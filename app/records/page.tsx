'use client'

import { useState } from 'react'
import { CalendarIcon } from '@heroicons/react/24/outline'

interface WithdrawRecord {
  time: string
  address: string
  amount: number
  fee: string
  status: 'completed' | 'pending' | 'failed'
}

export default function WithdrawRecordsPage() {
  const [dateFilter, setDateFilter] = useState('')

  // 模拟提现记录数据
  const records: WithdrawRecord[] = [
    {
      time: '2024-01-15 14:30:22',
      address: '0x8Fc6...3E4d',
      amount: 2.5,
      fee: '1%',
      status: 'completed'
    },
    {
      time: '2024-01-14 09:15:43',
      address: '0x7Bc9...2F1e',
      amount: 1.8,
      fee: '1%',
      status: 'pending'
    },
    {
      time: '2024-01-13 16:45:11',
      address: '0x6Ad5...9C3b',
      amount: 3.2,
      fee: '1%',
      status: 'failed'
    }
  ]

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-1 text-green-600 bg-green-50 rounded-full text-sm">已完成</span>
      case 'pending':
        return <span className="px-2 py-1 text-yellow-600 bg-yellow-50 rounded-full text-sm">处理中</span>
      case 'failed':
        return <span className="px-2 py-1 text-red-600 bg-red-50 rounded-full text-sm">失败</span>
      default:
        return null
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-6">提现记录</h1>
        
        {/* 搜索筛选区 */}
        <div className="flex justify-end space-x-2">
          <div className="relative">
            <input
              type="date"
              className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
            <CalendarIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            搜索
          </button>
        </div>
      </div>

      {/* 记录列表 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full whitespace-nowrap">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">提现时间</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">提现地址</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">提现数量</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">手续费率</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">状态</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {records.map((record, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">{record.time}</td>
                <td className="px-6 py-4 text-sm font-mono text-gray-900">{record.address}</td>
                <td className="px-6 py-4 text-sm text-blue-600 font-medium">
                  {record.amount.toFixed(1)} ETH
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{record.fee}</td>
                <td className="px-6 py-4">{getStatusTag(record.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 分页 */}
        <div className="px-6 py-4 border-t">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-700">
              共 {records.length} 条记录
            </div>
            <div className="flex space-x-2">
              <button className="px-3 py-1 border rounded text-sm text-gray-600 hover:bg-gray-50">
                上一页
              </button>
              <button className="px-3 py-1 border rounded text-sm text-gray-600 hover:bg-gray-50">
                下一页
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 