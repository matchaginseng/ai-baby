'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { babiesAPI } from '@/lib/api'
import BabyCardStack from '../components/BabyCardStack'
import LifeStagesModal from '../components/LifeStagesModal'
import ImageModal from '../components/ImageModal'

interface LifeStage {
  age: string
  description: string
  image_path: string
}

interface Baby {
  id: number
  name: string
  age: string
  attributes: string[]
  image_path: string
  life_stages: LifeStage[]
}

export default function BabiesPage() {
  const user = useAuthStore((state) => state.user)
  const router = useRouter()

  const [babies, setBabies] = useState<Baby[]>([])
  const [selectedBaby, setSelectedBaby] = useState<Baby | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalBaby, setModalBaby] = useState<Baby | null>(null)
  const [viewingImage, setViewingImage] = useState<string | null>(null)

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

  const handleMeet = (baby: Baby) => {
    setModalBaby(baby)
    setShowModal(true)
  }

  const handleChat = (baby: Baby, stage: LifeStage) => {
    // Store the selected stage in session storage for the chat page
    sessionStorage.setItem('selectedStage', JSON.stringify(stage))
    router.push(`/chat/${baby.id}`)
  }

  const handleSelect = async (baby: Baby) => {
    try {
      await babiesAPI.select(baby.id)
      setSelectedBaby(baby)
      setShowModal(false)
      setModalBaby(null)
    } catch (err) {
      console.error('Failed to select baby:', err)
      alert('Failed to select baby')
    }
  }

  const goBack = () => {
    router.push('/questionnaire')
  }

  if (!user) return null

  // If user has already selected a baby, show only that baby with life stages
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

            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                {selectedBaby.name}'s Life Stages
              </h2>
              <p className="text-gray-600">
                Click any stage to chat with {selectedBaby.name} at that age
              </p>
            </div>

            {/* Life Stages */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {selectedBaby.life_stages && selectedBaby.life_stages.length > 0 ? (
                selectedBaby.life_stages.map((stage, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden transform transition hover:scale-105 hover:shadow-xl"
                  >
                    <div
                      className="aspect-[3/4] relative bg-gradient-to-br from-blue-100 to-purple-100 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (stage.image_path) setViewingImage(stage.image_path)
                      }}
                    >
                      {stage.image_path ? (
                        <img
                          src={stage.image_path}
                          alt={`${selectedBaby.name} at ${stage.age}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-6xl">
                          👶
                        </div>
                      )}

                      {/* Age badge */}
                      <div className="absolute top-4 left-4 bg-white bg-opacity-90 px-4 py-2 rounded-full">
                        <span className="text-lg font-bold text-gray-800">{stage.age}</span>
                      </div>
                    </div>

                    <div className="p-4">
                      <p className="text-gray-700 text-sm mb-3">{stage.description}</p>
                      <button
                        onClick={() => handleChat(selectedBaby, stage)}
                        className="w-full py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg text-center hover:shadow-lg transition"
                      >
                        Chat at {stage.age}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center py-8 text-gray-500">
                  <div className="bg-white rounded-2xl shadow-lg p-6 w-80 mx-auto">
                    <div
                      className="aspect-square rounded-xl overflow-hidden mb-4 bg-gradient-to-br from-blue-100 to-purple-100 cursor-pointer hover:opacity-90 transition"
                      onClick={() => {
                        if (selectedBaby.image_path) setViewingImage(selectedBaby.image_path)
                      }}
                    >
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

                    <div className="flex flex-wrap gap-2 mb-4 justify-center">
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
                      onClick={() => router.push(`/chat/${selectedBaby.id}`)}
                      className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg transition"
                    >
                      Chat with {selectedBaby.name}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show card stack if no baby selected yet
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
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

          <div className="mb-6 text-center text-gray-600">
            <p>Swipe left or right to browse babies</p>
            <p className="text-sm">Click "Meet" to see them at different ages</p>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : babies.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No babies available yet. Check back later!
            </div>
          ) : (
            <BabyCardStack babies={babies} onMeet={handleMeet} onViewImage={setViewingImage} />
          )}
        </div>
      </div>

      {/* Life Stages Modal */}
      {showModal && modalBaby && (
        <LifeStagesModal
          baby={modalBaby}
          onClose={() => {
            setShowModal(false)
            setModalBaby(null)
          }}
          onChat={handleChat}
          onSelect={handleSelect}
          onViewImage={setViewingImage}
        />
      )}

      {/* Image Modal */}
      {viewingImage && (
        <ImageModal
          imageUrl={viewingImage}
          altText="Baby image"
          onClose={() => setViewingImage(null)}
        />
      )}
    </div>
  )
}
