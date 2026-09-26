import { createContext, useContext, useState, useEffect } from 'react'
import { api, setToken } from '../utils/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('mednex_token')
    if (!token) {
      setLoading(false)
      return
    }
    api
      .me()
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setLoading(false))
  }, [])

  const login = async (mobile, password) => {
    const data = await api.login(mobile, password)
    setToken(data.token)
    setUser(data)
    return data
  }

  const refreshUser = async () => {
    const data = await api.me()
    setUser(data)
    return data
  }

  const staffLogin = async ({ email, password, role }) => {
    const data = await api.staffLogin({ email, password, role })
    setToken(data.token)
    setUser(data)
    return data
  }

  const staffRegister = async (payload) => {
    const data = await api.staffRegister(payload)
    setToken(data.token)
    setUser(data)
    return data
  }

  const register = async ({ name, mobile, password, email }) => {
    const data = await api.register({ name, mobile, password, email })
    setToken(data.token)
    setUser(data)
    return data
  }

  const logout = () => {
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, staffLogin, staffRegister, refreshUser, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
