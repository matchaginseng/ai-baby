'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { babiesAPI } from '@/lib/api'

interface ProfileTabsProps {
  currentTab: 'profile' | 'questionnaire' | 'babies'
}

export default function ProfileTabs({ currentTab }: ProfileTabsProps) {
  const router = useRouter()
  const [babiesVisible, setBabiesVisible] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkBabiesVisibility = async () => {
      try {
        const babies = await babiesAPI.getAll()
        const anyBabyVisible = babies.some((baby: any) => baby.is_visible !== false)
        setBabiesVisible(anyBabyVisible)
      } catch (error) {
        console.error('Error checking babies visibility:', error)
        setBabiesVisible(false)
      } finally {
        setLoading(false)
      }
    }

    checkBabiesVisibility()
  }, [])

  const tabs = [
    { id: 'profile', label: 'Profile', path: '/profile', disabled: false },
    { id: 'questionnaire', label: 'Questionnaire', path: '/questionnaire', disabled: false },
    { id: 'babies', label: 'Babies', path: '/babies', disabled: !babiesVisible },
  ]

  return (
    <div className="border-b border-gray-200 mb-8">
      <div className="flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && router.push(tab.path)}
            disabled={tab.disabled}
            className={`
              pb-4 px-2 font-medium text-sm transition-colors relative
              ${currentTab === tab.id
                ? 'text-purple-600 border-b-2 border-purple-600'
                : tab.disabled
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300'
              }
            `}
          >
            {tab.label}
            {tab.disabled && (
              <span className="ml-2 text-xs">(Disabled)</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
