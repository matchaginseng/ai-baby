'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { babiesAPI } from '@/lib/api'

interface Baby {
  id: number
  name: string
  age: string
  attributes: string[]
  image_path: string
}

export default function BabiesPage() {
  const user = useAuthStore((state) => state.user)
  const router = useRouter()

  const [babies, setBabies] = useState<Baby[]>([])
  const [selectedBaby, setSelectedBaby] = useState<Baby | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    loadBabies()
    loadSelectedBaby()
  }, [user, router])

  const loadBabies = async () => {
    try {
      const response = await babiesAPI.getAll()
      setBabies(response.data)
    } catch (err) {
      console.error('Failed to load babies:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadSelectedBaby = async () => {
    try {
      const response = await babiesAPI.getSelected()
      if (response.data.selected_baby) {
        setSelectedBaby(response.data.selected_baby)
      }
    } catch (err) {
      console.error('Failed to load selected baby:', err)
    }
  }

  const handleChatClick = (baby: Baby) => {
    router.push(`/chat/${baby.id}`)
  }

  const goBack = () => {
    router.push('/questionnaire')
  }

  if (!user) return null

  // If user has already selected a baby, show only that baby
  if (selectedBaby) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800">Your Baby</h1>
              <button
                onClick={goBack}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                Back
              </button>
            </div>

            <div className="flex justify-center">
              <div className="bg-white rounded-2xl shadow-lg p-6 w-80 transform transition hover:scale-105">
                <div className="aspect-square rounded-xl overflow-hidden mb-4 bg-gradient-to-br from-blue-100 to-purple-100">
                  {selectedBaby.image_path ? (
                    <img
                      src={selectedBaby.image_path}
                      alt={selectedBaby.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">
                      👶
                    </div>
                  )}
                </div>

                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  {selectedBaby.name}
                </h3>
                <p className="text-gray-600 mb-3">Age: {selectedBaby.age}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedBaby.attributes.map((attr, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                    >
                      {attr}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => handleChatClick(selectedBaby)}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg transition"
                >
                  Chat with {selectedBaby.name}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show all babies if none selected yet
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Meet the Babies</h1>
            <button
              onClick={goBack}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              Back
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : babies.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No babies available yet. Check back later!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {babies.map((baby) => (
                <div
                  key={baby.id}
                  className="bg-white rounded-2xl shadow-lg p-6 transform transition hover:scale-105 hover:shadow-xl"
                >
                  <div className="aspect-square rounded-xl overflow-hidden mb-4 bg-gradient-to-br from-blue-100 to-purple-100">
                    {baby.image_path ? (
                      <img
                        src={baby.image_path}
                        alt={baby.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl">
                        👶
                      </div>
                    )}
                  </div>

                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    {baby.name}
                  </h3>
                  <p className="text-gray-600 mb-3">Age: {baby.age}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {baby.attributes.map((attr, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                      >
                        {attr}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => handleChatClick(baby)}
                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg transition"
                  >
                    Chat with {baby.name}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
