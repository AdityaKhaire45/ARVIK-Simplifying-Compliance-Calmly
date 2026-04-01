import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Filter, MoreVertical, Edit, Trash, X, Check, Command } from 'lucide-react'

import { db, ref, push, set, onValue, off } from '../firebase'

const availableTypes = ["GST-1", "GST-3B", "TDS", "PF", "ESIC", "PT", "ITR"]

const AddClientModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    gstin: '',
    assigned_ca_id: '',
    compliances: []
  })
  
  const [cas, setCas] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const caRef = ref(db, "cas")
      onValue(caRef, (snapshot) => {
        const data = snapshot.val()
        if (data) {
          setCas(Object.entries(data).map(([id, val]) => ({ id, ...val })))
        } else {
          setCas([])
        }
      })
    }
  }, [isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const clientRef = push(ref(db, "clients"))
      const now = new Date()
      const defaultDueDate = new Date(now.getFullYear(), now.getMonth(), 20).toISOString().split('T')[0]

      const complianceObjects = formData.compliances.map(name => ({
         name,
         due_date: defaultDueDate,
         status: 'pending'
      }))

      await set(clientRef, {
        name: formData.name,
        gstin: formData.gstin,
        assigned_ca_id: formData.assigned_ca_id,
        compliances: complianceObjects,
        created_at: new Date().toISOString()
      })
      setFormData({ name: '', gstin: '', assigned_ca_id: '', compliances: [] })
      onClose()
    } catch (err) {
      console.error("Firebase Error:", err)
    }
    setLoading(false)
  }

  const toggleCompliance = (name) => {
    const next = formData.compliances.includes(name)
      ? formData.compliances.filter(c => c !== name)
      : [...formData.compliances, name]
    setFormData({ ...formData, compliances: next })
  }

  if (!isOpen) return null

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.1)', display: 'grid', placeItems: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="card glass" style={{ width: '100%', maxWidth: '500px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.4rem' }}>Register New Entity</h2>
          <button onClick={onClose} className="btn" style={{ padding: '4px', background: 'transparent' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Business Name</label>
            <input required type="text" style={{ width: '100%', padding: '12px', border: '1px solid var(--card-border)', outline: 'none', borderRadius: '10px', background: 'white' }} 
              placeholder="e.g. Acme Corp" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>GSTIN Number</label>
            <input required type="text" style={{ width: '100%', padding: '12px', border: '1px solid var(--card-border)', outline: 'none', borderRadius: '10px', background: 'white' }} 
              placeholder="15-digit alphanumeric" value={formData.gstin} onChange={e => setFormData({...formData, gstin: e.target.value})} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Assigned Consultant</label>
            <select required style={{ width: '100%', padding: '12px', border: '1px solid var(--card-border)', outline: 'none', borderRadius: '10px', background: 'white' }}
              value={formData.assigned_ca_id} onChange={e => setFormData({...formData, assigned_ca_id: e.target.value})}>
              <option value="">Select CA</option>
              {cas.map(ca => <option key={ca.id} value={ca.id}>{ca.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Compliance Modules</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {availableTypes.map(name => (
                <div key={name} onClick={() => toggleCompliance(name)} style={{ 
                   padding: '6px 14px', cursor: 'pointer', borderRadius: '20px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px',
                   background: formData.compliances.includes(name) ? 'var(--primary)' : 'rgba(0,0,0,0.03)',
                   color: formData.compliances.includes(name) ? 'white' : 'var(--text-muted)',
                   border: '1px solid transparent',
                   transition: 'all 0.2s'
                }}>
                  {formData.compliances.includes(name) && <Check size={14} />}
                  {name}
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding: '12px', background: 'var(--bg-main)', borderRadius: '10px', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Command size={14} /> Shortcut: Press <span style={{ fontWeight: 600 }}>Ctrl + S</span> to quick save
          </div>
          <button disabled={loading} type="submit" className="btn btn-primary" style={{ height: '48px', fontSize: '1rem' }}>
            {loading ? 'Processing...' : 'Assign & Save'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}

const Clients = () => {
  const [clients, setClients] = useState([])
  const [cas, setCas] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const clientsRef = ref(db, "clients")
    const caRef = ref(db, "cas")

    onValue(caRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        setCas(Object.entries(data).map(([id, val]) => ({ id, ...val })))
      }
    })

    const unsubscribe = onValue(clientsRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const list = Object.entries(data).map(([id, val]) => ({ id, ...val }))
        setClients(list)
      } else {
        setClients([])
      }
    })
    return () => off(clientsRef)
  }, [])

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.gstin.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div style={{ maxWidth: '1200px' }}>
      <AddClientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Client Directory</h1>
            <p style={{ color: 'var(--text-muted)' }}>Managing <span style={{ fontWeight: 600, color: 'var(--primary-deep)' }}>{clients.length} active entities</span> in the ecosystem.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> New Registration
          </button>
        </header>

        <section className="card glass" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--card-border)', display: 'flex', gap: '16px', background: 'white' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-main)', borderRadius: '12px', padding: '10px 18px', flex: 1 }}>
                <Search size={18} color="var(--text-muted)" />
                <input 
                  type="text" 
                  placeholder="Query by Name, GSTIN or Consultant..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', width: '100%', outline: 'none', fontSize: '0.95rem' }} 
                />
             </div>
             <button className="btn btn-ghost"><Filter size={16} /> Filters</button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--card-border)' }}>
                  <th style={{ padding: '16px 24px', fontWeight: 600 }}>Entity Name</th>
                  <th style={{ padding: '16px 24px', fontWeight: 600 }}>Tax Identifier</th>
                  <th style={{ padding: '16px 24px', fontWeight: 600 }}>Consultant</th>
                  <th style={{ padding: '16px 24px', fontWeight: 600 }}>Modules</th>
                  <th style={{ padding: '16px 24px', fontWeight: 600 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((c) => {
                  const assignedCA = cas.find(ca => String(ca.id) === String(c.assigned_ca_id));
                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--card-border)', transition: 'background 0.2s' }}>
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{c.name}</div>
                      </td>
                      <td style={{ padding: '20px 24px', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.85rem' }}>{c.gstin}</td>
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--bg-accent)', fontSize: '0.75rem', display: 'grid', placeItems: 'center', color: 'white', fontWeight: 600 }}>{(assignedCA?.name || 'U')[0]}</div>
                          <span style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{assignedCA?.name || 'Pending'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                           {c.compliances?.length > 0 ? c.compliances.map((tag, idx) => (
                             <span key={idx} className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                               {tag.name || tag}
                             </span>
                           )) : (
                             <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>-</span>
                           )}
                        </div>
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{ display: 'flex', gap: '14px', color: 'var(--text-muted)' }}>
                          <Edit size={16} style={{ cursor: 'pointer' }} />
                          <Trash size={16} style={{ cursor: 'pointer', opacity: 0.5 }} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {filteredClients.length === 0 && (
            <div style={{ padding: '100px 40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No entities matching your query.
            </div>
          )}
        </section>
      </motion.div>
    </div>
  )
}

export default Clients
