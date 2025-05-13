import { apiClient } from '../utils/api-client'

export const userService = {
  // 绑定钱包地址
  bindWalletAddress: (address: string) => {
    return apiClient.post('/user/epochmine/bind-address', { wallet_address: address.trim() })
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
  },

  // 历史地址
  getHistoryAddress: () => {
    return apiClient.get('/user/history-address')
  },

  // 累计销售额
  getSalesVolume: () => {
    return apiClient.get('/user/sales-volume')
  },

  // 返佣提现
  withdrawCommission: (amount: number, walletAddress: string) => {
    return apiClient.post('/user/commission/withdraw', { amount, wallet_address: walletAddress })
  },

  // 累计返佣
  getTotalCommission: () => {
    return apiClient.get('/user/commission/withdrawal/info')
  },

  // 邀请记录
  getInviteRecords: (page: number = 1, limit: number = 10, startTime: string = '', endTime: string = '') => {
    return apiClient.get(`/user/invite-records?page=${page}&limit=${limit}&start_time=${startTime}&end_time=${endTime}`)
  },

  // user/withdrawal/records
  getWithdrawalRecords: (page: number = 1, limit: number = 10, startTime: string = '', endTime: string = '') => {
    return apiClient.get(`/user/withdrawal/records?page=${page}&limit=${limit}&start_time=${startTime}&end_time=${endTime}`)
  }
}