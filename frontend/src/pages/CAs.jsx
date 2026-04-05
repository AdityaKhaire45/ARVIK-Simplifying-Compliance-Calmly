import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, Mail, Users, FileCheck, Clock, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react'
import { db, ref, onValue, remove } from '../firebase'

const CAs = ({ role, user }) => {
  const [cas, setCas] = useState([])
  const [clients, setClients] = useState([])
  const [documents, setDocuments] = useState([])
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    // CAs from users with role=ca
    onValue(ref(db, 'users'), snap => {
      const d = snap.val()
      if (d) {
        setCas(Object.entries(d).filter(([_, v]) => v.role === 'ca').map(([id, v]) => ({ uid: id, ...v })))
      }
    })
    onValue(ref(db, 'clients'), snap => {
      const d = snap.val()
      setClients(d ? Object.entries(d).map(([id, v]) => ({ id, ...v })) : [])
    })
    onValue(ref(db, 'documents'), snap => {
      const d = snap.val()
      setDocuments(d ? Object.entries(d).map(([id, v]) => ({ id, ...v })) : [])
    })
    onValue(ref(db, 'alerts'), snap => {
      const d = snap.val()
      setAlerts(d ? Object.entries(d).map(([id, v]) => ({ id, ...v })) : [])
    })
  }, [])

  const terminateCA = async (caUid) => {
    if (window.confirm('Terminate this CA? Their assigned clients will become unassigned.')) {
      // Unassign all clients from this CA
      for (const c of clients.filter(c => c.assigned_ca_uid === caUid)) {
        const { update } = await import('../firebase')
        await update(ref(db, `clients/${c.id}`), { assigned_ca_uid: null, ca_status: 'none' })
      }
      await remove(ref(db, `users/${caUid}`))
    }
  }

  return (
    <div style={{ maxWidth: '1200px' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <header style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 600, marginBottom: '8px' }}>CA Directory</h1>
          <p style={{ color: 'var(--text-muted)' }}>Monitor CA performance, client load, and deadline compliance.</p>
          <p style={{ color: 'var(--primary)', fontSize: '0.85rem', marginTop: '8px' }}>
            CAs are auto-registered when they create an account with role "Expert (CA)".
          </p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '24px' }}>
          {cas.map(ca => {
            const myClients = clients.filter(c => c.assigned_ca_uid === ca.uid)
            const acceptedClients = myClients.filter(c => c.ca_status === 'accepted')
            const pendingClients = myClients.filter(c => c.ca_status === 'pending')
            const myDocs = documents.filter(d => myClients.some(c => c.id === d.client_uid))
            const pendingDocs = myDocs.filter(d => d.status === 'pending').length
            const approvedDocs = myDocs.filter(d => d.status === 'approved').length
            const rejectedDocs = myDocs.filter(d => d.status === 'rejected').length
            const hasUrgent = alerts.some(a => a.target_uid === ca.uid && !a.read)
            const completedClients = myClients.filter(c => c.work_status === 'completed').length

            return (
              <div key={ca.uid} className="card" style={{ background: 'white', display: 'flex', flexDirection: 'column', gap: '20px', borderLeft: hasUrgent ? '4px solid #E68A8A' : '4px solid var(--primary)' }}>
                {/* CA Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--primary)', display: 'grid', placeItems: 'center', color: 'white', fontSize: '1.4rem', fontWeight: 700 }}>{ca.name?.[0]}</div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '2px' }}>{ca.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      <Mail size={12} /> {ca.email}
                    </div>
                  </div>
                  {hasUrgent && <AlertTriangle size={20} color="#E68A8A" />}
                </div>

                {/* Performance Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', padding: '16px', background: 'var(--bg-main)', borderRadius: '12px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary-deep)' }}>{acceptedClients.length}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Clients</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#B7C06E' }}>{pendingDocs}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Pending</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary)' }}>{approvedDocs}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Approved</div>
                  </div>
                </div>

                {/* Status Info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>Completed: <strong>{completedClients}/{acceptedClients.length}</strong></span>
                  <span>Pending Requests: <strong style={{ color: pendingClients.length > 0 ? '#B7C06E' : 'var(--text-muted)' }}>{pendingClients.length}</strong></span>
                </div>

                {/* Upcoming Due Dates placeholder */}
                {hasUrgent && (
                  <div style={{ padding: '10px 14px', background: 'rgba(230,138,138,0.08)', borderRadius: '8px', fontSize: '0.8rem', color: '#B35E5E', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={14} /> Has unread deadline alerts
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                  <button className="btn btn-ghost" style={{ flex: 1, fontSize: '0.8rem' }}>View Details</button>
                  <button onClick={() => terminateCA(ca.uid)} className="btn btn-ghost" style={{ padding: '8px', color: '#B35E5E' }} title="Terminate CA"><Trash2 size={16} /></button>
                </div>
              </div>
            )
          })}
          {cas.length === 0 && (
            <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '100px', color: 'var(--text-muted)' }}>
              No CAs registered yet. A CA will appear here when they create an account with the "Expert (CA)" role.
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default CAs
