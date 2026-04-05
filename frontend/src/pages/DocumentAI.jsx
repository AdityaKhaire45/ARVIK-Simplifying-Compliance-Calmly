import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle, XCircle, Search, FileText, UserCheck, UserX, Clock, 
  MessageSquare, Send, AlertTriangle, Bell, ChevronRight, Scan,
  MoreVertical, CircleDot, CheckCheck, Loader2, Eye
} from 'lucide-react'
import { db, ref, onValue, update, push, set } from '../firebase'

import { API_BASE } from '../config'

export default function DocumentAI({ role, user }) {
  const [allClients, setAllClients] = useState([])
  const [documents, setDocuments] = useState([])
  const [alerts, setAlerts] = useState([])
  const [messages, setMessages] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [saldo, setSaldo] = useState(null)
  const [search, setSearch] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [rejectMsg, setRejectMsg] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectDocId, setRejectDocId] = useState(null)
  const [viewDoc, setViewDoc] = useState(null)
  const [rightTab, setRightTab] = useState('chat') // 'chat' | 'alerts'
  const chatEndRef = useRef(null)

  // ─── Data Loading ───
  const refreshData = async () => {
    if (!user) return
    try {
      // 1. Load Clients
      const cRes = await fetch(`${API_BASE}/clients`)
      const cData = await cRes.json()
      const list = Object.entries(cData || {}).map(([id, v]) => ({ id, ...v })).filter(c => c.assigned_ca_uid === user?.uid)
      setAllClients(list)

      // Auto-select
      if (!selectedClient && list.length > 0) {
        const first = list.find(c => c.ca_status === 'accepted') || list[0]
        if (first) setSelectedClient(first)
      }

      // 2. Load Documents
      const dRes = await fetch(`${API_BASE}/documents`)
      const dData = await dRes.json()
      setDocuments(dData ? Object.entries(dData).map(([id, v]) => ({ id, ...v })) : [])

      // 3. Load Alerts
      const aRes = await fetch(`${API_BASE}/alerts`)
      const aData = await aRes.json()
      if (aData) {
        setAlerts(Object.entries(aData).map(([id, v]) => ({ id, ...v })).filter(a => a.target_uid === user?.uid).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)))
      }

      // 4. Load Messages for selected client
      if (selectedClient) {
        const mRes = await fetch(`${API_BASE}/messages/${selectedClient.id}`)
        const mData = await mRes.json()
        setMessages(mData ? Object.values(mData).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)) : [])

        // 5. Load Saldo for Selected Client
        const sRes = await fetch(`${API_BASE}/saldo-insight`, {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ client_id: selectedClient.id })
        })
        const sData = await sRes.json()
        setSaldo(sData.saldo)
      }
    } catch (e) {
      console.error("Refresh Error:", e)
    }
  }

  useEffect(() => {
    refreshData()
    const interval = setInterval(refreshData, 5000)
    return () => clearInterval(interval)
  }, [user, selectedClient?.id])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // ─── Actions ───
  const handleClientAction = async (clientId, action) => {
    await fetch(`${API_BASE}/update-client`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId, ca_status: action })
    })
    refreshData()
  }

  const approveDoc = async (docId) => {
    await fetch(`${API_BASE}/update-doc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doc_id: docId, status: "approved", reviewed_by: user?.uid })
    })
    refreshData()
  }

  const rejectDoc = async () => {
    if (!rejectDocId) return
    await fetch(`${API_BASE}/update-doc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        doc_id: rejectDocId, 
        status: "rejected", 
        rejection_msg: rejectMsg, 
        reviewed_by: user?.uid 
      })
    })
    setShowRejectModal(false); setRejectMsg(''); setRejectDocId(null)
    refreshData()
  }

  const markCompleted = async (clientId) => {
    await fetch(`${API_BASE}/update-client`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId, work_status: "completed" })
    })
    refreshData()
  }

  const sendMessage = async () => {
    if (!chatInput.trim() || !selectedClient) return
    await fetch(`${API_BASE}/send-message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: selectedClient.id, text: chatInput })
    })
    setChatInput('')
    refreshData()
  }

  const markAlertRead = async (alertId) => {
    // Alert update endpoint not in backend yet, but we'll simulate or add if needed
    // For now, it stays locally read for the current session or we can add it
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, read: true } : a))
  }

  // ─── Derived ───
  const pendingClients = allClients.filter(c => c.ca_status === 'pending')
  const activeClients = allClients.filter(c => c.ca_status === 'accepted')
  // Sort clients by priority (pending work)
  const filteredClients = activeClients
    .filter(c => (c.name || '').toLowerCase().includes(search.toLowerCase()))
    .map(c => {
      const cDocs = documents.filter(d => d.client_id === c.id)
      const cPending = cDocs.filter(d => d.status === 'pending').length
      return { ...c, pendingCount: cPending, cDocs }
    })
    .sort((a, b) => b.pendingCount - a.pendingCount)

  const clientDocs = selectedClient ? documents.filter(d => d.client_id === selectedClient.id).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) : []
  const pendingDocCount = clientDocs.filter(d => d.status === 'pending').length
  const unreadAlerts = alerts.filter(a => !a.read).length

  // ─── Styles ───
  const panelStyle = { background: 'white', borderRadius: '16px', border: '1px solid var(--card-border)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }
  const panelHeaderStyle = { padding: '16px 20px', borderBottom: '1px solid var(--card-border)', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }
  const statusColor = (s) => s === 'approved' ? 'var(--primary)' : s === 'rejected' ? '#E68A8A' : '#B7C06E'
  const statusBg = (s) => s === 'approved' ? 'rgba(61,191,193,0.1)' : s === 'rejected' ? 'rgba(230,138,138,0.1)' : 'rgba(183,192,110,0.15)'

  return (
    <div style={{ height: 'calc(100vh - 150px)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Pending Client Requests Banner */}
      {pendingClients.length > 0 && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '12px 20px', border: '1px solid #B7C06E40', display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
          <Clock size={18} color="#B7C06E" />
          <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#8B8B2A' }}>Pending Requests:</span>
          {pendingClients.map(c => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 12px', background: 'rgba(183,192,110,0.1)', borderRadius: '8px' }}>
              <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{c.name}</span>
              <button onClick={() => handleClientAction(c.id, 'accepted')} style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', padding: '3px 10px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>Accept</button>
              <button onClick={() => handleClientAction(c.id, 'rejected')} style={{ background: '#E68A8A', color: 'white', border: 'none', borderRadius: '6px', padding: '3px 10px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>Reject</button>
            </div>
          ))}
        </div>
      )}

      {/* ⚡ QUICK ACTION BAR */}
      <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
        <button style={{ padding: '8px 14px', background: 'white', border: '1px solid var(--card-border)', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'var(--text-main)' }}>
          <UserCheck size={14}/> Add Client
        </button>
        <button style={{ padding: '8px 14px', background: 'white', border: '1px solid var(--card-border)', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'var(--text-main)' }}>
          <FileText size={14}/> Open Documents
        </button>
        <button onClick={() => document.getElementById('search-input')?.focus()} style={{ padding: '8px 14px', background: 'white', border: '1px solid var(--card-border)', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'var(--text-main)' }}>
          <Search size={14}/> Search
        </button>
        <button onClick={() => setRightTab('alerts')} style={{ padding: '8px 14px', background: 'white', border: '1px solid var(--card-border)', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'var(--text-main)' }}>
          <Bell size={14}/> Alerts {unreadAlerts > 0 && <span style={{ background: '#E68A8A', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '0.65rem' }}>{unreadAlerts}</span>}
        </button>
      </div>

      {/* ═══════ THREE PANEL LAYOUT ═══════ */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '260px 1fr 320px', gap: '12px', minHeight: 0 }}>
        
        {/* ═══════ LEFT: CLIENT LIST ═══════ */}
        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <FileText size={16} color="var(--primary)" /> My Clients
            <span style={{ marginLeft: 'auto', background: 'var(--primary)', color: 'white', borderRadius: '20px', padding: '1px 8px', fontSize: '0.7rem', fontWeight: 700 }}>{activeClients.length}</span>
          </div>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--card-border)' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '9px', color: 'var(--text-muted)' }} />
              <input id="search-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                style={{ width: '100%', padding: '8px 8px 8px 30px', borderRadius: '8px', border: '1px solid var(--card-border)', outline: 'none', fontSize: '0.8rem', background: 'var(--bg-main)' }} />
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
            {filteredClients.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                {activeClients.length === 0 ? 'No accepted clients yet.' : 'No results.'}
              </div>
            )}
            {filteredClients.map(c => {
              const cDocs = c.cDocs
              const cPending = c.pendingCount
              const isSelected = selectedClient?.id === c.id
              const workDone = c.work_status === 'completed'
              return (
                <motion.div key={c.id} whileTap={{ scale: 0.98 }} onClick={() => setSelectedClient(c)}
                  style={{ 
                    padding: '12px 14px', borderRadius: '10px', cursor: 'pointer', marginBottom: '4px',
                    background: isSelected ? 'linear-gradient(135deg, var(--primary), var(--primary-deep))' : 'transparent',
                    color: isSelected ? 'white' : 'var(--text-main)',
                    transition: 'all 0.2s ease',
                    border: isSelected ? 'none' : '1px solid transparent'
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{c.name}</div>
                    {cPending > 0 && <span style={{ background: isSelected ? 'rgba(255,255,255,0.3)' : '#B7C06E', color: isSelected ? 'white' : 'white', borderRadius: '10px', padding: '1px 8px', fontSize: '0.65rem', fontWeight: 700 }}>{cPending}</span>}
                    {workDone && <CheckCheck size={14} color={isSelected ? 'white' : 'var(--primary)'} />}
                  </div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: '2px' }}>
                    {workDone ? '✓ Completed' : cPending > 0 ? `${cPending} pending` : 'Up to date'}
                    {c.gstin && <span> · {c.gstin?.substring(0, 10)}...</span>}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* ═══════ CENTER: MAIN WORKSPACE ═══════ */}
        <div style={panelStyle}>
          {!selectedClient ? (
            <div style={{ flex: 1, display: 'grid', placeItems: 'center', color: 'var(--text-muted)' }}>
              <div style={{ textAlign: 'center' }}><Scan size={40} style={{ opacity: 0.2, marginBottom: '12px' }} /><div>Select a client to view workspace</div></div>
            </div>
          ) : (
            <>
              {/* Client Header + Actions */}
              <div style={{ ...panelHeaderStyle, justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {selectedClient.name}
                    {saldo && (
                      <span style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: '20px', background: 'var(--primary)', color: 'white', fontWeight: 800 }}>
                        Balance: ₹{saldo.balance?.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>GSTIN: {selectedClient.gstin || 'N/A'} · {selectedClient.work_status === 'completed' ? '✓ Work Completed' : `${pendingDocCount} pending docs`}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {selectedClient.work_status !== 'completed' && (
                    <button onClick={() => markCompleted(selectedClient.id)}
                      style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle size={14} /> Mark Complete
                    </button>
                  )}
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                {/* Documents List */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Documents ({clientDocs.length})</div>
                  {clientDocs.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px', border: '1px dashed var(--card-border)', borderRadius: '10px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No documents uploaded yet.
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {clientDocs.map(doc => (
                      <div key={doc.id} style={{ padding: '12px 16px', borderRadius: '10px', background: 'var(--bg-main)', borderLeft: `3px solid ${statusColor(doc.status)}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.file_name || 'Document'}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <span>{doc.type}</span>
                            {doc.extracted_data?.amount && <span>₹{doc.extracted_data.amount}</span>}
                            <span>{new Date(doc.timestamp).toLocaleDateString()}</span>
                          </div>
                          {doc.status === 'rejected' && doc.rejection_msg && <div style={{ fontSize: '0.7rem', color: '#B35E5E', marginTop: '4px' }}>⚠ {doc.rejection_msg}</div>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: statusBg(doc.status), color: statusColor(doc.status) }}>
                            {doc.status?.toUpperCase()}
                          </span>
                          
                          {doc.file_url && (
                            <button onClick={() => setViewDoc(doc)} title="View Document"
                              style={{ background: 'white', color: 'var(--text-main)', border: '1px solid var(--card-border)', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Eye size={12} /> View
                            </button>
                          )}

                          {doc.status === 'pending' && (
                            <>
                              <button onClick={() => approveDoc(doc.id)} title="Approve"
                                style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <CheckCircle size={12} /> Approve
                              </button>
                              <button onClick={() => { setRejectDocId(doc.id); setShowRejectModal(true) }} title="Reject"
                                style={{ background: '#E68A8A', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <XCircle size={12} /> Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Extracted Data Grid */}
                {clientDocs.length > 0 && clientDocs.some(d => d.extracted_data) && (
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Latest Extraction</div>
                    {(() => {
                      const latest = clientDocs.find(d => d.extracted_data)
                      if (!latest) return null
                      const ed = latest.extracted_data
                      return (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
                          {Object.entries(ed).filter(([k]) => !['error_msg','raw_text_fallback','parse_error','raw_response'].includes(k)).map(([k, v]) => (
                            <div key={k} style={{ padding: '10px 12px', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '3px' }}>{k.replace(/_/g, ' ')}</div>
                              <div style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v || '—'}</div>
                            </div>
                          ))}
                        </div>
                      )
                    })()}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ═══════ RIGHT: CHAT + ALERTS ═══════ */}
        <div style={panelStyle}>
          {/* Tab Switcher */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--card-border)', flexShrink: 0 }}>
            <button onClick={() => setRightTab('chat')}
              style={{ flex: 1, padding: '14px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', background: rightTab === 'chat' ? 'white' : 'var(--bg-main)', color: rightTab === 'chat' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: rightTab === 'chat' ? '2px solid var(--primary)' : '2px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <MessageSquare size={14} /> Chat
            </button>
            <button onClick={() => setRightTab('alerts')}
              style={{ flex: 1, padding: '14px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', background: rightTab === 'alerts' ? 'white' : 'var(--bg-main)', color: rightTab === 'alerts' ? '#E68A8A' : 'var(--text-muted)', borderBottom: rightTab === 'alerts' ? '2px solid #E68A8A' : '2px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', position: 'relative' }}>
              <Bell size={14} /> Alerts
              {unreadAlerts > 0 && <span style={{ position: 'absolute', top: '8px', right: '20px', background: '#E68A8A', color: 'white', borderRadius: '50%', width: '18px', height: '18px', fontSize: '0.6rem', display: 'grid', placeItems: 'center', fontWeight: 700 }}>{unreadAlerts}</span>}
            </button>
          </div>

          {/* Chat Panel */}
          {rightTab === 'chat' && (
            <>
              {!selectedClient ? (
                <div style={{ flex: 1, display: 'grid', placeItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '20px' }}>Select a client to start chat</div>
              ) : selectedClient.ca_status !== 'accepted' ? (
                <div style={{ flex: 1, display: 'grid', placeItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '20px' }}>Accept client first to enable chat</div>
              ) : (
                <>
                  <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--card-border)', fontSize: '0.8rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                    Chat with <strong style={{ color: 'var(--text-main)' }}>{selectedClient.name}</strong>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-main)' }}>
                    {messages.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px', fontSize: '0.8rem' }}>No messages yet</div>}
                    {messages.map((m, i) => (
                      <div key={i} style={{ alignSelf: m.sender_role === 'ca' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                        <div style={{ padding: '8px 14px', borderRadius: m.sender_role === 'ca' ? '12px 12px 2px 12px' : '12px 12px 12px 2px', fontSize: '0.82rem', lineHeight: '1.4',
                          background: m.sender_role === 'ca' ? 'var(--primary)' : 'white',
                          color: m.sender_role === 'ca' ? 'white' : 'var(--text-main)',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                          {m.text}
                        </div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '2px', textAlign: m.sender_role === 'ca' ? 'right' : 'left' }}>
                          {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  <div style={{ padding: '10px 12px', borderTop: '1px solid var(--card-border)', display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()}
                      placeholder="Type a message..."
                      style={{ flex: 1, padding: '9px 12px', borderRadius: '10px', border: '1px solid var(--card-border)', outline: 'none', fontSize: '0.82rem', background: 'var(--bg-main)' }} />
                    <button onClick={sendMessage}
                      style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '10px', padding: '9px 12px', cursor: 'pointer' }}>
                      <Send size={16} />
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {/* Alerts Panel */}
          {rightTab === 'alerts' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
              {alerts.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px', fontSize: '0.82rem' }}>No alerts</div>}
              {alerts.slice(0, 20).map(a => (
                <div key={a.id} onClick={() => markAlertRead(a.id)}
                  style={{ padding: '10px 14px', borderRadius: '8px', marginBottom: '6px', cursor: 'pointer',
                    background: a.read ? 'transparent' : 'rgba(230,138,138,0.05)',
                    borderLeft: `3px solid ${a.read ? 'var(--card-border)' : '#E68A8A'}`,
                    opacity: a.read ? 0.5 : 1, transition: 'all 0.2s' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: a.read ? 400 : 600, lineHeight: '1.4' }}>{a.message}</div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {new Date(a.created_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      <AnimatePresence>
        {showRejectModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', display: 'grid', placeItems: 'center', zIndex: 1000, backdropFilter: 'blur(6px)' }}>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
              style={{ background: 'white', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '12px', color: '#B35E5E' }}>Reject Document</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '14px' }}>Client will be notified with your reason.</p>
              <textarea value={rejectMsg} onChange={e => setRejectMsg(e.target.value)} placeholder="Rejection reason..."
                style={{ width: '100%', height: '100px', padding: '12px', borderRadius: '10px', border: '1px solid var(--card-border)', outline: 'none', resize: 'none', fontFamily: 'Inter', fontSize: '0.85rem' }} />
              <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                <button onClick={() => { setShowRejectModal(false); setRejectMsg('') }} style={{ flex: 1, padding: '10px', background: 'var(--bg-main)', border: '1px solid var(--card-border)', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                <button onClick={rejectDoc} style={{ flex: 1, padding: '10px', background: '#E68A8A', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 700 }}>Reject & Notify</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Document Modal */}
      <AnimatePresence>
        {viewDoc && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'grid', placeItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              style={{ background: 'white', borderRadius: '16px', padding: '20px', width: '90%', maxWidth: '900px', height: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={20} color="var(--primary)" />
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', margin: 0 }}>Document Viewer - {viewDoc.file_name}</h3>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <a href={viewDoc.file_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                    <button style={{ background: 'var(--bg-main)', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontWeight: 600, color: 'var(--text-main)' }}>Open in New Tab</button>
                  </a>
                  <button onClick={() => setViewDoc(null)} style={{ background: '#E68A8A', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontWeight: 700 }}>Close</button>
                </div>
              </div>

              <div style={{ flex: 1, background: '#f5f5f5', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--card-border)', display: 'grid', placeItems: 'center' }}>
                {viewDoc.mime_type?.includes('image') || viewDoc.file_url?.match(/\.(jpeg|jpg|gif|png)/i) ? (
                  <img src={viewDoc.file_url} alt="Document" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                ) : (
                  <iframe src={viewDoc.file_url} style={{ width: '100%', height: '100%', border: 'none' }} title="Document Viewer" />
                )}
              </div>
              
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
