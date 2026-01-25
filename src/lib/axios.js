import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para agregar token a cada request
api.interceptors.request.use(
  (config) => {
    // Validar que no haya NaN literal en las URLs
    if (config.url && (config.url.includes('/NaN') || config.url.includes('/undefined') || config.url.includes('/null'))) {
      console.error('Detected invalid ID in API URL:', config.url)
      console.error('Full config:', config)
      return Promise.reject(new Error('Invalid ID detected in API call'))
    }
    
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para manejar respuestas
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
