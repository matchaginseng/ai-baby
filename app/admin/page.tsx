'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { questionnaireAPI, babiesAPI, settingsAPI, authAPI } from '@/lib/api'
import ImageModal from '../components/ImageModal'

export default function AdminPage() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const router = useRouter()

  const [questionnaires, setQuestionnaires] = useState<any[]>([])
  const [babies, setBabies] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [showBabies, setShowBabies] = useState(false)
  const [questionnairesLocked, setQuestionnairesLocked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [viewingImage, setViewingImage] = useState<string | null>(null)
  const [assigningBaby, setAssigningBaby] = useState<number | null>(null)

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
    loadBabies()
    loadSettings()
    loadUsers()
  }, [user, router])

  const loadUsers = async () => {
    try {
      const response = await authAPI.getAllUsers()
      setUsers(response.data)
    } catch (err) {
      console.error('Failed to load users:', err)
    }
  }

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

  const loadBabies = async () => {
    try {
      const response = await babiesAPI.getAll()
      setBabies(response.data)
      // Initialize showBabies state from backend data
      const anyVisible = response.data.some((baby: any) => baby.is_visible)
      setShowBabies(anyVisible)
    } catch (err) {
      console.error('Failed to load babies:', err)
    }
  }

  const loadSettings = async () => {
    try {
      const response = await settingsAPI.get()
      setQuestionnairesLocked(response.data.questionnaires_locked || false)
    } catch (err) {
      console.error('Failed to load settings:', err)
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

  const handleToggleQuestionnairesLock = async () => {
    const newLockStatus = !questionnairesLocked
    try {
      await settingsAPI.toggleQuestionnairesLock(newLockStatus)
      setQuestionnairesLocked(newLockStatus)
    } catch (err) {
      console.error('Failed to toggle questionnaires lock:', err)
      alert('Failed to update questionnaires lock status')
    }
  }

  const handleAssignBaby = async (babyId: number, userId: number | null) => {
    if (userId === null) return

    try {
      await babiesAPI.assignToUser(babyId, userId)
      // Reload babies to reflect the changes
      await loadBabies()
      setAssigningBaby(null)
      alert('Baby assigned successfully!')
    } catch (err) {
      console.error('Failed to assign baby:', err)
      alert('Failed to assign baby to user')
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const getUserEmail = (userId: number | null) => {
    if (!userId) return 'Unassigned'
    const foundUser = users.find(u => u.id === userId)
    return foundUser ? foundUser.email : 'Unknown User'
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

          {/* Lock Questionnaires Toggle */}
          <div className="mb-8 p-6 bg-orange-50 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  Questionnaire Editing Lock
                </h2>
                <p className="text-gray-600 text-sm">
                  Toggle to lock/unlock questionnaire editing for all users
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={questionnairesLocked}
                  onChange={handleToggleQuestionnairesLock}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-600"></div>
                <span className="ml-3 text-sm font-medium text-gray-900">
                  {questionnairesLocked ? 'Locked' : 'Unlocked'}
                </span>
              </label>
            </div>
          </div>

          {/* Babies List */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              All Babies in Database
            </h2>

            {babies.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl">
                No babies in database yet
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
                    <div className="mb-3">
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

                    {/* Visibility Status */}
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          baby.is_visible ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                      />
                      <span className="text-sm text-gray-600">
                        {baby.is_visible ? 'Visible to users' : 'Hidden from users'}
                      </span>
                    </div>

                    {/* User Assignment */}
                    <div className="pt-3 border-t border-gray-200">
                      <h4 className="text-xs font-semibold text-gray-700 mb-2">
                        Assigned to:
                      </h4>
                      <div className="text-sm text-gray-600 mb-2">
                        {getUserEmail(baby.user_id)}
                      </div>

                      {assigningBaby === baby.id ? (
                        <div className="space-y-2">
                          <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            onChange={(e) => {
                              const userId = e.target.value ? parseInt(e.target.value) : null
                              handleAssignBaby(baby.id, userId)
                            }}
                            defaultValue={baby.user_id || ''}
                          >
                            <option value="">Select a user...</option>
                            {users.filter(u => u.role !== 'admin').map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.email}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => setAssigningBaby(null)}
                            className="w-full px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAssigningBaby(baby.id)}
                          className="w-full px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition text-sm font-medium"
                        >
                          {baby.user_id ? 'Reassign' : 'Assign to User'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                              className="aspect-square rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:border-purple-500 transition"
                              onClick={() => setViewingImage(`/api/uploads/${img}`)}
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

      {/* Image Modal */}
      {viewingImage && (
        <ImageModal
          imageUrl={viewingImage}
          altText="Image"
          onClose={() => setViewingImage(null)}
        />
      )}
    </div>
  )
}
