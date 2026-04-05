import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bell, AlertTriangle, CheckCircle, Clock, Trash2 } from 'lucide-react'
import { db, ref, onValue, update, remove } from '../firebase'

const Alerts = ({ role, user }) => {
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    const alertRef = ref(db, 'alerts')
    onValue(alertRef, (snap) => {
      const data = snap.val()
      if (!data) { setAlerts([]); return }
      const list = Object.entries(data)
        .map(([id, v]) => ({ id, ...v }))
        .filter(a => {
          if (role === 'admin') return true
          return a.target_uid === user?.uid
        })
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      setAlerts(list)
    })
  }, [user, role])

  const markRead = async (alertId) => {
    await update(ref(db, `alerts/${alertId}`), { read: true })
  }

  const deleteAlert = async (alertId) => {
    await remove(ref(db, `alerts/${alertId}`))
  }

  return (
    <div style={{ maxWidth: '900px' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <header style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Bell size={36} color="var(--primary)" /> Alert Center
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Real-time compliance & filing notifications</p>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {alerts.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
              <CheckCircle size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
              <div>No pending alerts. System is clean.</div>
            </div>
          )}
          {alerts.map((a) => (
            <motion.div key={a.id} whileHover={{ x: 4 }} className="card" style={{ 
              display: 'flex', alignItems: 'center', gap: '16px', padding: '20px 24px',
              background: a.read ? 'rgba(255,255,255,0.5)' : 'white',
              borderLeft: `4px solid ${a.type === 'warning' ? '#E68A8A' : a.type === 'info' ? 'var(--primary)' : '#B7C06E'}`,
              opacity: a.read ? 0.6 : 1
            }}>
              <AlertTriangle size={20} color={a.type === 'warning' ? '#E68A8A' : 'var(--primary)'} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{a.message}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={12} /> {new Date(a.created_at).toLocaleString('en-IN')}
                  {a.client_name && <span> · Client: <strong>{a.client_name}</strong></span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {!a.read && <button onClick={() => markRead(a.id)} className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>Mark Read</button>}
                <button onClick={() => deleteAlert(a.id)} className="btn btn-ghost" style={{ padding: '6px', color: '#E68A8A' }}><Trash2 size={14} /></button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

export default Alerts
