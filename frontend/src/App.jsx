import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Layout from './components/Layout'
import { auth, onAuthStateChanged, db, ref, onValue } from './firebase'
import { Loader2 } from 'lucide-react'

// --- PAGES ---
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import CAs from './pages/CAs'
import Settings from './pages/Settings'
import ClientDashboard from './pages/ClientDashboard'
import Login from './pages/Login'
import DocumentAI from './pages/DocumentAI'
import Alerts from './pages/Alerts'

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
        const userRef = ref(db, `users/${currentUser.uid}`)
        onValue(userRef, (snap) => {
          const data = snap.val()
          if (data && data.role) {
            setRole(data.role)
          } else {
            setRole('client')
          }
          setLoading(false)
        }, { onlyOnce: true })
      } else {
        setUser(null)
        setLoading(false)
      }
    })
    return () => unsubscribe()
  }, [])

  if (loading) return <LoadingScreen />

  const ProtectedRoute = ({ children, allowedRoles }) => {
    if (!user) return <Navigate to="/login" replace />
    if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/" replace />
    return <Layout role={role} user={user}>{children}</Layout>
  }

  // Determine the home page based on role
  const HomePage = () => {
    if (role === 'admin') return <Dashboard role={role} user={user} />
    if (role === 'ca') return <DocumentAI role={role} user={user} />
    return <ClientDashboard user={user} />
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      
      {/* HOME → role-dependent */}
      <Route path="/" element={<ProtectedRoute>{<HomePage />}</ProtectedRoute>} />

      {/* ADMIN ONLY */}
      <Route path="/clients" element={<ProtectedRoute allowedRoles={['admin']}><Clients role={role} user={user} /></ProtectedRoute>} />
      <Route path="/cas" element={<ProtectedRoute allowedRoles={['admin']}><CAs role={role} user={user} /></ProtectedRoute>} />

      {/* CA ONLY */}
      <Route path="/document-ai" element={<ProtectedRoute allowedRoles={['ca', 'admin']}><DocumentAI role={role} user={user} /></ProtectedRoute>} />

      {/* CLIENT ONLY */}
      <Route path="/upload" element={<ProtectedRoute allowedRoles={['client']}><ClientDashboard user={user} initialTab="upload" /></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute allowedRoles={['client']}><ClientDashboard user={user} initialTab="chat" /></ProtectedRoute>} />

      {/* SHARED */}
      <Route path="/alerts" element={<ProtectedRoute><Alerts role={role} user={user} /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings role={role} user={user} /></ProtectedRoute>} />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
