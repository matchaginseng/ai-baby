import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

export const api = axios.create({
  baseURL: API_URL,
})

// Add token to requests
api.interceptors.request.use((config) => {
  const storage = localStorage.getItem('auth-storage')
  if (storage) {
    const { state } = JSON.parse(storage)
    if (state?.user?.token) {
      config.headers.Authorization = `Bearer ${state.user.token}`
    }
  }
  return config
}, function(error) {
  return Promise.reject(error)
})

// Auth endpoints
export const authAPI = {
  register: (email: string, password: string) =>
    api.post('/auth/register', { email, password }),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  getMe: () => api.get('/auth/me'),
  getCurrentUser: () => api.get('auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { current_password: currentPassword, new_password: newPassword})
  ,
  updatePartner: (partner: string) => api.post('/auth/partner', { partner }),
  getAllUsers: () => api.get('/auth/users'),
}

// Questionnaire endpoints
export const questionnaireAPI = {
  get: () => api.get('/questionnaire'),
  save: (answers: any) => api.post('/questionnaire', { answers }),
  upload: (formData: FormData) =>
    api.post('/questionnaire/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getAll: () => api.get('/questionnaires/all'),
}

// Babies endpoints
export const babiesAPI = {
  getAll: () => api.get('/babies'),
  getMyBabies: () => api.get('/babies/my-babies'),
  toggleVisibility: (is_visible: boolean) =>
    api.post('/babies/visibility', { is_visible }),
  select: (baby_id: number) => api.post('/babies/selected', { baby_id }),
  getSelected: () => api.get('/babies/selected'),
  create: (data: any) => api.post('/babies', data),
  assignToUser: (baby_id: number, user_id: number) =>
    api.post(`/babies/${baby_id}/assign`, { baby_id, user_id }),
}

// Chat endpoints
export const chatAPI = {
  getHistory: (babyId: number) => api.get(`/chat/${babyId}`),
  sendMessage: (babyId: number, message: string, stage?: any) =>
    api.post(`/chat/${babyId}`, { message, stage }),
}

// Settings endpoints
export const settingsAPI = {
  get: () => api.get('/settings'),
  toggleQuestionnairesLock: (is_locked: boolean) =>
    api.post('/settings/questionnaires-lock', { is_locked }),
}
