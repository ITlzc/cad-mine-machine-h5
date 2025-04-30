// 代码已包含 CSS：使用 TailwindCSS , 安装 TailwindCSS 后方可看到布局样式效果

'use client'

import React, { useEffect,useState } from 'react';
import { Input, Button, Dialog, Toast } from 'antd-mobile';
// import { SearchOutlined, HomeOutlined, UnorderedListOutlined, LineChartOutlined, ProfileOutlined, UserOutlined } from '@ant-design/icons';
// import { useRouter } from 'next/router';
import { useRouter,usePathname,useSearchParams } from 'next/navigation';
import { orderService } from '../../services/order-service';
import moment from 'moment';
import { userService } from '../../services/user-service';
import { getCurrentUser } from '../../utils/supabase_lib';

interface OrderData {
    id: string
    created_at: string
    updated_at: string
    deleted_at: string
    order_id: string
    machine_info: {
        mpq: number
        image: string
        price: number
        title: string
        description: string
    }
    machine_id: string
    pool_info: {
        logo: string
        name: string
        description: string
    }
    pool_id: string
    amount: number
    transaction_hash: string
    status: number
    payment_address: string
	remark: string
	user_id: string
	from_address: string
	shipping_info: {
        phone: string
        address: string
        postcode: string
        receiver: string
        phoneCountry: string
    }
	expiration_time: string
	pay_time: string
	quantity: number
  }


export default function OrderDetailPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    console.log("id",id);

    const [order, setOrder] = useState<OrderData | null>(null);
    const [showStatusDialog, setShowStatusDialog] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<number | null>(null);
    const [user, setUser] = useState<any | null>(null);

    const statusOptions = [
        { value: 6, label: '机器准备中' },
        { value: 7, label: '机器已发货' },
        { value: 8, label: '机器已签收' },
        { value: 9, label: '机器待托管' },
        { value: 10, label: '机器已托管' }
    ];

    const handleStatusChange = async (newStatus: number) => {
        try {
            // TODO: 调用更新状态的 API
            const response: any = await orderService.updateOrderStatus(id, newStatus);
            console.log("response",response);
            setOrder(prev => prev ? {...prev, status: newStatus} : null);
            setShowStatusDialog(false);
            setSelectedStatus(null);
        } catch (error) {
            console.error('更新状态失败:', error);
            Toast.show({
                content: error.message,
                position: 'center'
            })
        }
    };

    const fetchOrderDetail = async () => {
        const response: any = await orderService.orderDetail(id);
        console.log("response",response);
        setOrder(response);
    }

    const fetchUserInfo = async () => {
        const { user: user_data, error } = await getCurrentUser();
        if (error) {
            console.error('获取用户信息失败:', error);
            return;
        }
        const response: any = await userService.getUserInfo(user_data.id);
        console.log("response",response);
        setUser(response.user);
    }

    useEffect(() => {
        fetchUserInfo()
        fetchOrderDetail();
    }, [id]);

    const getStatusTag = (status: number) => {
        if (status >= 6) {
            return <span className="text-green-600 bg-green-50 px-2 py-1 rounded">支付成功</span>
        }
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

    const getShippingStatusTag = (status: number) => {
        if (status === 1) {
            status = 6;
        }
        switch (status) {
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
        <div className="w-[375px] min-h-[762px] bg-gray-50 relative pb-16">
            {/* 顶部导航栏 */}
            <div className="fixed top-0 left-0 w-full bg-white shadow-sm z-50">
                <div className="flex justify-between items-center px-4 h-14">
                    <div className="flex items-center">
                        <Button className="!pl-0" onClick={() => router.back()}>
                            <i className="fas fa-arrow-left text-gray-600"></i>
                        </Button>
                        <span className="text-lg">订单详情</span>
                    </div>
                </div>
            </div>
            {/* 主要内容区域 */}
            <div className="px-4">
                {/* 订单信息 */}
                <div className="bg-white rounded-lg p-4 mb-4">
                    <h2 className="text-base font-medium mb-3">订单信息</h2>
                    <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between">
                            <span>订单ID</span>
                            <span>{order?.order_id}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>订单状态</span>
                            <span className="text-green-500">{getStatusTag(order?.status)}</span>
                        </div>
                        {((user?.role === 2 && order?.status == 1) || (user?.role === 2 &&  order?.status >= 6)) && (
                            <div className="flex justify-between items-center">
                                <span>发货状态</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-green-500">{getShippingStatusTag(order?.status)}</span>
                                    <Button
                                        color="primary"
                                        className="bg-blue-500"
                                        onClick={() => setShowStatusDialog(true)}
                                    >
                                        修改状态
                                    </Button>
                                </div>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span>订单金额</span>
                            <span className="text-[#FFD700]">${order?.amount} U</span>
                        </div>
                        <div className="flex justify-between">
                            <span>订单数量</span>
                            <span>{order?.quantity}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>创建时间</span>
                            <span>{moment(order?.created_at).format('YYYY.MM.DD HH:mm:ss')}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>超市时间</span>
                            <span>{moment(order?.expiration_time).format('YYYY.MM.DD HH:mm:ss')}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>付款时间</span>
                            <span>{moment(order?.pay_time).format('YYYY.MM.DD HH:mm:ss')}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>收款地址</span>
                            <span className="text-blue-500 break-all">{order?.payment_address || '-'}</span>
                        </div>
                        <div className="flex flex-col space-y-1">
                            <span>交易Hash</span>
                            <span className="text-blue-500 break-all text-xs">{order?.transaction_hash || '-'}</span>
                        </div>
                        <div className="flex flex-col space-y-1">
                            <span>付款地址</span>
                            <span className="text-blue-500 break-all text-xs">{order?.from_address || '-'}</span>
                        </div>
                    </div>
                </div>
                {/* 收货信息 */}
                <div className="bg-white rounded-lg p-4 mb-4">
                    <h2 className="text-base font-medium mb-3">收货信息</h2>
                    <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between">
                            <span>收货人</span>
                            <span>{order?.shipping_info?.receiver || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>电话</span>
                            <span>{order?.shipping_info?.phoneCountry} {order?.shipping_info?.phone || '-'} </span>
                        </div>
                        <div className="border-t my-2"></div>
                        <div>
                            <div className="text-gray-800">收货地址</div>
                            <div className="mt-1">{order?.shipping_info?.address || '-'}</div>
                        </div>
                        <div className="flex justify-between">
                            <span>邮政编码</span>
                            <span>{order?.shipping_info?.postcode || '-'}</span>
                        </div>
                    </div>
                </div>
                {/* 矿机信息 */}
                <div className="bg-white rounded-lg p-4 mb-4">
                    <h2 className="text-base font-medium mb-3">矿机信息</h2>
                    <div className="flex space-x-3">
                        <img
                        src="https://ai-public.mastergo.com/ai/img_res/fbceaee30a6643cdf34e60ea3ff5b983.jpg"
                        className="w-24 h-24 object-cover rounded-lg"
                        alt="EpochMiner"
                        />
                        <div className="flex-1">
                            <h3 className="font-medium">{order?.machine_info?.title || '-'}</h3>
                            <p className="text-sm text-gray-600 mt-1">{order?.machine_info?.description || '-'}</p>
                        </div>
                    </div>
                </div>
                {/* 矿池信息 */}
                <div className="bg-white rounded-lg p-4 mb-4">
                    <h2 className="text-base font-medium mb-3">矿池信息</h2>
                    <div className="flex items-center space-x-3">
                        <img
                        src="https://ai-public.mastergo.com/ai/img_res/5e424c56209dd0d51666a340f457a7e2.jpg"
                        className="w-12 h-12 rounded-lg"
                        alt="SparkPool"
                        />
                        <div>
                            <h3 className="font-medium">{order?.pool_info?.name || '-'}</h3>
                            <p className="text-sm text-gray-600 mt-1">{order?.pool_info?.description || '-'}</p>
                        </div>
                    </div>
                </div>
                {/* 备注 */}
                <div className="bg-white rounded-lg p-4 mb-4">
                    <h2 className="text-base font-medium mb-3">备注</h2>
                    <p className="text-sm text-gray-600">{order?.remark || ''}</p>
                </div>
            </div>
            {/* 状态选择弹窗 */}
            <Dialog
                visible={showStatusDialog}
                title="选择发货状态"
                content={
                    <div className="py-4">
                        {statusOptions.map(option => (
                            <div
                                key={option.value}
                                className={`p-3 mb-2 rounded cursor-pointer ${
                                    selectedStatus === option.value ? 'bg-blue-50 text-blue-500' : 'hover:bg-gray-50'
                                }`}
                                onClick={() => setSelectedStatus(option.value)}
                            >
                                {option.label}
                            </div>
                        ))}
                    </div>
                }
                closeOnAction
                onClose={() => {
                    setShowStatusDialog(false);
                    setSelectedStatus(null);
                }}
                actions={[
                    {
                        key: 'cancel',
                        text: '取消',
                        onClick: () => {
                            setShowStatusDialog(false);
                            setSelectedStatus(null);
                        }
                    },
                    {
                        key: 'confirm',
                        text: '确认',
                        disabled: selectedStatus === null,
                        onClick: () => {
                            if (selectedStatus !== null) {
                                handleStatusChange(selectedStatus);
                            }
                        }
                    }
                ]}
            />
        </div>
    );
}