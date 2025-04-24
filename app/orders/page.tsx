'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { minerService } from '../services/miner-service'
import { orderService } from '../services/order-service'
import Loading from '../components/Loading'
import PaymentModal from '../components/PaymentModal'
import { Toast, Dialog } from 'antd-mobile'
import moment from 'moment'
import { SearchBar, Button, InfiniteScroll } from 'antd-mobile'
import { toast } from 'react-hot-toast'
import { useAccount, useWriteContract, usePublicClient } from 'wagmi'
import { Bsc } from '../utils/bsc_config'
import { useConnectModal } from '@rainbow-me/rainbowkit'

interface Order {
  orderId: string
  productInfo: {
    name: string
    image: string
    quantity: number
  }
  poolInfo: {
    name: string
    icon: string
    description: string
  } | null
  amount: number
  txHash: string
  status: 'success' | 'pending' | 'cancelled'
  createTime: string
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchValue, setSearchValue] = useState('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [currentOrder, setCurrentOrder] = useState<any>(null)
  const [orderToCancel, setOrderToCancel] = useState<any>(null)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const pageSize = 20

  const [processingOrders, setProcessingOrders] = useState<Record<string, boolean>>({})
  const { writeContractAsync } = useWriteContract()
  const { address, isConnected } = useAccount()
  const { openConnectModal } = useConnectModal()
  const publicClient = usePublicClient()

  const [pendingTransaction, setPendingTransaction] = useState<{
    toastId: string;
    paymentAddress: string;
    amount: string;
    orderId: string;
  } | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  useEffect(() => {
    if (isConnected && pendingTransaction) {
      handleTransfer(
        pendingTransaction.toastId,
        pendingTransaction.paymentAddress,
        pendingTransaction.amount,
        pendingTransaction.orderId
      )
      setPendingTransaction(null)
    }
  }, [isConnected])

  const fetchOrders = async (isLoadMore = false) => {
    try {
      if (!isLoadMore) {
        setLoading(true)
      }
      
      const data: any = await orderService.orderList({
        page,
        pageSize,
        orderNo: searchValue
      })
      
      if (isLoadMore) {
        setOrders([...orders, ...(data.records || [])])
      } else {
        setOrders(data.records || [])
      }
      
      setHasMore(data.records?.length === pageSize)
    } catch (error) {
      console.error('Failed to fetch orders:', error)

    } finally {
      setLoading(false)
    }
  }

  const loadMore = async () => {
    setPage(prev => prev + 1)
    await fetchOrders(true)
  }

  const handleSearch = () => {
    setPage(1)
    setOrders([])
    fetchOrders()
  }

  const handleCancelClick = (order: any) => {
    setOrderToCancel(order)

    Dialog.confirm({
      title: '取消订单',
      content: '确定要取消该订单吗？',
      confirmText: '确定',
      cancelText: '取消',
      onConfirm: () => {
        handleCancelConfirm()
      },
    });
  }
  const handleCancelConfirm = async () => {
    if (!orderToCancel) return

    try {
      await orderService.cancelOrder(orderToCancel.id)
      Toast.show({
        content: '订单已取消',
        icon: 'success',
      })
      // 刷新订单列表
      const res: any = await orderService.orderList()
      setOrders(res.records)
    } catch (error) {
      Toast.show({
        content: '取消订单失败',
        icon: 'fail',
      })
    } finally {
      setOrderToCancel(null)
    }
  }

  // const handleRepay = async (order: any) => {
  //   try {
  //     setCurrentOrder({
  //       ...order,
  //       payment_address: order.payment_address,
  //     })
  //     setShowPaymentModal(true)
  //   } catch (error) {
  //     console.log(error)
  //   }
  // }

    const handleTransfer = async (toastId: string, paymentAddress: string, amount: string, orderId: string) => {
    try {
      toast.loading('转账处理中...', {
        id: toastId
      })

      // ERC20 代币合约配置
      const tokenAddress = '0x55d398326f99059fF775485246999027B3197955' as `0x${string}`
      const tokenABI = [{
        name: 'transfer',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
          { name: 'to', type: 'address' },
          { name: 'amount', type: 'uint256' }
        ],
        outputs: [{ type: 'bool' }]
      }] as const

      // 将金额转换为 wei（考虑 18 位小数）
      const amountInWei = BigInt(parseFloat(amount) * Math.pow(10, 18))

      // 发起转账
      const hash = await writeContractAsync({
        abi: tokenABI,
        address: tokenAddress,
        functionName: 'transfer',
        args: [paymentAddress as `0x${string}`, amountInWei],
        chain: Bsc,
        account: address
      })

      // 等待交易确认
      toast.loading('等待交易确认...', {
        id: toastId
      })

      // 等待交易被确认
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      
      if (receipt.status === 'success') {
        // 确认支付
        const response_confirm: any = await minerService.confirmPayment(orderId)
        console.log(response_confirm)

        toast.success('支付成功', {
          id: toastId
        })
        
        // 刷新订单列表
        const res: any = await orderService.orderList()
        setOrders(res.records)
      } else {
        throw new Error('交易失败')
      }
    } catch (error: any) {
      console.error('转账失败:', error)
      toast.dismiss(toastId)
    }
  }

  const handleRepay = async (order: any) => {
    try {
      setProcessingOrders(prev => ({ ...prev, [order.id]: true }))

      // 检测是否为钱包环境
      if (typeof window.ethereum !== 'undefined') {
        const toastId = toast.loading('准备支付...')
        try {
          // 检查钱包连接状态
          if (!isConnected && openConnectModal) {
            toast.loading('请先连接钱包...', {
              id: toastId
            })
            
            // 保存待处理的交易信息
            setPendingTransaction({
              toastId,
              paymentAddress: order.payment_address,
              amount: order.amount,
              orderId: order.id
            })
            
            // 打开 RainbowKit 钱包连接模态框
            openConnectModal()
            return
          }

          // 如果已经连接钱包，直接处理转账
          await handleTransfer(
            toastId,
            order.payment_address,
            order.amount,
            order.id
          )
          
        } catch (error: any) {
          console.error('支付失败:', error)
        } finally {
          setProcessingOrders(prev => ({ ...prev, [order.id]: false }))
          toast.dismiss(toastId)
        }
      } else {
        // 非钱包环境或未连接钱包，显示常规支付弹窗
        setCurrentOrder({
          ...order,
          payment_address: order.payment_address,
        })
        setShowPaymentModal(true)
        setProcessingOrders(prev => ({ ...prev, [order.id]: false }))
      }
    } catch (error) {
      console.error('获取支付信息失败:', error)
      // toast.error('获取支付信息失败')
      setProcessingOrders(prev => ({ ...prev, [order.id]: false }))
    }
  }

  const getStatusTag = (status: number) => {
    switch (status) {
      case 0:
        return <span className="text-yellow-600 bg-yellow-50 px-2 py-1 rounded">待支付</span>
      case 1:
        return <span className="text-green-600 bg-green-50 px-2 py-1 rounded">支付成功</span>
      case 2:
        return <span className="text-red-600 bg-red-50 px-2 py-1 rounded">订单取消</span>
      case 3:
        return <span className="text-red-600 bg-red-50 px-2 py-1 rounded">支付超时</span>
      case 4:
        return <span className="text-red-600 bg-red-50 px-2 py-1 rounded">支付失败</span>
      case 5:
        return <span className="text-yellow-600 bg-yellow-50 px-2 py-1 rounded">待验证</span>
      default:
        return <span className="text-gray-600 bg-gray-50 px-2 py-1 rounded">未知状态</span>
    }
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-[#E8F7EE] text-[#00B42A]'
      case 'pending':
        return 'bg-[#E8F3FF] text-[#165DFF]'
      case 'cancelled':
        return 'bg-[#F5F5F5] text-[#86909C]'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  if (loading && !orders.length) {
    return <Loading />
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <div className="sticky top-0 z-10 bg-white px-3 py-2 border-b">
        <div className="flex items-center space-x-2">
          <SearchBar
            placeholder="搜索订单号"
            value={searchValue}
            onChange={(value) => setSearchValue(value)}
            className="flex-1 h-full"
          />
          <button 
            onClick={() => handleSearch()}
            className="!bg-[#F5B544] !text-white !rounded-lg !border-none !py-2 !px-4 !text-sm"
          >
            搜索
          </button>
        </div>
      </div>

      <div className="p-3 pb-[80px] space-y-3">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="text-sm text-gray-500">订单编号：{order.order_id}</div>
            </div>

            <div className="space-y-2 mb-3">
              <div className="text-sm">商品信息：{order.machine_info.title}</div>
              <div className="text-sm">矿池信息：{order.pool_info.name}</div>
              <div className="text-sm">创建时间：{moment(order.created_at).format('YYYY-MM-DD HH:mm:ss')}</div>
              <div className="text-sm truncate">交易哈希：{order.status === 1 ? order.transaction_hash : '-'}</div>
            </div>

            <div className="flex justify-between items-center mb-3">
              <div className="text-[#F5B544] font-medium">
                支付金额： ${order.amount.toFixed(2)} U
              </div>
              <div className={`rounded text-xs ${getStatusClass(order.status)}`}>
                {getStatusTag(order.status)}
              </div>
            </div>

            {(order.status === 0) && (
              <div className="grid grid-cols-2 gap-3 mt-4">
                {order.status === 0 && (
                  <Button
                    block
                    className="!bg-[#3B82F6] !text-white !rounded-lg !border-none !h-10"
                    onClick={() => handleRepay(order)}
                    disabled={processingOrders[order.id]}
                  >
                    {processingOrders[order.id] ? '支付中...' : '重新支付'}
                  </Button>
                )}
                <Button
                  block
                  className="!bg-gray-100 !text-gray-600 !rounded-lg !border-none !h-10"
                  onClick={() => handleCancelClick(order)}
                  disabled={processingOrders[order.id]}
                >
                  取消订单
                </Button>
              </div>
            )}
          </div>
        ))}
        
        <InfiniteScroll loadMore={loadMore} hasMore={hasMore} />
      </div>

      {/* 支付弹窗 */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        paymentAddress={currentOrder?.payment_address || ''}
        expiration_time={currentOrder?.expiration_time || ''}
      />

    </div>
  )
} 