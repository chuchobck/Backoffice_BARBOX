import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    usuario: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await login(formData.usuario, formData.password)

    if (result.success) {
      navigate('/dashboard')
    } else {
      setError(result.message)
    }
    setLoading(false)
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-barbox-cream p-4">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-br from-barbox-terracotta to-transparent"></div>
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-tr from-barbox-wine to-transparent"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Card de Login */}
        <div className="card animate-fade-in-up">
          {/* Header con logo */}
          <div className="card-header text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-barbox-terracotta to-barbox-terracotta-dark rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-terracotta">
                🍷
              </div>
            </div>
            <h1 className="text-3xl font-display font-bold text-barbox-wine mb-2">
              BARBOX
            </h1>
            <p className="text-barbox-text-secondary">
              Panel Administrativo
            </p>
          </div>

          {/* Form */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error message */}
              {error && (
                <div className="bg-danger/10 border border-danger/30 text-danger px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Usuario */}
              <div>
                <label htmlFor="usuario" className="block text-sm font-semibold text-barbox-wine mb-2">
                  Usuario
                </label>
                <input
                  type="text"
                  id="usuario"
                  name="usuario"
                  value={formData.usuario}
                  onChange={handleChange}
                  className="input"
                  placeholder="Ingresa tu usuario"
                  required
                  autoFocus
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-barbox-wine mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input"
                  placeholder="••••••••"
                  required
                />
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
                    Iniciando sesión...
                  </span>
                ) : (
                  'Iniciar Sesión'
                )}
              </button>
            </form>

            {/* Usuarios de prueba */}
            <div className="mt-8 p-4 bg-barbox-cream/50 rounded-lg">
              <p className="text-xs text-barbox-text-secondary mb-2 font-semibold">
                👤 Usuarios de prueba:
              </p>
              <div className="text-xs text-barbox-text-secondary space-y-1">
                <p>• admin / admin123 (Administrador)</p>
                <p>• cajero01 / cajero123 (Cajero)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-sm text-barbox-text-secondary">
          BARBOX © 2026 - Sistema de Gestión de Licorería
        </p>
      </div>
    </div>
  )
}
