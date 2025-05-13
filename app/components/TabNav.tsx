'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import { useNavigateWithParams } from '../hooks/useNavigateWithParams'

const tabs = [
  { name: '矿机', href: '/', icon: 'fas fa-home' },
  { name: '列表', href: '/machines', icon: 'fas fa-list' },
  { name: '收益', href: '/withdraw', icon: 'fas fa-chart-line' },
  { name: '订单', href: '/orders', icon: 'fas fa-file-alt' },
  { name: '我的', href: '/settings', icon: 'fas fa-user' },
]

export default function TabNav() {
  const pathname = usePathname()
  const navigateWithParams = useNavigateWithParams()

  const handleTabClick = (tab: any) => {
    navigateWithParams(tab.href, 'push')
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2">
      <div className="flex justify-around">
        {tabs.map((tab) => {
          const isActive = tab.href === '/' 
            ? pathname === '/' 
            : pathname.startsWith(tab.href)
          
          return (
            <span
              key={tab.href}
              onClick={() => handleTabClick(tab)}
              className={clsx(
                'flex flex-col items-center py-1 px-2 flex-1',
                isActive
                  ? 'text-[#1677FF]'
                  : 'text-gray-400'
              )}
            >
              <i className={`${tab.icon} text-xl mb-0.5`} />
              <span className="text-xs">{tab.name}</span>
            </span>
          )
        })}
      </div>
    </nav>
  )
} 