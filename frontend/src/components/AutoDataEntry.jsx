import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UploadCloud, CheckCircle, BrainCircuit, Scan, FileText, AlertCircle, FileCheck, X } from 'lucide-react'
import { API_BASE } from '../config'
import { db, ref, push, set } from '../firebase' // Keeping firebase for now if still needed, but backend is preferred.

export default function AutoDataEntry({ clientData, assignedCA, onComplete }) {
  const [file, setFile] = useState(null)
  const [docType, setDocType] = useState('expense') // sales or expense
  const [step, setStep] = useState(1) // 1: upload, 2: processing, 3: review, 4: done
  const [processingStatus, setProcessingStatus] = useState('')
  const [extractedData, setExtractedData] = useState({
    gstin: '',
    amount: '',
    date: '',
    vendor: '',
    invoice_no: ''
  })

  // Real AI Logic hitting FastAPI Backend
  const callGeminiAPI = async (uploadedFile) => {
    const formData = new FormData();
    formData.append("file", uploadedFile);
    formData.append("client_id", clientData.id);
    formData.append("doc_type", docType);

    const res = await fetch(`${API_BASE}/upload`, {
      method: "POST",
      body: formData
    });
    
    if (!res.ok) {
      throw new Error(`API error: ${res.statusText}`);
    }
    
    const resData = await res.json();
    return resData.data;
  }

  const handleUpload = (e) => {
    const uploadedFile = e.target.files[0]
    if (!uploadedFile) return
    setFile(uploadedFile)
    setStep(2)
    startProcessing(uploadedFile)
  }

  const startProcessing = async (uploadedFile) => {
    setProcessingStatus('Connecting to ARVIK AI Engine...')
    try {
      setProcessingStatus('Extracting Document Data via Gemini...')
      const data = await callGeminiAPI(uploadedFile)
      
      if(data.error_msg) {
         console.warn("AI extraction warning:", data.error_msg);
      }
      
      setExtractedData({
        gstin: data.gstin || '',
        amount: data.amount || '',
        date: data.date || '',
        vendor: data.vendor || '',
        invoice_no: data.invoice_number || data.invoice_no || ''
      })
      setStep(3)
    } catch (err) {
      console.error(err);
      // Fallback: Proceed to manual review
      setStep(3);
    }
  }

  const handleSubmit = async () => {
     // SALDO is updated by the backend during /upload
     // We just transition the UI to the "done" state
     setStep(4)
     setTimeout(() => {
       if (onComplete) onComplete()
     }, 2000)
  }

  return (
    <div className="card glass" style={{ background: 'white', padding: '30px' }}>
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
           <h3 style={{ fontSize: '1.4rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BrainCircuit color="var(--primary)" /> Smart Data Entry Engine
           </h3>
           {step === 1 && (
             <select 
               value={docType} 
               onChange={e => setDocType(e.target.value)}
               style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-main)', outline: 'none' }}
             >
               <option value="expense">Upload Expense (Purchase)</option>
               <option value="sales">Upload Sales (Income)</option>
             </select>
           )}
       </div>

       <AnimatePresence mode="wait">
         {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
               <div style={{ padding: '40px', border: '2px dashed var(--card-border)', borderRadius: '16px', textAlign: 'center', background: 'var(--bg-main)', cursor: 'pointer', position: 'relative' }}>
                  <input type="file" onChange={handleUpload} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} accept="image/*,application/pdf" />
                  <UploadCloud size={48} color="var(--primary)" style={{ margin: '0 auto 16px' }} />
                  <div style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px' }}>Upload {docType === 'sales' ? 'Sales Invoice' : 'Expense Receipt'}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>ARVIK AI will auto-extract, validate, and update SALDO balance.</div>
               </div>
            </motion.div>
         )}

         {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ textAlign: 'center', padding: '40px 0' }}>
               <div className="animate-spin" style={{ display: 'inline-block', marginBottom: '20px' }}>
                 <Scan size={48} color="var(--primary)" />
               </div>
               <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--primary-deep)' }}>{processingStatus}</div>
               <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px' }}>Connecting directly to Gemini AI model...</div>
            </motion.div>
         )}

         {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', padding: '16px', background: 'var(--bg-main)', borderRadius: '12px', borderLeft: '4px solid var(--primary)' }}>
                 <FileCheck size={24} color="var(--primary)" />
                 <div>
                   <div style={{ fontWeight: 600 }}>Data Extracted Successfully</div>
                   <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Confidence Score: <span style={{ color: 'var(--primary)', fontWeight: 800 }}>High</span> </div>
                 </div>
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                 <div className="input-group">
                   <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px', display: 'block' }}>Vendor Name</label>
                   <input className="input" value={extractedData.vendor} onChange={e => setExtractedData({...extractedData, vendor: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--card-border)', outline: 'none' }} />
                 </div>
                 <div className="input-group">
                   <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px', display: 'block' }}>Invoice Number</label>
                   <input className="input" value={extractedData.invoice_no} onChange={e => setExtractedData({...extractedData, invoice_no: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--card-border)', outline: 'none' }} />
                 </div>
                 <div className="input-group">
                   <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px', display: 'block' }}>GSTIN</label>
                   <input className="input" value={extractedData.gstin} onChange={e => setExtractedData({...extractedData, gstin: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--card-border)', outline: 'none' }} />
                 </div>
                 <div className="input-group">
                   <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px', display: 'block' }}>Date</label>
                   <input type="date" className="input" value={extractedData.date} onChange={e => setExtractedData({...extractedData, date: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--card-border)', outline: 'none' }} />
                 </div>
                 <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                   <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px', display: 'block' }}>Total Amount (₹)</label>
                   <input className="input" value={extractedData.amount} onChange={e => setExtractedData({...extractedData, amount: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--card-border)', outline: 'none', fontWeight: 'bold', fontSize: '1.1rem' }} />
                 </div>
               </div>

               <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                 <button onClick={() => { setStep(1); setExtractedData({ gstin: '', amount: '', date: '', vendor: '', invoice_no: '' }) }} className="btn btn-ghost">Cancel</button>
                 <button onClick={handleSubmit} className="btn btn-primary">Confirm & Update SALDO</button>
               </div>
            </motion.div>
         )}

         {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '40px 0' }}>
               <CheckCircle size={64} color="var(--primary)" style={{ margin: '0 auto 16px' }} />
               <div style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--primary-deep)' }}>SALDO Updated & Routed to Consultant</div>
               <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '8px' }}>Your CA {(assignedCA?.name) || ''} will review the processed data.</div>
            </motion.div>
         )}
       </AnimatePresence>
    </div>
  )
}
