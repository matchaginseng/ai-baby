'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'

export default function Home() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/profile')
      }
    } else {
      router.push('/login')
    }
  }, [user, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  )
}
