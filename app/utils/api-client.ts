import { get_access_token } from '../utils/supabase_lib';
import { Toast } from 'antd-mobile'

interface ApiResponse<T = any> {
  code: number
  data: T
  message: string
}

interface RequestConfig extends RequestInit {
  showError?: boolean // 是否显示错误提示
  skipAuth?: boolean  // 是否跳过认证
}

class ApiClient {
  private static instance: ApiClient
  private baseUrl: string = '/api/v1'

  private constructor() {}

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient()
    }
    return ApiClient.instance
  }

  // 处理响应
  private async handleResponse<T>(response: Response): Promise<T> {
    const data: ApiResponse<T> = await response.json()
    
    if (!response.ok) {
      // 处理特定错误码
      switch (response.status) {
        case 401:
          // token 过期或无效，跳转登录
          localStorage.removeItem('access_token')
          window.location.href = '/login'
          break
        case 403:
          Toast.show({
            content: '没有权限访问',
            icon: 'fail',
          })
          break
        // ... 其他错误码处理
      }
      throw new Error(data.message || '请求失败')
    }
    
    return data.data
  }

  // 请求方法
  private async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const { showError = true, skipAuth = false, ...requestConfig } = config
    
    try {
      const token = await get_access_token()
      // if(!token) {
      //   Toast.show({
      //     content: '请先登录',
      //     icon: 'fail',
      //   })
      //   window.location.href = '/login'
      //   return
      // }
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...requestConfig.headers,
      }

      // 添加认证 token
      if (!skipAuth && token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...requestConfig,
        headers,
      })

      return await this.handleResponse<T>(response)
    } catch (error) {
      // if (showError && error instanceof Error) {
      //   Toast.show({
      //     content: error.message,
      //     icon: 'fail',
      //   })
      // }
      throw error
    }
  }

  // GET 请求
  public async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' })
  }

  // POST 请求
  public async post<T>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // PUT 请求
  public async put<T>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // DELETE 请求
  public async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' })
  }
}

export const apiClient = ApiClient.getInstance() 