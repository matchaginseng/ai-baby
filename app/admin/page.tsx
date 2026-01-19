'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { questionnaireAPI, babiesAPI } from '@/lib/api'

export default function AdminPage() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const router = useRouter()

  const [questionnaires, setQuestionnaires] = useState<any[]>([])
  const [showBabies, setShowBabies] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    if (user.role !== 'admin') {
      router.push('/questionnaire')
      return
    }

    loadQuestionnaires()
  }, [user, router])

  const loadQuestionnaires = async () => {
    try {
      const response = await questionnaireAPI.getAll()
      setQuestionnaires(response.data)
    } catch (err) {
      console.error('Failed to load questionnaires:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleBabies = async () => {
    const newVisibility = !showBabies
    try {
      await babiesAPI.toggleVisibility(newVisibility)
      setShowBabies(newVisibility)
    } catch (err) {
      console.error('Failed to toggle babies:', err)
      alert('Failed to update baby visibility')
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  if (!user || user.role !== 'admin') return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              Logout
            </button>
          </div>

          {/* Show Babies Toggle */}
          <div className="mb-8 p-6 bg-blue-50 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  Baby Visibility Control
                </h2>
                <p className="text-gray-600 text-sm">
                  Toggle to show/hide the Babies tab for all users
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showBabies}
                  onChange={handleToggleBabies}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-sm font-medium text-gray-900">
                  {showBabies ? 'Babies Visible' : 'Babies Hidden'}
                </span>
              </label>
            </div>
          </div>

          {/* Questionnaires List */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              User Questionnaires
            </h2>

            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading...</div>
            ) : questionnaires.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No questionnaires submitted yet
              </div>
            ) : (
              <div className="space-y-6">
                {questionnaires.map((q) => (
                  <div
                    key={q.user_id}
                    className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {q.email}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Last updated:{' '}
                          {q.updated_at
                            ? new Date(q.updated_at).toLocaleString()
                            : 'Never'}
                        </p>
                      </div>
                    </div>

                    {/* Answers */}
                    {Object.keys(q.answers || {}).length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-700 mb-2">
                          Answers:
                        </h4>
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                          {Object.entries(q.answers).map(([key, value]) => (
                            <div key={key}>
                              <span className="font-medium text-gray-700">
                                {key.replace(/_/g, ' ')}:
                              </span>{' '}
                              <span className="text-gray-600">
                                {Array.isArray(value)
                                  ? value.join(', ')
                                  : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Images */}
                    {q.image_paths && q.image_paths.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">
                          Uploaded Images:
                        </h4>
                        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                          {q.image_paths.map((img: string, idx: number) => (
                            <div
                              key={idx}
                              className="aspect-square rounded-lg overflow-hidden border border-gray-200"
                            >
                              <img
                                src={`/api/uploads/${img}`}
                                alt={`Upload ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
