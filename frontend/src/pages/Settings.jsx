import React, { useState, useEffect } from 'react';
import { 
  User, 
  Settings as SettingsIcon, 
  Monitor, 
  Zap, 
  Bell, 
  Smartphone, 
  Mail, 
  Eye, 
  EyeOff, 
  CheckCircle2,
  Shield,
  Key,
  ShieldCheck,
  Globe,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { db, ref, onValue, set, auth } from '../firebase';

const Settings = ({ role, user }) => {
  const [activeTab, setActiveTab] = useState('user');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      const userRef = ref(db, `users/${user.uid}`);
      onValue(userRef, (snap) => {
        setProfile(snap.val());
      });
    }
  }, [user]);

  const handleUpdateProfile = async (updates) => {
    setLoading(true);
    await set(ref(db, `users/${user.uid}`), {
      ...profile,
      ...updates
    });
    setLoading(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const tabs = [
    { id: 'user', name: 'User Identity', icon: <User size={18} /> },
    { id: 'security', name: 'Security Vault', icon: <Shield size={18} /> },
    { id: 'workflow', name: 'Process Logic', icon: <SettingsIcon size={18} /> },
    { id: 'performance', name: 'Core Engine', icon: <Zap size={18} /> },
    { id: 'notifications', name: 'Alert Systems', icon: <Bell size={18} /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'user':
        return (
          <div className="fade-in">
            <h3 style={{ marginBottom: '24px', fontSize: '1.4rem' }}>Identity Management</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="card glass" style={{ display: 'flex', alignItems: 'center', gap: '24px', background: 'white' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '16px', background: 'var(--primary)', display: 'grid', placeItems: 'center', color: 'white', fontSize: '2rem', fontWeight: 'bold' }}>
                  {profile?.name ? profile.name[0] : 'A'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', fontSize: '1.2rem', color: 'var(--text-main)' }}>{profile?.name || 'Loading Identity...'}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{profile?.email} | {role?.toUpperCase()} Privilege</div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Verified Account</span>
                    <span style={{ fontSize: '0.65rem', padding: '4px 10px', background: 'var(--bg-main)', borderRadius: '20px', color: 'var(--text-muted)' }}>MFA Active</span>
                  </div>
                </div>
                <button className="btn btn-ghost">Edit Signature</button>
              </div>
              
              <div className="card glass" style={{ background: 'white', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>Visual Interface Mode</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Adjust the ARVIK UI brightness level.</div>
                  </div>
                  <div style={{ padding: '6px', background: 'var(--bg-main)', borderRadius: '30px', display: 'flex', gap: '6px' }}>
                    <button className="btn" style={{ padding: '8px 16px', fontSize: '0.75rem', background: 'white', color: 'var(--primary)', boxShadow: 'var(--shadow-soft)' }}>Precision Light</button>
                    <button className="btn" style={{ padding: '8px 16px', fontSize: '0.75rem', background: 'transparent', color: 'var(--text-muted)' }}>OLED Dark</button>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                     <div style={{ fontWeight: 600 }}>Regional Instance</div>
                     <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Localized regulatory engine selector.</div>
                  </div>
                  <select style={{ padding: '10px 16px', borderRadius: '12px', border: '1px solid var(--card-border)', outline: 'none', background: 'var(--bg-main)', fontSize: '0.85rem' }}>
                    <option>India (GST/IT)</option>
                    <option>USA (IRS/SOC)</option>
                    <option>UK (VAT/HMRC)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );
      case 'security':
        return (
          <div className="fade-in">
             <h3 style={{ marginBottom: '24px', fontSize: '1.4rem' }}>Protocol & Security</h3>
             <div className="card glass" style={{ background: 'white', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div>
                      <div style={{ fontWeight: 600 }}>Access Encryption</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Manage your 256-bit secure tunnel keys.</div>
                   </div>
                   <button className="btn btn-ghost"><Key size={16} /> Rotate Keys</button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(61,191,193,0.05)', padding: '20px', borderRadius: '16px' }}>
                   <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'white', display: 'grid', placeItems: 'center', color: 'var(--primary)' }}>
                        <ShieldCheck size={20} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Two-Factor Authentication</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Device: iPhone 15 Pro (Verified)</div>
                      </div>
                   </div>
                   <button className="btn btn-primary" style={{ height: '40px', fontSize: '0.75rem' }}>Configure</button>
                </div>
             </div>
          </div>
        );
      case 'workflow':
        return (
          <div className="fade-in">
            <h3 style={{ marginBottom: '24px', fontSize: '1.4rem' }}>Filing Core Config</h3>
            <div className="card glass" style={{ background: 'white', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Compliance Modules</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {['GST Engine', 'TDS Pipeline', 'Audit Node', 'MCA Module', 'PF Sync', 'ESI Gate'].map(t => (
                    <div key={t} style={{ padding: '12px', background: 'var(--bg-main)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
                       <CheckCircle2 size={16} color="var(--primary)" /> {t}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>Advisor Auto-Assignment</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Smart allocation based on expert bandwidth.</div>
                </div>
                <input type="checkbox" defaultChecked style={{ width: '24px', height: '24px', accentColor: 'var(--primary)' }} />
              </div>
            </div>
            <button className="btn btn-primary" style={{ marginTop: '24px', height: '52px', width: '240px' }} onClick={() => handleUpdateProfile({})}>
              {loading ? <Loader2 className="animate-spin" /> : 'Synchronize Core Settings'}
            </button>
          </div>
        );
      default:
        return <div style={{ padding: '100px', textAlign: 'center', color: 'var(--text-muted)' }}>System Interface Under Optimization...</div>;
    }
  };

  return (
    <div style={{ maxWidth: '1100px' }}>
      <header style={{ marginBottom: '48px' }}>
        <h1 style={{ fontSize: '2.8rem', fontWeight: 600, marginBottom: '8px', letterSpacing: '-0.02em' }}>Unified Control Center</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Sovereign settings for <span style={{ color: 'var(--primary-deep)', fontWeight: 600 }}>{profile?.name}</span>'s workspace.</p>
        
        {saveSuccess && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ position: 'fixed', top: '40px', right: '40px', background: 'var(--primary)', color: 'white', padding: '12px 24px', borderRadius: '12px', boxShadow: 'var(--shadow-medium)', zIndex: 1000, display: 'flex', alignItems: 'center', gap: '10px' }}>
             <CheckCircle2 size={20} /> Settings Synchronized Successfully
          </motion.div>
        )}
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '60px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="btn"
              style={{
                justifyContent: 'flex-start',
                padding: '16px 20px',
                background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
                color: activeTab === tab.id ? 'white' : 'var(--text-muted)',
                border: activeTab === tab.id ? 'none' : '1px solid transparent',
                borderRadius: '14px',
                fontWeight: 600
              }}
            >
              {tab.icon}
              {tab.name}
            </button>
          ))}
          <div style={{ marginTop: 'auto', padding: '20px', background: 'var(--bg-main)', borderRadius: '16px', opacity: 0.8 }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-deep)' }}>
               <Shield size={14} /> SECURITY AUDIT
             </div>
             <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '6px' }}>Last signed: {new Date().toLocaleString()}</p>
          </div>
        </div>

        <div style={{ minHeight: '500px' }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Settings;
