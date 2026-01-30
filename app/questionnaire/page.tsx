'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { questionnaireAPI, babiesAPI, settingsAPI } from '@/lib/api'
import ImageModal from '../components/ImageModal'
import ProfileTabs from '@/app/components/ProfileTabs'

export default function QuestionnairePage() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const router = useRouter()

  const [answers, setAnswers] = useState<any>({})
  const [images, setImages] = useState<File[]>([])
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasSelectedBaby, setHasSelectedBaby] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
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

    loadQuestionnaire()
    checkSelectedBaby()
    loadSettings()
  }, [user, router])

  const checkSelectedBaby = async () => {
    try {
      const response = await babiesAPI.getSelected()
      setHasSelectedBaby(!!response.data.selected_baby)
    } catch (err) {
      console.error('Failed to check selected baby:', err)
    }
  }

  const loadQuestionnaire = async () => {
    try {
      const response = await questionnaireAPI.get()
      setAnswers(response.data.answers || {})
      setUploadedImages(response.data.image_paths || [])
    } catch (err) {
      console.error('Failed to load questionnaire:', err)
    }
  }

  const loadSettings = async () => {
    try {
      const response = await settingsAPI.get()
      setIsLocked(response.data.questionnaires_locked || false)

      // Check if babies are visible
      const allBabiesResponse = await babiesAPI.getAll()
      const anyVisible = allBabiesResponse.data.some((baby: any) => baby.is_visible)
      setBabiesVisible(anyVisible)
    } catch (err) {
      console.error('Failed to load settings:', err)
    }
  }

  const saveAnswers = async (newAnswers: any) => {
    setSaving(true)
    try {
      await questionnaireAPI.save(newAnswers)
      setLastSaved(new Date())
    } catch (err) {
      console.error('Failed to save:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    if (isLocked) return
    const newAnswers = { ...answers, [field]: value }
    setAnswers(newAnswers)
    // Auto-save with debounce
    setTimeout(() => saveAnswers(newAnswers), 1000)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isLocked) return
    const files = e.target.files
    if (!files) return

    for (let file of Array.from(files)) {
      if (file.size > 1024 * 1024) {
        alert('File too large (max 1MB)')
        continue
      }

      const formData = new FormData()
      formData.append('image', file)

      try {
        const response = await questionnaireAPI.upload(formData)
        setUploadedImages((prev) => [...prev, response.data.filename])
      } catch (err) {
        console.error('Upload failed:', err)
        alert('Failed to upload image')
      }
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const goToBabies = () => {
    router.push('/babies')
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Questionnaire
          </h1>
          <button
            onClick={handleLogout}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
          >
            Logout
          </button>
        </div>

        {/* Tabs */}
        <ProfileTabs currentTab="questionnaire" />

        {/* Content */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          {isLocked && (
            <div className="mb-6 p-4 bg-orange-100 border border-orange-400 text-orange-800 rounded-lg">
              <strong>Questionnaire Locked:</strong> The admin has locked questionnaire editing. You can view your answers but cannot make changes at this time.
            </div>
          )}

          {saving && (
            <div className="mb-4 text-sm text-blue-600">Saving...</div>
          )}
          {lastSaved && !saving && (
            <div className="mb-4 text-sm text-green-600">
              Last saved: {lastSaved.toLocaleTimeString()}
            </div>
          )}

          <div className="space-y-8">
            {/* Multiple Choice Questions */}
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-3">
                What is your preferred parenting style?
              </label>
              <div className="space-y-2">
                {['Gentle', 'Structured', 'Playful', 'Educational'].map(
                  (option) => (
                    <label key={option} className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="parenting_style"
                        value={option}
                        checked={answers.parenting_style === option}
                        onChange={(e) =>
                          handleInputChange('parenting_style', e.target.value)
                        }
                        disabled={isLocked}
                        className="w-4 h-4 text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <span className="text-gray-700">{option}</span>
                    </label>
                  )
                )}
              </div>
            </div>

            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-3">
                What energy level do you prefer?
              </label>
              <div className="space-y-2">
                {['High Energy', 'Moderate', 'Calm', 'Very Calm'].map(
                  (option) => (
                    <label key={option} className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="energy_level"
                        value={option}
                        checked={answers.energy_level === option}
                        onChange={(e) =>
                          handleInputChange('energy_level', e.target.value)
                        }
                        disabled={isLocked}
                        className="w-4 h-4 text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <span className="text-gray-700">{option}</span>
                    </label>
                  )
                )}
              </div>
            </div>

            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-3">
                What personality traits are most important to you?
              </label>
              <div className="space-y-2">
                {[
                  'Smart & Curious',
                  'Funny & Outgoing',
                  'Kind & Empathetic',
                  'Creative & Artistic',
                  'Athletic & Active',
                ].map((option) => (
                  <label key={option} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      value={option}
                      checked={(answers.traits || []).includes(option)}
                      onChange={(e) => {
                        const traits = answers.traits || []
                        const newTraits = e.target.checked
                          ? [...traits, option]
                          : traits.filter((t: string) => t !== option)
                        handleInputChange('traits', newTraits)
                      }}
                      disabled={isLocked}
                      className="w-4 h-4 text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className="text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Text Inputs */}
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-3">
                What are your hobbies and interests?
              </label>
              <textarea
                value={answers.hobbies || ''}
                onChange={(e) => handleInputChange('hobbies', e.target.value)}
                disabled={isLocked}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                rows={4}
                placeholder="Tell us about your hobbies..."
              />
            </div>

            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-3">
                Describe your ideal weekend
              </label>
              <textarea
                value={answers.ideal_weekend || ''}
                onChange={(e) =>
                  handleInputChange('ideal_weekend', e.target.value)
                }
                disabled={isLocked}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                rows={4}
                placeholder="Describe your perfect weekend..."
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-3">
                Upload your photos (max 1MB each)
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                disabled={isLocked}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
              />

              {uploadedImages.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {uploadedImages.map((img, idx) => (
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
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {viewingImage && (
        <ImageModal
          imageUrl={viewingImage}
          altText="Uploaded image"
          onClose={() => setViewingImage(null)}
        />
      )}
    </div>
  )
}
