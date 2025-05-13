'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export function useNavigateWithParams() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const navigateWithParams = (path: string, isReplace: string = 'push') => {
    const inviterCode = searchParams.get('inviter_code')
    if (inviterCode) {
      // 构建新的 URL
      const newParams = new URLSearchParams(searchParams.toString())
      newParams.set('inviter_code', inviterCode)
      const queryString = newParams.toString()
      if (isReplace === 'replace') {
        router.replace(`${path}${queryString ? `?${queryString}` : ''}`)
      } else {
        router.push(`${path}${queryString ? `?${queryString}` : ''}`)
      }
    } else {
      router.push(path)
    }
  }

  return navigateWithParams
} 