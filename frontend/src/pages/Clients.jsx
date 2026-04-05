import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Plus, X, Search, ShieldCheck, UserCheck, UserX, Trash2, RefreshCw, Mail, Phone } from 'lucide-react'
import { db, ref, push, set, onValue, update, remove } from '../firebase'

const Clients = ({ role, user }) => {
  const [clients, setClients] = useState([])
  const [cas, setCas] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [assignModal, setAssignModal] = useState(null) // clientId or null
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ name: '', gstin: '', phone: '', email: '' })

  useEffect(() => {
    onValue(ref(db, 'clients'), snap => {
      const d = snap.val()
      setClients(d ? Object.entries(d).map(([id, v]) => ({ id, ...v })) : [])
    })
    // Get CAs from users with role=ca
    onValue(ref(db, 'users'), snap => {
      const d = snap.val()
      if (d) {
        setCas(Object.entries(d).filter(([_, v]) => v.role === 'ca').map(([id, v]) => ({ uid: id, ...v })))
      }
    })
  }, [])

  const createClient = async (e) => {
    e.preventDefault()
    const clientRef = push(ref(db, 'clients'))
    await set(clientRef, {
      ...form,
      assigned_ca_uid: null,
      ca_status: 'none',
      created_by: user.uid,
      created_at: new Date().toISOString()
    })
    setForm({ name: '', gstin: '', phone: '', email: '' })
    setShowModal(false)
  }

  const assignCA = async (clientId, caUid) => {
    await update(ref(db, `clients/${clientId}`), {
      assigned_ca_uid: caUid,
      ca_status: 'pending'
    })
    // Push notification alert to CA
    const client = clients.find(c => c.id === clientId)
    await push(ref(db, 'alerts'), {
      target_uid: caUid,
      message: `New client "${client?.name}" assigned to you. Please accept or reject.`,
      client_name: client?.name,
      type: 'info',
      created_at: new Date().toISOString(),
      read: false
    })
    setAssignModal(null)
  }

  const deleteClient = async (clientId) => {
    if (window.confirm('Are you sure you want to remove this client?')) {
      await remove(ref(db, `clients/${clientId}`))
    }
  }

  const filtered = clients.filter(c => 
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.gstin || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ maxWidth: '1200px' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 600, marginBottom: '8px' }}>Client Management</h1>
            <p style={{ color: 'var(--text-muted)' }}>Create clients, assign CAs, track assignment status.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} /> Create New Client
          </button>
        </header>

        {/* Search */}
        <div style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or GSTIN..."
              style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '12px', border: '1px solid var(--card-border)', outline: 'none', background: 'white' }} />
          </div>
        </div>

        {/* Client Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filtered.map(c => {
            const assignedCA = cas.find(ca => ca.uid === c.assigned_ca_uid)
            return (
              <div key={c.id} className="card" style={{ background: 'white', display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr', gap: '20px', alignItems: 'center' }}>
                {/* Client Info */}
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '6px' }}>{c.name}</div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {c.gstin && <span>GSTIN: {c.gstin}</span>}
                    {c.phone && <span><Phone size={12} /> {c.phone}</span>}
                    {c.email && <span><Mail size={12} /> {c.email}</span>}
                  </div>
                </div>

                {/* CA Assignment */}
                <div>
                  {!c.assigned_ca_uid || c.ca_status === 'none' ? (
                    <button onClick={() => setAssignModal(c.id)} className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '10px 20px' }}>
                      <ShieldCheck size={16} /> Assign CA
                    </button>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary)', display: 'grid', placeItems: 'center', color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>
                        {assignedCA?.name?.[0] || '?'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{assignedCA?.name || 'Unknown CA'}</div>
                        <span style={{ 
                          fontSize: '0.7rem', padding: '2px 10px', borderRadius: '20px', fontWeight: 700,
                          background: c.ca_status === 'accepted' ? 'rgba(61,191,193,0.1)' : c.ca_status === 'rejected' ? 'rgba(230,138,138,0.1)' : 'rgba(183,192,110,0.15)',
                          color: c.ca_status === 'accepted' ? 'var(--primary-deep)' : c.ca_status === 'rejected' ? '#B35E5E' : '#8B8B2A'
                        }}>
                          {c.ca_status === 'accepted' ? '✓ ACCEPTED' : c.ca_status === 'rejected' ? '✗ REJECTED' : '⏳ PENDING'}
                        </span>
                      </div>
                      <button onClick={() => setAssignModal(c.id)} className="btn btn-ghost" style={{ padding: '6px', marginLeft: '8px' }} title="Reassign CA">
                        <RefreshCw size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button onClick={() => deleteClient(c.id)} className="btn btn-ghost" style={{ padding: '8px', color: '#B35E5E' }}><Trash2 size={16} /></button>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && <div className="card" style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>No clients found. Create one to get started.</div>}
        </div>
      </motion.div>

      {/* Create Client Modal */}
      <AnimatePresence>
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.15)', display: 'grid', placeItems: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="card" style={{ width: '100%', maxWidth: '480px', background: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.4rem' }}>Create New Client</h2>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              <form onSubmit={createClient} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Business / Client Name *</label>
                  <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. ABC Traders Pvt Ltd"
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--card-border)', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>GSTIN</label>
                  <input value={form.gstin} onChange={e => setForm({...form, gstin: e.target.value})} placeholder="22AAAAA0000A1Z5"
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--card-border)', outline: 'none' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Phone</label>
                    <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+91..."
                      style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--card-border)', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Email</label>
                    <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="client@company.com"
                      style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--card-border)', outline: 'none' }} />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" style={{ marginTop: '8px', height: '48px', fontSize: '1rem' }}>Create Client</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Assign CA Modal */}
      <AnimatePresence>
        {assignModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.15)', display: 'grid', placeItems: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="card" style={{ width: '100%', maxWidth: '450px', background: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.4rem' }}>Assign CA</h2>
                <button onClick={() => setAssignModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
                Select a Chartered Accountant to assign to this client. The CA will need to accept the assignment.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {cas.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No CAs registered. Ask a CA to create an account first.</div>}
                {cas.map(ca => (
                  <button key={ca.uid} onClick={() => assignCA(assignModal, ca.uid)}
                    style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px', background: 'var(--bg-main)', border: '1px solid var(--card-border)', borderRadius: '12px', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.background = 'white' }}
                    onMouseLeave={e => { e.target.style.borderColor = 'var(--card-border)'; e.target.style.background = 'var(--bg-main)' }}
                  >
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', display: 'grid', placeItems: 'center', color: 'white', fontWeight: 700, flexShrink: 0 }}>{ca.name?.[0]}</div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{ca.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ca.email}</div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Clients
