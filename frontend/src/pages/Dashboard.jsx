import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, ShieldCheck, FileCheck, AlertTriangle, TrendingUp, Clock, CheckCircle, XCircle, BarChart3, Bell, UserPlus, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { API_BASE } from '../config'

const Dashboard = ({ role, user }) => {
  const [clients, setClients] = useState([])
  const [cas, setCas] = useState([])
  const [documents, setDocuments] = useState([])
  const [alerts, setAlerts] = useState([])
  const navigate = useNavigate()

  const refreshData = async () => {
    try {
      // 1. Clients
      const cRes = await fetch(`${API_BASE}/clients`)
      const cData = await cRes.json()
      setClients(cData ? Object.entries(cData).map(([id, v]) => ({ id, ...v })) : [])

      // 2. CAs - Fetch from users (Need to add /users endpoint or filter from clients)
      // For now, let's assume we can get users. I'll add /users to backend later if missing.
      const uRes = await fetch(`${API_BASE}/users`)
      const uData = await uRes.json()
      if (uData) {
        const caList = Object.entries(uData).filter(([_, v]) => v.role === 'ca').map(([id, v]) => ({ uid: id, ...v }))
        setCas(caList)
      }

      // 3. Documents
      const dRes = await fetch(`${API_BASE}/documents`)
      const dData = await dRes.json()
      setDocuments(dData ? Object.entries(dData).map(([id, v]) => ({ id, ...v })) : [])

      // 4. Alerts
      const aRes = await fetch(`${API_BASE}/alerts`)
      const aData = await aRes.json()
      setAlerts(aData ? Object.entries(aData).map(([id, v]) => ({ id, ...v })) : [])
    } catch (err) {
      console.error("Dashboard refresh error:", err)
    }
  }

  useEffect(() => {
    refreshData()
    const interval = setInterval(refreshData, 5000)
    return () => clearInterval(interval)
  }, [])

  const totalClients = clients.length
  const assignedClients = clients.filter(c => c.assigned_ca_uid).length
  const pendingDocs = documents.filter(d => d.status === 'pending').length
  const approvedDocs = documents.filter(d => d.status === 'approved').length
  const unreadAlerts = alerts.filter(a => !a.read).length

  // CA Performance Data
  const caPerformance = cas.map(ca => {
    const myClients = clients.filter(c => c.assigned_ca_uid === ca.uid)
    const myDocs = documents.filter(d => myClients.some(c => c.id === d.client_uid))
    const pending = myDocs.filter(d => d.status === 'pending').length
    const approved = myDocs.filter(d => d.status === 'approved').length
    const hasUrgent = alerts.some(a => a.target_uid === ca.uid && !a.read)
    return { ...ca, clientCount: myClients.length, pending, approved, hasUrgent }
  })

  return (
    <div style={{ maxWidth: '1400px' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '2.8rem', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '8px' }}>
              Administrative Control
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
              System Integrity: <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Optimal</span> | Connected to Secure Instance
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => navigate('/clients')} className="btn btn-primary"><UserPlus size={18} /> New Client</button>
          </div>
        </header>

        {/* Stats Row */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px', marginBottom: '40px' }}>
          {[
            { label: 'Total Clients', val: totalClients, icon: <Users size={18} />, color: 'var(--primary)' },
            { label: 'Assigned', val: assignedClients, icon: <ShieldCheck size={18} />, color: '#3DBFC1' },
            { label: 'Active CAs', val: cas.length, icon: <BarChart3 size={18} />, color: '#2FA3A0' },
            { label: 'Pending Docs', val: pendingDocs, icon: <Clock size={18} />, color: '#B7C06E' },
            { label: 'Unread Alerts', val: unreadAlerts, icon: <Bell size={18} />, color: '#E68A8A' },
          ].map((s, i) => (
            <div key={i} className="card" style={{ background: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ width: '36px', height: '36px', background: `${s.color}15`, borderRadius: '10px', display: 'grid', placeItems: 'center', color: s.color }}>{s.icon}</div>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
              <div style={{ fontSize: '2rem', fontWeight: '700', marginTop: '4px' }}>{s.val}</div>
            </div>
          ))}
        </section>

        {/* CA Performance Table */}
        <section className="card" style={{ background: 'white', marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <TrendingUp size={24} color="var(--primary)" /> CA Performance Overview
            </h2>
            <button onClick={() => navigate('/cas')} className="btn btn-ghost" style={{ fontSize: '0.85rem' }}>View All <ArrowRight size={14} /></button>
          </div>

          {caPerformance.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
              No CAs registered yet. CAs will appear when they create an account with role "CA".
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Header */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '12px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <span>CA Name</span><span>Clients</span><span>Pending</span><span>Approved</span><span>Status</span>
              </div>
              {caPerformance.map((ca, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '16px 20px', background: 'var(--bg-main)', borderRadius: '12px', alignItems: 'center', border: ca.hasUrgent ? '1px solid #E68A8A' : '1px solid transparent' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', display: 'grid', placeItems: 'center', color: 'white', fontWeight: 700, fontSize: '1rem' }}>{ca.name?.[0]}</div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{ca.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ca.email}</div>
                    </div>
                  </div>
                  <span style={{ fontWeight: 700 }}>{ca.clientCount}</span>
                  <span style={{ color: ca.pending > 0 ? '#B7C06E' : 'var(--text-muted)', fontWeight: 700 }}>{ca.pending}</span>
                  <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{ca.approved}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {ca.hasUrgent && <AlertTriangle size={16} color="#E68A8A" />}
                    <span style={{ fontSize: '0.8rem', color: ca.hasUrgent ? '#E68A8A' : 'var(--primary)', fontWeight: 700 }}>
                      {ca.hasUrgent ? 'Deadline Near' : 'Active'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Clients */}
        <section className="card" style={{ background: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users size={24} color="var(--primary)" /> Client Registry
            </h2>
            <button onClick={() => navigate('/clients')} className="btn btn-ghost" style={{ fontSize: '0.85rem' }}>Manage All <ArrowRight size={14} /></button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {clients.slice(0, 8).map((c, i) => {
              const assignedCA = cas.find(ca => ca.uid === c.assigned_ca_uid)
              return (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr', padding: '14px 20px', background: 'var(--bg-main)', borderRadius: '12px', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>GSTIN: {c.gstin || 'N/A'}</div>
                  </div>
                  <div>
                    {assignedCA ? (
                      <div style={{ fontSize: '0.85rem' }}>
                        CA: <strong style={{ color: 'var(--primary-deep)' }}>{assignedCA.name}</strong>
                        <span style={{ 
                          fontSize: '0.7rem', marginLeft: '8px', padding: '2px 8px', borderRadius: '20px',
                          background: c.ca_status === 'accepted' ? 'rgba(61,191,193,0.1)' : c.ca_status === 'rejected' ? 'rgba(230,138,138,0.1)' : 'rgba(183,192,110,0.1)',
                          color: c.ca_status === 'accepted' ? 'var(--primary-deep)' : c.ca_status === 'rejected' ? '#E68A8A' : '#8B8B2A',
                          fontWeight: 700
                        }}>
                          {(c.ca_status || 'pending').toUpperCase()}
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No CA Assigned</span>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(c.created_at || Date.now()).toLocaleDateString()}
                  </div>
                </div>
              )
            })}
            {clients.length === 0 && <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>No clients registered yet.</div>}
          </div>
        </section>
      </motion.div>
    </div>
  )
}

export default Dashboard
