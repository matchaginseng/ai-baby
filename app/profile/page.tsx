'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import ProfileTabs from '@/app/components/ProfileTabs'
import { authAPI } from '@/lib/api'

export default function ProfilePage() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const [partner, setPartner] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [partnerError, setPartnerError] = useState('')
  const [partnerSuccess, setPartnerSuccess] = useState('')
  const [loading, setLoading] = useState(true)
  const [changingPassword, setChangingPassword] = useState(false)
  const [savingPartner, setSavingPartner] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    const fetchUserData = async () => {
      try {
        const response = await authAPI.getCurrentUser()
        setPartner(response.data.partner || '')
      } catch (error) {
        console.error('Error fetching user data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [user, router])

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters')
      return
    }

    setChangingPassword(true)

    try {
      await authAPI.changePassword(currentPassword, newPassword)
      setPasswordSuccess('Password changed successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      setPasswordError(error.response?.data?.message || 'Failed to change password')
    } finally {
      setChangingPassword(false)
    }
  }

  const handlePartnerSave = async () => {
    setPartnerError('')
    setPartnerSuccess('')
    setSavingPartner(true)

    try {
      await authAPI.updatePartner(partner)
      setPartnerSuccess('Partner information saved')
    } catch (error: any) {
      setPartnerError(error.response?.data?.message || 'Failed to save partner information')
    } finally {
      setSavingPartner(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            My Profile
          </h1>
          <button
            onClick={handleLogout}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
          >
            Logout
          </button>
        </div>

        {/* Tabs */}
        <ProfileTabs currentTab="profile" />

        {/* Profile Content */}
        <div className="space-y-6">
          {/* Email Display */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Account Information</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-600">
                {user?.email}
              </div>
            </div>
          </div>

          {/* Partner Field */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Partner Information</h2>
            <div>
              <label htmlFor="partner" className="block text-sm font-medium text-gray-700 mb-2">
                Partner Email (Optional)
              </label>
              <input
                type="email"
                id="partner"
                value={partner}
                onChange={(e) => setPartner(e.target.value)}
                placeholder="partner@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-2">
                Share your baby experience with your partner
              </p>
            </div>
            {partnerError && (
              <div className="mt-3 text-sm text-red-600">{partnerError}</div>
            )}
            {partnerSuccess && (
              <div className="mt-3 text-sm text-green-600">{partnerSuccess}</div>
            )}
            <button
              onClick={handlePartnerSave}
              disabled={savingPartner}
              className="mt-4 px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingPartner ? 'Saving...' : 'Save Partner'}
            </button>
          </div>

          {/* Password Change */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Change Password</h2>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  id="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  id="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              {passwordError && (
                <div className="text-sm text-red-600">{passwordError}</div>
              )}
              {passwordSuccess && (
                <div className="text-sm text-green-600">{passwordSuccess}</div>
              )}
              <button
                type="submit"
                disabled={changingPassword}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {changingPassword ? 'Changing Password...' : 'Change Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
