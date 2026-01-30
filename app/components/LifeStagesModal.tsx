'use client'

import { useState } from 'react'

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

interface LifeStagesModalProps {
  baby: Baby
  onClose: () => void
  onChat: (baby: Baby, stage: LifeStage) => void
  onSelect: (baby: Baby) => void
  onViewImage: (imageUrl: string) => void
}

export default function LifeStagesModal({ baby, onClose, onChat, onSelect, onViewImage }: LifeStagesModalProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-gray-800 mb-2">
            Meet {baby.name} at Different Ages
          </h2>
          <p className="text-gray-600">
            Choose an age to chat with {baby.name}
          </p>
        </div>

        {/* Life Stage Cards - Fanned out */}
        <div className="relative flex items-center justify-center min-h-[500px] mb-8">
          <div className="relative w-full max-w-4xl">
            {baby.life_stages.map((stage, index) => {
              const totalCards = baby.life_stages.length
              const centerIndex = (totalCards - 1) / 2
              const offset = index - centerIndex

              // Calculate rotation and position
              const rotation = hoveredIndex === index ? 0 : offset * 15
              const translateX = hoveredIndex === index ? 0 : offset * 40
              const translateY = hoveredIndex === index ? -20 : Math.abs(offset) * 10
              const scale = hoveredIndex === index ? 1.05 : 1
              const zIndex = hoveredIndex === index ? 10 : 5 - Math.abs(offset)

              return (
                <div
                  key={index}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-80 transition-all duration-300 cursor-pointer"
                  style={{
                    transform: `translateX(calc(-50% + ${translateX}px)) translateY(calc(-50% + ${translateY}px)) rotate(${rotation}deg) scale(${scale})`,
                    zIndex,
                  }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-white hover:border-purple-500 transition-colors">
                    {/* Stage Image */}
                    <div
                      className="aspect-[3/4] relative bg-gradient-to-br from-blue-100 to-purple-100 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (stage.image_path) onViewImage(stage.image_path)
                      }}
                    >
                      {stage.image_path ? (
                        <img
                          src={stage.image_path}
                          alt={`${baby.name} at ${stage.age}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-8xl">
                          👶
                        </div>
                      )}

                      {/* Age badge */}
                      <div className="absolute top-4 left-4 bg-white bg-opacity-90 px-4 py-2 rounded-full">
                        <span className="text-lg font-bold text-gray-800">{stage.age}</span>
                      </div>
                    </div>

                    {/* Stage Info */}
                    <div className="p-4">
                      <p className="text-gray-700 text-sm mb-3 line-clamp-3">
                        {stage.description}
                      </p>

                      {/* Chat button */}
                      <button
                        onClick={() => onChat(baby, stage)}
                        className="w-full py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:shadow-lg transition"
                      >
                        Chat at {stage.age}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Select Baby Button */}
        <div className="text-center pt-8 border-t border-gray-200">
          <button
            onClick={() => onSelect(baby)}
            className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:shadow-lg transition text-lg"
          >
            Select {baby.name} as My Baby
          </button>
        </div>
      </div>
    </div>
  )
}
