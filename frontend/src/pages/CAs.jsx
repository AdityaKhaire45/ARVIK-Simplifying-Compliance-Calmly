import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Filter, Edit, Trash, X, Check, UserPlus, Mail } from 'lucide-react'
import { db, ref, push, set, onValue, off } from '../firebase'

const AddCAModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    specialization: 'GST'
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const caRef = push(ref(db, "cas"))
      await set(caRef, {
        ...formData,
        id: Date.now(), 
        created_at: new Date().toISOString()
      })
      setFormData({ name: '', email: '', specialization: 'GST' })
      onClose()
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  if (!isOpen) return null

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.1)', display: 'grid', placeItems: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="card glass" style={{ width: '100%', maxWidth: '450px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.4rem' }}>Onboard Expert</h2>
          <button onClick={onClose} className="btn" style={{ padding: '4px', background: 'transparent' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Professional Name</label>
            <input required type="text" style={{ width: '100%', padding: '12px', border: '1px solid var(--card-border)', outline: 'none', borderRadius: '10px', background: 'white' }} 
              placeholder="e.g. CA Rahul Sharma" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Email Address</label>
            <input required type="email" style={{ width: '100%', padding: '12px', border: '1px solid var(--card-border)', outline: 'none', borderRadius: '10px', background: 'white' }} 
              placeholder="rahul@arvik.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Specialization Area</label>
            <select style={{ width: '100%', padding: '12px', border: '1px solid var(--card-border)', outline: 'none', borderRadius: '10px', background: 'white' }}
              value={formData.specialization} onChange={e => setFormData({...formData, specialization: e.target.value})}>
              <option value="GST">GST Compliance</option>
              <option value="Income Tax">Income Tax</option>
              <option value="Audit">Audit & Assurance</option>
              <option value="Corporate">Corporate Law</option>
            </select>
          </div>
          <button disabled={loading} type="submit" className="btn btn-primary" style={{ height: '48px', fontSize: '1rem', marginTop: '10px' }}>
            {loading ? 'Processing...' : 'Onboard Partner'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}

const CAs = () => {
  const [cas, setCas] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    const caRef = ref(db, "cas")
    onValue(caRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        setCas(Object.entries(data).map(([id, val]) => ({ id, ...val })))
      } else {
        setCas([])
      }
    })
  }, [])

  return (
    <div style={{ maxWidth: '1200px' }}>
      <AddCAModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Expert Directory</h1>
            <p style={{ color: 'var(--text-muted)' }}>Managing the elite professional network of ARVIK.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <UserPlus size={18} /> New Expert Onboarding
          </button>
        </header>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
          {cas.map((ca, i) => (
             <div key={i} className="card glass" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--bg-accent)', display: 'grid', placeItems: 'center', color: 'white', fontSize: '1.4rem', fontWeight: 600 }}>{ca.name[0]}</div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>{ca.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      <Mail size={12} /> {ca.email}
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '20px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase' }}>Focus Expertise</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="badge badge-success">{ca.specialization}</span>
                    <div style={{ fontSize: '0.8rem', color: 'var(--primary-deep)', fontWeight: 600 }}>12 Active Clients</div>
                  </div>
                </div>

                <div style={{ marginTop: 'auto', display: 'flex', gap: '10px' }}>
                  <button className="btn btn-ghost" style={{ flex: 1, fontSize: '0.8rem' }}>Expert Profile</button>
                  <button className="btn btn-ghost" style={{ padding: '8px' }}><Edit size={16} /></button>
                </div>
             </div>
          ))}
          {cas.length === 0 && (
            <div className="card glass" style={{ gridColumn: '1 / -1', padding: '100px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Initial Expert network is empty. Start onboarding to build your team.
            </div>
          )}
        </section>
      </motion.div>
    </div>
  )
}

export default CAs
