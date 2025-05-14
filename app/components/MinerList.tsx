'use client'

import { Card, Image, Button, Swiper, SpinLoading } from 'antd-mobile'
import { useState, useEffect, useRef } from 'react'
import { minerService } from '../services/miner-service'
import Loading from './Loading'
import BuyForm from './BuyForm'
import PaymentModal from './PaymentModal'
import { Toast, Dialog } from 'antd-mobile'
import { toast } from 'react-hot-toast'
import { useAccount, useWriteContract, usePublicClient, useChainId, useSwitchChain } from 'wagmi'
import { Bsc } from '../utils/bsc_config'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useRouter } from 'next/navigation'
import { useNavigateWithParams } from '../hooks/useNavigateWithParams'

interface Miner {
  id: string
  title: string
  price: number
  image: string
  detail_images: string[]
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
      const element = textRef.current;
      // 使用更兼容的方式检查内容是否溢出
      const isTextOverflow = element.scrollHeight > element.clientHeight;
      setIsOverflow(isTextOverflow);
    }
  }, [text, maxLines]);

  // 安全地处理HTML内容
  const createMarkup = (htmlContent: string) => {
    return { __html: htmlContent };
  };

  return (
    <div className="relative">
      <div
        ref={textRef}
        className={`text-gray-500 text-sm mt-1 ${!isExpanded ? 'overflow-hidden' : ''}`}
        style={{
          maxHeight: !isExpanded ? `${maxLines * 1.5}em` : 'none',
          overflow: !isExpanded ? 'hidden' : 'visible'
        }}
      >
        <div dangerouslySetInnerHTML={createMarkup(text)} />
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

export default function MinerList({ discount, userInfo }: { discount: number, userInfo: any }) {
  const chainId = useChainId()
  const { switchChainAsync } = useSwitchChain()
  const { writeContractAsync } = useWriteContract()
  const { openConnectModal } = useConnectModal()
  const publicClient = usePublicClient()
  const { address, isConnected } = useAccount()

  const navigateWithParams = useNavigateWithParams()
  const [miners, setMiners] = useState<Miner[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMiner, setSelectedMiner] = useState<Miner | null>(null)
  const [showBuyForm, setShowBuyForm] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentInfo, setPaymentInfo] = useState<{
    address: string;
    id: string;
    amount: number;
  } | null>(null)
  const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({})

  
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
    // if(userInfo.role === 0){
    //   Dialog.alert({
    //     title: '提示',
    //     content: '请向代理商购买',
    //   })

    //   return
    // }
    setSelectedMiner(miner)
    setShowBuyForm(true)
  }

  // 处理转账的函数
  const handleTransfer = async (toastId: string, paymentAddress: string, amount: string, orderId: string) => {
    try {
      toast.loading('转账处理中...', {
        id: toastId
      })

      if (chainId !== Bsc.id) {
        await switchChainAsync({ chainId: Bsc.id })
      }

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

        navigateWithParams(`/orders`, 'push')
      } else {
        throw new Error('交易失败')
      }
    } catch (error: any) {
      if (!error.message.includes('User denied') && !error.message.includes('user rejected') && !error.message.includes('User rejected')) {
        console.error('转账失败:', error)
        toast.dismiss(toastId)
      }
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
          },
          inviter_code: values.inviteCode
        })

        // 保存支付信息
        setPaymentInfo({
          address: response.payment_address,
          id: response.id,
          amount: response.amount
        })

        // setShowPaymentModal(true)
        // toast.success('订单创建成功,请在钱包中确认支付')
        Toast.show({
          content: '订单创建成功,请在钱包中确认支付',
          position: 'top'
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
        position: 'center'
      })
    }
  }

  const handleImageLoad = (minerId: string) => {
    setImageLoading(prev => ({
      ...prev,
      [minerId]: false
    }))
  }

  const handleImageError = (minerId: string) => {
    setImageLoading(prev => ({
      ...prev,
      [minerId]: false
    }))
  }

  // 在组件挂载时设置所有图片为加载状态
  useEffect(() => {
    const initialLoadingState: Record<string, boolean> = {}
    miners.forEach(miner => {
      initialLoadingState[miner.id] = true
    })
    setImageLoading(initialLoadingState)

    // 设置一个超时，确保即使图片加载事件没有触发，也会在合理时间内隐藏加载状态
    const timer = setTimeout(() => {
      setImageLoading({})
    }, 3000)

    return () => clearTimeout(timer)
  }, [miners])

  if (loading) {
    return <Loading />
  }

  return (
    <>
      <div className="space-y-4 p-3">
        {miners.map((miner) => (
          <div key={miner.id} className="bg-white p-4 rounded-xl shadow-[0_2px_12px_0_rgba(0,0,0,0.07)]">
            {/* 轮播图区域 */}
            <div className="w-full h-auto rounded-lg overflow-hidden mb-3">
              <Swiper
                autoplay
                loop
                indicator={(total, current) => (
                  <div className="absolute bottom-1 right-1 bg-black/30 rounded-full px-2 py-0.5 text-white text-xs">
                    {current + 1}/{total}
                  </div>
                )}
              >
                {miner.detail_images?.length > 0 ? (
                  miner.detail_images.map((image, index) => (
                    <Swiper.Item key={index}>
                      <Image
                        src={image}
                        alt={`${miner.title}-${index + 1}`}
                        className="w-full h-full object-cover"
                        fit="cover"
                        loading="eager"
                      />
                    </Swiper.Item>
                  ))
                ) : (
                  <Swiper.Item>
                    <Image
                      src={miner.image}
                      alt={miner.title}
                      className="w-full h-full object-cover"
                      fit="cover"
                      loading="lazy"
                    />
                  </Swiper.Item>
                )}
              </Swiper>
            </div>
            {/* 内容区 */}
            <div className="flex flex-col justify-between">
              <div>
                <h3 className="text-base font-medium mb-1">{miner.title}</h3>
                <ExpandableText text={miner.description} />
              </div>
              <div className="flex items-center justify-between mt-3">
                {discount && Number(discount) > 0 && Number(discount) < 1 ? (
                  <div className="flex flex-col items-start">
                    <span className="text-sm text-gray-400 line-through">
                      原价：${miner.price} U
                    </span>
                    <span className="text-lg font-bold text-[#F5B544]">
                      ${(miner.price * (discount))} U
                    </span>
                  </div>
                ) : <span className="text-[#F5B544] text-lg">
                  ${miner.price} U
                </span>}
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
        ))}
      </div>

      {selectedMiner && (
        <BuyForm
          visible={showBuyForm}
          onClose={() => setShowBuyForm(false)}
          onSubmit={handleSubmit}
          discount={discount}
          miner={selectedMiner}
          userInfo={userInfo}
        />
      )}

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        paymentAddress={paymentInfo?.address || ''}
        minAmount={paymentInfo?.amount || 0}
        expiration_time={selectedMiner?.expiration_time || ''}
      />
    </>
  )
} 