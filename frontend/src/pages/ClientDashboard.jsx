import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { db, ref, onValue, push, set, update, storage, storageRef, uploadBytes, getDownloadURL } from '../firebase'
import { 
  Upload, CheckCircle, Clock, XCircle, MessageSquare, Send, 
  FileText, AlertTriangle, Shield, Scan, Loader2, Bell
} from 'lucide-react'

const ClientDashboard = ({ user, initialTab }) => {
  const [clientData, setClientData] = useState(null)
  const [caData, setCaData] = useState(null)
  const [documents, setDocuments] = useState([])
  const [alerts, setAlerts] = useState([])
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState(initialTab || 'dashboard')

  // Upload state
  const [uploadFile, setUploadFile] = useState(null)
  const [docType, setDocType] = useState('expense')
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)

  // Chat state
  const [chatInput, setChatInput] = useState('')
  const chatEndRef = useRef(null)

  useEffect(() => {
    if (!user) return
    // Find client profile linked to this user
    onValue(ref(db, 'clients'), snap => {
      const d = snap.val()
      if (d) {
        // Find client where user_uid matches, or first client for demo
        const entries = Object.entries(d)
        const myClient = entries.find(([_, v]) => v.user_uid === user.uid)
        if (myClient) {
          setClientData({ id: myClient[0], ...myClient[1] })
        } else if (entries.length > 0) {
          // Fallback: first client for demo purposes
          setClientData({ id: entries[0][0], ...entries[0][1] })
        }
      }
      setLoading(false)
    })
  }, [user])

  useEffect(() => {
    if (!clientData) return
    // Get assigned CA info
    if (clientData.assigned_ca_uid) {
      onValue(ref(db, `users/${clientData.assigned_ca_uid}`), snap => {
        setCaData(snap.val())
      })
    }
    // Get documents for this client
    onValue(ref(db, 'documents'), snap => {
      const d = snap.val()
      if (d) {
        const myDocs = Object.entries(d).map(([id, v]) => ({ id, ...v })).filter(doc => doc.client_uid === clientData.id)
        setDocuments(myDocs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)))
      }
    })
    // Get alerts
    onValue(ref(db, 'alerts'), snap => {
      const d = snap.val()
      if (d) {
        setAlerts(Object.entries(d).map(([id, v]) => ({ id, ...v })).filter(a => a.target_uid === user?.uid || a.target_uid === clientData.id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)))
      }
    })
    // Get messages
    onValue(ref(db, `messages/${clientData.id}`), snap => {
      const d = snap.val()
      if (d) setMessages(Object.values(d).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)))
      else setMessages([])
    })
  }, [clientData])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Upload to backend
  const handleUpload = async () => {
    if (!uploadFile || !clientData) return
    setUploading(true)
    setUploadResult(null)
    try {
      const formData = new FormData()
      formData.append('file', uploadFile)
      formData.append('client_id', clientData.id)
      formData.append('doc_type', docType)

      const res = await fetch('http://127.0.0.1:8000/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error(`Server error: ${res.statusText}`)
      const data = await res.json()

      // Upload file to Firebase Storage to get a viewable URL
      const fileExt = uploadFile.name.split('.').pop()
      const fbStorageRef = storageRef(storage, `documents/${clientData.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`)
      await uploadBytes(fbStorageRef, uploadFile)
      const downloadUrl = await getDownloadURL(fbStorageRef)

      // Save to documents node with client_uid
      const docRef = push(ref(db, 'documents'))
      await set(docRef, {
        client_uid: clientData.id,
        file_name: `AI_${docType.toUpperCase()}_${data.data?.vendor || uploadFile.name}`,
        file_url: downloadUrl,
        mime_type: uploadFile.type,
        type: docType,
        status: 'pending',
        extracted_data: data.data,
        amount: data.data?.amount || 0,
        timestamp: new Date().toISOString()
      })

      // Alert CA
      if (clientData.assigned_ca_uid) {
        await push(ref(db, 'alerts'), {
          target_uid: clientData.assigned_ca_uid,
          message: `New ${docType} document uploaded by "${clientData.name}". Please review.`,
          client_name: clientData.name,
          type: 'info',
          created_at: new Date().toISOString(),
          read: false
        })
      }

      setUploadResult(data)
      setUploadFile(null)
    } catch (err) {
      setUploadResult({ error: err.message })
    }
    setUploading(false)
  }

  // Send chat message
  const sendMessage = async () => {
    if (!chatInput.trim() || !clientData) return
    await push(ref(db, `messages/${clientData.id}`), {
      text: chatInput,
      sender_uid: user?.uid,
      sender_role: 'client',
      sender_name: 'Client',
      timestamp: new Date().toISOString()
    })
    setChatInput('')
  }

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading your portal...</div>
  if (!clientData) return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>No client profile found. Ask your admin to register you.</div>

  const isCAAssigned = clientData.assigned_ca_uid && clientData.ca_status === 'accepted'
  const pendingDocs = documents.filter(d => d.status === 'pending').length
  const approvedDocs = documents.filter(d => d.status === 'approved').length
  const rejectedDocs = documents.filter(d => d.status === 'rejected').length

  return (
    <div style={{ maxWidth: '1200px' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <header style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 600, marginBottom: '8px' }}>
            Welcome, <span style={{ color: 'var(--primary)' }}>{clientData.name}</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
            Assigned CA: {isCAAssigned ? <strong style={{ color: 'var(--primary-deep)' }}>{caData?.name || 'Loading...'}</strong> : 
            <span style={{ color: '#B7C06E' }}>{clientData.ca_status === 'pending' ? '⏳ CA Pending Acceptance' : '❌ No CA Assigned Yet'}</span>}
          </p>
        </header>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '30px', background: 'white', borderRadius: '14px', padding: '4px', boxShadow: 'var(--shadow-soft)', width: 'fit-content' }}>
          {[
            { key: 'dashboard', label: 'Overview', icon: <FileText size={16} /> },
            { key: 'upload', label: 'Upload Docs', icon: <Upload size={16} /> },
            { key: 'chat', label: 'Chat with CA', icon: <MessageSquare size={16} /> },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ 
                padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
                display: 'flex', alignItems: 'center', gap: '8px',
                background: tab === t.key ? 'var(--primary)' : 'transparent',
                color: tab === t.key ? 'white' : 'var(--text-muted)'
              }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ========== DASHBOARD TAB ========== */}
        {tab === 'dashboard' && (
          <div>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '30px' }}>
              {[
                { label: 'Pending', val: pendingDocs, icon: <Clock size={18} />, color: '#B7C06E' },
                { label: 'Approved', val: approvedDocs, icon: <CheckCircle size={18} />, color: 'var(--primary)' },
                { label: 'Rejected', val: rejectedDocs, icon: <XCircle size={18} />, color: '#E68A8A' },
                { label: 'Alerts', val: alerts.filter(a => !a.read).length, icon: <Bell size={18} />, color: '#B7C06E' },
              ].map((s, i) => (
                <div key={i} className="card" style={{ background: 'white' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ width: '32px', height: '32px', background: `${s.color}15`, borderRadius: '8px', display: 'grid', placeItems: 'center', color: s.color }}>{s.icon}</div>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>{s.label}</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{s.val}</div>
                </div>
              ))}
            </div>

            {/* Document List */}
            <div className="card" style={{ background: 'white' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '20px' }}>Your Documents</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {documents.length === 0 && <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>No documents yet. Upload one to get started.</div>}
                {documents.map(d => (
                  <div key={d.id} style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderRadius: '12px', background: 'var(--bg-main)',
                    borderLeft: `4px solid ${d.status === 'approved' ? 'var(--primary)' : d.status === 'rejected' ? '#E68A8A' : '#B7C06E'}`
                  }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{d.file_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(d.timestamp).toLocaleString()}</div>
                      {d.status === 'rejected' && d.rejection_msg && <div style={{ fontSize: '0.75rem', color: '#B35E5E', marginTop: '4px' }}>⚠ {d.rejection_msg}</div>}
                    </div>
                    <span style={{ 
                      fontSize: '0.7rem', fontWeight: 700, padding: '4px 12px', borderRadius: '20px',
                      background: d.status === 'approved' ? 'rgba(61,191,193,0.1)' : d.status === 'rejected' ? 'rgba(230,138,138,0.1)' : 'rgba(183,192,110,0.15)',
                      color: d.status === 'approved' ? 'var(--primary-deep)' : d.status === 'rejected' ? '#B35E5E' : '#8B8B2A'
                    }}>
                      {d.status?.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Alerts */}
            {alerts.length > 0 && (
              <div className="card" style={{ background: 'white', marginTop: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={18} color="#E68A8A" /> Recent Alerts
                </h3>
                {alerts.slice(0, 5).map(a => (
                  <div key={a.id} style={{ padding: '10px 14px', borderLeft: '3px solid #E68A8A', marginBottom: '8px', fontSize: '0.85rem' }}>
                    {a.message}
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>{new Date(a.created_at).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========== UPLOAD TAB ========== */}
        {tab === 'upload' && (
          <div className="card" style={{ background: 'white' }}>
            {!isCAAssigned ? (
              <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
                <Shield size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>CA Not Yet Assigned</div>
                <p style={{ marginTop: '8px' }}>You can upload documents only after a CA has been assigned and accepted your account. Please contact your admin.</p>
              </div>
            ) : (
              <>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Upload size={22} color="var(--primary)" /> Upload Document for Review
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '16px', alignItems: 'end', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Document Type</label>
                    <select value={docType} onChange={e => setDocType(e.target.value)}
                      style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--card-border)', outline: 'none', background: 'var(--bg-main)' }}>
                      <option value="expense">Expense (Purchase)</option>
                      <option value="sales">Sales (Income)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Upload File (Image/PDF)</label>
                    <input type="file" accept="image/*,application/pdf" onChange={e => setUploadFile(e.target.files[0])}
                      style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--card-border)', background: 'var(--bg-main)' }} />
                  </div>
                  <button disabled={uploading || !uploadFile} onClick={handleUpload} className="btn btn-primary" style={{ height: '48px', minWidth: '180px' }}>
                    {uploading ? <><Loader2 size={18} className="animate-spin" /> Scanning...</> : <><Scan size={18} /> Scan & Upload</>}
                  </button>
                </div>

                {uploadResult && !uploadResult.error && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '20px', background: 'var(--bg-main)', borderRadius: '12px', borderLeft: '4px solid var(--primary)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--primary-deep)', marginBottom: '12px' }}>
                      <CheckCircle size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
                      Document Scanned & Sent to CA!
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
                      {Object.entries(uploadResult.data || {}).filter(([k]) => !k.startsWith('error') && !k.startsWith('raw') && !k.startsWith('parse')).map(([k, v]) => (
                        <div key={k} style={{ padding: '10px', background: 'white', borderRadius: '8px' }}>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>{k}</div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{v || '—'}</div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
                {uploadResult?.error && (
                  <div style={{ padding: '16px', background: 'rgba(230,138,138,0.1)', borderRadius: '10px', color: '#B35E5E' }}>
                    <AlertTriangle size={16} style={{ display: 'inline', marginRight: '8px' }} /> {uploadResult.error}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ========== CHAT TAB ========== */}
        {tab === 'chat' && (
          <div className="card" style={{ background: 'white', height: '600px', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
            {!isCAAssigned ? (
              <div style={{ flex: 1, display: 'grid', placeItems: 'center', color: 'var(--text-muted)' }}>
                <div style={{ textAlign: 'center' }}>
                  <MessageSquare size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                  <div style={{ fontWeight: 600 }}>Chat Unavailable</div>
                  <p style={{ marginTop: '8px', fontSize: '0.85rem' }}>Chat is enabled only after a CA accepts your account.</p>
                </div>
              </div>
            ) : (
              <>
                <div style={{ padding: '20px', borderBottom: '1px solid var(--card-border)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <MessageSquare size={18} color="var(--primary)" /> Chat with {caData?.name || 'Your CA'}
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--bg-main)' }}>
                  {messages.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>No messages yet. Start the conversation!</div>}
                  {messages.map((m, i) => (
                    <div key={i} style={{ alignSelf: m.sender_role === 'client' ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                      <div style={{ padding: '10px 16px', borderRadius: '12px', fontSize: '0.85rem',
                        background: m.sender_role === 'client' ? 'var(--primary)' : 'white',
                        color: m.sender_role === 'client' ? 'white' : 'var(--text-main)',
                        boxShadow: 'var(--shadow-soft)' }}>
                        {m.text}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px', textAlign: m.sender_role === 'client' ? 'right' : 'left' }}>
                        {m.sender_name} · {new Date(m.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div style={{ padding: '16px', borderTop: '1px solid var(--card-border)', display: 'flex', gap: '10px' }}>
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && sendMessage()}
                    placeholder="Type your message..."
                    style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--card-border)', outline: 'none' }} />
                  <button onClick={sendMessage} className="btn btn-primary" style={{ padding: '10px' }}><Send size={18} /></button>
                </div>
              </>
            )}
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default ClientDashboard
