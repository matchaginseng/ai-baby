'use client'

import { useState, useRef, useEffect } from 'react'

interface Baby {
  id: number
  name: string
  age: string
  attributes: string[]
  image_path: string
  life_stages: LifeStage[]
}

interface LifeStage {
  age: string
  description: string
  image_path: string
}

interface BabyCardStackProps {
  babies: Baby[]
  onMeet: (baby: Baby) => void
  onViewImage: (imageUrl: string) => void
}

export default function BabyCardStack({ babies, onMeet, onViewImage }: BabyCardStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [offsetX, setOffsetX] = useState(0)
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const currentBaby = babies[currentIndex]

  const handleStart = (clientX: number) => {
    setIsDragging(true)
    setStartX(clientX)
  }

  const handleMove = (clientX: number) => {
    if (!isDragging) return
    const diff = clientX - startX
    setOffsetX(diff)

    if (Math.abs(diff) > 50) {
      setSwipeDirection(diff > 0 ? 'right' : 'left')
    } else {
      setSwipeDirection(null)
    }
  }

  const handleEnd = () => {
    if (!isDragging) return
    setIsDragging(false)

    // If swiped more than 100px, move to next card
    if (Math.abs(offsetX) > 100) {
      if (offsetX > 0 && currentIndex > 0) {
        // Swipe right - go to previous
        setCurrentIndex(currentIndex - 1)
      } else if (offsetX < 0 && currentIndex < babies.length - 1) {
        // Swipe left - go to next
        setCurrentIndex(currentIndex + 1)
      }
    }

    setOffsetX(0)
    setSwipeDirection(null)
  }

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX)
  }

  const handleMouseUp = () => {
    handleEnd()
  }

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX)
  }

  const handleTouchEnd = () => {
    handleEnd()
  }

  if (!currentBaby) {
    return (
      <div className="text-center py-12 text-gray-500">
        No babies available yet. Check back later!
      </div>
    )
  }

  return (
    <div className="relative w-full max-w-md mx-auto h-[600px] flex items-center justify-center">
      {/* Stack of cards behind */}
      {babies.map((baby, index) => {
        if (index < currentIndex || index > currentIndex + 2) return null

        const isActive = index === currentIndex
        const scale = isActive ? 1 : 0.95 - (index - currentIndex) * 0.05
        const translateY = isActive ? 0 : (index - currentIndex) * 10
        const zIndex = babies.length - index

        return (
          <div
            key={baby.id}
            className="absolute w-full"
            style={{
              transform: isActive
                ? `translateX(${offsetX}px) rotate(${offsetX * 0.05}deg)`
                : `scale(${scale}) translateY(${translateY}px)`,
              transition: isDragging && isActive ? 'none' : 'transform 0.3s ease-out',
              zIndex,
              opacity: index > currentIndex + 2 ? 0 : 1,
            }}
            onMouseDown={isActive ? handleMouseDown : undefined}
            onMouseMove={isActive ? handleMouseMove : undefined}
            onMouseUp={isActive ? handleMouseUp : undefined}
            onMouseLeave={isActive ? handleMouseUp : undefined}
            onTouchStart={isActive ? handleTouchStart : undefined}
            onTouchMove={isActive ? handleTouchMove : undefined}
            onTouchEnd={isActive ? handleTouchEnd : undefined}
            ref={isActive ? cardRef : null}
          >
            <div
              className={`bg-white rounded-3xl shadow-2xl overflow-hidden ${
                isActive ? 'cursor-grab active:cursor-grabbing' : ''
              }`}
            >
              {/* Swipe indicators */}
              {isActive && swipeDirection && (
                <div className={`absolute inset-0 z-10 flex items-center justify-center bg-opacity-50 ${
                  swipeDirection === 'left' ? 'bg-blue-500' : 'bg-pink-500'
                }`}>
                  <div className="text-white text-6xl font-bold">
                    {swipeDirection === 'left' ? '→' : '←'}
                  </div>
                </div>
              )}

              {/* Baby Image */}
              <div
                className="aspect-[3/4] relative bg-gradient-to-br from-blue-100 to-purple-100 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  if (baby.image_path) onViewImage(baby.image_path)
                }}
              >
                {baby.image_path ? (
                  <img
                    src={baby.image_path}
                    alt={baby.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-9xl">
                    👶
                  </div>
                )}
              </div>

              {/* Baby Info */}
              <div className="p-6">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  {baby.name}, {baby.age}
                </h2>

                {/* Attributes */}
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

                {/* Meet Button */}
                <button
                  onClick={() => onMeet(baby)}
                  className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:shadow-lg transition text-lg"
                >
                  Meet {baby.name}
                </button>
              </div>
            </div>
          </div>
        )
      })}

      {/* Navigation dots */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
        {babies.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-3 h-3 rounded-full transition ${
              index === currentIndex ? 'bg-purple-600 w-6' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
