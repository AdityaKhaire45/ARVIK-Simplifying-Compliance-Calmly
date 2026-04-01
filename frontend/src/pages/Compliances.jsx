import React from 'react'
import { motion } from 'framer-motion'
import { Plus, History, Calendar, CheckSquare, Clock, ArrowRight } from 'lucide-react'

const Compliances = () => {
  const compliances = [
    { name: 'GSTR-1', type: 'Monthly', dueDay: 11, category: 'GST', stats: '92%' },
    { name: 'GSTR-3B', type: 'Monthly', dueDay: 20, category: 'GST', stats: '98%' },
    { name: 'TDS Payment', type: 'Monthly', dueDay: 7, category: 'TDS', stats: '89%' },
    { name: 'PF & ESIC', type: 'Monthly', dueDay: 15, category: 'Payroll', stats: '94%' },
    { name: 'Professional Tax (PT)', type: 'Monthly', dueDay: 30, category: 'PT', stats: '99%' },
    { name: 'ITR Filing (Indiv)', type: 'Yearly', dueDay: 212, category: 'Income Tax', stats: '75%' }
  ]

  return (
    <div style={{ maxWidth: '1200px' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Compliance Master</h1>
            <p style={{ color: 'var(--text-muted)' }}>Defining the governance and logic for regulatory filings.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
             <button className="btn btn-ghost"><History size={16} /> Audit Trail</button>
             <button className="btn btn-primary"><Plus size={18} /> Add Module</button>
          </div>
        </header>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
          {compliances.map((c, i) => (
             <div key={i} className="card glass" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '6px' }}>{c.name}</h3>
                    <span className="badge badge-success" style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>{c.category}</span>
                  </div>
                  <div style={{ 
                    background: c.type === 'Monthly' ? 'rgba(61, 191, 193, 0.1)' : 'rgba(183, 192, 110, 0.1)', 
                    color: c.type === 'Monthly' ? 'var(--primary-deep)' : '#8C9441', 
                    padding: '4px 12px', 
                    borderRadius: '20px', 
                    fontSize: '0.7rem', 
                    fontWeight: 600 
                  }}>
                    {c.type}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '16px', background: 'var(--bg-main)', borderRadius: '12px' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}><Clock size={12} /> Due Logic</div>
                    <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>Day {c.dueDay}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}><CheckSquare size={12} /> Compliance Rate</div>
                    <div style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--primary)' }}>{c.stats}</div>
                  </div>
                </div>

                <div style={{ marginTop: 'auto', display: 'flex', gap: '10px' }}>
                  <button className="btn btn-ghost" style={{ flex: 1, fontSize: '0.8rem' }}>Edit Strategy</button>
                  <button className="btn btn-ghost" style={{ padding: '8px' }}><ArrowRight size={16} /></button>
                </div>
             </div>
          ))}
        </section>
      </motion.div>
    </div>
  )
}

export default Compliances
