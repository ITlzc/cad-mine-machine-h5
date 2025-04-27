import { apiClient } from '../utils/api-client'

export const minerService = {
  // 获取矿机列表
  getMiners: (page: number = 1, limit: number = 20, keyword: string = "") => {
    return apiClient.get(`/shop/mine-machines?page=${page}&limit=${limit}&keyword=${keyword}`)
  },

  // 获取矿机详情
  getMinerDetail: (id: string) => {
    return apiClient.get(`/shop/mine-machines/${id}`)
  },

  // 获取矿池列表
  getMiningPools: (page: number = 1, limit: number = 10, keyword: string = "") => {
    return apiClient.get(`/shop/mining-pools?page=${page}&limit=${limit}&keyword=${keyword}`)
  },

  // 创建订单
  createOrder: (orderData: any) => {
    return apiClient.post('/orders/create', orderData)
  },

  // 确认支付
  confirmPayment: (id: string) => {
    return apiClient.post(`/orders/confirm-payment`, {id})
  },

  async getDiscount(email: string) {
    return await apiClient.get(`/shop/discount?email=${email}`)
  }
} 