'use client'

import { Card, Image, Button } from 'antd-mobile'
import { useState, useEffect, useRef } from 'react'
import { minerService } from '../services/miner-service'
import Loading from './Loading'
import BuyForm from './BuyForm'
import PaymentModal from './PaymentModal'
import { Toast } from 'antd-mobile'
import { toast } from 'react-hot-toast'
import { orderService } from '../services/order-service'
import { useAccount, useWriteContract, usePublicClient } from 'wagmi'
import { Bsc } from '../utils/bsc_config'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useRouter } from 'next/navigation'

interface Miner {
  id: string
  title: string
  price: number
  image: string
  description: string
  payment_address: string
  expiration_time: string
  MPQ: number
}

interface ExpandableTextProps {
  text: string
  maxLines?: number
}

function ExpandableText({ text, maxLines = 3 }: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isOverflow, setIsOverflow] = useState(false)
  const textRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (textRef.current) {
      const element = textRef.current
      // 检查内容是否超出指定的行数
      const lineHeight = parseInt(window.getComputedStyle(element).lineHeight)
      const height = element.scrollHeight
      const maxHeight = lineHeight * maxLines

      setIsOverflow(height > maxHeight)
    }
  }, [text, maxLines])

  return (
    <div className="relative">
      <div
        ref={textRef}
        className={`text-gray-500 text-sm mt-1 ${!isExpanded ? 'line-clamp-3' : ''}`}
      >
        <div dangerouslySetInnerHTML={{ __html: text }} />
      </div>
      {isOverflow && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[#1677FF] text-xs mt-0.5"
        >
          {isExpanded ? '收起' : '展开'}
        </button>
      )}
    </div>
  )
}

export default function MinerList() {
  const [miners, setMiners] = useState<Miner[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMiner, setSelectedMiner] = useState<Miner | null>(null)
  const [showBuyForm, setShowBuyForm] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentInfo, setPaymentInfo] = useState<{
    address: string;
    id: string;
  } | null>(null)

  const { writeContractAsync } = useWriteContract()
  const { address, isConnected } = useAccount()
  const { openConnectModal } = useConnectModal()
  const publicClient = usePublicClient()
  const router = useRouter()
  const [pendingTransaction, setPendingTransaction] = useState<{
    toastId: string;
    paymentAddress: string;
    amount: string;
    orderId: string;
  } | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchMiners = async () => {
      try {
        setLoading(true)
        const data: any = await minerService.getMiners()
        setMiners(data.records)
      } catch (error) {
        console.error('Failed to fetch miners:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMiners()
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

  const handleBuyClick = (miner: Miner) => {
    setSelectedMiner(miner)
    setShowBuyForm(true)
  }

  // 处理转账的函数
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

        router.push(`/orders`)
      } else {
        throw new Error('交易失败')
      }
    } catch (error: any) {
      console.error('转账失败:', error)
      toast.dismiss(toastId)
    } finally {
      toast.dismiss(toastId)
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      if (selectedMiner) {
        // 创建订单
        const orderData = {
          minerId: selectedMiner.id,
          ...values
        }
        // TODO: 调用创建订单接口
        console.log('Creating order:', orderData)

        const response: any = await minerService.createOrder({
          machine_id: orderData.minerId,
          pool_id: orderData.poolId,
          quantity: orderData.quantity,
          shipping_info: {
            receiver: orderData.receiver,
            phone: orderData.phone,
            address: orderData.address,
            postcode: orderData.postcode
          }
        })

        // 保存支付信息
        setPaymentInfo({
          address: response.payment_address,
          id: response.id
        })

        // setShowPaymentModal(true)
        Toast.show({
          content: '订单创建成功,请在钱包中确认支付',
          icon: 'success',
        })

        setShowBuyForm(false)
        setSelectedMiner(null)


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
                paymentAddress: response.payment_address,
                amount: response.amount,
                orderId: response.id
              })

              // 打开 RainbowKit 钱包连接模态框
              openConnectModal()
              return
            }

            // 如果已经连接钱包，直接处理转账
            await handleTransfer(
              toastId,
              response.payment_address,
              response.amount,
              response.id
            )

          } catch (error: any) {
            console.error('支付失败:', error)
          } finally {
            setIsSubmitting(false)
            toast.dismiss(toastId)
          }
        } else {
          // 非钱包环境或未连接钱包，显示常规支付弹窗
          setShowPaymentModal(true)
          setIsSubmitting(false)
        }
      }
      setShowBuyForm(false)
      setSelectedMiner(null)
    } catch (error) {
      console.error('Failed to create order:', error)
      Toast.show({
        content: '创建订单失败',
        icon: 'fail',
      })
    }
  }

  if (loading) {
    return <Loading />
  }

  return (
    <>
      <div className="space-y-4 p-3">
        {miners.map((miner) => (
          <div key={miner.id} className="bg-white p-4 rounded-xl shadow-[0_2px_12px_0_rgba(0,0,0,0.07)]">
            <div className="flex space-x-4">
              <img
                src={miner.image}
                alt={miner.title}
                className="w-20 h-20 object-cover rounded-lg"
              />
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-medium">{miner.title}</h3>
                  <ExpandableText text={miner.description} />
                  {/* <div className="relative">
                    <p
                      className={`text-gray-500 text-sm mt-1`}
                    >
                      <div dangerouslySetInnerHTML={{ __html: miner.description }} />
                    </p>
                  </div> */}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#F5B544] text-lg">
                    ${miner.price} U
                  </span>
                  <Button
                    className="!bg-[#F5B544] !text-white rounded-full px-6 shadow-[0_2px_8px_0_rgba(245,181,68,0.35)]"
                    size="small"
                    onClick={() => handleBuyClick(miner)}
                  >
                    立即购买
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedMiner && (
        <BuyForm
          visible={showBuyForm}
          onClose={() => setShowBuyForm(false)}
          onSubmit={handleSubmit}
          miner={selectedMiner}
        />
      )}

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        paymentAddress={paymentInfo?.address || ''}
        expiration_time={selectedMiner?.expiration_time || ''}
      />
    </>
  )
} 