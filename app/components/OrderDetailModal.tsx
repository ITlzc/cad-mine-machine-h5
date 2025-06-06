'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Popup, Button, Toast, Picker, Dialog, Input } from 'antd-mobile'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import moment from 'moment'
import { orderService } from '../services/order-service'
import Loading from './Loading'

interface OrderDetailProps {
  isOpen: boolean
  order: any
  onBack: () => void
  getStatusTag: (status: number) => JSX.Element
  userInfo: any
  updataList: () => void
}

export default function OrderDetailModal({
  isOpen,
  order,
  onBack,
  getStatusTag,
  userInfo,
  updataList,
}: OrderDetailProps) {
  const router = useRouter()
  const [showPicker, setShowPicker] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<number | ''>('')
  const [orderDetail, setOrderDetail] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showMacInput, setShowMacInput] = useState(false)
  const [macAddress, setMacAddress] = useState('')
  const [mac_selected_status, set_mac_selected_status] = useState(-1)

  const statusOptions = [
    { label: '机器准备中', value: 6 },
    { label: '机器已发货', value: 7 },
    { label: '机器已签收', value: 8 },
    { label: '机器待托管', value: 9 },
    { label: '机器已托管', value: 10 }
  ]

  const availableOptions = statusOptions.filter(
    option => option.value !== orderDetail?.status
  )

  const handleUpdateStatus = async () => {
    if (!selectedStatus) {
      Toast.show({
        content: '请选择要更新的状态',
        position: 'center',
      })
      return
    }

    if (selectedStatus === orderDetail?.status) {
      return
    }

    if (selectedStatus === 7) {
      set_mac_selected_status(selectedStatus)
      setShowMacInput(true)
      return
    }

    setUpdating(true)
    try {
      // @ts-ignore
      await orderService.updateOrderStatus(orderDetail.id, selectedStatus, macAddress)
      const updatedOrder = await orderService.orderDetail(order.id)
      setOrderDetail(updatedOrder)
      Toast.show({
        content: '状态更新成功',
        position: 'center',
      })
      setShowPicker(false)
      setMacAddress('')
      updataList()
    } catch (error) {
      console.error('更新状态失败:', error)
      Toast.show({
        content: '更新状态失败',
        position: 'center',
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleMacConfirm = async () => {
    if (!macAddress.trim()) {
      Toast.show({
        content: '请输入MAC地址',
        position: 'center',
      })
      return
    }

    setUpdating(true)
    try {
      // @ts-ignore
      console.log("handleMacConfirm", selectedStatus)
      console.log("mac_selected_status", mac_selected_status)
      let status = mac_selected_status
      if (typeof status == 'string') {
        status = parseInt(status)
      }
      await orderService.updateOrderStatus(orderDetail.id, status, macAddress)
      const updatedOrder = await orderService.orderDetail(order.id)
      setOrderDetail(updatedOrder)
      Toast.show({
        content: '状态更新成功',
        position: 'center',
      })
      setShowPicker(false)
      setShowMacInput(false)
      setMacAddress('')
      setSelectedStatus('')
      updataList()
    } catch (error) {
      console.error('更新状态失败:', error)
      Toast.show({
        content: '更新状态失败',
        position: 'center',
      })
    } finally {
      setUpdating(false)
    }
  }

  useEffect(() => {
    orderService.orderDetail(order?.id).then((res: any) => {
      setOrderDetail(res)
      setSelectedStatus(res.status !== 1 ? res.status : '')
      setLoading(false)
    })
  }, [order])

  const getShippingStatusTag = (status: number) => {
    // if (status === 1) {
    //   status = 6;
    // }
    switch (status) {
      case 1:
        return <span className="text-yellow-600 bg-yellow-50 px-2 py-1 rounded">待准备机器</span>
      case 6:
        return <span className="text-yellow-600 bg-yellow-50 px-2 py-1 rounded">机器准备中</span>
      case 7:
        return <span className="text-green-600 bg-green-50 px-2 py-1 rounded">机器已发货</span>
      case 8:
        return <span className="text-red-600 bg-red-50 px-2 py-1 rounded">机器已签收</span>
      case 9:
        return <span className="text-red-600 bg-red-50 px-2 py-1 rounded">机器待托管</span>
      case 10:
        return <span className="text-red-600 bg-red-50 px-2 py-1 rounded">机器已托管</span>
      default:
        return <span className="text-gray-600 bg-gray-50 px-2 py-1 rounded">未知状态</span>
    }
  }


  return (
    <>
      <Popup
        visible={isOpen}
        onMaskClick={onBack}
        position="bottom"
        bodyStyle={{
          height: '92%',
          overflowY: 'auto',
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}
        className="relative"
      >
        <div className="flex flex-col min-h-screen bg-gray-50 relative pb-16">
          {/* 顶部导航栏 */}
          <div className="sticky top-0 z-10 w-full bg-white shadow-sm z-50">
            <div className="flex relative justify-center items-center px-4 h-14">
              <div className="flex items-center absolute right-4" onClick={() => {
                setShowPicker(false)
                setSelectedStatus('')
                onBack()
              }}>
                <i className="fas fa-times text-gray-600 text-lg mr-2"></i>
                {/* <span className="text-sm">关闭</span> */}
              </div>
              <div className="flex items-center">
                <span className="text-lg">订单详情</span>
              </div>
            </div>
          </div>
          {/* 主要内容区域 */}
          {loading ? <Loading /> : <div className="px-4 py-4">
            {/* 订单信息 */}
            <div className="bg-white rounded-lg p-4 mb-4">
              <h2 className="text-base font-medium mb-3">订单信息</h2>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>订单ID</span>
                  <span>{orderDetail?.order_id}</span>
                </div>
                <div className="flex justify-between">
                  <span>订单状态</span>
                  <span className="text-green-500">{getStatusTag(orderDetail?.status)}</span>
                </div>
                {((userInfo?.role === 2 && orderDetail?.status == 1) || (userInfo?.role === 2 && orderDetail?.status >= 6)) && (
                  <div className="flex justify-between items-center">
                    <span>发货状态</span>
                    <div className="flex items-center gap-2">
                      <span className="text-green-500">{getShippingStatusTag(orderDetail?.status)}</span>
                      <Button
                        color="primary"
                        className="bg-blue-500 !py-1 !text-sm"
                        onClick={() => setShowPicker(true)}
                        loading={updating}
                        disabled={updating}
                      >
                        {updating ? '更新中' : '修改状态'}
                      </Button>
                    </div>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>订单金额</span>
                  <span className="text-[#FFD700]">{orderDetail?.machine_info?.currency_type === 'BSC_USDT' ? `$${orderDetail?.amount} U` : `${orderDetail?.amount} CAD`}</span>
                </div>
                <div className="flex justify-between">
                  <span>订单数量</span>
                  <span>{orderDetail?.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span>创建时间</span>
                  <span>{moment(orderDetail?.created_at).format('YYYY.MM.DD HH:mm:ss')}</span>
                </div>
                <div className="flex justify-between">
                  <span>超市时间</span>
                  <span>{moment(orderDetail?.expiration_time).format('YYYY.MM.DD HH:mm:ss')}</span>
                </div>
                <div className="flex justify-between">
                  <span>付款时间</span>
                  <span>{moment(orderDetail?.pay_time).format('YYYY.MM.DD HH:mm:ss')}</span>
                </div>
                <div className="flex justify-between">
                  <span>付款地址</span>
                  <Link href={`https://bscscan.com/address/${orderDetail?.from_address}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 break-all">
                    {orderDetail?.from_address && orderDetail?.from_address.slice(0, 10) + '...' + orderDetail?.from_address.slice(-6) || '-'}
                  </Link>
                </div>
                <div className="flex justify-between">
                  <span>交易Hash</span>
                  <Link href={`https://bscscan.com/tx/${orderDetail?.transaction_hash}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 break-all">
                    {orderDetail?.transaction_hash && orderDetail?.transaction_hash.slice(0, 10) + '...' + orderDetail?.transaction_hash.slice(-6) || '-'}
                  </Link>
                </div>

                <div className="flex justify-between">
                  <span>收款地址</span>
                  <Link href={`https://bscscan.com/address/${orderDetail?.payment_address}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 break-all">
                    {orderDetail?.payment_address && orderDetail?.payment_address.slice(0, 10) + '...' + orderDetail?.payment_address.slice(-6) || '-'}
                  </Link>
                </div>
              </div>
            </div>
            {/* 收货信息 */}
            {orderDetail?.machine_info.good_type === 1 && <div className="bg-white rounded-lg p-4 mb-4">
              <h2 className="text-base font-medium mb-3">收货信息</h2>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>收货人</span>
                  <span>{orderDetail?.shipping_info?.receiver || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span>电话</span>
                  <span>{orderDetail?.shipping_info?.phoneCountry} {orderDetail?.shipping_info?.phone || '-'} </span>
                </div>
                <div className="border-t my-2"></div>
                <div>
                  <div className="text-gray-800">收货地址</div>
                  <div className="mt-1">{orderDetail?.shipping_info?.address || '-'}</div>
                </div>
                <div className="flex justify-between">
                  <span>邮政编码</span>
                  <span>{orderDetail?.shipping_info?.postcode || '-'}</span>
                </div>
              </div>
            </div>}
            {/* 矿机信息 */}
            <div className="bg-white rounded-lg p-4 mb-4">
              <h2 className="text-base font-medium mb-3">矿机信息</h2>
              <div className="flex space-x-3">
                <img
                  src={orderDetail?.machine_info.image}
                  alt={orderDetail?.machine_info?.title}
                  className="w-24 h-24 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="text-base font-medium">{orderDetail?.machine_info?.title || '-'}</h3>
                  <div
                    className="text-sm text-gray-600 mt-1"
                    dangerouslySetInnerHTML={{ __html: orderDetail?.machine_info?.description }}
                  />
                </div>
              </div>
            </div>
            {/* 矿池信息 */}
            <div className="bg-white rounded-lg p-4 mb-4">
              <h2 className="text-base font-medium mb-3">矿池信息</h2>
              <div className="flex items-center space-x-3">
                <img
                  src={orderDetail?.pool_info.logo}
                  alt={orderDetail?.pool_info.name}
                  className="w-12 h-12 rounded-lg"
                />
                <div>
                  <h3 className="font-medium">{orderDetail?.pool_info?.name || '-'}</h3>
                  <p className="text-sm text-gray-600 mt-1">{orderDetail?.pool_info?.description || '-'}</p>
                </div>
              </div>
            </div>
            {/* 备注 */}
            <div className="bg-white rounded-lg p-4 mb-4">
              <h2 className="text-base font-medium mb-3">备注</h2>
              <p className="text-sm text-gray-600">{orderDetail?.remark || ''}</p>
            </div>
          </div>}
          {/* 状态选择器 */}
          <Picker
            visible={showPicker}
            columns={[availableOptions]}
            onClose={() => {
              if (!updating) {
                setShowPicker(false)
                if (!showMacInput) {
                  setSelectedStatus('')
                }
              }
            }}
            value={[selectedStatus]}
            onConfirm={(val) => {
              if (updating) return
              const newStatus = val[0] as number
              setSelectedStatus(newStatus)
              if (newStatus !== orderDetail?.status) {
                handleUpdateStatus()
              } else {
                setShowPicker(false)
                setSelectedStatus('')
              }
            }}
            onSelect={(val) => {
              if (!updating) {
                setSelectedStatus(val[0] as number)
              }
            }}
          />
        </div>
      </Popup>
      <Popup
        visible={showMacInput}
        onMaskClick={() => setShowMacInput(false)}
        position="bottom"
        bodyStyle={{
          padding: '20px',
        }}
      >
        <div className="pb-safe">
          <h4 className="text-lg mb-4">输入MAC地址</h4>
          <div className="mb-4">
            <Input
              placeholder="请输入MAC地址（多个地址以逗号分隔）"
              value={macAddress}
              onChange={val => setMacAddress(val)}
            />
          </div>
          <div className="flex gap-3">
            <Button
              block
              color="default"
              onClick={() => {
                setShowMacInput(false)
                setMacAddress('')
                setSelectedStatus('')
              }}
            >
              取消
            </Button>
            <Button
              block
              color="primary"
              onClick={handleMacConfirm}
              loading={updating}
            >
              确认
            </Button>
          </div>
        </div>
      </Popup>
    </>
  )
} 