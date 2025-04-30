import { apiClient } from '../utils/api-client'

export const userService = {
  // 绑定钱包地址
  bindWalletAddress: (address: string) => {
    return apiClient.post('/user/set-address', { wallet_address: address.trim() })
  },

  // 获取用户信息
  getUserInfo: (id: string) => {
    return apiClient.get(`/user/${id}`)
  },

  getMinerNode: (page: number = 1, limit: number = 10, keyword: string = "") => {
    return apiClient.get(`/user/mine-node?page=${page}&limit=${limit}&keyword=${keyword}`)
  },

  getMinerNodeOnlineTime: (node_keys: string[]) => {
    return apiClient.post(`/user/mine-node/online-time`, { node_keys })
  },

  // 转让矿机
  transferMinerNode: (node_key: string, targetEmail: string) => {
    return apiClient.post(`/user/mine-node/transfer`, { node_key: node_key, to_user_email: targetEmail })
  },

  addMinerNode: (macAddress: string) => {
    return apiClient.post('/user/mine-node/add', { mac_address: macAddress })
  }
}