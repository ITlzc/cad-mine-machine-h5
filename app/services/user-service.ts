import { apiClient } from '../utils/api-client'

export const userService = {
  // 绑定钱包地址
  bindWalletAddress: (address: string) => {
    return apiClient.post('/user/set-address', { wallet_address: address.trim() })
  },

  // 获取用户信息
  getUserInfo: (id: string) => {
    return apiClient.get(`/user/${id}`)
  }
} 