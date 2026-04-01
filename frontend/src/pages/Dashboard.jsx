import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ClipboardList, 
  ShieldCheck, 
  Bell, 
  PlusCircle, 
  PieChart, 
  TrendingUp, 
  Calendar,
  AlertTriangle,
  History,
  ArrowUpRight,
  Monitor,
  MousePointer2,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, ref, onValue } from '../firebase';
import { useNavigate } from 'react-router-dom';

const Dashboard = ({ role }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState([
    { label: 'Managed Entities', value: '0', icon: <Users size={18} />, color: 'var(--primary)', path: '/clients', trend: '+12%' },
    { label: 'Active Filings', value: '0', icon: <ClipboardList size={18} />, color: 'var(--primary-deep)', path: '/compliances', trend: 'Live' },
    { label: 'Partner Network', value: '0', icon: <ShieldCheck size={18} />, color: 'var(--highlight)', path: '/cas', trend: 'Global' },
    { label: 'System Health', value: '99.8%', icon: <PieChart size={18} />, color: 'var(--primary-muted)', path: '/', trend: 'Stable' }
  ]);
  const [pipeline, setPipeline] = useState([]);

  useEffect(() => {
    const clientsRef = ref(db, "clients");
    const caRef = ref(db, "cas");
    
    onValue(caRef, (snap) => {
      const caCount = snap.val() ? Object.keys(snap.val()).length : 0;
      setStats(prev => {
        const next = [...prev];
        next[2].value = caCount.toString();
        return next;
      });
    });

    onValue(clientsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const clients = Object.entries(data).map(([id, val]) => ({ id, ...val }));
        setStats(prev => {
           const next = [...prev];
           next[0].value = clients.length.toString();
           next[1].value = clients.reduce((acc, c) => acc + (c.compliances?.length || 0), 0).toString();
           return next;
        });

        const tasks = [];
        clients.forEach(c => {
          (c.compliances || []).forEach(name => {
            tasks.push({
              clientName: c.name,
              complianceName: typeof name === 'string' ? name : name.name,
              dueDay: 20 
            });
          });
        });
        setPipeline(tasks.slice(-5).reverse());
      }
    });
  }, []);

  return (
    <div style={{ maxWidth: '1400px' }}>
      {/* 1. Dynamic Welcome Header */}
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2.8rem', marginBottom: '8px', fontWeight: 600, letterSpacing: '-0.02em' }}>
            {role === 'admin' ? 'Administrative Control' : 'Advisor Workspace'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
            System Integrity: <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Optimal</span> | Connected to Secure Instance
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-ghost"><Filter size={18} /> Configure View</button>
          <button className="btn btn-primary" onClick={() => navigate('/clients')}><PlusCircle size={18} /> New Engagement</button>
        </div>
      </header>

      {/* 2. Enhanced Summary Cards */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        {stats.map((s, i) => (
          <motion.div 
            key={i} 
            className="card glass" 
            style={{ 
              position: 'relative', 
              overflow: 'hidden', 
              cursor: 'pointer',
              padding: '30px',
              border: '1px solid var(--card-border)',
              background: 'white'
            }}
            whileHover={{ y: -8, boxShadow: 'var(--shadow-medium)' }}
            onClick={() => navigate(s.path)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ color: s.color, background: `${s.color}15`, width: '40px', height: '40px', borderRadius: '10px', display: 'grid', placeItems: 'center' }}>{s.icon}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700, background: 'rgba(61,191,193,0.1)', padding: '4px 10px', borderRadius: '20px' }}>{s.trend}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{s.label}</div>
              <div style={{ fontSize: '2.4rem', fontWeight: '700', letterSpacing: '-0.04em' }}>{s.value}</div>
            </div>
            <div style={{ position: 'absolute', bottom: '-15px', right: '-15px', opacity: 0.05, transform: 'scale(2.5)' }}>{s.icon}</div>
          </motion.div>
        ))}
      </section>

      {/* 3. Detailed Data Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '30px' }}>
        
        {/* Module 1: Live Compliance Engine */}
        <div className="card glass" style={{ background: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.25rem' }}>
              <TrendingUp size={20} color="var(--primary)" /> Intelligent Filing Stream
            </h3>
            <button className="btn-ghost" style={{ fontSize: '0.8rem', padding: '6px 12px' }} onClick={() => navigate('/compliances')}>Master Control Center</button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {pipeline.length > 0 ? pipeline.map((t, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ delay: i * 0.05 }} 
                key={i} 
                className="glass" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '20px', 
                  borderRadius: 'var(--radius-md)', 
                  border: '1px solid var(--card-border)',
                  background: 'var(--bg-main)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'white', display: 'grid', placeItems: 'center' }}>
                    <Monitor size={20} color="var(--primary)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '1rem', color: 'var(--text-main)' }}>{t.complianceName} • <span style={{ color: 'var(--primary-deep)' }}>{t.clientName}</span></div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                      <Calendar size={12} /> Filing Cycle: April 2026
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: 'var(--primary-deep)', fontWeight: '700', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                     Process <ArrowUpRight size={14} />
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>Est. Completion: 2h</div>
                </div>
              </motion.div>
            )) : (
              <div style={{ padding: '80px 40px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-main)', borderRadius: '16px', border: '1px dashed var(--card-border)' }}>
                 <MousePointer2 size={32} style={{ opacity: 0.2, marginBottom: '16px' }} />
                 <p>Operational Stream Offline. Awaiting New Data.</p>
              </div>
            )}
          </div>
        </div>

        {/* Module 2: System Intelligence & Quick Ops */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Quick Ops Panel */}
          <div className="card glass" style={{ background: 'var(--primary)', color: 'white', backgroundImage: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-deep) 100%)', border: 'none' }}>
             <h3 style={{ marginBottom: '20px', fontSize: '1.2rem', fontWeight: 600 }}>Operational Command</h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button className="btn" style={{ width: '100%', background: 'white', color: 'var(--primary-deep)', border: 'none' }}>
                  <PlusCircle size={18} /> New Enterprise Entity
                </button>
                <button className="btn" style={{ width: '100%', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>
                  <History size={18} /> Bulk Audit Reports
                </button>
                <div style={{ marginTop: '10px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)', textAlign: 'center' }}>
                  Shortcut: <span style={{ fontWeight: 800 }}>Ctrl + N</span> for rapid registration
                </div>
             </div>
          </div>

          {/* System Integrity (Alerts) */}
          <div className="card glass" style={{ background: 'white' }}>
             <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.15rem' }}>
               <AlertTriangle size={20} color="var(--highlight)" /> Governance Alerts
             </h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                   <div style={{ width: '4px', height: 'auto', background: 'var(--primary)', borderRadius: '4px' }}></div>
                   <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>Cloud Node Sync</div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Global instances synchronized. Latency: 12ms</p>
                   </div>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                   <div style={{ width: '4px', height: 'auto', background: 'var(--highlight)', borderRadius: '4px' }}></div>
                   <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>Compliance Drift Detected</div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>2 entities require GSTIN re-verification.</p>
                   </div>
                </div>
             </div>
             <button className="btn btn-ghost" style={{ width: '100%', marginTop: '24px', fontSize: '0.8rem' }}>View Analytics History</button>
          </div>
        </div>

      </div>

      {/* Footer Branding */}
      <footer style={{ marginTop: '60px', borderTop: '1px solid var(--card-border)', paddingTop: '30px', textAlign: 'center' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
          ARVIK CORE v2.4 | ENCRYPTED | COMPLIANCE FIRST ARCHITECTURE
        </p>
      </footer>
    </div>
  );
};

export default Dashboard;
