import { apiClient } from '../utils/api-client'

interface OrderListParams {
  page?: number
  pageSize?: number
  orderNo?: string
}

export const orderService = {
  // 获取矿机列表
  orderList: ({ page = 1, pageSize = 20, orderNo = "" }: OrderListParams = {}) => {
    return apiClient.get(`/orders/list?page=${page}&limit=${pageSize}&order_id=${orderNo}`)
  },

  // 取消订单
  cancelOrder: (id: string) => {
    return apiClient.post(`/orders/cancel/`, { id })
  },

  // 获取订单详情
  orderDetail: (id: string) => {
    return apiClient.get(`/orders/detail/${id}`)
  },

  // 更新订单状态
  updateOrderStatus: (id: string, status: number, mac_addresses: string = '') => {
    return apiClient.post(`/orders/update-shipping-status`, { id, status, mac_addresses })
  }
} 
