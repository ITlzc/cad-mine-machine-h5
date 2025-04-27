'use client'

import './globals.css'
import Head from 'next/head'
import { AuthProvider } from './providers/AuthProvider'
import { Providers } from '../providers/wagmiProvider'
import { Toaster } from 'react-hot-toast'
import { Inter } from 'next/font/google'
import { usePathname } from 'next/navigation'
import Header from './components/Header'
import TabNav from './components/TabNav'

const inter = Inter({ subsets: ['latin'] })

// 定义不需要显示侧边栏和Tab的路由
const noLayoutRoutes = ['/login/', '/register/', '/forgot-password/']

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const showLayout = !noLayoutRoutes.includes(pathname)

  return (
    <html lang="en">
      <head>
        <title>Cad Mine Machine</title>
        <meta name="description" content="EpochMine是专业的矿机销售平台，提供高性能矿机、专业级矿机和旗舰级矿机等产品。" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        {/* <meta name="keywords" content="矿机,挖矿,比特币,以太坊,加密货币" /> */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css"
        />
        <link rel="icon" href="/images/favicon.ico" />
      </head>
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-white">
            {showLayout && <Header />}
            <div className="flex flex-col">
              <main className={`flex-1 ${showLayout ? 'md:px-4 md:pb-0' : ''}`}>
                <AuthProvider>
                  {children}
                  <Toaster position="top-right" />
                </AuthProvider>
              </main>
              {showLayout && <TabNav />}
            </div>
          </div>
        </Providers>
      </body>
    </html>
  )
} 