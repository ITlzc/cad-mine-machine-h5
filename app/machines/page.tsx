'use client'

import { useState } from 'react'
import { SearchBar } from 'antd-mobile'

interface MinerData {
  id: string
  macAddress: string
  ipAddress: string
  status: 'online' | 'offline'
  duration: string
  yesterdayEarnings: number
  totalEarnings: number
}

export default function MachinePage() {
  const [searchValue, setSearchValue] = useState('')

  // 模拟矿机数据
  const miners: MinerData[] = [
    {
      id: 'EM99283',
      macAddress: '00:da:dad:d',
      ipAddress: '192.293.2039',
      status: 'online',
      duration: '30天',
      yesterdayEarnings: 0.05,
      totalEarnings: 10
    },
    {
      id: 'EM99283',
      macAddress: '00:da:dad:d',
      ipAddress: '192.293.2039',
      status: 'offline',
      duration: '30天',
      yesterdayEarnings: 0.05,
      totalEarnings: 10
    },
    {
      id: 'EM99283',
      macAddress: '00:da:dad:d',
      ipAddress: '192.293.2039',
      status: 'online',
      duration: '30天',
      yesterdayEarnings: 0.05,
      totalEarnings: 10
    }
  ]

  const getStatusTag = (status: 'online' | 'offline') => {
    return status === 'online' ? (
      <span className="px-2 py-0.5 text-[#00B42A] bg-[#E8F7EE] rounded text-xs">
        在线
      </span>
    ) : (
      <span className="px-2 py-0.5 text-red-500 bg-red-50 rounded text-xs">
        离线
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-[#fff]">
      {/* 搜索框 */}
      <div className="px-4 py-4">
        <div className="border border-gray-200 rounded-lg">
          <SearchBar
            style={{
              '--height': '44px',
              '--background': '#ffffff',
              '--border-radius': '8px',
            }}
            placeholder="搜索矿机"
            value={searchValue}
            onChange={setSearchValue}
          />
        </div>
      </div>

      {/* 统计数据 */}
      <div className="px-4 grid grid-cols-3 gap-3 mb-4">
        <div className="bg-[#FFB400] rounded-lg p-3 text-white shadow-sm">
          <div className="text-sm mb-2">矿机总数</div>
          <div className="text-2xl font-medium">3</div>
        </div>
        <div className="bg-[#00B42A] rounded-lg p-3 text-white shadow-sm">
          <div className="text-sm mb-2">在线数量</div>
          <div className="text-2xl font-medium">2</div>
        </div>
        <div className="bg-[#F53F3F] rounded-lg p-3 text-white shadow-sm">
          <div className="text-sm mb-2">离线数量</div>
          <div className="text-2xl font-medium">1</div>
        </div>
      </div>

      {/* 矿机列表 */}
      <div className="px-4 space-y-3 pb-20">
        {miners.map((miner, index) => (
          <div key={index} className="bg-white rounded-lg p-4 shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] border border-gray-100">
            <div className="grid grid-cols-2 gap-y-2 text-sm mb-3">
              <div>
                <span className="text-gray-500">矿机ID: </span>
                <span>{miner.id}</span>
              </div>
              <div>
                <span className="text-gray-500">IP地址: </span>
                <span>{miner.ipAddress}</span>
              </div>
              <div>
                <span className="text-gray-500">MAC地址: </span>
                <span>{miner.macAddress}</span>
              </div>
              <div>
                <span className="text-gray-500">在线时间: </span>
                <span>{miner.duration}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm mb-1">
                  <span className="text-gray-500">昨日收益: </span>
                  <span className="text-[#F5B544]">{miner.yesterdayEarnings} ETH</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">总收益: </span>
                  <span className="text-[#F5B544]">{miner.totalEarnings} ETH</span>
                </div>
              </div>
              {getStatusTag(miner.status)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 