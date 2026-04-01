import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { db, ref, onValue, off, push, set } from '../firebase'
import { 
  ShieldCheck, Calendar as CalendarIcon, Bell, ClipboardList, 
  TrendingUp, Users, Paperclip, Send, MessageSquare, 
  Download, AlertCircle, CheckCircle, Clock, Info,
  DollarSign, PieChart, ArrowUpRight, ArrowDownRight,
  MoreVertical, Search, Filter, History
} from 'lucide-react'

// --- HELPER: CHAT COMPONENT ---
const ChatBox = ({ clientId, advisorName }) => {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const scrollRef = useRef(null)

  useEffect(() => {
    const msgRef = ref(db, `clients/${clientId}/messages`)
    onValue(msgRef, (snap) => {
      const data = snap.val()
      if (data) setMessages(Object.values(data))
    })
  }, [clientId])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim()) return
    const msgRef = push(ref(db, `clients/${clientId}/messages`))
    await set(msgRef, {
      text: input,
      sender: 'Client',
      timestamp: new Date().toISOString()
    })
    setInput('')
  }

  return (
    <div className="card glass" style={{ height: '400px', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden', background: 'white' }}>
      <div style={{ padding: '20px', borderBottom: '1px solid var(--card-border)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <MessageSquare size={18} color="var(--primary)" /> Consultation with {advisorName || 'Advisor'}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--bg-main)' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ alignSelf: m.sender === 'Client' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
            <div style={{ 
              padding: '10px 16px', borderRadius: '12px', fontSize: '0.85rem',
              background: m.sender === 'Client' ? 'var(--primary)' : 'white',
              color: m.sender === 'Client' ? 'white' : 'var(--text-main)',
              boxShadow: 'var(--shadow-soft)'
            }}>
              {m.text}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px', textAlign: m.sender === 'Client' ? 'right' : 'left', fontWeight: 600 }}>{m.sender}</div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>
      <div style={{ padding: '16px', borderTop: '1px solid var(--card-border)', display: 'flex', gap: '10px' }}>
        <input 
          style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--card-border)', color: 'var(--text-main)', fontSize: '0.85rem', outline: 'none' }} 
          placeholder="Query your personal expert..."
          value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={sendMessage} className="btn btn-primary" style={{ padding: '10px' }}><Send size={18} /></button>
      </div>
    </div>
  )
}

// --- HELPER: MINI CALENDAR ---
const MiniCalendar = ({ complianceDates }) => {
  const days = Array.from({ length: 30 }, (_, i) => i + 1)
  return (
    <div className="card glass" style={{ background: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontWeight: '600' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CalendarIcon size={18} color="var(--primary)" /> Filing Cycle</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--primary-deep)' }}>April 2026</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
        {days.map(d => {
          const isDeadline = complianceDates.some(cd => cd.day === d)
          return (
            <div key={d} style={{ 
              aspectRatio: '1', display: 'grid', placeItems: 'center', fontSize: '0.7rem', borderRadius: '8px',
              background: isDeadline ? 'var(--primary)' : 'var(--bg-main)',
              color: isDeadline ? 'white' : 'var(--text-muted)',
              fontWeight: isDeadline ? 700 : 400
            }}>
              {d}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const ClientDashboard = () => {
  const [clientData, setClientData] = useState(null)
  const [assignedCA, setAssignedCA] = useState(null)
  const [loading, setLoading] = useState(true)
  const [docName, setDocName] = useState('')
  const [docSearch, setDocSearch] = useState('')

  useEffect(() => {
    const clientsRef = ref(db, "clients")
    const unsubscribe = onValue(clientsRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const firstId = Object.keys(data)[0]
        const client = data[firstId]
        setClientData({ id: firstId, ...client })
        if (client.assigned_ca_id) {
           onValue(ref(db, "cas/" + client.assigned_ca_id), (caSnap) => {
             setAssignedCA(caSnap.val())
           }, { onlyOnce: true })
        }
      }
      setLoading(false)
    })
    return () => off(clientsRef)
  }, [])

  const handleUpload = async () => {
    if (!docName.trim()) return
    const docRef = push(ref(db, `clients/${clientData.id}/documents`))
    await set(docRef, {
      name: docName,
      status: 'verified',
      timestamp: new Date().toISOString()
    })
    setDocName('')
    // In-built notification or feedback here
  }

  if (loading) return <div style={{ padding: '60px', color: 'var(--text-muted)', textAlign: 'center' }}>Secure Access Initializing...</div>
  if (!clientData) return <div style={{ padding: '60px', color: 'var(--text-muted)', textAlign: 'center' }}>No Enterprise Entity profiles found for your account.</div>

  const compTasks = clientData.compliances || []
  const completedCount = compTasks.filter(c => c.status === 'completed').length
  const progressPercent = compTasks.length ? Math.round((completedCount / compTasks.length) * 100) : 0
  
  const docs = clientData.documents ? Object.values(clientData.documents) : []
  const filteredDocs = docs.filter(d => d.name.toLowerCase().includes(docSearch.toLowerCase()))
  
  const complianceDates = compTasks.map(t => ({ day: parseInt(t.due_date?.split('-')[2] || '20'), name: t.name }))

  return (
    <div style={{ maxWidth: '1400px' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
           <div>
              <h1 style={{ fontSize: '2.8rem', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '8px' }}>
                Portal: <span style={{ color: 'var(--primary)' }}>{clientData.name}</span>
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                Primary Expert: <span style={{ color: 'var(--primary-deep)', fontWeight: 600 }}>{assignedCA?.name || 'Assigning Expertise...'}</span> | Reg Index: <span style={{ color: 'var(--primary)' }}>Verified</span>
              </p>
           </div>
           <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-ghost"><History size={18} /> Filing History</button>
              <button className="btn btn-primary"><Download size={18} /> Financial Pack</button>
           </div>
        </header>

        {/* 1. Metric Layer */}
        <section style={{ display: 'grid', gridTemplateColumns: '1.4fr 2.6fr', gap: '30px', marginBottom: '40px' }}>
          <div className="card glass" style={{ background: 'white', padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <span style={{ fontWeight: '600', fontSize: '1rem', color: 'var(--text-muted)' }}>Compliance Fulfillment</span>
                <span style={{ color: 'var(--primary-deep)', fontWeight: '800', fontSize: '1.2rem' }}>{progressPercent}%</span>
             </div>
             <div style={{ height: '12px', background: 'var(--bg-main)', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} style={{ height: '100%', background: 'var(--primary)' }} />
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
               <span>Cycle Status: Stable</span>
               <span style={{ color: 'var(--primary)' }}>{completedCount} filed</span>
             </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
             {[
               { label: 'Pending GST', val: '₹14.2L', trend: '+1.2%', icon: <DollarSign size={18} /> },
               { label: 'Available ITC', val: '₹4.8L', trend: 'Live', icon: <ArrowDownRight size={18} /> },
               { label: 'Audit Risk', val: 'Minimal', trend: 'Low', icon: <ShieldCheck size={18} /> },
               { label: 'Filing Health', val: '98%', trend: 'Optimum', icon: <PieChart size={18} /> },
             ].map((s, i) => (
               <div key={i} className="card glass" style={{ background: 'white', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ width: '32px', height: '32px', background: 'var(--bg-main)', borderRadius: '8px', display: 'grid', placeItems: 'center', color: 'var(--primary)' }}>{s.icon}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 800 }}>{s.trend}</div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '700', marginTop: '4px' }}>{s.val}</div>
               </div>
             ))}
          </div>
        </section>

        {/* 2. Operations Layer */}
        <section style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '30px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            {/* Regulatory Roadmap */}
            <div className="card glass" style={{ background: 'white' }}>
               <h3 style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.3rem' }}><ShieldCheck color="var(--primary)" /> Governance Pipeline</h3>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {compTasks.map((t, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '24px', borderRadius: '16px', background: 'var(--bg-main)', border: '1px solid var(--card-border)' }}>
                       <div>
                         <div style={{ fontWeight: '600', fontSize: '1.05rem' }}>{t.name}</div>
                         <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Clock size={12} /> Deadline: {new Date(t.due_date || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                         </div>
                       </div>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                         <span className={t.status === 'completed' ? 'badge-success' : 'badge-warning'} style={{ padding: '6px 16px', borderRadius: '30px', fontSize: '0.75rem', fontWeight: 800 }}>
                            {t.status.toUpperCase()}
                         </span>
                         <MoreVertical size={18} color="var(--text-muted)" style={{ cursor: 'pointer' }} />
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            {/* Document Assistant */}
            <div className="card glass" style={{ background: 'white' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.3rem' }}><Paperclip color="var(--primary)" /> Enterprise Vault</h3>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                    <input 
                      style={{ padding: '8px 12px 8px 32px', borderRadius: '10px', border: '1px solid var(--card-border)', background: 'var(--bg-main)', fontSize: '0.8rem', width: '180px' }}
                      placeholder="Search Vault..."
                      value={docSearch} onChange={e => setDocSearch(e.target.value)}
                    />
                  </div>
                  <button className="btn btn-ghost" style={{ padding: '8px' }}><Filter size={16} /></button>
                </div>
               </div>
               
               <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', background: 'var(--bg-main)', padding: '16px', borderRadius: '16px' }}>
                  <input value={docName} onChange={e => setDocName(e.target.value)} style={{ flex: 1, padding: '14px', border: '1px solid var(--card-border)', outline: 'none', borderRadius: '12px', background: 'white' }} placeholder="Enterprise Document Label (e.g. Sales Registry Mar-26)" />
                  <button onClick={handleUpload} className="btn btn-primary" style={{ height: '52px' }}><PlusCircle size={20} /> Secure Transfer</button>
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                  {filteredDocs.map((d, i) => (
                    <motion.div whileHover={{ scale: 1.02 }} key={i} className="glass" style={{ padding: '20px', borderRadius: '14px', border: '1px solid var(--card-border)', background: 'white', position: 'relative' }}>
                       <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '12px' }}>{d.name}</div>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{new Date(d.timestamp || Date.now()).toLocaleDateString()}</span>
                         <CheckCircle size={16} color="var(--primary)" />
                       </div>
                    </motion.div>
                  ))}
                  {filteredDocs.length === 0 && <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: 'var(--text-muted)', fontSize: '0.9rem', border: '1px dashed var(--card-border)', borderRadius: '16px' }}>Vault Index is currently synchronized. No results for query.</div>}
               </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
             {/* Dynamic Insight Engine */}
             <div className="card glass" style={{ background: 'var(--primary)', color: 'white', border: 'none', backgroundImage: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-deep) 100%)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontWeight: '700' }}>
                   <Zap size={20} /> ARVIK Intelligence
                </div>
                <p style={{ fontSize: '1rem', lineHeight: '1.6', marginBottom: '20px' }}>
                  Detected <span style={{ fontWeight: 800 }}>14 unbilled ledger entries</span>. Processing now will optimize your tax liability by ₹2.4L.
                </p>
                <button className="btn" style={{ width: '100%', background: 'white', color: 'var(--primary-deep)', border: 'none' }}>Optimize Performance</button>
             </div>

             {/* Personal Expert Channel */}
             <ChatBox clientId={clientData.id} advisorName={assignedCA?.name} />

             {/* Regional Filing Cycle */}
             <MiniCalendar complianceDates={complianceDates} />

             {/* Risk & Safety Channel */}
             <div className="card glass" style={{ borderColor: '#E68A8A', background: 'rgba(230, 138, 138, 0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#B35E5E', fontWeight: '700', marginBottom: '16px' }}>
                   <AlertCircle size={20} /> Security & Risk Notifications
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                   <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', borderLeft: '3px solid #E68A8A', paddingLeft: '12px' }}>
                      <div style={{ fontWeight: 700 }}>Critical: TDS Q4 filing</div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '3px' }}>Filing window closes in 48 hours.</p>
                   </div>
                   <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', borderLeft: '3px solid var(--highlight)', paddingLeft: '12px' }}>
                      <div style={{ fontWeight: 700 }}>Invoice Gap Detected</div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '3px' }}>2 purchase entries require GSTR-2B sync.</p>
                   </div>
                </div>
             </div>
          </div>
        </section>
      </motion.div>
      <footer style={{ marginTop: '80px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', paddingBottom: '40px' }}>
         SECURE ENTERPRISE LAYER v2.4 | AES-256 ENCRYPTED | GDPR COMPLIANT
      </footer>
    </div>
  )
}

export default ClientDashboard
