import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-barbox-cream">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-barbox-terracotta border-solid mx-auto mb-4"></div>
          <p className="text-barbox-wine font-semibold">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}
