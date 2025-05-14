'use client'

import { useState, useEffect, Suspense } from 'react'
import { Toast, Dialog, Loading, Popup, DatePicker, Steps, Input, Button } from 'antd-mobile'
import { getCurrentUser, signOut } from '../utils/supabase_lib'
import { userService } from '../services/user-service'
import { useRouter } from 'next/navigation'
import { useDisconnect } from 'wagmi'
import WalletModal from '../components/WalletModal'
import moment from 'moment'
import { useNavigateWithParams } from '../hooks/useNavigateWithParams'
import { useWriteContract, usePublicClient, useSwitchChain, useAccount, useConnect } from 'wagmi'
import { ethers } from 'ethers'
// import { Bsc } from '../utils/bsc_config'
import { BscTest } from '../utils/bsc_test_config'
import RebateABI from '../contracts/Rebate.json'

const REBATE_CONTRACT = '0xae5630AdDF965c51abAC1C3bd97E16aF1E0cA166'


function SettingsPageContent() {
  const { address } = useAccount()
  const { connect } = useConnect()
  const [emailAddress, setEmailAddress] = useState('')
  const [userInfo, setUserInfo] = useState<any>({})
  const [walletAddress, setWalletAddress] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const router = useRouter()
  const navigateWithParams = useNavigateWithParams()

  const { disconnectAsync } = useDisconnect()
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
  const { writeContractAsync } = useWriteContract()
  const publicClient = usePublicClient()
  const { switchChainAsync } = useSwitchChain()
  const [withdrawalRecords, setWithdrawalRecords] = useState<any[]>([])
  const [showWithdrawalRecords, setShowWithdrawalRecords] = useState(false)
  const [withdrawalPagination, setWithdrawalPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })
  const [processingRecord, setProcessingRecord] = useState<any>(null)
  const [tipText, setTipText] = useState('')

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
      if (!error.message.includes('User denied') && !error.message.includes('user rejected') && !error.message.includes('User rejected')) {
        console.error('绑定钱包失败:', error)
        Toast.show({
          content: '绑定钱包失败：' + error.message,
          position: 'center'
        })
      }
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

  const handleLogout = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        console.error('Error signing out:', error);
        return;
      }
      localStorage.removeItem('user');
      await disconnectAsync();
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

  const handleWithdraw = async (record?: any) => {
    try {
      if (!address) {
        Toast.show({
          content: '请先连接钱包',
          position: 'center',
        })
        return
      }
      setIsWithdrawing(true)
      if (record) {
        setProcessingRecord(record)
      }
      if (publicClient.chain !== BscTest) {
        await switchChainAsync({ chainId: BscTest.id })
      }

      if (record) {
        handleWithdrawContract(record)
        return
      }

      let createWithdraw: any = null
      createWithdraw = await userService.withdrawCommission(Number(withdrawAmount), withdrawAddress)

      if ((createWithdraw && createWithdraw?.id)) {
        let retryCount = 0
        const maxRetries = 30 // 最多轮询30次
        const retryInterval = 2000 // 每2秒轮询一次

        let withdrawData = null
        while (retryCount < maxRetries) {
          const res: any = await userService.getCommissionWithdrawalRecord(record?.id || createWithdraw?.id)
          if (res?.record?.signature && res?.record?.nonce) {
            withdrawData = res.record
            break
          }
          await new Promise(resolve => setTimeout(resolve, retryInterval))
          retryCount++
        }

        if (!withdrawData?.signature || !withdrawData?.nonce) {
          throw new Error('获取签名超时，请稍后在提现记录中查看状态')
        }
        handleWithdrawContract(withdrawData)
      }

    } catch (error) {
      if (!error.message.includes('User denied') && !error.message.includes('user rejected') && !error.message.includes('User rejected')) {
        console.error('提现失败:', error)
        Toast.show({
          content: error.message || '提现失败',
          position: 'center',
        })
      }
      setProcessingRecord(null)
      setIsWithdrawing(false)
    }
  }

  async function handleWithdrawContract(withdrawData: any) {
    if (!address) {
      Toast.show({
        content: '请先连接钱包',
        position: 'center',
      })
      return
    }
    try {
      setTipText('交易确认中...')
      console.log('withdrawData', withdrawData)
      const hash = await writeContractAsync({
        abi: RebateABI.abi,
        address: REBATE_CONTRACT,
        functionName: 'claim',
        args: [withdrawData.withdrawal_address, ethers.utils.parseEther(withdrawData.withdrawal_amount.toString()), withdrawData.nonce, '0x' + withdrawData.signature],
        chain: BscTest,
        account: address as `0x${string}`
      })
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      console.log(receipt)

      if (receipt.status === 'success') {
        setTipText('提现成功，状态更新中...')
        // 开始轮询检查记录状态
        let retryCount = 0
        const maxRetries = 30 // 最多轮询30次
        const retryInterval = 2000 // 每2秒轮询一次

        let recordStatus = 0
        while (retryCount < maxRetries) {
          const res: any = await userService.getCommissionWithdrawalRecord(withdrawData.id)
          if (res?.record?.status === 2) {
            recordStatus = 2
            break
          }
          await new Promise(resolve => setTimeout(resolve, retryInterval))
          retryCount++
        }

        if (recordStatus === 2) {
          Toast.show({
            content: '提现成功',
            position: 'center',
          })
          setTipText('')
          setShowWithdrawModal(false)
          // 重置状态
          setWithdrawAddress('')
          setWithdrawAmount('')
          setIsWithdrawing(false)
          setProcessingRecord(null)
          // 刷新数据
          userService.getTotalCommission().then((res: any) => {
            setTotalCommission(res?.total_commission)
            setWithdrawnCommission(res?.withdrawn_amount)
            setInviteNum(res?.user_count)
          })
          // 刷新提现记录
          fetchWithdrawalRecords(1)
        } else {
          Toast.show({
            content: '提现成功，请稍后在提现记录中查看状态',
            position: 'center',
          })
          setTipText('')
          setShowWithdrawModal(false)
          setWithdrawAddress('')
          setWithdrawAmount('')
          setIsWithdrawing(false)
          setProcessingRecord(null)
          // 刷新数据
          userService.getTotalCommission().then((res: any) => {
            setTotalCommission(res?.total_commission)
            setWithdrawnCommission(res?.withdrawn_amount)
            setInviteNum(res?.user_count)
          })
          // 刷新提现记录
          fetchWithdrawalRecords(1)
        }
      } else {
        Toast.show({
          content: '合约调用失败：' + receipt.status,
          position: 'center',
        })
        setTipText('')
        setIsWithdrawing(false)
        setProcessingRecord(null)
      }
    } catch (error) {
      if (!error.message.includes('User denied') && !error.message.includes('user rejected') && !error.message.includes('User rejected')) {
        console.error('提现合约调用失败:', error)
        Toast.show({
          content: error.message || '提现失败',
          position: 'center',
        })
      }
      setTipText('')
      setIsWithdrawing(false)
      setProcessingRecord(null)
    }
  }

  // 获取返佣提现记录
  const fetchWithdrawalRecords = async (page: number) => {
    try {
      const res: any = await userService.getCommissionWithdrawalRecords(
        page,
        withdrawalPagination.pageSize,
        startDate ? moment(startDate).startOf('day').format('YYYY-MM-DD HH:mm:ss') : '',
        endDate ? moment(endDate).endOf('day').format('YYYY-MM-DD HH:mm:ss') : ''
      )
      setWithdrawalRecords(res.records || [])
      setWithdrawalPagination(prev => ({
        ...prev,
        current: page,
        total: res.pagination.total
      }))
    } catch (error) {
      console.error('获取提现记录失败:', error)
    }
  }

  // 处理提现记录分页
  const handleWithdrawalPageChange = (page: number) => {
    if (page === withdrawalPagination.current) return
    fetchWithdrawalRecords(page)
  }

  // 生成提现记录分页数字
  const generateWithdrawalPageNumbers = () => {
    const totalPages = Math.ceil(withdrawalPagination.total / withdrawalPagination.pageSize)
    const current = withdrawalPagination.current
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

  // 0未签名 1已签名可执行 2执行完成 3已过期
  const getWithdrawalStatus = (status: number) => {
    switch (status) {
      case 0:
        return <span className="px-2 py-0.5 rounded text-xs text-[#165DFF] bg-[#E8F3FF]">待签名</span>
      case 1:
        return <span className="px-2 py-0.5 rounded text-xs text-[#165DFF] bg-[#E8F3FF]">待确认</span>
      case 2:
        return <span className="px-2 py-0.5 rounded text-xs text-[#00B42A] bg-[#E8F7EE]">已完成</span>
      case 3:
        return <span className="px-2 py-0.5 rounded text-xs bg-red-50 text-red-500">已过期</span>
      default:
        return <span className="px-2 py-0.5 rounded text-xs bg-gray-50 text-gray-500">未知</span>
    }
  }

  useEffect(() => {
    getUserInfo()
  }, [])

  useEffect(() => {
    if (userInfoByFetch?.role === 2) {
      fetchWithdrawalRecords(1)
      fetchInviteRecords(1)
      userService.getTotalCommission().then((res: any) => {
        console.log('getTotalCommission res', res)
        setTotalCommission(res?.total_commission)
        setWithdrawnCommission(res?.withdrawn_amount)
        setInviteNum(res?.user_count)
      })
    }
  }, [userInfoByFetch])

  const renderWithdrawModal = () => {
    return (
      <Popup
        visible={showWithdrawModal}
        onMaskClick={() => {
          if (!isWithdrawing) {
            setShowWithdrawModal(false)
            setWithdrawAddress('')
            setWithdrawAmount('')
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
                if (!isWithdrawing) {
                  setShowWithdrawModal(false)
                  setWithdrawAddress('')
                  setWithdrawAmount('')
                }
              }}
            >
              ×
            </span>
          </div>

          <div className="space-y-4">
            <Input
              placeholder="请输入提现地址"
              value={withdrawAddress}
              onChange={setWithdrawAddress}
              className="!h-11 !border-b"
            />
            <Input
              type="number"
              placeholder="请输入提现数量"
              value={withdrawAmount}
              onChange={setWithdrawAmount}
              className="!h-11 !border-b"
            />
            <Button
              block
              color="primary"
              onClick={() => {
                // 验证地址格式
                if (!ethers.utils.isAddress(withdrawAddress)) {
                  Toast.show({
                    content: '请输入有效的提现地址',
                    position: 'center',
                  })
                  return
                }
                // 验证金额
                const amount = Number(withdrawAmount)
                if (isNaN(amount) || amount <= 0) {
                  Toast.show({
                    content: '请输入有效的提现金额',
                    position: 'center',
                  })
                  return
                }
                if (amount > totalCommission) {
                  Toast.show({
                    content: '提现金额不能大于累计返佣金额',
                    position: 'center',
                  })
                  return
                }
                handleWithdraw()
              }}
              loading={isWithdrawing}
              disabled={!withdrawAddress || !withdrawAmount || isWithdrawing || !address}
              className="!rounded-lg !h-11"
            >
              确认提现
            </Button>
            {tipText && <div className="text-center text-xs text-gray-500">{tipText}</div>}
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
            onClick={() => {
              if (typeof window.ethereum !== 'undefined' && address) {
                setShowWithdrawModal(true)
              }
            }}
            disabled={typeof window.ethereum === 'undefined' || !address || !totalCommission || totalCommission === 0}
            className="w-full bg-[#165DFF] text-white py-2.5 rounded-lg flex items-center justify-center text-base disabled:opacity-50"
          >
            <i className="fas fa-wallet mr-2"></i>
            {address ? '提现' : '请先连接钱包'}
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
          <div className="mt-4 px-4 pb-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-base font-medium text-gray-900">提现记录</span>
              <span
                className="text-[#165DFF] text-sm"
                onClick={() => setShowWithdrawalRecords(true)}
              >
                更多记录 &gt;
              </span>
            </div>
            <div className="bg-white rounded-lg">
              <table className="w-full text-sm">
                <thead className="text-gray-500">
                  <tr className="grid grid-cols-5 py-2">
                    <th className="text-left">数量</th>
                    <th className="text-left">时间</th>
                    <th className="text-center">地址</th>
                    <th className="text-right">状态</th>
                    <th className="text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {withdrawalRecords.length > 0 ? withdrawalRecords.slice(0, 5).map((record, index) => (
                    <tr key={index} className="grid grid-cols-5 py-2">
                      <td className="text-left text-xs">{Number(ethers.utils.formatEther(record.amount.toString()))} USDT</td>
                      <td className="text-xs">{moment(record.created_at).format('YYYY-MM-DD HH:mm:ss')}</td>
                      <td className="text-center text-xs text-[#165DFF]">{record.withdrawal_address ? record.withdrawal_address.slice(0, 6) + '...' + record.withdrawal_address.slice(-4) : '-'}</td>
                      <td className="text-right">
                        {getWithdrawalStatus(record.status)}
                      </td>
                      <td className="text-right">
                        {record.status === 1 ? <Button size="small"
                          className='!rounded-lg !text-xs !w-[80%] !bg-[#165DFF] !text-white'
                          loading={processingRecord?.id === record.id}
                          disabled={processingRecord?.id === record.id || isLoading}
                          onClick={() => handleWithdraw(record)}>提现</Button> : '-'}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="text-center text-gray-500">暂无提现记录</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 邀请记录 */}
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
                  {inviteRecords.length > 0 ? inviteRecords.slice(0, 5).map((record, index) => (
                    <tr key={index} className="grid grid-cols-4 py-2">
                      <td className="text-xs text-[#165DFF]">{record.wallet_address ? record.wallet_address.slice(0, 6) + '...' + record.wallet_address.slice(-4) : '-'}</td>
                      <td className="text-center text-xs">{record.quantity}</td>
                      <td className="text-xs">{moment(record.created_at).format('YYYY-MM-DD HH:mm:ss')}</td>
                      <td className="text-right text-xs">{record.commission} USDT</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="text-center text-gray-500">暂无邀请记录</td>
                    </tr>
                  )}
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

      {/* 邀请记录弹窗 */}
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
            {inviteRecords.length > 0 ? inviteRecords.map((record, index) => (
              <div
                key={index}
                className="grid grid-cols-4 px-4 py-3 text-sm border-b"
              >
                <div className="text-xs text-[#165DFF]">{record.wallet_address ? record.wallet_address.slice(0, 6) + '...' + record.wallet_address.slice(-4) : '-'}</div>
                <div className="text-center text-xs">{record.quantity}</div>
                <div className="text-xs">{moment(record.created_at).format('YYYY-MM-DD HH:mm:ss')}</div>
                <div className="text-right text-xs">{record.commission} USDT</div>
              </div>
            )) : (
              <div className="text-center text-gray-500 py-4">暂无邀请记录</div>
            )}
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
      </Popup>

      {/* 提现记录弹窗 */}
      <Popup
        visible={showWithdrawalRecords}
        onMaskClick={() => setShowWithdrawalRecords(false)}
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
              onClick={() => setShowWithdrawalRecords(false)}
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
                    fetchWithdrawalRecords(1)
                  }}
                  className="px-3 py-1 text-gray-600 text-sm"
                >
                  重置
                </button>
                <button
                  onClick={() => {
                    if (!startDate || !endDate) {
                      Toast.show({
                        content: '请选择完整的时间范围',
                        position: 'center',
                      })
                      return
                    }
                    fetchWithdrawalRecords(1)
                  }}
                  className="px-3 py-1 bg-[#165DFF] text-white rounded-lg text-sm"
                >
                  搜索
                </button>
              </div>
            </div>
          </div>

          {/* 表格头部 */}
          <div className="grid grid-cols-5 py-3 px-4 text-sm text-gray-500 bg-gray-50">
            <div className="text-left">数量</div>
            <div className="text-left">时间</div>
            <div className="text-center">地址</div>
            <div className="text-right">状态</div>
            <div className="text-right">操作</div>
          </div>

          {/* 表格内容 */}
          <div className="flex-1 overflow-auto">
            {withdrawalRecords.length > 0 ? withdrawalRecords.map((record, index) => (
              <div
                key={index}
                className="grid grid-cols-5 px-4 py-3 text-sm border-b"
              >
                <div className="text-left text-xs">{Number(ethers.utils.formatEther(record.amount.toString()))} USDT</div>
                <div className="text-xs">{moment(record.created_at).format('YYYY-MM-DD HH:mm:ss')}</div>
                <div className="text-xs text-[#165DFF] text-center">{record.withdrawal_address ? record.withdrawal_address.slice(0, 6) + '...' + record.withdrawal_address.slice(-4) : '-'}</div>
                <div className="text-right">
                  {getWithdrawalStatus(record.status)}
                </div>
                <div className="text-right">
                  {record.status === 1 ? <Button size="small"
                    className='!rounded-lg !text-xs !w-[80%] !bg-[#165DFF] !text-white'
                    loading={processingRecord?.id === record.id}
                    disabled={processingRecord?.id === record.id || isLoading}
                    onClick={() => handleWithdraw(record)}>提现</Button> : '-'}
                </div>
              </div>
            )) : (
              <div className="text-center text-gray-500 py-4">暂无提现记录</div>
            )}
          </div>

          {/* 分页 */}
          <div className="flex justify-center items-center gap-2 py-3 border-t">
            <button
              onClick={() => handleWithdrawalPageChange(withdrawalPagination.current - 1)}
              disabled={withdrawalPagination.current === 1}
              className={`w-8 h-8 flex items-center justify-center rounded ${withdrawalPagination.current === 1
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-100'
                }`}
            >
              &lt;
            </button>

            {generateWithdrawalPageNumbers().map((page, index) => (
              page === '...' ? (
                <span key={`ellipsis-${index}`} className="w-8 h-8 flex items-center justify-center">
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => handleWithdrawalPageChange(page as number)}
                  className={`w-8 h-8 flex items-center justify-center rounded ${page === withdrawalPagination.current
                    ? 'bg-[#165DFF] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  {page}
                </button>
              )
            ))}

            <button
              onClick={() => handleWithdrawalPageChange(withdrawalPagination.current + 1)}
              disabled={withdrawalPagination.current === Math.ceil(withdrawalPagination.total / withdrawalPagination.pageSize)}
              className={`w-8 h-8 flex items-center justify-center rounded ${withdrawalPagination.current === Math.ceil(withdrawalPagination.total / withdrawalPagination.pageSize)
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

export default function SettingsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SettingsPageContent />
    </Suspense>
  );
}