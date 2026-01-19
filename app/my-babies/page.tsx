'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { babiesAPI, settingsAPI } from '@/lib/api'
import ImageModal from '../components/ImageModal'

export default function MyBabiesPage() {
  const user = useAuthStore((state) => state.user)
  const router = useRouter()

  const [babies, setBabies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewingImage, setViewingImage] = useState<string | null>(null)
  const [babiesVisible, setBabiesVisible] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    if (user.role === 'admin') {
      router.push('/admin')
      return
    }

    loadSettings()
  }, [user, router])

  useEffect(() => {
    if (babiesVisible) {
      loadMyBabies()
    } else {
      setLoading(false)
    }
  }, [babiesVisible])

  const loadSettings = async () => {
    try {
      const response = await settingsAPI.get()
      // Check if babies are visible by checking if any baby has is_visible
      const allBabiesResponse = await babiesAPI.getAll()
      const anyVisible = allBabiesResponse.data.some((baby: any) => baby.is_visible)
      setBabiesVisible(anyVisible)
    } catch (err) {
      console.error('Failed to load settings:', err)
      setLoading(false)
    }
  }

  const loadMyBabies = async () => {
    try {
      const response = await babiesAPI.getMyBabies()
      setBabies(response.data)
    } catch (err) {
      console.error('Failed to load babies:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleChatClick = (babyId: number) => {
    router.push(`/chat/${babyId}`)
  }

  if (!user || user.role === 'admin') return null

  if (!babiesVisible) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-gray-800">My Babies</h1>
              <button
                onClick={() => router.push('/questionnaire')}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                Back to Questionnaire
              </button>
            </div>
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">Baby viewing is currently disabled by the admin.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">My Babies</h1>
              <p className="text-gray-600 mt-2">
                Babies you've selected or interacted with
              </p>
            </div>
            <button
              onClick={() => router.push('/questionnaire')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              Back to Questionnaire
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            <button
              onClick={() => router.push('/questionnaire')}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 hover:border-b-2 hover:border-purple-500 transition"
            >
              Questionnaire
            </button>
            <button
              className="px-6 py-3 text-purple-600 border-b-2 border-purple-600 font-semibold"
            >
              My Babies
            </button>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : babies.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl">
              <p className="text-lg mb-4">You haven't selected or interacted with any babies yet.</p>
              <button
                onClick={() => router.push('/babies')}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                Browse Babies
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {babies.map((baby) => (
                <div
                  key={baby.id}
                  className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition bg-white"
                >
                  {/* Baby Image */}
                  {baby.image_path && (
                    <div
                      className="mb-4 rounded-lg overflow-hidden aspect-square bg-gray-100 cursor-pointer hover:opacity-90 transition"
                      onClick={() => setViewingImage(baby.image_path)}
                    >
                      <img
                        src={baby.image_path}
                        alt={baby.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Baby Info */}
                  <h3 className="text-xl font-bold text-gray-800 mb-1">
                    {baby.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">{baby.age}</p>

                  {/* Attributes */}
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-700 mb-2">
                      Attributes:
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {baby.attributes?.map((attr: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs"
                        >
                          {attr}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleChatClick(baby.id)}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                    >
                      Chat
                    </button>
                    <button
                      onClick={() => router.push(`/babies`)}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {viewingImage && (
        <ImageModal
          imageUrl={viewingImage}
          altText="Baby Image"
          onClose={() => setViewingImage(null)}
        />
      )}
    </div>
  )
}
