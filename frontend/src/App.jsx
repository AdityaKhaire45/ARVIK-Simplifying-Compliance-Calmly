import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Layout from './components/Layout'
import { auth, onAuthStateChanged, db, ref, onValue } from './firebase'

// --- PAGES ---
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import Compliances from './pages/Compliances'
import CAs from './pages/CAs'
import Settings from './pages/Settings'
import ClientDashboard from './pages/ClientDashboard'
import Login from './pages/Login'
import { Loader2 } from 'lucide-react'

const LoadingScreen = () => (
  <div style={{ height: '100vh', width: '100vw', display: 'grid', placeItems: 'center', background: 'var(--bg-main)' }}>
    <div style={{ textAlign: 'center' }}>
      <Loader2 size={48} className="animate-spin" style={{ color: 'var(--primary)', marginBottom: '20px' }} />
      <h1 style={{ fontWeight: 300, letterSpacing: '0.1em', color: 'var(--primary-deep)' }}>ARVIK</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Synchronizing Secure Environment...</p>
    </div>
  </div>
)

function App() {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState('client')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        // Fetch Role from Realtime DB
        const userRef = ref(db, `users/${currentUser.uid}`)
        onValue(userRef, (snap) => {
          const data = snap.val()
          if (data && data.role) {
            setRole(data.role)
          } else {
            // Default or fallback
            setRole('client')
          }
          setLoading(false)
        }, { onlyOnce: true })
      } else {
        setUser(null)
        setLoading(false)
        // if path is not /login, redirect later? handled by protected route
      }
    })
    return () => unsubscribe()
  }, [])

  if (loading) return <LoadingScreen />

  const ProtectedRoute = ({ children }) => {
    if (!user) return <Navigate to="/login" replace />
    return <Layout role={role} user={user}>{children}</Layout>
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      
      <Route path="/" element={<ProtectedRoute>{role === 'client' ? <ClientDashboard /> : <Dashboard role={role} />}</ProtectedRoute>} />
      <Route path="/clients" element={<ProtectedRoute><Clients role={role} /></ProtectedRoute>} />
      <Route path="/compliances" element={<ProtectedRoute><Compliances role={role} /></ProtectedRoute>} />
      <Route path="/cas" element={<ProtectedRoute><CAs role={role} /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings role={role} user={user} /></ProtectedRoute>} />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
