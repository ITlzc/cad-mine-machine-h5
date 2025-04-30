'use client'

import { useEffect, useState, useCallback } from 'react'
import { SearchBar, InfiniteScroll } from 'antd-mobile'
import { userService } from '../services/user-service'
import { ClipboardDocumentIcon, CheckIcon, PlusIcon } from '@heroicons/react/24/outline'
import md5 from 'md5'

import TransferModal from '../components/TransferModal'
import AddMachineModal from '../components/AddMachineModal'

import toast from 'react-hot-toast'
import { Toast } from 'antd-mobile'
import Loading from '../components/Loading'
interface MinerData {
  id: string
  node_key: string,
  mac_addr: string
  last_ip: string,
  last_submit_time: string,
  status: 0
  online_time: string
  y_earn: number
  t_earn: number
}

export default function MachinePage() {

  const [searchTerm, setSearchTerm] = useState('')
  const [miners, setMiners] = useState<MinerData[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [online_num, setOnlineNum] = useState(0)
  const [offline_num, setOfflineNum] = useState(0)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [showAddMachineModal, setShowAddMachineModal] = useState(false)
  const [selectedMiner, setSelectedMiner] = useState<MinerData | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const formatOnlineTime = (seconds: number): string => {
    if (!seconds) return '-'

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60

    return `${hours}小时${minutes}分钟${remainingSeconds}秒`
  }

  // 使用useCallback包装搜索函数，避免重复创建
  const debouncedSearch = useCallback(
    (keyword: string) => {
      setPage(1)
      getMiners(1, pageSize, keyword, false)
    },
    [pageSize]
  )

  // 处理搜索框输入
  const handleSearchInput = (value: string) => {
    setSearchTerm(value)
  }

  // 处理清空按钮点击
  const handleClear = () => {
    setSearchTerm('')
    setPage(1)
    getMiners(1, pageSize, '', false)
  }

  // 监听搜索词变化，使用防抖处理搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      debouncedSearch(searchTerm)
    }, 300) // 300ms 的防抖延迟

    return () => clearTimeout(timer)
  }, [searchTerm, debouncedSearch])

  const handlePageChange = (page: number) => {
    setPage(page)
    getMiners(page, pageSize, searchTerm, false)
  }

  const getMiners = async (page: number, pageSize: number, searchTerm: string, isLoadMore = false) => {
    setLoading(!isLoadMore)
    try {
      const res: any = await userService.getMinerNode(page, pageSize, searchTerm)
      console.log("getMiners =", res)
      if (res.records && res.records.length > 0) {
        let records = res.records
        // 处理数据...

        // 更新miners列表
        if (isLoadMore) {
          setMiners(prev => [...prev, ...records])
        } else {
          setMiners(records)
        }

        setTotal(res.total)
        setOnlineNum(res.online_count)
        setOfflineNum(res.offline_count)
        // 设置是否还有更多数据
        setHasMore(records.length === pageSize)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error('Failed to fetch miners:', error)
    } finally {
      setLoading(false)
    }
  }

  const onlineTimeForMiner = async (node_keys: string[], records: MinerData[]) => {
    const res: any = await userService.getMinerNodeOnlineTime(node_keys)
    console.log("onlineTimeForMiner =", res)
    for (let i = 0; i < res.length; i++) {
      for (let j = 0; j < records.length; j++) {
        if (records[j].node_key === res[i].node_key) {
          records[j].online_time = res[i].online_time
        }
      }
    }
    console.log("records =", records)
    setMiners(records)
    // const data = await response.json()
    // if (data.code === 200 && data.data) {
    //   let records = data.data
    //   for (let i = 0; i < records.length; i++) {
    //     let online_time = records[i].online_time
    //     for (let j = 0; j < miners.length; j++) {
    //       if (miners[j].node_key === records[i].node_key) {
    //         miners[j].duration = online_time
    //       }
    //     }
    //   }
    //   setMiners(miners)
    // }
  }

  const handleTransferClick = (miner: MinerData) => {
    setSelectedMiner(miner)
    setShowTransferModal(true)
  }

  const handleTransferConfirm = async (email: string) => {
    if (!selectedMiner) return

    try {
      setSubmitting(true)
      const res: any = await userService.transferMinerNode(selectedMiner.node_key, email)
      console.log("transferMinerNode =", res)
      Toast.show({
        content: '转让成功',
        position: 'center',
      })
      setShowTransferModal(false)
      // 刷新列表
      getMiners(page, pageSize, searchTerm, false)
    } catch (error) {
      console.error('转让失败:', error)
      Toast.show({
        content: '转让失败',
        position: 'center',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id)
    toast.success('已复制到剪贴板')
    setCopiedId(id)
    // Reset the copied state after 2 seconds
    setTimeout(() => {
      setCopiedId(null)
    }, 2000)
  }

  useEffect(() => {
    getMiners(page, pageSize, searchTerm, false)
  }, [])
  const getStatusTag = (status: number) => {
    return status === 1 ? (
      <span className="px-2 py-1 text-green-600 bg-green-50 rounded-full text-xs">
        在线
      </span>
    ) : (
      <span className="px-2 py-1 text-red-600 bg-red-50 rounded-full text-xs">
        离线
      </span>
    )
  }

  const handleAddMachine = () => {
    setShowAddMachineModal(true)
  }

  const handleAddMachineConfirm = async (macAddress: string) => {
    try {
      setSubmitting(true)
      const res: any = await userService.addMinerNode(macAddress)
      console.log("addMinerNode =", res)
      Toast.show({
        content: '添加成功',
        position: 'center',
      })
      setShowAddMachineModal(false)
      // 刷新列表
      getMiners(page, pageSize, searchTerm, false)
    } catch (error) {
      console.error('添加失败:', error)
      Toast.show({
        content: '添加失败: ' + error.message,
        position: 'top',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const getShortNodeKey = (nodeKey: string): string => {
    const hash = md5(nodeKey)
    return hash.substring(8, 24) // 取中间16位，避免开头和结尾
  }

  const loadMore = async () => {
    const nextPage = page + 1
    setPage(nextPage)
    await getMiners(nextPage, pageSize, searchTerm, true)
  }

  return (
    <div className="min-h-screen bg-[#fff]">
      {/* 搜索框和添加按钮 */}
      <div className="px-4 py-4">
        <div className="flex gap-3 items-center">
          <div className="flex-1 border border-gray-200 rounded-lg">
            <SearchBar
              // style={{
              //   '--height': '44px',
              //   '--background': '#ffffff',
              //   '--border-radius': '8px',
              // }}
              placeholder="搜索矿机"
              value={searchTerm}
              onChange={setSearchTerm}
            />
          </div>
          <button
            onClick={handleAddMachine}
            className="py-2 px-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-1"
          >
            <PlusIcon className="h-5 w-5" />
            <span>新增矿机</span>
          </button>
        </div>
      </div>

      {/* 统计数据 */}
      <div className="px-4 grid grid-cols-3 gap-3 mb-4">
        <div className="bg-[#FFB400] rounded-lg p-3 text-white shadow-sm">
          <div className="text-sm mb-2">矿机总数</div>
          <div className="text-2xl font-medium">{total}</div>
        </div>
        <div className="bg-[#00B42A] rounded-lg p-3 text-white shadow-sm">
          <div className="text-sm mb-2">在线数量</div>
          <div className="text-2xl font-medium">{online_num}</div>
        </div>
        <div className="bg-[#F53F3F] rounded-lg p-3 text-white shadow-sm">
          <div className="text-sm mb-2">离线数量</div>
          <div className="text-2xl font-medium">{offline_num}</div>
        </div>
      </div>

      {/* 矿机列表 */}
      {loading && !miners.length ? <Loading /> : (
        <div className="px-4 space-y-3 pb-20">
          {miners.map((miner, index) => (
            <div key={index} className="bg-white rounded-lg p-4 shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="text-sm flex gap-1">
                  <span className="text-gray-500">矿机ID:</span>
                  <span className="text-gray-800">{getShortNodeKey(miner.node_key)}</span>
                </div>
                {getStatusTag(miner.status)}
              </div>
              <div className="flex items-center gap-2 mb-2">
                {/* <button
                  onClick={() => handleCopyId(miner.node_key)}
                  className="p-1.5 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
                >
                  {copiedId === miner.node_key ? (
                    <CheckIcon className="h-5 w-5 text-green-500" />
                  ) : (
                    <ClipboardDocumentIcon className="h-5 w-5" />
                  )}
                </button> */}
              </div>
              <div className="flex flex-col gap-y-2 text-sm mb-3">
                <div>
                  <span className="text-gray-500">IP地址: </span>
                  <span>{miner.last_ip || '-'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">MAC地址: </span>
                  <div className="flex items-center gap-1">
                    <span>{miner.mac_addr || '-'}</span>
                    {miner.mac_addr && (<button
                      onClick={() => handleCopyId(miner.mac_addr)}
                      className="p-1.5 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
                    >
                      {copiedId === miner.mac_addr ? (
                        <CheckIcon className="h-5 w-5 text-green-500" />
                      ) : (
                        <ClipboardDocumentIcon className="h-5 w-5" />
                      )}
                    </button>
                    )}
                  </div>
                </div>
                <div className="col-span-2 flex items-center gap-1">
                  <span className="text-gray-500 shrink-0">在线时间: </span>
                  <span className="whitespace-nowrap">{formatOnlineTime(Number(miner.online_time)) || '-'}</span>
                </div>
              </div>

              {/* <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm mb-1">
                    <span className="text-gray-500">昨日收益: </span>
                    <span className="text-[#F5B544]">{Number(ethers.utils.formatEther(BigInt(miner.y_earn).toString())).toFixed(2)} CAD</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">总收益: </span>
                    <span className="text-[#F5B544]">{Number(ethers.utils.formatEther(BigInt(miner.t_earn).toString())).toFixed(2)} CAD</span>
                  </div>
                </div>
                <button
                  onClick={() => handleTransferClick(miner)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                >
                  转让
                </button>
              </div> */}
            </div>
          ))}
          
          <InfiniteScroll loadMore={loadMore} hasMore={hasMore} />
        </div>
      )}

      <TransferModal
        isOpen={showTransferModal}
        onClose={() => {
          setShowTransferModal(false)
          setSelectedMiner(null)
        }}
        onConfirm={handleTransferConfirm}
        minerId={selectedMiner?.node_key || ''}
        submitting={submitting}
      />

      <AddMachineModal
        isOpen={showAddMachineModal}
        onClose={() => setShowAddMachineModal(false)}
        onConfirm={handleAddMachineConfirm}
        submitting={submitting}
      />
    </div>
  )
} 