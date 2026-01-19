'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { chatAPI, babiesAPI } from '@/lib/api'

interface Message {
  message: string
  role: 'user' | 'assistant'
  timestamp: string
}

export default function ChatPage() {
  const user = useAuthStore((state) => state.user)
  const router = useRouter()
  const params = useParams()
  const babyId = parseInt(params.babyId as string)

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messageCount, setMessageCount] = useState(0)
  const [limitReached, setLimitReached] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [baby, setBaby] = useState<any>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    loadChatHistory()
    loadBabyInfo()
  }, [user, babyId, router])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadBabyInfo = async () => {
    try {
      const response = await babiesAPI.getAll()
      const babyData = response.data.find((b: any) => b.id === babyId)
      setBaby(babyData)
    } catch (err) {
      console.error('Failed to load baby info:', err)
    }
  }

  const loadChatHistory = async () => {
    try {
      const response = await chatAPI.getHistory(babyId)
      setMessages(response.data.messages)
      setMessageCount(response.data.message_count)
      setLimitReached(response.data.message_count >= 20)
    } catch (err) {
      console.error('Failed to load chat history:', err)
    }
  }

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setLoading(true)

    try {
      const response = await chatAPI.sendMessage(babyId, userMessage)

      setMessages((prev) => [
        ...prev,
        { message: userMessage, role: 'user', timestamp: new Date().toISOString() },
        {
          message: response.data.message,
          role: 'assistant',
          timestamp: new Date().toISOString(),
        },
      ])

      setMessageCount(response.data.message_count)
      setLimitReached(response.data.limit_reached)
    } catch (err: any) {
      console.error('Failed to send message:', err)
      if (err.response?.data?.limit_reached) {
        setLimitReached(true)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSelectBaby = async () => {
    try {
      await babiesAPI.select(babyId)
      router.push('/babies')
    } catch (err) {
      console.error('Failed to select baby:', err)
      alert('Failed to select baby')
    }
  }

  const goBack = () => {
    router.push('/babies')
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
        <div className="bg-white rounded-2xl shadow-xl flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Chat with {baby?.name || 'Baby'}
              </h1>
              <p className="text-sm text-gray-500">
                Messages: {messageCount}/20 {limitReached && '(Limit reached)'}
              </p>
            </div>
            <button
              onClick={goBack}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              Back
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 py-12">
                Start a conversation! Say hello to {baby?.name || 'the baby'}.
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.message}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-4 py-3">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.1s' }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input or Selection */}
          {limitReached ? (
            <div className="p-6 border-t border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
              <div className="text-center mb-4">
                <p className="text-lg font-semibold text-gray-800 mb-2">
                  You've reached the message limit!
                </p>
                <p className="text-gray-600">
                  Would you like to select {baby?.name || 'this baby'} as your final
                  choice?
                </p>
              </div>
              <button
                onClick={() => setShowConfirmation(true)}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:shadow-lg transition text-lg"
              >
                Select {baby?.name || 'This Baby'}
              </button>
            </div>
          ) : (
            <div className="p-6 border-t border-gray-200">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={loading || !input.trim()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Final Decision
            </h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to select {baby?.name || 'this baby'}? This is
              your final decision and cannot be changed. Please be careful!
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSelectBaby}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition font-semibold"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
