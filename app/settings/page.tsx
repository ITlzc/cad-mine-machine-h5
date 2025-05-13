'use client'

import { useState, useEffect } from 'react'
import { Toast, Dialog, Loading, Popup, DatePicker, Steps, Input, Button } from 'antd-mobile'
import { getCurrentUser, signOut } from '../utils/supabase_lib'
import { userService } from '../services/user-service'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useDisconnect } from 'wagmi'
import WalletModal from '../components/WalletModal'
import moment from 'moment'
import { useNavigateWithParams } from '../hooks/useNavigateWithParams'
import { useWriteContract, usePublicClient, useSwitchChain } from 'wagmi'
import { ethers } from 'ethers'
import { Bsc } from '../utils/bsc_config'
import RebateABI from '../contracts/Rebate.json'

const TOKEN_ADDRESS = '0x55d398326f99059fF775485246999027B3197955'
const REBATE_CONTRACT = '0xae5630AdDF965c51abAC1C3bd97E16aF1E0cA166'

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

export default function SettingsPage() {
  const [emailAddress, setEmailAddress] = useState('')
  const [userInfo, setUserInfo] = useState<any>({})
  const [walletAddress, setWalletAddress] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const router = useRouter()
  const navigateWithParams = useNavigateWithParams()

  const { disconnect } = useDisconnect()
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [inviteNum, setInviteNum] = useState(0)
  const [totalCommission, setTotalCommission] = useState(0)
  const [withdrawnCommission, setWithdrawnCommission] = useState(0)
  const [userInfoByFetch, setUserInfoByFetch] = useState<any>({})
  const [showRecords, setShowRecords] = useState(false)
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [showStartDatePicker, setShowStartDatePicker] = useState(false)
  const [showEndDatePicker, setShowEndDatePicker] = useState(false)
  const [inviteRecords, setInviteRecords] = useState<any[]>([])
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawAddress, setWithdrawAddress] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [currentStep, setCurrentStep] = useState(0)
  const [stepStatus, setStepStatus] = useState<'process' | 'wait' | 'finish' | ''>('')
  const { writeContractAsync } = useWriteContract()
  const publicClient = usePublicClient()
  const { switchChain } = useSwitchChain()

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
          setShowWalletModal(false)
          getUserInfo()
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

  async function getUserInfo() {
    try {
      setIsLoading(true)
      const { user: user_data, error } = await getCurrentUser();
      console.log('user_data', user_data)
      setUserInfo(user_data)

      const userInfo: any = await userService.getUserInfo(user_data?.id)
      setUserInfoByFetch(userInfo?.user)
      if (error) {
        console.error('获取用户信息失败:', error)
      } else {
        setEmailAddress(user_data?.email || '')
        const inviteLink = `${window.location.origin}?inviter_code=${user_data?.id?.replace(/-/g, '').slice(8, 20)}`
        setInviteLink(inviteLink)
        setInviteCode(user_data?.id?.replace(/-/g, '').slice(8, 20))
        const historyAddress: any = await userService.getHistoryAddress()
        if (historyAddress && historyAddress?.length > 0) {
          setWalletAddress(historyAddress[0]?.wallet_address)
        }
      }
    } catch (error) {
      console.error('获取用户信息错误:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchInviteRecords = async (page: number) => {
    try {
      const res: any = await userService.getInviteRecords(
        page, 
        pagination.pageSize,
        startDate ? moment(startDate).startOf('day').format('YYYY-MM-DD HH:mm:ss') : '',
        endDate ? moment(endDate).endOf('day').format('YYYY-MM-DD HH:mm:ss') : ''
      )
      setInviteRecords(res.records)
      setPagination(prev => ({
        ...prev,
        current: page,
        total: res.pagination.total
      }))
    } catch (error) {
      console.error('获取邀请记录失败:', error)
    }
  }

  const handleSearch = () => {
    if (!startDate || !endDate) {
      Toast.show({
        content: '请选择完整的时间范围',
        position: 'center',
      })
      return
    }
    fetchInviteRecords(1)
  }

  useEffect(() => {
    getUserInfo()
  }, [])

  useEffect(() => {
    if (userInfoByFetch?.role === 2) {
      fetchInviteRecords(1)
      userService.getTotalCommission().then((res: any) => {
        console.log('getTotalCommission res', res)
        setTotalCommission(res?.total_commission)
        setWithdrawnCommission(res?.withdrawn_amount)
        setInviteNum(res?.user_count)
      })
    }
  }, [userInfoByFetch])

  const handleLogout = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        console.error('Error signing out:', error);
        return;
      }
      localStorage.removeItem('user');
      disconnect();
      navigateWithParams('/login', 'push');
    } catch (error) {
      console.error('退出登录错误:', error)
    }
  }

  const showLogoutConfirm = () => {
    Dialog.confirm({
      title: '退出登录',
      content: '确定要退出登录吗？',
      confirmText: '确定',
      cancelText: '取消',
      onConfirm: () => {
        handleLogout();
      },
    });
  };

  const handlePageChange = (page: number) => {
    if (page === pagination.current) return
    fetchInviteRecords(page)
  }

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

  // 检查授权额度
  const checkAllowance = async () => {
    try {
      const allowance = await publicClient.readContract({
        abi: ERC20_ABI,
        address: TOKEN_ADDRESS,
        functionName: 'allowance',
        args: [walletAddress, REBATE_CONTRACT],
      })
      return ethers.utils.formatEther(allowance as bigint)
    } catch (error) {
      console.error('检查授权额度失败:', error)
      return '0'
    }
  }

  // 处理提现
  const handleWithdraw = async () => {
    // 检查链接状态 未连接先连接
    if (!walletAddress) {
      Toast.show({
        content: '请先连接钱包',
        position: 'center',
      })
      return
    }
    // 检查提现地址
    if (!withdrawAddress) {
      Toast.show({
        content: '请填写提现地址',
        position: 'center',
      })
      return
    }
    // 检查提现金额
    if (!withdrawAmount) {
      Toast.show({
        content: '请填写提现金额',
        position: 'center',
      })
      return
    }
    // 检查提现金额是否超过100
    if (Number(withdrawAmount) > 100) {
      Toast.show({
        content: '提现金额不能超过100',
        position: 'center',
      })
      return
    }

    try {
      setIsWithdrawing(true)
      setShowWithdrawModal(true)
      // 检查是否在BSC链上
      if (publicClient.chain !== Bsc) {
        await switchChain({ chainId: Bsc.id })
        // 等待切换完成
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }

      // 检查授权额度
      const allowance = await checkAllowance()
      console.log('allowance', allowance, 'withdrawAmount', withdrawAmount)

      // 如果授权额度大于提现金额，直接跳到第三步
      if (Number(allowance) >= Number(withdrawAmount)) {
        setCurrentStep(2)
      } else {
        setCurrentStep(1)
      }
      setStepStatus('wait')
    } catch (error) {
      console.error('检查授权失败:', error)
      Toast.show({
        content: '检查授权失败，请重试',
        position: 'center',
      })
      setIsWithdrawing(false)
    }
  }

  // 处理 Approve USDT
  const handleApproveCADM = async () => {
    try {
      // 直接切换到BSC链
      if (publicClient.chain !== Bsc) {
        await switchChain({ chainId: Bsc.id })
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
      setStepStatus('process')
      const hash = await writeContractAsync({
        abi: ERC20_ABI,
        address: TOKEN_ADDRESS,
        functionName: 'approve',
        args: [REBATE_CONTRACT, ethers.utils.parseEther(withdrawAmount)],
        chain: Bsc,
        account: walletAddress as `0x${string}`
      })
      // 等待交易确认
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      if (receipt.status === 'success') {
        // 再次检查授权额度
        const allowance = await checkAllowance()
        if (Number(allowance) >= Number(withdrawAmount)) {
          setCurrentStep(2)
          setStepStatus('wait')
        } else {
          setStepStatus('wait')
        }
      } else {
        setStepStatus('wait')
      }
    } catch (error) {
      console.error('Approve失败:', error)
      if (error instanceof Error && error.message.includes('User denied transaction signature')) {
        setStepStatus('wait')
        return
      } else {
        Toast.show({
          content: error.message,
          position: 'center',
        })
      }
      setStepStatus('wait')
    }
  }

  // 处理提现合约
  const handleWithdrawContract = async () => {
    try {
      // 直接切换到BSC链
      if (publicClient.chain !== Bsc) {
        await switchChain({ chainId: Bsc.id })
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
      setStepStatus('process')
      const hash = await writeContractAsync({
        abi: RebateABI.abi,
        address: REBATE_CONTRACT,
        functionName: 'withdraw',
        args: [withdrawAddress, ethers.utils.parseEther(withdrawAmount)],
        chain: Bsc,
        account: walletAddress as `0x${string}`
      })
      const receipt = await publicClient.waitForTransactionReceipt({ hash })

      if (receipt.status === 'success') {
        Toast.show({
          content: '提现成功',
          position: 'center',
        })
        setShowWithdrawModal(false)
        // 重置状态
        setCurrentStep(0)
        setStepStatus('')
        setWithdrawAddress('')
        setWithdrawAmount('')
        setIsWithdrawing(false)
        // 刷新数据
        userService.getTotalCommission().then((res: any) => {
          setTotalCommission(res?.total_commission)
          setWithdrawnCommission(res?.withdrawn_amount)
          setInviteNum(res?.user_count)
        })
      } else {
        setStepStatus('wait')
      }
    } catch (error) {
      console.error('提现失败:', error)
      Toast.show({
        content: '提现失败',
        position: 'center',
      })
      setStepStatus('wait')
      setIsWithdrawing(false)
    }
  }

  const renderWithdrawModal = () => {
    return (
      <Popup
        visible={showWithdrawModal}
        onMaskClick={() => {
          if (stepStatus !== 'process') {
            setShowWithdrawModal(false)
            setCurrentStep(0)
            setStepStatus('')
            setWithdrawAddress('')
            setWithdrawAmount('')
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
                  setShowWithdrawModal(false)
                  setCurrentStep(0)
                  setStepStatus('')
                  setWithdrawAddress('')
                  setWithdrawAmount('')
                  setIsWithdrawing(false)
                }
              }}
            >
              ×
            </span>
          </div>

          <Steps current={currentStep}>
            <Steps.Step title="1" description="填写提现信息" />
            <Steps.Step title="2" description="授权USDT代币" />
            <Steps.Step title="3" description="确认提现" />
          </Steps>

          <div className="mt-8 space-y-4">
            {currentStep === 0 && (
              <>
                <div className="space-y-4">
                  <Input
                    placeholder="请输入提现地址"
                    value={withdrawAddress}
                    onChange={setWithdrawAddress}
                    className="!rounded-lg !h-11"
                  />
                  <Input
                    type="number"
                    placeholder="请输入提现数量（不超过100）"
                    value={withdrawAmount}
                    onChange={setWithdrawAmount}
                    className="!rounded-lg !h-11"
                  />
                  <Button
                    block
                    color="primary"
                    onClick={handleWithdraw}
                    disabled={!withdrawAddress || !withdrawAmount || Number(withdrawAmount) > 100}
                    className="!rounded-lg !h-11"
                  >
                    下一步
                  </Button>
                </div>
              </>
            )}

            {currentStep === 1 && (
              <Button
                block
                color="primary"
                loading={stepStatus === 'process'}
                onClick={handleApproveCADM}
                className="!rounded-lg !h-11"
              >
                {stepStatus === 'process' ? 'Approving...' : 'Approve USDT'}
              </Button>
            )}

            {currentStep === 2 && (
              <Button
                block
                color="primary"
                loading={stepStatus === 'process'}
                onClick={handleWithdrawContract}
                className="!rounded-lg !h-11"
              >
                {stepStatus === 'process' ? '处理中...' : '确认提现'}
              </Button>
            )}

            <div className="text-sm text-gray-500 text-center">
              {currentStep === 0 && '请输入提现信息'}
              {currentStep === 1 && '请先授权 USDT 代币'}
              {currentStep === 2 && '请确认提现'}
            </div>
          </div>
        </div>
      </Popup>
    )
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center pt-20 text-lg">
        <Loading color='#1677FF' />
      </div>
    )
  }

  return (
    <div className="h-full bg-[#F5F7FA]">

      {/* 用户信息 */}
      <div className="bg-white mt-3 px-4 py-4">
        <div className="flex items-center">
          <div className="min-w-12 min-h-12 w-12 h-12 bg-gray-200 rounded-full overflow-hidden">
            <img
              src={userInfo?.user_metadata.avatar_url || "/images/avatar.png"}
              alt="Avatar"
              width={48}
              height={48}
              className="w-12 h-12 rounded-full"
            />
          </div>
          <div className="ml-3">
            <div className="text-lg font-medium">{emailAddress}</div>
            <div className="text-xs text-gray-500">用户ID: {userInfo?.id}</div>
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={showLogoutConfirm}
            className="w-full bg-red-500 text-white py-2.5 rounded-lg flex items-center justify-center text-base"
          >
            <i className="fas fa-sign-out-alt mr-2"></i>
            退出登录
          </button>
        </div>
      </div>

      {userInfoByFetch?.role === 2 && <div className="px-4 py-4 bg-white mb-4">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-[#FFB400] flex flex-col items-center justify-start rounded-lg py-3 text-white shadow-sm">
            <div className="text-sm mb-2">已邀请人数</div>
            <div className="text-sm font-medium text-center">{inviteNum}</div>
          </div>
          <div className="bg-[#FFB400] flex flex-col items-center justify-start rounded-lg py-3 text-white shadow-sm">
            <div className="text-sm mb-2">累计返佣</div>
            <div className="text-sm font-medium text-center">{totalCommission} USDT</div>
          </div>
          <div className="bg-[#00B42A] flex flex-col items-center justify-start rounded-lg py-3 text-white shadow-sm">
            <div className="text-sm mb-2">已提现返佣</div>
            <div className="text-sm font-medium text-center">{withdrawnCommission} USDT</div>
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="w-full bg-[#165DFF] text-white py-2.5 rounded-lg flex items-center justify-center text-base"
          >
            <i className="fas fa-wallet mr-2"></i>
            提现
          </button>
        </div>
      </div>
      }

      {/* 钱包地址 */}
      <div className="bg-white mt-3">
        <div className="px-4 py-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-base font-medium text-gray-900">钱包地址</span>
            {walletAddress && <button
              className="text-[#165DFF]"
              onClick={() => {
                navigator.clipboard.writeText(walletAddress);
                Toast.show({
                  content: '复制成功',
                  position: 'center'
                });
              }}
            >
              <i className="far fa-copy"></i>
            </button>}
          </div>
          {walletAddress ? (
            <div className="text-xs text-gray-500 break-all">
              {walletAddress}
            </div>
          ) : (
            <button onClick={() => setShowWalletModal(true)} className="w-full bg-[#165DFF] text-white py-3 rounded-lg flex items-center justify-center text-base">
              <i className="fas fa-wallet mr-2"></i>
              绑定钱包
            </button>
          )}
        </div>


        {userInfoByFetch?.role === 2 && <>
          <div className="px-4 py-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-base font-medium text-gray-900">邀请链接</span>
              {inviteLink && <button
                className="text-[#165DFF]"
                onClick={() => {
                  navigator.clipboard.writeText(inviteLink);
                  Toast.show({
                    content: '复制成功',
                    position: 'center'
                  });
                }}
              >
                <i className="far fa-copy"></i>
              </button>}
            </div>
            <div className="text-xs text-gray-500 break-all">
              {inviteLink}
            </div>
          </div>

          <div className="px-4 py-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-base font-medium text-gray-900">我的邀请码</span>
              {inviteLink && <button
                className="text-[#165DFF]"
                onClick={() => {
                  navigator.clipboard.writeText(inviteCode);
                  Toast.show({
                    content: '复制成功',
                    position: 'center'
                  });
                }}
              >
                <i className="far fa-copy"></i>
              </button>}
            </div>
            <div className="text-xs text-gray-500 break-all">
              {inviteCode}
            </div>
          </div>

          {/* 提现记录 */}
          <div className="mt-4 px-4 pb-20">
            <div className="flex justify-between items-center mb-3">
              <span className="text-base font-medium text-gray-900">邀请记录</span>
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
                  <tr className="grid grid-cols-4 py-2">
                    <th className="text-left">用户地址</th>
                    <th className="text-center">下单数量</th>
                    <th className="text-left">时间</th>
                    <th className="text-right">返佣奖励</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {inviteRecords.slice(0, 5).map((record, index) => (
                    <tr key={index} className="grid grid-cols-4 py-2">
                      <td className="text-xs">{record.wallet_address ? record.wallet_address.slice(0, 6) + '...' + record.wallet_address.slice(-4) : '-'}</td>
                      <td className="text-center text-xs">{record.quantity}</td>
                      <td className="text-xs">{moment(record.created_at).format('YYYY-MM-DD HH:mm:ss')}</td>
                      <td className="text-right text-xs">{record.commission} USDT</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>}


      </div>

      <WalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onConnect={(address: string) => handleBindWallet(address)}
        submitting={submitting}
      />

      <Popup
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
            <span className="text-lg font-medium">邀请记录</span>
            <span
              className="text-gray-500 text-2xl leading-none"
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
                  onClick={() => {
                    setStartDate(null)
                    setEndDate(null)
                    fetchInviteRecords(1)
                  }}
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
          <div className="grid grid-cols-4 py-3 px-4 text-sm text-gray-500 bg-gray-50">
            <div className="text-left">用户地址</div>
            <div className="text-center">下单数量</div>
            <div className="text-left">时间</div>
            <div className="text-right">返佣奖励</div>
          </div>

          {/* 表格内容 */}
          <div className="flex-1 overflow-auto">
            {inviteRecords.map((record, index) => (
              <div
                key={index}
                className="grid grid-cols-4 px-4 py-3 text-sm border-b"
              >
                <div className="text-xs">{record.wallet_address ? record.wallet_address.slice(0, 6) + '...' + record.wallet_address.slice(-4) : '-'}</div>
                <div className="text-center text-xs">{record.quantity}</div>
                <div className="text-xs">{moment(record.created_at).format('YYYY-MM-DD HH:mm:ss')}</div>
                <div className="text-right text-xs">{record.commission} USDT</div>
              </div>
            ))}
          </div>

          {/* 分页 */}
          <div className="flex justify-center items-center gap-2 py-3 border-t">
            <button
              onClick={() => handlePageChange(pagination.current - 1)}
              disabled={pagination.current === 1}
              className={`w-8 h-8 flex items-center justify-center rounded ${
                pagination.current === 1
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
                  className={`w-8 h-8 flex items-center justify-center rounded ${
                    page === pagination.current
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
              className={`w-8 h-8 flex items-center justify-center rounded ${
                pagination.current === Math.ceil(pagination.total / pagination.pageSize)
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              &gt;
            </button>
          </div>
        </div>
      </Popup>

      {/* 开始时间选择器 */}
      <DatePicker
        visible={showStartDatePicker}
        onClose={() => setShowStartDatePicker(false)}
        precision="day"
        max={endDate || undefined}
        onConfirm={val => {
          // 设置为当天的00:00:00
          const startOfDay = moment(val).startOf('day').toDate()
          setStartDate(startOfDay)
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

      {userInfoByFetch?.role === 2 && renderWithdrawModal()}
    </div>
  )
} 