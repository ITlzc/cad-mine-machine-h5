'use client'

import { useState, useEffect } from 'react'
import { Input, Button, Popup, DatePicker, Steps, Toast, Selector, Form } from 'antd-mobile'
import moment from 'moment'
import { useAccount, useWriteContract, usePublicClient, useSwitchChain, useChainId, useReadContract } from 'wagmi'
import { CAD_CHAIN } from '../utils/cad_config'
import BridgeABI from '../contracts/Bridge.json'
import CADM_ABI from '../contracts/CADM.json'
import { ethers } from 'ethers'
import { userService } from '../services/user-service'
import WalletModal from '../components/WalletModal'
import { sepolia } from 'viem/chains'
import { createPublicClient, http } from 'viem'
const BRIDGE_ETH = '0xE4F6733c7b3f3A00a5d290059DCc3cE9B627A1A4'
const BRIDGE_CAD = '0xF27541A5A17dED9A3922A0834E003628c430c3B5'
const TOKEN_ADDRESS = '0x0Ed4400Cc8620FAC2c79cAf2381037f0a127E98b'

// 添加 ERC20 ABI
const ERC20_ABI = [
  {
    "constant": false,
    "inputs": [
      {
        "name": "spender",
        "type": "address"
      },
      {
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "name": "",
        "type": "bool"
      }
    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // allowance
  {
    "constant": true,
    "inputs": [
      {
        "name": "owner",
        "type": "address"
      },
      {
        "name": "spender",
        "type": "address"
      }
    ],
    "name": "allowance",
    "outputs": [
      {
        "name": "remaining",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }
]

export default function WithdrawPage() {
  const [form] = Form.useForm()
  const [withdrawAddress, setWithdrawAddress] = useState('')
  const [profitAddress, setProfitAddress] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [fee] = useState(0.02) // 2%
  const [actualAmount, setActualAmount] = useState(0)
  const [showRecords, setShowRecords] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [showStepsModal, setShowStepsModal] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [stepStatus, setStepStatus] = useState<'process' | 'wait' | 'finish' | ''>('')
  const { address } = useAccount()
  const { writeContractAsync } = useWriteContract()
  const { switchChain, switchChainAsync } = useSwitchChain()
  const chainId = useChainId()
  const publicClient = usePublicClient()

  // 模拟数据
  const [historyAddresses, setHistoryAddresses] = useState<any[]>([])
  const [showAddressSelector, setShowAddressSelector] = useState(false)
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [availableBalance, setAvailableBalance] = useState('0')
  const [totalWithdrawn, setTotalWithdrawn] = useState('0')
  const [withdrawalRecords, setWithdrawalRecords] = useState<any[]>([])
  const [withdrawalRecord, setWithdrawalRecord] = useState<any>()
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [recentOperatedIds, setRecentOperatedIds] = useState<string[]>([])  // 添加最近操作的记录ID数组
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [showStartDatePicker, setShowStartDatePicker] = useState(false)
  const [showEndDatePicker, setShowEndDatePicker] = useState(false)
  const [tipText, setTipText] = useState('')
  const [processingRecord, setProcessingRecord] = useState<any>()
  const [isLoading, setIsLoading] = useState(false)

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    abi: ERC20_ABI,
    address: TOKEN_ADDRESS,

    functionName: "allowance",
    args: [historyAddresses && historyAddresses.length > 0 ? historyAddresses[0].wallet_address : address, BRIDGE_CAD],
    chainId: CAD_CHAIN.id,
    query: {
      enabled: false
    }
  })


  const { data: balance, refetch: refetchBalance } = useReadContract({
    abi: CADM_ABI.abi,
    address: TOKEN_ADDRESS,
    functionName: "batchGetBalance",
    args: [historyAddresses && historyAddresses.length > 0 ? [historyAddresses[0]?.wallet_address] : []],
    chainId: CAD_CHAIN.id,
    query: {
      enabled: false
    }
  })

  const { data: totalWithdrawn_balance, refetch: refetchTotalWithdrawn } = useReadContract({
    abi: BridgeABI.abi,
    address: BRIDGE_CAD,
    functionName: "batchGetBridgeOutAmount",
    args: [historyAddresses && historyAddresses.length > 0 ? [historyAddresses[0]?.wallet_address] : []],
    chainId: CAD_CHAIN.id,
    query: {
      enabled: false
    }
  })


  // console.log('allowance', allowance)
  // 可提现金额 batchGetBalance
  const getAvailableBalance = async () => {
    const { data: balance } = await refetchBalance()
    if (balance) {
      console.log('balance', balance)
      setAvailableBalance(Number(ethers.utils.formatEther(balance as bigint)).toFixed(2))
    }
  }

  // 已提现金额 batchGetBalance
  const getTotalWithdrawn = async () => {
    const { data: totalWithdrawn_balance } = await refetchTotalWithdrawn()
    if (totalWithdrawn_balance) {
      console.log('totalWithdrawn_balance', totalWithdrawn_balance)
      setTotalWithdrawn(Number(ethers.utils.formatEther(totalWithdrawn_balance as bigint)).toFixed(2))
    }
  }


  const handleBindWallet = async (address: string) => {
    try {
      setSubmitting(true)
      if (typeof window.ethereum !== 'undefined') {
        if (address) {
          await userService.bindWalletAddress(address)
          Toast.show({
            content: '绑定成功',
            position: 'center'
          })
          setSubmitting(false)
          setShowWalletModal(false)
        }
      }
    } catch (error) {
      console.error('连接钱包失败:', error)
      Toast.show({
        content: '连接钱包失败',
        position: 'center'
      })
    } finally {
      setSubmitting(false)
    }
  }


  // 获取历史地址
  const fetchHistoryAddresses = async () => {
    try {
      const addresses: any = await userService.getHistoryAddress()
      console.log('addresses', addresses)
      if (addresses) {
        setHistoryAddresses(addresses)
        // 如果有地址，默认选择第一个
        if (addresses.length > 0) {
          setProfitAddress(addresses[0].wallet_address)
          // 设置表单的初始值
          form.setFieldValue('profitAddress', addresses[0].wallet_address)
        }
      } else {
        setShowWalletModal(true)
      }
    } catch (error) {
      console.error('获取历史地址失败:', error)
    }
  }

  // getWithdrawalRecords
  const getWithdrawalRecords = async (page = 1, startDate: Date | null = null, endDate: Date | null = null) => {
    try {
      const res: any = await userService.getWithdrawalRecords(
        page,
        pagination.pageSize,
        startDate ? moment(startDate).format('YYYY-MM-DD HH:mm:ss') : '',
        endDate ? moment(endDate).endOf('day').format('YYYY-MM-DD HH:mm:ss') : ''
      )
      if (res) {
        setWithdrawalRecords(res.records || [])
        setPagination(prev => ({
          ...prev,
          current: page,
          total: res.pagination.total
        }))
      }
    } catch (error) {
      console.error('获取提现记录失败:', error)
    }
  }



  // 检查授权额度
  const checkAllowance = async () => {
    try {
      const { data: allowance } = await refetchAllowance()
      return ethers.utils.formatEther(allowance as bigint)
    } catch (error) {
      console.error('检查授权额度失败:', error)
      return '0'
    }
  }

  // 添加轮询获取记录的函数
  const pollWithdrawalRecord = async (txHash: string, maxAttempts = 15, interval = 2000) => {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const record: any = await userService.getWithdrawalRecords(1)
        if (record && record.records.length > 0) {
          // 通过交易哈希匹配记录
          const matchedRecord = record.records.find(
            (r: any) => r.from_chain_tx_hash?.toLowerCase() === txHash.toLowerCase()
          )
          if (matchedRecord) {
            setWithdrawalRecord(matchedRecord)
            setWithdrawalRecords(record.records)
            return matchedRecord
          }
        }
        // 等待指定时间后再次尝试
        await new Promise(resolve => setTimeout(resolve, interval))
      } catch (error) {
        console.error('获取提现记录失败:', error)
      }
    }
    return null
  }

  // 添加刷新单条记录的函数
  const refreshSingleRecord = async (recordId: string) => {
    try {
      setIsLoading(true)
      const res: any = await userService.getWithdrawalRecords()
      if (res && res.records) {
        const updatedRecord = res.records.find((r: any) => r.id === recordId)
        if (updatedRecord) {
          setWithdrawalRecords(prev =>
            prev.map(r =>
              r.id === recordId ? updatedRecord : r
            )
          )
          // 如果记录状态已经完成或失败，从最近操作列表中移除
          if (updatedRecord.to_chain_tx_status === 1 || updatedRecord.to_chain_tx_status === 2) {
            setRecentOperatedIds(prev => prev.filter(id => id !== recordId))
          }
        }
      }
    } catch (error) {
      console.error('刷新记录失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 添加网络切换函数
  const switchToNetwork = async (targetChainId: number) => {
    try {
      const chainId_ = await switchChainAsync({
        chainId: targetChainId,
        ...(targetChainId === CAD_CHAIN.id && {
          addEthereumChainParameter: {
            chainName: CAD_CHAIN.name,
            nativeCurrency: {
              name: CAD_CHAIN.nativeCurrency.name,
              symbol: CAD_CHAIN.nativeCurrency.symbol,
              decimals: CAD_CHAIN.nativeCurrency.decimals,
            },
            rpcUrls: [CAD_CHAIN.rpcUrls.default.http[0]],
            blockExplorerUrls: [CAD_CHAIN.blockExplorers?.default.url],
          }
        })
      })
      console.log('chainId_', chainId_)
      return chainId_
    } catch (error) {
      // 如果是用户拒绝错误，直接抛出
      if (error.message.includes('User denied') || error.message.includes('user rejected')) {
        throw error
      }
      // 其他错误，尝试先添加网络
      if (targetChainId === CAD_CHAIN.id) {
        try {
          await switchChainAsync({
            chainId: targetChainId,
            addEthereumChainParameter: {
              chainName: CAD_CHAIN.name,
              nativeCurrency: {
                name: CAD_CHAIN.nativeCurrency.name,
                symbol: CAD_CHAIN.nativeCurrency.symbol,
                decimals: CAD_CHAIN.nativeCurrency.decimals,
              },
              rpcUrls: [CAD_CHAIN.rpcUrls.default.http[0]],
              blockExplorerUrls: [CAD_CHAIN.blockExplorers?.default.url],
            }
          })
          return targetChainId
        } catch (addError) {
          console.error('添加网络失败:', addError)
          throw addError
        }
      }
      throw error
    }
  }

  // 修改 handleWithdraw 函数
  const handleWithdraw = async () => {
    setIsWithdrawing(true)
    if (!address) {
      Toast.show({
        content: '请先连接钱包',
        position: 'center',
      })
      return
    }

    try {
      if (chainId !== CAD_CHAIN.id) {
        await switchToNetwork(CAD_CHAIN.id)
      }

      const allowance = await checkAllowance()
      console.log('allowance', allowance, 'withdrawAmount', withdrawAmount)

      if (Number(allowance) >= Number(withdrawAmount)) {
        setCurrentStep(1)
      } else {
        setCurrentStep(0)
      }
      setStepStatus('wait')
      setShowStepsModal(true)

    } catch (error) {
      console.error('检查授权失败:', error)
      if (!error.message.includes('User denied') && !error.message.includes('user rejected')) {
        Toast.show({
          content: error.message || '检查授权失败，请重试',
          position: 'center',
        })
      }
      setIsWithdrawing(false)
    }
  }

  // 修改 handleApproveCADM 函数
  const handleApproveCADM = async () => {
    try {
      setStepStatus('process')

      if (chainId !== CAD_CHAIN.id) {
        await switchToNetwork(CAD_CHAIN.id)
      }

      const hash = await writeContractAsync({
        abi: ERC20_ABI,
        address: TOKEN_ADDRESS,
        functionName: 'approve',
        args: [BRIDGE_CAD, ethers.utils.parseEther(withdrawAmount)],
        chain: CAD_CHAIN,
        account: address
      })

      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      console.log('receipt', receipt)
      if (receipt.status === 'success') {
        const allowance = await checkAllowance()
        if (Number(allowance) >= Number(withdrawAmount)) {
          setCurrentStep(1)
          setStepStatus('wait')
        } else {
          setStepStatus('wait')
        }
      } else {
        setStepStatus('wait')
      }
    } catch (error) {
      console.error('操作失败:', error)
      if (error.message.includes('User denied') || error.message.includes('user rejected')) {
        Toast.show({
          content: '用户取消了操作',
          position: 'center',
        })
      } else {
        Toast.show({
          content: error.message || '操作失败，请重试',
          position: 'center',
        })
      }
      setStepStatus('wait')
    }
  }

  // 修改 handleTestnetBridge 函数
  const handleTestnetBridge = async () => {
    try {
      setStepStatus('process')

      if (chainId !== CAD_CHAIN.id) {
        await switchToNetwork(CAD_CHAIN.id)
      }

      const hash = await writeContractAsync({
        abi: BridgeABI.abi,
        address: BRIDGE_CAD,
        functionName: 'bridgeOut',
        args: [withdrawAddress, ethers.utils.parseEther(withdrawAmount)],
        chain: CAD_CHAIN,
        account: address
      })

      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      console.log('receipt', receipt)

      if (receipt.status === 'success') {
        setTipText('交易已提交，获取签名中...')
        const newRecord = await pollWithdrawalRecord(receipt.transactionHash)
        if (newRecord) {
          setRecentOperatedIds(prev => [...new Set([...prev, newRecord.id])])
          setCurrentStep(2)
          setStepStatus('wait')
          setTipText('')
        } else {
          Toast.show({
            content: '等待后台处理中，请稍后在记录中确认',
            position: 'center',
          })
          setIsWithdrawing(false)
          setShowStepsModal(false)
          setCurrentStep(0)
          setStepStatus('wait')
          setTipText('')
          getWithdrawalRecords(1)
        }
      } else {
        setStepStatus('wait')
      }
    } catch (error) {
      console.error('操作失败:', error)
      if (error.message.includes('User denied') || error.message.includes('user rejected')) {
        Toast.show({
          content: '用户取消了操作',
          position: 'center',
        })
      } else {
        Toast.show({
          content: error.message || '操作失败，请重试',
          position: 'center',
        })
      }
      setStepStatus('wait')
    }
  }

  // 修改 handleEthereumBridge 函数
  const handleEthereumBridge = async (record?: any, isTableClick?: boolean) => {
    if (isTableClick) {
      setProcessingRecord(record)
    }
    try {
      if (!address) {
        Toast.show({
          content: '请先连接钱包',
          position: 'center',
        })
        setProcessingRecord(undefined)
        return
      }

      const params = {
        to: record?.to ? record.to : withdrawAddress,
        amount: record?.amount ? record.amount : ethers.utils.parseEther(withdrawAmount),
        nonce: record?.nonce ? record.nonce : withdrawalRecord.nonce,
        deadline: record?.deadline ? record.deadline : withdrawalRecord.deadline,
        signature: record?.signature ? '0x' + record.signature : '0x' + withdrawalRecord.signature
      }

      setStepStatus('process')

      try {
        if (chainId !== sepolia.id) {
          await switchToNetwork(sepolia.id)
        }
        // 创建 Sepolia 网络的 publicClient
        const sepoliaClient = createPublicClient({
          chain: sepolia,
          transport: http()
        })

        const hash = await writeContractAsync({
          abi: BridgeABI.abi,
          address: BRIDGE_ETH,
          functionName: 'bridgeIn',
          args: [params.to, params.amount, params.nonce, params.deadline, params.signature],
          chain: sepolia,
          account: address
        })

        const receipt = await sepoliaClient.waitForTransactionReceipt({ hash })
        console.log('receipt', receipt)

        if (receipt.status === 'success') {
          handleSuccessTransaction(record)
        } else {
          Toast.show({
            content: '交易确认失败，请重试',
            position: 'center',
          })
          setStepStatus('wait')
        }
        setProcessingRecord(undefined)
      } catch (error) {
        console.error('以太坊跨链失败:', error)
        Toast.show({
          content: error.message || '操作失败，请重试',
          position: 'center',
        })
        setStepStatus('wait')
        setProcessingRecord(undefined)
      }
    } catch (error) {
      console.error('以太坊跨链失败:', error)
      Toast.show({
        content: error.message || '操作失败，请重试',
        position: 'center',
      })
      setStepStatus('wait')
      setProcessingRecord(undefined)
    }
  }

  // 添加处理成功交易的函数
  const handleSuccessTransaction = (record?: any) => {
    // 添加到最近操作列表以便用户刷新
    if (record?.id) {
      setRecentOperatedIds(prev => [...new Set([...prev, record.id])])
    }

    // setTipText('提现成功，后台更新状态中，请稍后刷新记录查看...')

    // 启动自动刷新
    // let attempts = 0
    // const maxAttempts = 20

    // const checkInterval = setInterval(async () => {
    //   try {
    //     attempts++
    //     if (attempts >= maxAttempts) {
    //       clearInterval(checkInterval)
    //       Toast.show({
    //         content: '提现成功，后台更新状态中，请稍后刷新记录查看',
    //         position: 'center',
    //         duration: 3000
    //       })
    //       return
    //     }

    //     const res: any = await userService.getWithdrawalRecords(1)
    //     if (res?.records) {
    //       const updatedRecord = res.records.find((r: any) => r.id === record.id)
    //       if (updatedRecord?.to_chain_tx_status === 1) {
    //         clearInterval(checkInterval)
    //         Toast.show({
    //           content: '提现成功',
    //           position: 'center',
    //         })
    //         // 更新记录列表
    //         setWithdrawalRecords(prev =>
    //           prev.map(r => r.id === record.id ? updatedRecord : r)
    //         )
    //         // 从最近操作列表中移除
    //         setRecentOperatedIds(prev => prev.filter(id => id !== record.id))

    //         setShowStepsModal(false)
    //         setCurrentStep(0)
    //         setStepStatus('wait')
    //         setIsWithdrawing(false)
    //         setWithdrawAddress('')
    //         setWithdrawAmount('')
    //         form.setFieldsValue({
    //           withdrawAmount: '',
    //           withdrawAddress: ''
    //         })
    //       }
    //     }
    //   } catch (error) {
    //     console.error('检查记录状态失败:', error)
    //     Toast.show({
    //       content: '后台更新状态中，请稍后在记录中刷新查看',
    //       position: 'center',
    //       duration: 3000
    //     })
    //     setIsWithdrawing(false)
    //     setShowStepsModal(false)
    //     setCurrentStep(0)
    //     setStepStatus('wait')
    //     setWithdrawAddress('')
    //     setWithdrawAmount('')
    //     form.setFieldsValue({
    //       withdrawAmount: '',
    //       withdrawAddress: ''
    //     })
    //   }
    // }, 3000)

    Toast.show({
      content: '提现成功，后台更新状态中，请稍后刷新记录查看',
      position: 'center',
      duration: 3000
    })
    setIsWithdrawing(false)
    setShowStepsModal(false)
    setCurrentStep(0)
    setStepStatus('wait')
    setWithdrawAddress('')
    setWithdrawAmount('')
    form.setFieldsValue({
      withdrawAmount: '',
      withdrawAddress: ''
    })
  }

  const getStatusTag = (record) => {
    // 检查是否过期
    const isExpired = record?.deadline && moment().unix() > record.deadline

    // 如果已过期，显示过期状态
    if (isExpired) {
      return <span className="px-2 py-0.5 text-red-500 bg-red-50 rounded text-xs">已过期</span>
    }

    switch (record?.to_chain_tx_status) {
      case 0:
        if (record?.signature) {
          return <span className="px-2 py-0.5 text-[#165DFF] bg-[#E8F3FF] rounded text-xs">待提取</span>
        } else {
          return <span className="px-2 py-0.5 text-[#165DFF] bg-[#E8F3FF] rounded text-xs">处理中</span>
        }
      case 1:
        return <span className="px-2 py-0.5 text-[#00B42A] bg-[#E8F7EE] rounded text-xs">已完成</span>
      case 2:
        return <span className="px-2 py-0.5 text-red-500 bg-red-50 rounded text-xs">失败</span>
      default:
        return null
    }
  }

  // 处理页码变化
  const handlePageChange = (page: number) => {
    if (page === pagination.current) return
    getWithdrawalRecords(page)
  }

  // 生成页码数组
  const generatePageNumbers = () => {
    const totalPages = Math.ceil(pagination.total / pagination.pageSize)
    const current = pagination.current
    const pages = []

    pages.push(1)

    let start = Math.max(2, current - 1)
    let end = Math.min(totalPages - 1, current + 1)

    if (start > 2) {
      pages.push('...')
    }

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (end < totalPages - 1) {
      pages.push('...')
    }

    if (totalPages > 1) {
      pages.push(totalPages)
    }

    return pages
  }

  // 处理搜索
  const handleSearch = () => {
    if (!startDate || !endDate) {
      Toast.show({
        content: '请选择完整的时间范围',
        position: 'center',
      })
      return
    }
    getWithdrawalRecords(1, startDate, endDate)
  }

  // 重置搜索条件
  const handleReset = () => {
    setStartDate(null)
    setEndDate(null)
    getWithdrawalRecords(1, null, null)
  }

  // 计算实际到账金额
  useEffect(() => {
    const amount = parseFloat(withdrawAmount) || 0
    setActualAmount(amount - amount * fee)
  }, [withdrawAmount, fee])

  // 在组件加载时获取历史地址
  useEffect(() => {
    fetchHistoryAddresses()
    getWithdrawalRecords()
  }, [])

  useEffect(() => {
    const getBalance = async () => {
      if (historyAddresses.length > 0 && address) {
        try {
          await getAvailableBalance()
          await getTotalWithdrawn()
        } catch (error) {
          console.error('网络切换失败:', error)
        }
      }
    }
    if (!isWithdrawing) {
      getBalance()
    }
  }, [historyAddresses, address, isWithdrawing, chainId])

  return (
    <div className="min-h-screen bg-[#fff] pb-20">

      {/* 余额卡片 */}
      <div className="grid grid-cols-2 gap-3 p-4">
        <div className="bg-[#FFB400] rounded-lg p-3 text-white">
          <div className="text-sm mb-1">可提现金额</div>
          <div className="text-xl font-medium">{availableBalance} CAD</div>
        </div>
        <div className="bg-[#00B42A] rounded-lg p-3 text-white">
          <div className="text-sm mb-1">已提现金额</div>
          <div className="text-xl font-medium">{totalWithdrawn} CAD</div>
        </div>
      </div>

      {/* 提现表单 */}
      <div className="px-4">
        <Form
          form={form}
          layout="vertical"
          className="bg-white rounded-lg py-4"
          requiredMarkStyle="none"
          initialValues={{
            profitAddress: profitAddress
          }}
          footer={
            <Button
              block
              color="primary"
              className="!rounded-lg !h-11"
              onClick={handleWithdraw}
              disabled={!withdrawAddress || !profitAddress || !withdrawAmount || !address || !historyAddresses.length}
            >
              {!address ? '请先连接钱包' : address && historyAddresses.length === 0 ? '请先绑定地址' : '确认提现'}
            </Button>
          }
        >
          <Form.Item
            label="收益地址"
            name="profitAddress"
            rules={[{ required: true, message: '请选择收益地址' }]}
            className="!pl-0"
          >
            <div
              className="relative border rounded-lg h-11 px-3 flex items-center justify-between cursor-pointer"
              onClick={() => {
                if (historyAddresses?.length > 0 && address) {
                  setShowAddressSelector(true)
                }
              }}
            >
              <span className={profitAddress ? 'text-black' : 'text-gray-400'}>
                {profitAddress ? `${profitAddress?.slice(0, 10)}...${profitAddress?.slice(-6)}` : '请选择收益地址'}
              </span>
              <span className="text-gray-400">▼</span>
            </div>
          </Form.Item>

          <Form.Item
            label="提现地址"
            name="withdrawAddress"
            rules={[
              { required: true, message: '请输入提现地址' },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  if (!ethers.utils.isAddress(value)) {
                    return Promise.reject('请输入有效的钱包地址');
                  }
                  return Promise.resolve();
                }
              }
            ]}
            className="!pl-0 !text-xs"
          >
            <Input
              placeholder="请输入提现地址"
              value={withdrawAddress}
              onChange={(val) => {
                setWithdrawAddress(val);
                // 实时验证地址格式
                if (val && !ethers.utils.isAddress(val)) {
                  form.setFields([{
                    name: 'withdrawAddress',
                    errors: ['请输入有效的钱包地址']
                  }]);
                }
              }}
              className="!rounded-lg !h-11 !text-xs"
            />
          </Form.Item>

          <Form.Item
            label="提现数量"
            name="withdrawAmount"
            rules={[{ required: true, message: '请输入提现数量' }, {
              validator: (_, value) => {
                if (value && parseFloat(value) > parseFloat(availableBalance)) {
                  return Promise.reject('提现数量不能大于可提现金额');
                }
                if (value === 0 || parseFloat(value) === 0) {
                  return Promise.reject('提现数量不能为0');
                }
                return Promise.resolve();
              }
            }]}
            className="!pl-0"
          >
            <Input
              type="number"
              placeholder="请输入提现数量"
              value={withdrawAmount}
              onChange={(val) => {
                setWithdrawAmount(val);
                if (val && parseFloat(val) > parseFloat(availableBalance)) {
                  form.setFields([{
                    name: 'withdrawAmount',
                    errors: ['提现数量不能大于可提现金额']
                  }]);
                }
                if (val === '0' || parseFloat(val) === 0) {
                  form.setFields([{
                    name: 'withdrawAmount',
                    errors: ['提现数量不能为0']
                  }]);
                }
              }}
              className="!rounded-lg !h-11 !text-sm"
            />
          </Form.Item>

          <div className="flex justify-between items-center text-sm py-2">
            <span className="text-gray-500">手续费率</span>
            <span>2%</span>
          </div>
          <div className="flex justify-between items-center text-sm py-2">
            <span className="text-gray-500">实际到账</span>
            <span>≈ {actualAmount.toFixed(2)} CAD</span>
          </div>
        </Form>
      </div>

      {/* 提现记录 */}
      <div className="mt-4 px-4 pb-4">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">

            <span className="text-gray-900 text-sm">提现记录</span>
            <span
              className="text-[#165DFF] text-sm"
              onClick={async () => {
                if (isWithdrawing) return
                try {
                  setIsLoading(true)
                  await getWithdrawalRecords()
                  setIsLoading(false)
                } catch (error) {
                  console.error('刷新失败:', error)
                } finally {
                  setIsLoading(false)
                }
              }}
            >
              {isLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-sync-alt"></i>}
            </span>
          </div>

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
              <tr className="grid grid-cols-5 px-1 py-2 text-xs">
                <th className="text-left">数量</th>
                <th className="text-left">时间</th>
                <th className="text-center">地址</th>
                <th className="text-right">状态</th>
                <th className="text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {withdrawalRecords.slice(0, 10).map((record, index) => (
                <tr key={index} className="grid grid-cols-5 px-1 py-2 text-xs">
                  <td className="text-left">{Number(ethers.utils.formatEther(record.amount.toString()))} CAD</td>
                  <td className="text-left">{moment(record.created_at).format('YYYY-MM-DD HH:mm:ss')}</td>
                  <td className="text-center text-[#165DFF]">{record.to.slice(0, 6)}...{record.to.slice(-4)}</td>
                  <td className="text-right">{getStatusTag(record)}</td>
                  <td className="text-right flex flex-col gap-1 justify-start items-end">
                    {(
                      <>
                        {record.to_chain_tx_status === 0 && record?.signature && record.deadline && moment().unix() < record.deadline &&
                          <Button
                            size="small"
                            className='!rounded-lg !text-xs !w-[80%] !bg-[#165DFF] !text-white'
                            loading={processingRecord?.id === record.id}
                            disabled={processingRecord?.id === record.id || isLoading}
                            onClick={() => { recentOperatedIds.includes(record.id) ? refreshSingleRecord(record.id) : handleEthereumBridge(record, true) }}
                          >
                            {processingRecord?.id === record.id || isLoading ? <i className="fas fa-spinner fa-spin"></i> : recentOperatedIds.includes(record.id) ? '刷新' : '提取'}
                          </Button>
                        }

                        {/* {recentOperatedIds.includes(record.id) &&
                          <Button
                            size="small"
                            className='!rounded-lg !text-xs !w-[80%] !bg-gray-100'
                            loading={isLoading}
                            disabled={isLoading}
                            onClick={() => refreshSingleRecord(record.id)}
                          >
                            {isLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-sync-alt"></i>}
                          </Button>
                        } */}
                        {(record.to_chain_tx_status === 1 || record.to_chain_tx_status === 2 || !record.deadline) && <div>-</div>}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 提现记录弹窗 */}
      {showRecords && <Popup
        visible={showRecords}
        onMaskClick={() => setShowRecords(false)}
        position="bottom"
        bodyStyle={{
          height: '100%',
          backgroundColor: '#fff',
          overflowY: 'auto',
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}
      >
        <div className="h-full flex flex-col">
          {/* 弹窗头部 */}
          <div className="flex justify-between items-center px-4 py-3 border-b">
            <span className="text-lg font-medium">提现记录</span>
            <span
              className="text-gray-500 text-2xl leading-none cursor-pointer"
              onClick={() => setShowRecords(false)}
            >
              ×
            </span>
          </div>

          {/* 日期选择 */}
          <div className="px-4 py-3 text-sm text-gray-500 border-b">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span>时间范围：</span>
                <div
                  className="px-3 py-1 border rounded-lg cursor-pointer"
                  onClick={() => setShowStartDatePicker(true)}
                >
                  {startDate ? moment(startDate).format('YYYY-MM-DD') : '开始时间'}
                </div>
                <span>至</span>
                <div
                  className="px-3 py-1 border rounded-lg cursor-pointer"
                  onClick={() => setShowEndDatePicker(true)}
                >
                  {endDate ? moment(endDate).format('YYYY-MM-DD') : '结束时间'}
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={handleReset}
                  className="px-3 py-1 text-gray-600 text-sm"
                >
                  重置
                </button>
                <button
                  onClick={handleSearch}
                  className="px-3 py-1 bg-[#165DFF] text-white rounded-lg text-sm"
                >
                  搜索
                </button>
              </div>
            </div>
          </div>

          {/* 表格头部 */}
          <div className="grid grid-cols-5 px-4 py-3 text-sm text-gray-500 bg-gray-50 text-xs">
            <div className="text-left">数量</div>
            <div className="text-left">时间</div>
            <div className="text-center">地址</div>
            <div className="text-right">状态</div>
            <div className="text-right">操作</div>
          </div>

          {/* 表格内容 */}
          <div className="flex-1 overflow-auto">
            {withdrawalRecords.map((record, index) => (
              <div
                key={index}
                className="grid grid-cols-5 px-4 py-3 text-sm border-b text-xs"
              >
                <div className="text-left">{Number(ethers.utils.formatEther(record.amount.toString()))} CAD</div>
                <div className="text-left">{moment(record.created_at).format('YYYY-MM-DD HH:mm:ss')}</div>
                <div className="text-center text-[#165DFF]">{record.to.slice(0, 6)}...{record.to.slice(-4)}</div>
                <div className="text-right">{getStatusTag(record)}</div>
                <div className="text-right flex flex-col gap-1 justify-start items-end">
                  {(
                    <>
                      {record.to_chain_tx_status === 0 && record?.signature && record.deadline && moment().unix() < record.deadline &&
                        <Button
                          size="small"
                          className='!rounded-lg !text-xs !w-[80%]'
                          loading={processingRecord?.id === record.id}
                          disabled={processingRecord?.id === record.id || isLoading}
                          onClick={() => { recentOperatedIds.includes(record.id) ? refreshSingleRecord(record.id) : handleEthereumBridge(record, true) }}
                        >
                          {processingRecord?.id === record.id || isLoading ? <i className="fas fa-spinner fa-spin"></i> : recentOperatedIds.includes(record.id) ? '刷新' : '提取'}
                        </Button>
                      }
                      {/* {recentOperatedIds.includes(record.id) &&
                        <Button
                          size="small"
                          className='!rounded-lg !text-xs !w-[80%] !bg-gray-100'
                          loading={isLoading}
                          disabled={isLoading}
                          onClick={() => refreshSingleRecord(record)}
                        >
                          {isLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-sync-alt"></i>}
                        </Button>
                      } */}
                      {(record.to_chain_tx_status === 1 || record.to_chain_tx_status === 2 || !record.deadline) && <div>-</div>}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 分页 */}
          <div className="flex justify-center items-center gap-2 py-3 border-t">
            <button
              onClick={() => handlePageChange(pagination.current - 1)}
              disabled={pagination.current === 1}
              className={`w-8 h-8 flex items-center justify-center rounded ${pagination.current === 1
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-100'
                }`}
            >
              &lt;
            </button>

            {generatePageNumbers().map((page, index) => (
              page === '...' ? (
                <span key={`ellipsis-${index}`} className="w-8 h-8 flex items-center justify-center">
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => handlePageChange(page as number)}
                  className={`w-8 h-8 flex items-center justify-center rounded ${page === pagination.current
                    ? 'bg-[#165DFF] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  {page}
                </button>
              )
            ))}

            <button
              onClick={() => handlePageChange(pagination.current + 1)}
              disabled={pagination.current === Math.ceil(pagination.total / pagination.pageSize)}
              className={`w-8 h-8 flex items-center justify-center rounded ${pagination.current === Math.ceil(pagination.total / pagination.pageSize)
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-100'
                }`}
            >
              &gt;
            </button>
          </div>
        </div>
      </Popup>}

      {/* 开始时间选择器 */}
      <DatePicker
        visible={showStartDatePicker}
        onClose={() => setShowStartDatePicker(false)}
        precision="day"
        max={endDate || undefined}
        onConfirm={val => {
          setStartDate(val)
          setShowStartDatePicker(false)
        }}
      />

      {/* 结束时间选择器 */}
      <DatePicker
        visible={showEndDatePicker}
        onClose={() => setShowEndDatePicker(false)}
        precision="day"
        min={startDate || undefined}
        onConfirm={val => {
          // 设置为当天的23:59:59
          const endOfDay = moment(val).endOf('day').toDate()
          setEndDate(endOfDay)
          setShowEndDatePicker(false)
        }}
      />

      {/* 添加步骤确认弹窗 */}
      <Popup
        visible={showStepsModal}
        onMaskClick={() => {
          if (stepStatus !== 'process') {
            if (currentStep === 2) {
              setProcessingRecord(undefined)
              setRecentOperatedIds([])
            }
            setShowStepsModal(false)
            setCurrentStep(0)
            setStepStatus('process')
            setIsWithdrawing(false)
          }
        }}
        position="bottom"
        bodyStyle={{
          height: '50vh',
          borderTopLeftRadius: '8px',
          borderTopRightRadius: '8px',
        }}
      >
        <div className="p-4">
          <div className="flex justify-between items-center mb-6">
            <span className="text-lg font-medium">确认提现</span>
            <span
              className="text-gray-500 text-2xl leading-none cursor-pointer"
              onClick={() => {
                if (stepStatus !== 'process') {
                  if (currentStep === 2) {
                    setProcessingRecord(undefined)
                    setRecentOperatedIds([])
                  }
                  setShowStepsModal(false)
                  setCurrentStep(0)
                  setStepStatus('process')
                  setIsWithdrawing(false)
                }
              }}
            >
              ×
            </span>
          </div>

          <Steps current={currentStep}>
            <Steps.Step title="1" description="授权" />
            <Steps.Step title="2" description="CAD转入" />
            <Steps.Step title="3" description="提取" />
          </Steps>

          <div className="mt-8 space-y-4">
            {currentStep === 0 && (
              <Button
                block
                color="primary"
                loading={stepStatus === 'process'}
                onClick={handleApproveCADM}
                className="!rounded-lg !h-11"
              >
                {stepStatus === 'process' ? 'Approving...' : '授权'}
              </Button>
            )}

            {currentStep === 1 && (
              <Button
                block
                color="primary"
                loading={stepStatus === 'process'}
                onClick={handleTestnetBridge}
                className="!rounded-lg !h-11"
              >
                {stepStatus === 'process' ? '处理中...' : '确认转入'}
              </Button>
            )}

            {currentStep === 2 && (
              <Button
                block
                color="primary"
                loading={stepStatus === 'process'}
                onClick={handleEthereumBridge}
                className="!rounded-lg !h-11"
              >
                {stepStatus === 'process' ? '处理中...' : '确认提取'}
              </Button>
            )}

            <div className="text-sm text-gray-500 text-center">
              {currentStep === 0 && '请先授权'}
              {currentStep === 1 && (tipText ? tipText : '请确认转入')}
              {currentStep === 2 && '请确认提取'}
            </div>
          </div>
        </div>
      </Popup>

      {/* 修改收益地址选择弹窗 */}
      <Popup
        visible={showAddressSelector}
        onMaskClick={() => setShowAddressSelector(false)}
        position="bottom"
        bodyStyle={{
          height: '50vh',
          borderTopLeftRadius: '8px',
          borderTopRightRadius: '8px',
        }}
      >
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-medium">选择收益地址</span>
            <span
              className="text-gray-500 text-2xl leading-none cursor-pointer"
              onClick={() => setShowAddressSelector(false)}
            >
              ×
            </span>
          </div>

          <div className="max-h-[50vh] overflow-auto">
            {historyAddresses.map((item: any) => (
              <div
                key={item.wallet_address}
                className={`py-3 px-4 border-b cursor-pointer ${profitAddress === item.wallet_address ? 'bg-[#E8F3FF] text-[#165DFF]' : ''
                  }`}
                onClick={() => {
                  setProfitAddress(item.wallet_address)
                  setShowAddressSelector(false)
                }}
              >
                <div className="text-sm truncate">{item.wallet_address.slice(0, 10)}...{item.wallet_address.slice(-6)}</div>
              </div>
            ))}
          </div>
        </div>
      </Popup>

      <WalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onConnect={(address: string) => handleBindWallet(address)}
        submitting={submitting}
      />
    </div>
  )
} 